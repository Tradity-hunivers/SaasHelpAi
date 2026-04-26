# Spec — Refonte de la page Workflows (option A)

> Document de continuité pour reprendre le chantier sur un autre poste.
> Créé le 2026-04-27. Branche `main`. Dernier commit lié : `1c41bfd`.

---

## Contexte

L'onglet **Automations → Workflows** du dashboard est actuellement un **démo localStorage** : "Créer un workflow" crée juste une ligne `{name, trigger, status}` stockée dans `localStorage.helpai_workflows` avec des `EditableText` libres. Le bouton "Activer" change un badge mais **rien ne s'exécute**.

En parallèle, **toutes les edge functions Supabase nécessaires existent déjà** et tournent en prod :

| Edge function | Rôle |
|---|---|
| `agency-automation-engine` | orchestrateur (à utiliser comme moteur) |
| `agency-wa-relances` | moteur de relance leads SMS/WhatsApp |
| `agency-wa-send` / `agency-wa-webhook` | envoi/réception WhatsApp |
| `agency-notify` | dispatcher SMS / WhatsApp / Telegram |
| `agency-lead-intake` | capture des leads entrants |
| `agency-bilan-mensuel` | bilan mensuel auto |
| `gmb-autopilot-review-reply` | auto-réponse aux avis Google |
| `gmb-autopilot-post-generator` + `gmb-post-scheduler` | publications GMB programmées |
| `gmb-report-generator` | rapport de performance fiche Google |
| `agency-blog-generator` + `blog-publish` | génération + publication d'articles SEO |

**Objectif** : connecter la page UI à ces fonctions via un catalogue de templates et un vrai moteur d'instances par client.

---

## 1. Tables Supabase à créer

### `agency_workflow_templates` (catalogue, seed read-only)

| champ | type | rôle |
|---|---|---|
| `slug` | text PK | identifiant : `relance_lead_no_reply`, `auto_reply_avis`, etc. |
| `nom` | text | nom affiché |
| `description` | text | une phrase |
| `categorie` | text | `relance` / `acquisition` / `avis` / `reporting` / `gmb` / `blog` |
| `icon` | text | nom d'icône Lucide (`zap`, `bell`, `mail`, etc.) |
| `trigger_type` | text | `lead.created` / `lead.statut_change` / `gmb.review.received` / `cron` |
| `executor_function` | text | nom de la edge function appelée |
| `config_schema` | jsonb | décrit les champs configurables (cf. § 3) |
| `default_config` | jsonb | valeurs par défaut |
| `actif` | bool | template disponible dans le catalogue |

### `agency_workflows` (instances par client)

| champ | type | rôle |
|---|---|---|
| `id` | uuid PK | |
| `client_id` | uuid → `agency_clients` | propriétaire |
| `template_slug` | text → `agency_workflow_templates.slug` | |
| `nom` | text | nom personnalisable |
| `statut` | text | `draft` / `active` / `paused` |
| `config` | jsonb | la config réelle de cette instance |
| `last_run_at` | timestamptz | |
| `next_run_at` | timestamptz | pour les workflows cron |
| `runs_count` | int | total |
| `success_count` | int | |
| `error_count` | int | |
| `created_at`, `updated_at` | timestamptz | |

### `agency_workflow_runs` (log d'exécution)

| champ | type | rôle |
|---|---|---|
| `id` | uuid PK | |
| `workflow_id` | uuid → `agency_workflows` | |
| `client_id` | uuid → `agency_clients` | dénormalisé pour filtrer |
| `started_at`, `finished_at` | timestamptz | |
| `statut` | text | `running` / `success` / `error` |
| `payload` | jsonb | l'événement reçu |
| `result` | jsonb | retour de la edge function |
| `error_message` | text | si statut=error |

Cette table alimente déjà le **Journal des automations** (page admin existante via `agency_automation_log` — à fusionner ou à laisser séparé selon usage).

### `agency_pending_actions` (file d'attente pour les délais)

Pour les relances J+1, J+3, J+7 il faut stocker des actions à exécuter plus tard.

| champ | type | rôle |
|---|---|---|
| `id` | uuid PK | |
| `workflow_id` | uuid → `agency_workflows` | |
| `run_at` | timestamptz | quand l'exécuter |
| `payload` | jsonb | l'événement initial |
| `step` | int | étape (1 = J+1, 2 = J+3, 3 = J+7) |
| `statut` | text | `pending` / `done` / `cancelled` (cancelled si lead a répondu) |

---

