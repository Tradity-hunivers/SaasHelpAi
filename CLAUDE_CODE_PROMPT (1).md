# Prompt Claude Code — Help AI Agency Dashboard

## Contexte général

Tu travailles sur le dashboard client/admin de **Help AI Agency** (helpaiagency.fr), une agence digitale basée à Montauban, France, spécialisée dans la création de sites web, le SEO local, la gestion GMB et Google Ads pour artisans et PME.

**Propriétaire :** Guillaume (vouvoyez-le toujours)  
**Contact admin :** contactpro@helpaiagency.com  
**Stack :** HTML vanilla + Supabase backend + Cloudflare Pages pour l'hébergement

---

## Supabase — Projet principal

```
Project ID : wodlupbffooqtshgasml
URL        : https://wodlupbffooqtshgasml.supabase.co
Anon key   : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZGx1cGJmZm9vcXRzaGdhc21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNzkwODQsImV4cCI6MjA4ODk1NTA4NH0.cpimdDxESdrsdOH2CtPSamgzATDiss3eTogf5s5IFy4
```

### Authentification Supabase

- **Admin :** `contactpro@helpaiagency.com` — identifié via `app_metadata.role === 'admin'` dans `auth.users`
- **Client test :** `decarvalho.jordan23@gmail.com` — user_id `b53da4dc-c833-462e-92c3-630984d840d2`
- Le rôle admin est dans `raw_app_meta_data` → `{ "role": "admin" }`
- Les clients sont dans `auth.users` avec leur user_id lié à `agency_clients.user_id`

---

## Tables du dashboard (schéma `public`)

### `agency_clients`
Table principale des clients artisans/PME gérés par l'agence.

| Colonne | Type | Notes |
|---------|------|-------|
| id | uuid PK | gen_random_uuid() |
| user_id | uuid FK → auth.users | Lien avec l'espace client Supabase Auth |
| nom | text | Nom du client |
| slug | text UNIQUE | Identifiant URL (ex: "jordan") |
| email | text | Email du client |
| telephone | text nullable | |
| secteur | text nullable | Ex: "Plomberie", "Couverture" |
| statut | text | 'actif', 'pause', 'inactif' |
| webhook_secret | text | UUID auto-généré pour sécuriser le webhook leads |
| stripe_customer_id | text nullable | |
| drive_folder_id | text nullable | |
| gmb_client_id | text nullable | Lien vers gmb_clients.id pour les avis GMB |
| telegram_notify | boolean | true par défaut |
| notes_internes | text nullable | |

### `agency_leads`
Leads entrants pour chaque client.

| Colonne | Type | Notes |
|---------|------|-------|
| id | uuid PK | |
| client_id | uuid FK → agency_clients | |
| source | text | 'site', 'google_ads', 'meta', 'appel', 'lsa', 'autre' |
| statut | text | 'nouveau', 'contacté', 'qualifié', 'gagné', 'perdu' |
| nom | text nullable | Nom du prospect |
| email | text nullable | |
| telephone | text nullable | |
| message | text nullable | Message du formulaire |
| notes | text nullable | Notes internes agence |
| notes_internes | text nullable | Alias legacy |
| utm_source/medium/campaign/content | text | Tracking UTM |
| metadata | jsonb | Données brutes webhook |
| created_at / updated_at | timestamptz | |

### `agency_kpis`
KPIs mensuels par client et par source. **IMPORTANT : chaque mois a 4 lignes** (google_ads + meta + gmb + total). Toujours filtrer `source='total'` pour les KPIs cumulés et éviter le double comptage.

