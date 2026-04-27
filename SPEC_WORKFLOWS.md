# Spec — Workflows / Automations HelpAi Agency

> Document vivant. Dernière mise à jour : 2026-04-27 (post audit edge functions).
> Branche `main`. Lire ce fichier avant toute reprise sur le chantier workflows.

---

## 🧠 Audit du code existant — l'engine est déjà à ~80%

Après lecture des edge functions Supabase (`agency-automation-engine`, `agency-wa-webhook`, `agency-lead-intake`) et inspection du schéma `public`, **la majorité du moteur conversationnel est déjà déployée**. Ce qu'il reste à faire est plus une **couche d'orchestration + canaux** qu'une refonte.

### Ce qui FONCTIONNE déjà en prod

| Workflow utilisateur | Implémenté dans | Statut |
|---|---|---|
| Création lead + détection source | `agency-lead-intake` | ✅ |
| **#1** SMS qualification (proprio? prestation? urgence?) | `agency-automation-engine` AUTO 1 → envoie via WA | ✅ logique OK, ❌ canal SMS à ajouter |
| **#2** Notif lead chaud prio (proprio + urgent) | `agency-wa-webhook` étape 3 → calcule `priorite='haute'` + notif WA artisan | ✅ |
| **#3** Appel manqué → SMS prospect + notif artisan | `agency-automation-engine` AUTO 2 (lit `lead.appel_manque`) | ⚠️ webhook voix manquant |
| **#4** Menu post-appel artisan (RDV/Devis/Perdu/Rappel) | `agency-automation-engine` AUTO 3 — boutons WA | ✅ |
| **#5** Création RDV via parsing date | `agency-wa-webhook` (`parseRdvDate` via Claude Haiku) | ✅ |
| **#6** Rappels RDV J-1, 2h, 30 min + confirmation | `agency-automation-engine` AUTO 4 | ✅ |
| **#6 bis** Détection risque no-show + check post-RDV | `agency-automation-engine` AUTO 4 | ✅ |
| **#7** Séquence no-show (immédiat / 2h / J+1) | `agency-automation-engine` AUTO 5 | ✅ |
| **#8** Relances devis prospect J+2/J+5/J+15 | `agency-automation-engine` AUTO 6 | ✅ |
| **#8 bis** Suivi devis artisan | `agency-automation-engine` AUTO 7 (boutons J+7) | ✅ |
| **#9** Demande montant chantier (1× après signature) | `agency-wa-webhook` (saisie texte libre + parsing) | ✅ |
| **#10** Confirmation chantier terminé | `agency-automation-engine` AUTO 9 (à 30j) + boutons | ✅ |
| **#11** Satisfaction post-chantier (note 1-5 → avis Google ou alerte artisan) | `agency-automation-engine` AUTO 8 + `agency-wa-webhook` parsing | ✅ |
| **#12** Relances internes artisan (24h / 48h / 30j) | `agency-automation-engine` AUTO 9 | ✅ |
| **#13** Bilan mensuel CA + chantiers + panier + sources | `agency-bilan-mensuel` + table `agency_ca_mensuel` | ⚠️ pas vérifié si wired au cron |

### Tables déjà en place (rien à créer pour la donnée métier)

| Table | Rôle |
|---|---|
| `agency_clients` | inclut `whatsapp_phone/_actif`, `telegram_chat_id/_actif`, `canal_notif`, `avis_google_url` |
| `agency_leads` | tous les champs lifecycle : `proprietaire`, `prestation`, `urgence`, `priorite`, `qualifie`, `rdv_datetime`+flags, `devis_envoye_le`+flags, `montant_chantier`, `satisfaction_note`, `appel_manque`, `appel_repondu_le`, `sms_etape`, `relance_artisan_*` |
| `agency_appels` | log appels (`type`, `duree_sec`, `traite`, `sms_envoye`) |
| `agency_relances` | log relances |
| `agency_lead_conversations` | toutes les conversations (in/out, prospect/artisan) |
| `agency_wa_messages` | log WA brut |
| `agency_automation_log` | runs anti-doublons (unique key sur `lead_id+type`) |
| `agency_ca_mensuel` | CA agrégé mensuel par source (`ca_site`, `ca_google_ads`, `ca_meta`, `ca_appel`, `ca_lsa`, `ca_autre` + comptes chantiers) |
| `agency_kpis` | KPIs synthèse multi-sources |

---

## 🎯 Décisions produit validées avec Guillaume