## 2. Le moteur (`agency-automation-engine`)

3 modes d'invocation :

### a) Trigger DB (événements)

Trigger PostgreSQL sur :
- `INSERT INTO agency_leads` → appelle l'engine avec `{event: "lead.created", lead_id}`
- `UPDATE agency_leads SET statut=...` → appelle avec `{event: "lead.statut_change", lead_id, old_statut, new_statut}`
- `INSERT INTO agency_reviews` → appelle avec `{event: "gmb.review.received", review_id}`

L'engine cherche dans `agency_workflows` toutes les instances `active` du bon template pour ce `client_id`, puis :
- Workflow immédiat → appelle directement la edge function executor
- Workflow à délais → insère N lignes dans `agency_pending_actions` (une par étape)

### b) Cron toutes les 5 min (`pg_cron`)

L'engine lit :
- `agency_pending_actions WHERE statut='pending' AND run_at <= now()` → exécute et marque `done` (ou `cancelled` si annulé)
- `agency_workflows WHERE trigger_type='cron' AND statut='active' AND next_run_at <= now()` → exécute, recalcule `next_run_at`

### c) Bouton "Exécuter maintenant" (manuel)

Appel HTTP direct depuis l'UI avec payload de test → exécute en mode dry-run (n'envoie rien réellement, retourne le rendu) ou en mode réel selon paramètre.

À chaque exécution : ligne dans `agency_workflow_runs` (success/error + message complet) + incrément des counters sur `agency_workflows`.

---

## 3. Catalogue de 8 templates

| # | slug | trigger | executor | config exposée |
|---|---|---|---|---|
| 1 | `relance_lead_no_reply` | `lead.created` | `agency-wa-relances` | canal (sms/wa/tg), délais (array de jours, ex `[1,3,7]`), 1 message par étape, `stop_si_repondu` |
| 2 | `notif_artisan_nouveau_lead` | `lead.created` | `agency-notify` | canal, template message, `urgent_seulement` |
| 3 | `bienvenue_lead_qualifie` | `lead.statut → qualifie` | `agency-notify` | canal, délai (heures), message |
| 4 | `recovery_no_show` | `lead.statut → no_show` | `agency-wa-relances` | canal, délai, message d'excuse + lien re-RDV |
| 5 | `auto_reply_avis_google` | `gmb.review.received` | `gmb-autopilot-review-reply` | ton (chaleureux/pro), seuil note minimum, signature |
| 6 | `gmb_post_hebdo` | `cron` | `gmb-autopilot-post-generator` | jour de semaine, heure, thèmes (array) |
| 7 | `bilan_mensuel_auto` | `cron` | `agency-bilan-mensuel` | jour du mois (1–28), destinataires email (array), inclure factures |
| 8 | `blog_seo_auto` | `cron` | `agency-blog-generator` → `blog-publish` | fréquence (hebdo/mensuel), mots-clés (array), tonalité |

### Format du `config_schema`

Pour générer dynamiquement le formulaire dans le drawer. Exemple pour template #1 :

```json
{
  "fields": [
    {
      "key": "canal",
      "label": "Canal",
      "type": "radio",
      "options": ["sms", "whatsapp", "telegram"],
      "default": "whatsapp",
      "required": true
    },
    {
      "key": "delais_jours",
      "label": "Délais des relances (en jours)",
      "type": "chips_int",
      "default": [1, 3, 7],
      "min": 1,
      "max": 30
    },
    {
      "key": "messages",
      "label": "Messages par étape",
      "type": "textarea_per_step",
      "depends_on": "delais_jours",
      "variables": ["nom", "prestation", "ville", "telephone_artisan"]
    },
    {
      "key": "stop_si_repondu",
      "label": "Arrêter si le lead répond",
      "type": "bool",
      "default": true
    }
  ]
}
```

Types de champs supportés : `text`, `textarea`, `int`, `num`, `bool`, `radio`, `select`, `multi_select`, `chips_int`, `email_list`, `time`, `cron`, `textarea_per_step`.

---

## 4. UI — page Workflows refaite

### a) Header — KPIs réels

4 cartes lues depuis Supabase (plus localStorage) :
- Workflows actifs (count `agency_workflows WHERE statut='active'`)
- Exécutions 30j (count `agency_workflow_runs WHERE started_at > now() - interval '30 days'`)
- Taux de succès % (success / total runs sur 30j)
- Temps gagné h (heuristique : 5 min/run réussi)

### b) Bouton "+ Ajouter un workflow" → Modal Catalogue