| Colonne | Type | Notes |
|---------|------|-------|
| id | uuid PK | |
| client_id | uuid FK → agency_clients | |
| periode | date | Premier jour du mois (ex: 2026-04-01) |
| source | text | 'google_ads', 'meta', 'gmb', 'site', 'total' |
| nb_leads | integer | |
| nb_impressions | integer | |
| nb_clics | integer | |
| depense | integer | **En centimes** (ex: 150000 = 1500€) |
| cout_par_lead | integer | En centimes |
| ca_genere | integer | **En centimes** |
| deals | integer | Nombre de deals signés |
| pipeline | integer | Nombre de devis en cours |
| note_google | numeric | Note GMB (ex: 4.8) |
| nb_avis_google | integer | |
| roas | numeric | ROAS calculé |
| taux_rdv | numeric | % RDV honorés |
| leads_ref | integer | Leads par référencement |
| panier_moyen | integer | En centimes |
| UNIQUE | | (client_id, periode, source) — upsert possible |

### `agency_invoices`
Factures liées à Stripe.

| Colonne | Type | Notes |
|---------|------|-------|
| id | uuid PK | |
| client_id | uuid FK | |
| stripe_invoice_id | text UNIQUE | |
| numero | text | N° de facture affiché |
| montant | integer | **En centimes** |
| statut | text | 'en_attente', 'payée', 'échouée', 'annulée' |
| pdf_url | text | Lien PDF |
| payé_le | timestamptz | |

### `agency_documents`
Documents partagés avec les clients.

| Colonne | Type | Notes |
|---------|------|-------|
| id | uuid PK | |
| client_id | uuid FK | |
| nom | text | Nom du fichier |
| type | text | 'contrat', 'rapport', 'facture', 'audit', 'autre' |
| drive_url | text | Lien Google Drive |
| visible_client | boolean | true = visible côté client |

### Vue `agency_gmb_stats`
Vue SQL calculant en temps réel les stats GMB depuis les avis stockés.

```sql
CREATE OR REPLACE VIEW public.agency_gmb_stats AS
SELECT 
  ac.id AS agency_client_id,
  ac.nom,
  gc.id AS gmb_client_id,
  ge.id AS establishment_id,
  ge."name" AS establishment_name,
  ROUND(AVG(r.rating)::numeric, 1) AS note_moyenne,
  COUNT(r.id) AS nb_avis,
  COUNT(CASE WHEN r."publishedAt" >= NOW() - INTERVAL '30 days' THEN 1 END) AS nb_avis_30j,
  MAX(r."publishedAt") AS dernier_avis_le
FROM public.agency_clients ac
LEFT JOIN public.gmb_clients gc 
  ON gc."contactEmail" = ac.email OR gc.id = ac.gmb_client_id
LEFT JOIN public.gmb_establishments ge ON ge."clientId" = gc.id
LEFT JOIN public.gmb_reviews r ON r."establishmentId" = ge.id
GROUP BY ac.id, ac.nom, gc.id, ge.id, ge."name";
```

---

## Tables GMB (existantes dans le projet)

Ces tables sont utilisées par le GMB AI SaaS (autre produit) mais les données d'avis sont partagées avec le dashboard agency via la vue `agency_gmb_stats`.

- `gmb_clients` — clients GMB (lien via `contactEmail` = `agency_clients.email`)
- `gmb_establishments` — fiches Google Business (lien via `clientId`)
- `gmb_reviews` — avis individuels avec `rating`, `authorName`, `comment`, `publishedAt`

---

## Edge Functions déployées

### `agency-lead-intake` (verify_jwt: false)
Webhook qui reçoit les leads depuis les formulaires des sites clients.

```
URL: https://wodlupbffooqtshgasml.supabase.co/functions/v1/agency-lead-intake
```

**Body attendu :**
```json
{
  "slug": "jordan",
  "secret": "webhook_secret_du_client",
  "nom": "Jean Dupont",
  "email": "jean@example.fr",
  "telephone": "0600000000",
  "message": "Demande de devis",
  "source": "site"
}
```

Insère dans `agency_leads`, envoie une notification Telegram + email Resend au client.

### `agency-stripe-webhook` (verify_jwt: false)
Reçoit les events Stripe et upsert dans `agency_invoices`.

---

## RLS (Row Level Security)