| # | Décision | Réponse |
|---|---|---|
| 1 | Catalogue workflows | 13 workflows (cycle de vie complet du lead) |
| 2 | Multi-client | Activation libre par client (1 ou N artisans en même temps) |
| 3 | Bouton « Tester » | Oui — par défaut **dry-run** (rendu sans envoi), avec toggle « envoyer pour de vrai » sur numéro test |
| 4 | Variables messages | `{{nom}} {{prestation}} {{ville}} {{telephone_artisan}}` à itérer pendant les tests |
| 5 | Permissions | Admin = config + activation. Client = lecture seule des workflows actifs sur son compte |

### Canaux de communication

| Acteur | Canal sortant | Canal entrant |
|---|---|---|
| **Prospect / lead final** | **SMS** uniquement (Twilio) | SMS (Twilio) |
| **Artisan (client agence)** | WhatsApp **ou** Telegram (selon `agency_clients.canal_notif`) | WA / Telegram |

### Infrastructure téléphonie validée — **Twilio**

- Provider unique : **Twilio** (SMS + Voice + numéros de tracking)
- 2 numéros par artisan :
  - **Numéro principal** : exposé sur site web + Google Business + papier à entête → cohérence NAP locale
  - **Numéro Ads** : exposé sur Meta Ads + Google Ads + landing pages → tag `ads_*` automatique
- Les 2 numéros forwardent vers le **téléphone perso de l'artisan** (TwiML `<Dial>`)
- Webhook missed call → remplit `agency_appels` + `agency_leads.appel_manque=true`
- Webhook SMS inbound → parse réponses prospect (qualification, confirmation RDV, note satisfaction)

**Coût estimé / artisan / mois** : ~12 € (2 numéros 2 € + ~100 SMS × 6,5c + ~50 appels × 2 min × 1c)

---

## 🚧 Ce qu'il reste à construire

### A. Couche Twilio (CRITIQUE — manquante)

| Edge function | Rôle | Priorité |
|---|---|---|
| `agency-sms-send` | Envoi SMS via Twilio API (utilisé par engine quand destinataire = prospect) | P0 |
| `agency-sms-webhook` | Réception SMS (Twilio POST) → route vers logique de `agency-wa-webhook` (qualif / confirmation / satisfaction) | P0 |
| `agency-voice-webhook` | Statut appel Twilio (forward + missed call) → écrit dans `agency_appels` + flag `lead.appel_manque` | P0 |
| `agency-twilio-provision` | Création/assignation numéros par client (1 principal + 1 ads) | P1 |

### B. Refactor de l'engine pour le multi-canal

Le moteur actuel envoie **tout via WhatsApp**, y compris au prospect. Il faut wrapper les appels send :

```ts
async function sendToProspect(lead, msg) {
  // toujours SMS via Twilio
  await fetch(SUPABASE_URL + '/functions/v1/agency-sms-send', { body: { to: lead.telephone, msg } });
}

async function sendToArtisan(client, msg, buttons?) {
  // selon canal_notif : 'whatsapp' (défaut) ou 'telegram'
  if (client.canal_notif === 'telegram') {
    await sendTelegram(client.telegram_chat_id, msg, buttons);
  } else {
    await sendWaText(client.whatsapp_phone, msg);
    if (buttons) await sendWaButtons(client.whatsapp_phone, msg, buttons);
  }
}
```

→ remplacer `sendText(prospectPhone, ...)` partout dans l'engine par `sendToProspect(lead, ...)`
→ remplacer `sendText(artisanPhone, ...)` par `sendToArtisan(client, ...)`

### C. Toggles par client (activer/désactiver chaque workflow)

#### Nouvelle table : `agency_workflow_settings`

```sql
create table public.agency_workflow_settings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.agency_clients(id) on delete cascade,
  workflow_slug text not null,    -- 'sms_qualification_prospect', 'rdv_rappel_j1', etc.
  enabled boolean not null default true,
  config jsonb default '{}'::jsonb,  -- ex: { delais_jours: [2, 5, 15] } ou ton message custom
  updated_at timestamptz default now(),
  unique(client_id, workflow_slug)
);
```