Grille de cartes des 8 templates classées par catégorie. Chaque carte : icône, nom, description courte, badge de trigger.
Click sur carte → ouvre le **Drawer de config**.

### c) Drawer de configuration

Formulaire **généré dynamiquement** depuis `template.config_schema` :
- Sélecteur de **client** (admin : multi-client possible avec "Appliquer à tous")
- Champs dynamiques selon le schema
- Statut initial : `draft` (test) / `active`
- Bouton **"Tester maintenant"** → mode dry-run (cf. § Q3)
- **Enregistrer** → INSERT dans `agency_workflows`

### d) Liste des workflows configurés

Cartes ou tableau :
- Icône + nom du template + nom custom
- Client (si admin sans filtre)
- Résumé du trigger en français : *"Quand un lead arrive, relance par WhatsApp à J+1, J+3, J+7"*
- Dernière exécution (vert/rouge) + Prochaine (pour cron)
- Toggle Actif / Pause
- Bouton ▶ Exécuter / ✏ Éditer / 🗑 Supprimer

### e) Modal détail d'un workflow

- Config en lecture/édition
- **Historique des runs** (depuis `agency_workflow_runs`) avec payload + erreur déroulables

### f) Filtres

Chips : Tous / Actifs / Pause / Brouillons. Plus filtre par client (admin), par catégorie de template.

---

## 5. ⚠️ Inconnu à vérifier avant de coder

Le **format de payload** attendu par chaque edge function existante n'a pas encore été lu. Avant de coder l'engine, lire :

- `agency-wa-relances/index.ts` → comprendre comment elle attend les délais et les messages
- `agency-notify/index.ts` → format canal + message
- `gmb-autopilot-review-reply/index.ts` → format payload et options
- `agency-bilan-mensuel/index.ts` → comment elle est appelée
- `agency-automation-engine/index.ts` → ce qu'elle fait déjà aujourd'hui

⇒ Adapter `executor_function` + le mapping de config pour chaque template.

---

## 6. Questions ouvertes à valider AVANT le code

1. **Le catalogue à 8 templates** te convient ou tu veux ajouter / supprimer / renommer ?
2. **Multi-client en une fois** : activer un même workflow sur tous les clients d'un coup, ou un par un ?
3. **"Tester maintenant"** : envoi réel sur un numéro de test, ou dry-run qui montre juste ce qui *aurait* été envoyé ?
4. **Variables dans messages** : `{{nom}}, {{prestation}}, {{ville}}` suffisent ou il en faut d'autres (`montant_chantier`, `urgence`, `telephone_artisan`…) ?
5. **Permissions** : seul l'admin agence configure, ou le client final peut aussi voir / pauser ses workflows ?

---

## 7. Plan de découpage en commits

Pour pouvoir tester au fur et à mesure :

1. **Migration BDD** : créer les 4 tables + RLS + seed des 8 templates
2. **Edge function engine** : étendre `agency-automation-engine` (modes trigger/cron/manual + mapping vers executors)
3. **Triggers PostgreSQL** : sur `agency_leads` (insert + update statut) et sur les avis
4. **pg_cron schedule** : tick toutes les 5 min
5. **UI catalogue** : modal de sélection des templates
6. **UI drawer config** : form dynamique depuis `config_schema`
7. **UI liste + détail** : remplacement de la page localStorage actuelle
8. **UI historique runs** : modal détail + filtres

Chaque étape est mergeable indépendamment et testable.

---

## État du code à la dernière session (2026-04-27)

- Branche : `main`
- Dernier commit : `1c41bfd` — *fix: Modifier no longer freezes the page (lazy contentEditable)*
- Page actuelle Workflows : `dashboard.html:6560` (`function ScreenAutomations`) — à remplacer
- Page Journal des automations : `dashboard.html:6253` (`function ScreenAutomationsJournal`) — à conserver, utilisera désormais aussi `agency_workflow_runs`
- Memory locale : `C:\Users\Admin\.claude\projects\c--Users-Admin-Desktop-Espace-client-HELP-AI\memory\` — non synchronisée entre machines

---

## Comment reprendre demain

Sur l'autre poste :

1. `git pull origin main`
2. Ouvrir une nouvelle conversation Claude Code
3. Dire : *"Lis SPEC_WORKFLOWS.md, on reprend le chantier de la page Workflows. Mes réponses aux 5 questions sont : [tes réponses]. Tu peux commencer par l'étape 1 (migration BDD)."*

Le fichier servira de doc de référence durable pour le chantier.