- **Admin** (`app_metadata.role === 'admin'`) → accès total à toutes les tables
- **Client** → voit uniquement ses propres données filtrées par `user_id` ou `client_id`
- Policies nommées : `client_read_own_kpis`, `client_update_own_leads`, etc.
- La vue `agency_gmb_stats` est accessible en SELECT pour `anon` et `authenticated`

---

## Dashboard HTML — Fichier principal

Le dashboard est un **fichier HTML vanilla single-file** (`dashboard.html`) avec :
- Supabase JS CDN
- Chart.js CDN
- Design system **Claude Design** (oklch color palette, Montserrat + JetBrains Mono)

### Design system CSS (variables principales)
```css
:root {
  --bg: oklch(0.155 0.008 60);
  --bg-2: oklch(0.185 0.009 60);
  --surface: oklch(0.205 0.009 60);
  --surface-2: oklch(0.235 0.010 60);
  --surface-hover: oklch(0.255 0.010 60);
  --border: oklch(0.30 0.010 60);
  --border-soft: oklch(0.25 0.010 60);
  --text: oklch(0.97 0.005 60);
  --text-2: oklch(0.78 0.010 60);
  --text-3: oklch(0.58 0.012 60);
  --text-4: oklch(0.42 0.012 60);
  --accent: oklch(0.74 0.155 55);   /* Ambre chaud */
  --accent-2: oklch(0.80 0.120 60);
  --accent-soft: oklch(0.74 0.155 55 / 0.12);
  --accent-border: oklch(0.74 0.155 55 / 0.35);
  --accent-ink: oklch(0.18 0.04 55);
  --success: oklch(0.78 0.13 155);
  --danger: oklch(0.68 0.17 25);
  --info: oklch(0.74 0.10 240);
  --shadow-1: 0 1px 0 0 oklch(1 0 0 / 0.03) inset, 0 1px 2px oklch(0 0 0 / 0.4);
  --shadow-2: 0 1px 0 0 oklch(1 0 0 / 0.04) inset, 0 8px 24px oklch(0 0 0 / 0.4);
  --shadow-glow: 0 0 0 1px oklch(0.74 0.155 55 / 0.15), 0 8px 24px oklch(0.74 0.155 55 / 0.12);
  --sidebar-w: 248px;
  --r-xs: 4px; --r-sm: 6px; --r-md: 10px; --r-lg: 14px; --r-xl: 20px;
}
[data-theme="light"] { /* overrides */ }
```

**Thème :** contrôlé via `document.documentElement.setAttribute('data-theme', 'dark'|'light')`

### Architecture JS du dashboard

**Variables globales :**
```js
var IS_ADMIN = false;   // true si admin connecté
var MY_CLIENT = null;   // objet agency_clients du client connecté
var RT = null;          // canal Realtime Supabase
var CLIENTS = [];       // tous les clients (admin uniquement)
var LEADS = [];         // tous les leads (admin)
var INVOICES = [];      // toutes les factures (admin)
var ALL_KPIS = [];      // tous les KPIs (admin)
var MY_LEADS = [];      // leads du client connecté
var MY_INV = [];        // factures du client
var MY_DOCS = [];       // documents du client
var MY_KPIS = [];       // KPIs du client
var CUR_CLIENT = null;  // client actuellement ouvert (fiche admin)
var KPI_CID = null;     // client sélectionné dans Reporting
var ACQ_CID = null;     // client sélectionné dans Acquisition
var VTE_CID = null;     // client sélectionné dans Ventes
var CHARTS = {};        // instances Chart.js (pour destroy avant re-render)
```

**Flux auth :**
1. `boot(user)` → détecte admin via `user.app_metadata.role === 'admin'`
2. Admin → affiche nav admin, charge tous les clients/leads/kpis, `go('ao')`
3. Client → charge `agency_clients` par `user_id`, affiche nav client, `go('cr')`