13 slugs prédéfinis (1 par AUTO de l'engine + workflows externes) :

| slug | label UI | défaut |
|---|---|---|
| `sms_qualification_prospect` | SMS qualification (3 questions) | activé |
| `notif_lead_chaud_prio` | Notif PRIO sur lead proprio + urgent | activé |
| `appel_manque_relance` | SMS prospect + notif artisan sur appel manqué | activé |
| `post_appel_menu` | Menu artisan 10 min après appel | activé |
| `rdv_creation_via_sms` | Création RDV via parsing date | activé |
| `rdv_rappels_prospect` | Rappels J-1 / 2h / 30 min | activé |
| `rdv_check_no_show` | Vérif no-show post-RDV | activé |
| `no_show_relances` | Séquence no-show 0 / 2h / J+1 | activé |
| `devis_relances_prospect` | Relances devis J+2 / J+5 / J+15 | activé |
| `devis_suivi_artisan` | Boutons signé / pas encore / perdu (J+7) | activé |
| `montant_demande_post_signature` | Demande montant après signature | activé |
| `satisfaction_post_chantier` | Note 1-5 + avis Google / alerte | activé |
| `relances_internes_artisan` | Rappels artisan 24h / 48h / 30j | activé |
| `bilan_mensuel_auto` | Bilan CA fin de mois SMS + email | activé |

Dans l'engine, gate chaque AUTO :
```ts
if (!await isWorkflowEnabled(clientId, 'sms_qualification_prospect')) continue;
```

### D. UI Workflows refaite (`dashboard.html`)

#### Pour l'admin (vue Agence)
- **Vue d'ensemble** : 4 KPIs réels (workflows actifs / runs 30j / taux succès / temps gagné)
- **Liste des 14 templates** : 1 ligne par workflow avec :
  - Nom + description
  - Déclencheur en français
  - Toggle global (activer pour tous les artisans)
  - Bouton "Configurer par client" → modal avec liste artisans + checkbox d'activation par artisan
  - Bouton "Tester" → modal avec lead simulé + dry-run / send réel
- **Historique runs** : table `agency_automation_log` avec filtres par client / workflow / statut

#### Pour le client (artisan)
- **Vue lecture seule** des workflows activés sur son compte
- Pas de toggle, pas de config

### E. Triggers DB + cron (à valider/créer)

À vérifier (peut-être déjà en place) :
- `pg_cron` job toutes les 5 min → POST `agency-automation-engine`
- Trigger PostgreSQL sur `INSERT/UPDATE agency_leads` → POST engine immédiat (pour réactivité)

À créer :
- Trigger sur `INSERT agency_appels WHERE traite=false AND duree_sec=0` → POST engine (missed call)

---

## 📋 Plan de découpage en commits

Chaque étape est testable individuellement.

| Étape | Description | Effort | Bloquant |
|---|---|---|---|
| **0** | ✅ Audit + spec (ce document) | fait | — |
| **1** | Créer table `agency_workflow_settings` + seed 14 lignes par client | 1h | aucun |
| **2** | Edge function `agency-sms-send` + `agency-sms-webhook` (Twilio outbound + inbound) | 3h | crédentiels Twilio |
| **3** | Edge function `agency-voice-webhook` (missed call detection) + alimentation `agency_appels` | 2h | crédentiels Twilio + numéros provisionnés |
| **4** | Refactor `agency-automation-engine` : `sendToProspect`/`sendToArtisan` + gating workflows + support Telegram | 3h | étape 2 |
| **5** | UI dashboard — Liste workflows + toggle global + toggle par client + tester | 4h | étape 1 |
| **6** | UI dashboard — Modal historique runs (lit `agency_automation_log` + `agency_lead_conversations`) | 2h | aucun |
| **7** | Edge function `agency-twilio-provision` (création numéros + association client + redirection vers tél perso) | 3h | étape 2 |
| **8** | Configurer `pg_cron` + trigger PostgreSQL sur `agency_leads` (si manquant) | 1h | aucun |
| **9** | Tests E2E + ajustements messages / variables | itératif | toutes |

---

## 🔐 Secrets à fournir (Supabase Edge Functions)

```
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_FROM_DEFAULT  (le N° principal Twilio par défaut, override-able par client)
```

Déjà présents (utilisés par l'existant) :
```
WA_ACCESS_TOKEN, WA_PHONE_NUMBER_ID, WA_VERIFY_TOKEN, ANTHROPIC_API_KEY,
RESEND_API_KEY, TELEGRAM_BOT_TOKEN, FCM_SERVER_KEY, STRIPE_SECRET_KEY
```

---

## ⚠️ À valider AVANT étape 2

1. **Compte Twilio créé** par Guillaume + ajout des 3 secrets dans Supabase
2. **Achat de 2 numéros français** Twilio pour test (1 principal + 1 ads) → ~2 €/mois
3. **Confirmation politique** : artisan reçoit-il **TOUS** les messages via son canal préféré (`canal_notif`), ou seulement les notifs prio en Telegram et le quotidien en WA ? → on part sur **un seul canal par artisan, configuré dans `agency_clients.canal_notif`**.

---

## 🧭 Comment reprendre demain

Sur l'autre poste :

1. `git pull origin main`
2. Ouvrir une nouvelle conversation Claude Code
3. Dire : *"Lis SPEC_WORKFLOWS.md. On reprend l'étape X. Twilio est connecté / pas connecté. Mes ajustements sont …"*

Le fichier sert de référence durable pour le chantier.