**Pages admin :**
- `ao` → Vue d'ensemble globale (KPIs agrégés + 3 charts + tableau mensuel + derniers leads)
- `ac` → Liste clients + fiche client (KPIs + charts + leads + GMB + webhook config)
- `al` → CRM leads global avec filtres par source
- `af` → Factures
- `ar` → Saisie KPIs par client (sélecteur de client + tableau détail + upsert)
- `aa` → Acquisition par client (donut sources + évolution CPL + Budget vs CA)
- `av` → Ventes par client (deals + panier moyen + taux conversion)

**Pages client :**
- `cr` → Vue d'ensemble = KPIs + 2 charts (leads par mois + CPL) + section GMB
- `cl` → Mes leads avec filtres par statut
- `ca` → Acquisition (mêmes charts qu'admin mais sur ses données)
- `cv` → Ventes

**Fonctions clés JS :**

```js
// Helpers
g(id)                    // document.getElementById
esc(s)                   // escape HTML
fd(d)                    // format date fr
fmtM(centimes)           // format monétaire (centimes → "1 500 €")
emR(n, txt)              // ligne "empty" pour tableau HTML
kc(label, valeur, hint, cls)  // rendu carte KPI
srcB(source)             // badge coloré source lead
stB(statut)              // badge coloré statut lead
fctB(statut)             // badge statut facture
toast(msg)               // notification temporaire
mkChart(id, config)      // crée/détruit Chart.js dans CHARTS[id]
chartBase()              // retourne {gc, tc} couleurs selon thème
periods(kpis)            // extrait périodes uniques d'un tableau de KPIs
pLabel(p)                // '2026-04' → 'avr. 26'
sumK(kpis, field)        // somme un champ sur tableau de KPIs

// Renders admin
renderVE()               // Vue d'ensemble (lit ALL_KPIS filtrés source='total')
renderClients()          // Grille clients
renderAL()               // CRM leads
renderAF()               // Factures
renderAR()               // Reporting KPIs (KPI_CID)
renderAA()               // Acquisition (ACQ_CID)
renderAV()               // Ventes (VTE_CID)
openClient(id)           // Ouvre fiche client avec mini-dashboard complet

// Renders client
renderCR()               // Vue d'ensemble client (source='total' de MY_KPIS)
renderCL()               // Mes leads
renderCA()               // Acquisition client
renderCV()               // Ventes client

// CRM / Modales
openLead(id)             // Modale fiche lead (éditable si admin)
saveLead(id)             // Sauvegarde statut/notes lead
mNewLead()               // Modale nouveau lead
createLead()             // Insère nouveau lead
mNewKpi(preClient, prePeriod)  // Modale saisie KPIs (4 sources)
saveKpis()               // Upsert KPIs (google_ads + meta + gmb + total)
mNewClient()             // Modale nouveau client
createClient()           // Insère nouveau client
mEditClient()            // Modale modification client
saveClient()             // Sauvegarde modifications client

// GMB
fetchGmbStats(clientId)  // Charge stats GMB depuis agency_gmb_stats + derniers avis
fetchClientGmb()         // Version client (utilise MY_CLIENT.id)
saveGmbLink()            // Sauvegarde gmb_client_id sur agency_clients
syncGmb()                // Re-fetch GMB stats

// Mon compte (client)
openAcc()                // Modale Mon compte
renderAccTab(tab)        // Onglet 'profil'|'factures'|'documents'
saveTel(), saveEmail(), savePwd()  // Mises à jour profil

// Navigation
go(pg)                   // Change de page, update nav, déclenche renders
closeM()                 // Ferme modale
setTheme('dark'|'light') // Bascule thème + localStorage
cpText(el)               // Copie texte dans presse-papier
```

**⚠️ Règle critique KPIs (double comptage) :**
```js
// TOUJOURS filtrer source='total' pour les KPIs cumulés
var ktot = kpis.filter(k => k.source === 'total');
var totCA = sumK(ktot, 'ca_genere');  // ✅ correct
var totCA = sumK(kpis, 'ca_genere'); // ❌ quadruple comptage !

// Pour les charts par source, utiliser les lignes individuelles
var ldGA = ps.map(p => sumK(kga.filter(k => k.periode.startsWith(p)), 'nb_leads'));
```

**⚠️ Règle critique montants :**
Tous les montants sont stockés en **centimes** dans la DB.
```js
fmtM(200000)  // → "2 000 €"  (200000 centimes = 2000€)
// Saisie → toujours multiplier par 100 avant insert
Math.round(parseFloat(inputValue) * 100)
```

---

## Ce que le dashboard fait déjà ✅

1. **Auth Supabase** — login/logout, détection admin/client
2. **Realtime** — nouveau lead → toast + update tableau immédiat
3. **Admin → Vue d'ensemble** — 7 KPIs + 3 graphiques Chart.js (CA+Budget, Leads empilés, ROAS+CPL) + tableau mensuel + derniers leads + sélecteur client
4. **Admin → Clients** — grille + fiche complète (KPIs, 2 charts, tableau détail mensuel, CRM leads, Webhook config, Section GMB avec avis)
5. **Admin → CRM** — tous les leads filtrables par source, modale édition
6. **Admin → Factures** — liste avec liens PDF
7. **Admin → Reporting KPIs** — saisie multi-source (Google Ads + Meta + GMB + Business), upsert propre
8. **Admin → Acquisition** — donut sources + CPL par mois + Budget vs CA
9. **Admin → Ventes** — deals par mois + panier moyen & taux conversion
10. **Client → Vue d'ensemble** — KPIs + 2 charts + section GMB avec derniers avis
11. **Client → Mes leads** — filtre par statut
12. **Client → Acquisition / Ventes** — mêmes charts sur ses données
13. **Client → Mon compte** — modale avec onglets Profil/Factures/Documents
14. **GMB** — vue SQL `agency_gmb_stats`, fetch avis, lien via email ou gmb_client_id
15. **Thème clair/sombre** — persisté en localStorage via `data-theme`

---

## Ce qui reste à faire 🚧

Le fichier `dashboard.html` existe et fonctionne pour l'authentification et la logique Supabase, mais le **design Claude Design** (obtenu via Export as standalone HTML) n'est pas encore parfaitement intégré.

### Problème actuel
Le design Claude Design (fichier gzip de ~1.7MB) a été exporté en HTML standalone. Il contient :
- Un design system CSS oklch complet (23,750 chars)
- Des composants React (screens, charts SVG custom, sidebar, topbar)
- Des données mockées statiques

La tentative de merge a abouti à un fichier fonctionnel avec le bon CSS mais dont les class names HTML doivent être vérifiés et ajustés pour correspondre parfaitement au design.

### Ce que tu dois faire

**Mission principale :** Faire en sorte que le dashboard `dashboard.html` ressemble exactement au design Claude Design tout en conservant 100% de la logique Supabase.

**Étapes suggérées :**

1. **Audit visuel** : Ouvre le fichier `dashboard.html` actuel dans un browser. Compare avec des screenshots du design Claude Design.

2. **Alignement HTML/CSS** : Les principales classes à vérifier/corriger :
   - Sidebar : `.sidebar`, `.s-brand`, `.s-who`, `.ni`, `.nl`, `.s-foot`
   - Topbar : `.topbar`, `.pg-title`, `.pg-sub`, `.live`, `.dot`
   - KPIs : `.kpi-grid`, `.kpi`, `.kpi-label`, `.kpi-value`
   - Cards : `.card`, `.ch`, `.ct`, `.card-head`, `.card-title`
   - Boutons : `.btn-s` (primaire), `.btn-lo` (secondaire)
   - Tableaux : `table`, `thead th`, `tbody td`
   - Modales : `.overlay`, `.modal`, `.mh`, `.mt`, `.mb`
   - Filtres : `.fbar`, `.fb`, `.fb.on`
   - Formulaires : `input`, `select.fsel`, `textarea`, `label`

3. **Charts** : Les graphiques sont Chart.js. Vérifier que les canvas ont une hauteur fixe et que `maintainAspectRatio: false` est bien actif.

4. **Realtime** : Vérifier que le canal Supabase Realtime fonctionne pour les nouveaux leads.

5. **GMB** : Tester la section Google My Business sur la fiche client Jordan. Si aucune fiche GMB n'est liée (car c'est un client test), proposer le formulaire de liaison.

---

## Instructions pour Claude Code

### Commandes recommandées

```bash
# Lancer avec permissions complètes (comme Guillaume le fait habituellement)
claude --dangerously-skip-permissions

# Ou en mode normal
claude
```

### Règles de code à respecter

1. **Zéro TypeScript** dans le fichier HTML — JavaScript vanilla ES5/ES6 uniquement
2. **Zéro template literals (backticks)** dans les strings HTML — utiliser la concaténation `+`
3. **Un seul `<body>`, un seul `<style>`** dans le HTML — ne jamais dupliquer
4. **Vérifier la balance des accolades** après chaque modification JS majeure
5. **Les montants** sont toujours en centimes en DB — diviser par 100 pour afficher
6. **Les KPIs** : toujours filtrer `source='total'` pour éviter le double comptage
7. **Le thème** utilise `data-theme="dark"|"light"` sur `<html>`, pas de classes CSS
8. **Les charts Chart.js** doivent détruire l'instance précédente avant de recréer (`CHARTS[id].destroy()`)

### Architecture à ne pas modifier

- La logique d'auth Supabase (`boot`, `doLogin`, `doLogout`)
- Le système de navigation (`go(pg)`, `CHARTS`, `pv`/`pv.active`)
- Les appels Supabase (tables, colonnes, RLS)
- Les Edge Functions déployées

### Fichier de référence design

Le fichier design original peut être téléchargé depuis Claude Design en cas de besoin comme référence visuelle. Il contient l'ensemble du design system CSS dans `<style>` tag n°2 du template HTML (extrait via JSON parsing du `<script type="__bundler/template">`).

---

## Secrets Supabase disponibles

```
RESEND_API_KEY          # Email via resend.com (domaine helpaiagency.fr vérifié)
TELEGRAM_BOT_TOKEN      # Bot Telegram pour notifications
ANTHROPIC_API_KEY       # Claude API pour IA
GOOGLE_CLIENT_ID        # OAuth Google
GOOGLE_CLIENT_SECRET    # OAuth Google
STRIPE_SECRET_KEY       # Stripe
STRIPE_WEBHOOK_SECRET   # Stripe webhooks
FCM_SERVER_KEY          # Firebase Cloud Messaging (LSA notifications)
```

---

## Notes importantes

- Guillaume utilise **Claude Code** lancé avec `--dangerously-skip-permissions` pour les projets frontend
- Le dashboard est déployé sur **Cloudflare Pages** (pas encore déployé pour ce fichier — en développement local)
- Il n'y a pas de build system — le fichier HTML est directement servi
- La DB Supabase supporte **1000+ utilisateurs simultanés** (RLS + index configurés)
- Le fichier `dashboard.html` doit rester **un seul fichier** (pas de split CSS/JS séparé)
- La sécurité est prioritaire — ne jamais exposer le service role key côté client

---

## Résumé de la mission

Créer un dashboard HTML vanilla single-file, élégant et fonctionnel, pour Help AI Agency. Il doit :
- Avoir le **design Claude Design** (dark theme ambre oklch, Montserrat, JetBrains Mono)
- Être **100% connecté à Supabase** (auth, leads, KPIs, GMB, factures, documents)
- Fonctionner pour **deux types d'utilisateurs** : admin (Guillaume) et clients artisans
- Être **stable et maintenable** (pas de bugs JS, pas de double comptage KPIs)
- Être déployable directement sur **Cloudflare Pages** sans build step
