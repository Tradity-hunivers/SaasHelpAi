/* Mock data for all screens */

const MONTHS = ["Avr 25", "Mai 25", "Juin 25", "Juil 25", "Août 25", "Sep 25", "Oct 25", "Nov 25", "Déc 25", "Jan 26", "Fév 26", "Mar 26"];

const REVENUE_DATA = [
  { m: "Avr 25", ca: 38000, ads: 12000, goal: 40000 },
  { m: "Mai 25", ca: 52000, ads: 14000, goal: 55000 },
  { m: "Juin 25", ca: 67000, ads: 18000, goal: 70000 },
  { m: "Juil 25", ca: 81000, ads: 22000, goal: 85000 },
  { m: "Août 25", ca: 94000, ads: 24000, goal: 95000 },
  { m: "Sep 25", ca: 118000, ads: 29000, goal: 115000 },
  { m: "Oct 25", ca: 147000, ads: 32000, goal: 140000 },
  { m: "Nov 25", ca: 162000, ads: 36000, goal: 160000 },
  { m: "Déc 25", ca: 195000, ads: 41000, goal: 180000 },
  { m: "Jan 26", ca: 238000, ads: 48000, goal: 220000 },
  { m: "Fév 26", ca: 284000, ads: 54000, goal: 260000 },
  { m: "Mar 26", ca: 326000, ads: 61000, goal: 310000 },
];

const LEADS_DATA = MONTHS.map((m, i) => ({
  m,
  ads: 120 + i * 45 + Math.round(Math.sin(i) * 30),
  organic: 80 + i * 28 + Math.round(Math.cos(i) * 20),
  referral: 30 + i * 9,
}));

const ROAS_DATA = MONTHS.map((m, i) => ({
  m,
  roas: 2.8 + i * 0.28 + Math.sin(i * 0.7) * 0.3,
  cpl: 72 - i * 2.5 + Math.cos(i) * 4,
}));

const KPIS = [
  { label: "CA total", value: "1 662 900", unit: "€", trend: "+24.3%", dir: "up", spark: [38, 52, 67, 81, 94, 118, 147, 162, 195, 238, 284, 326] },
  { label: "Leads total", value: "6 632", trend: "+18.2%", dir: "up", spark: [120, 180, 220, 260, 310, 355, 400, 460, 520, 580, 640, 700] },
  { label: "CPL moyen", value: "47", unit: "€", trend: "-12.4%", dir: "up", spark: [72, 68, 64, 62, 58, 55, 53, 51, 49, 48, 47, 47] },
  { label: "ROAS cumulé", value: "5.38", unit: "x", trend: "+42.1%", dir: "up", spark: [2.8, 3.1, 3.4, 3.8, 4.1, 4.3, 4.5, 4.8, 5.0, 5.2, 5.3, 5.38] },
  { label: "Deals signés", value: "320", trend: "+28.9%", dir: "up", spark: [15, 22, 28, 35, 42, 48, 55, 62, 72, 88, 95, 102] },
  { label: "Coût par deal", value: "966", unit: "€", trend: "-8.6%", dir: "up", spark: [1180, 1120, 1080, 1040, 1020, 1000, 985, 978, 972, 968, 966, 966] },
];

const KPIS_B = [
  { label: "No-show rate", value: "18.0", unit: "%", trend: "-2.3pt", dir: "up" },
  { label: "Pipeline en cours", value: "102", unit: "devis", trend: "+14", dir: "up" },
  { label: "Note moyenne", value: "4.8", unit: "/5", trend: "312 avis", dir: "flat" },
  { label: "Contrats actifs", value: "78", trend: "+6", dir: "up" },
  { label: "Tâches IA", value: "8 547", trend: "+1 204", dir: "up" },
];

const PIPELINE = {
  "Nouveau": [
    { name: "Dubois SAS", value: "12 400 €", source: "Meta Ads", owner: "LM", hot: true, age: "2h" },
    { name: "Martin & Fils", value: "8 200 €", source: "Google", owner: "TR", age: "5h" },
    { name: "Café Central", value: "4 800 €", source: "Referral", owner: "LM", age: "1j" },
    { name: "Atelier du Parc", value: "6 100 €", source: "Organique", owner: "SC", age: "1j" },
  ],
  "Qualifié": [
    { name: "Pharmacie Lyon 3", value: "18 900 €", source: "Referral", owner: "TR", hot: true, age: "2j" },
    { name: "Boulangerie Moreau", value: "5 600 €", source: "Meta Ads", owner: "SC", age: "3j" },
    { name: "Cabinet Dr. Petit", value: "14 200 €", source: "Google", owner: "LM", age: "4j" },
  ],
  "Devis envoyé": [
    { name: "Restaurant Arcadia", value: "24 500 €", source: "Referral", owner: "TR", hot: true, age: "5j" },
    { name: "Garage Riviera", value: "9 800 €", source: "Meta Ads", owner: "LM", age: "6j" },
    { name: "École Saint-Jean", value: "32 400 €", source: "Google", owner: "SC", age: "7j" },
    { name: "Studio Flora", value: "11 200 €", source: "Organique", owner: "TR", age: "8j" },
  ],
  "Négociation": [
    { name: "Groupe Vincent", value: "48 000 €", source: "Referral", owner: "LM", hot: true, age: "10j" },
    { name: "Hôtel Mirador", value: "36 500 €", source: "Referral", owner: "SC", age: "12j" },
  ],
  "Gagné": [
    { name: "Villa Aurore", value: "28 400 €", source: "Meta Ads", owner: "TR", age: "Aujourd'hui" },
    { name: "Opti-Lux SARL", value: "19 800 €", source: "Google", owner: "LM", age: "Hier" },
    { name: "Clinique Azur", value: "41 200 €", source: "Organique", owner: "SC", age: "Hier" },
  ],
};

const CUSTOMERS = [
  { name: "Villa Aurore", type: "Contrat annuel", value: "28 400 €", health: 94, status: "ok", owner: "TR", since: "Mar 2026", next: "Maintenance 15/05" },
  { name: "Groupe Vincent", type: "Multi-sites", value: "48 000 €", health: 88, status: "ok", owner: "LM", since: "Fév 2026", next: "Audit 22/04" },
  { name: "Hôtel Mirador", type: "Premium", value: "36 500 €", health: 72, status: "warn", owner: "SC", since: "Jan 2026", next: "Renouvellement 30/04" },
  { name: "Pharmacie Lyon 3", type: "Standard", value: "18 900 €", health: 96, status: "ok", owner: "TR", since: "Jan 2026", next: "—" },
  { name: "Cabinet Dr. Petit", type: "Standard", value: "14 200 €", health: 41, status: "bad", owner: "LM", since: "Déc 2025", next: "Relance 25/04" },
  { name: "Boulangerie Moreau", type: "Standard", value: "5 600 €", health: 82, status: "ok", owner: "SC", since: "Déc 2025", next: "—" },
  { name: "Atelier du Parc", type: "Standard", value: "6 100 €", health: 68, status: "warn", owner: "TR", since: "Nov 2025", next: "Intervention 28/04" },
  { name: "Clinique Azur", type: "Premium", value: "41 200 €", health: 91, status: "ok", owner: "SC", since: "Nov 2025", next: "Revue trimestrielle" },
];

const AUTOMATIONS = [
  { name: "Qualification des leads Meta Ads", trigger: "Nouveau lead Meta", runs: 2134, success: 97.8, status: "on", last: "il y a 2 min" },
  { name: "Relance devis à J+3", trigger: "Devis sans réponse 3j", runs: 487, success: 91.2, status: "on", last: "il y a 12 min" },
  { name: "Scoring prospect chaud", trigger: "Formulaire site", runs: 1892, success: 99.1, status: "on", last: "il y a 1 min" },
  { name: "Relance no-show RDV", trigger: "No-show Calendly", runs: 214, success: 88.4, status: "on", last: "il y a 34 min" },
  { name: "Email onboarding client", trigger: "Deal gagné", runs: 320, success: 100, status: "on", last: "il y a 2h" },
  { name: "Review Google post-intervention", trigger: "Ticket résolu", runs: 628, success: 94.5, status: "on", last: "il y a 48 min" },
  { name: "Nurturing leads froids", trigger: "Lead > 14j sans activité", runs: 912, success: 72.3, status: "paused", last: "il y a 3j" },
];

const INTEGRATIONS = [
  { name: "Meta Ads Manager", cat: "Acquisition", status: "connected", last: "Sync temps réel", events: "12 840" },
  { name: "Google Ads", cat: "Acquisition", status: "connected", last: "Il y a 4 min", events: "8 214" },
  { name: "HubSpot CRM", cat: "CRM", status: "connected", last: "Sync temps réel", events: "24 108" },
  { name: "Pipedrive", cat: "CRM", status: "disconnected", last: "—", events: "—" },
  { name: "Calendly", cat: "Rendez-vous", status: "connected", last: "Il y a 2 min", events: "4 321" },
  { name: "Stripe", cat: "Paiement", status: "connected", last: "Il y a 8 min", events: "987" },
  { name: "Google Business", cat: "Réputation", status: "connected", last: "Il y a 1h", events: "312" },
  { name: "Slack", cat: "Communication", status: "connected", last: "Temps réel", events: "18 042" },
  { name: "Notion", cat: "Documentation", status: "available", last: "—", events: "—" },
  { name: "Zapier", cat: "Automatisation", status: "connected", last: "Il y a 5 min", events: "6 780" },
  { name: "Segment", cat: "Data", status: "available", last: "—", events: "—" },
];

const TEAM = [
  { initials: "TR", name: "Thomas Renard", role: "Head of Sales", deals: 42, ca: "512 300 €", load: 78 },
  { initials: "LM", name: "Léa Marchand", role: "Account Executive", deals: 38, ca: "428 100 €", load: 82 },
  { initials: "SC", name: "Samir Cherif", role: "Account Executive", deals: 34, ca: "391 800 €", load: 65 },
  { initials: "EP", name: "Emma Pereira", role: "SDR", deals: 18, ca: "184 200 €", load: 91 },
  { initials: "NB", name: "Nicolas Berger", role: "Customer Success", deals: 0, ca: "—", load: 58 },
];

const ACTIVITY = [
  { time: "14:32", who: "Automation", what: <>Nouveau lead qualifié <strong>Villa Aurore</strong> — score <strong>92/100</strong></>, tag: "IA" },
  { time: "14:28", who: "Léa M.", what: <>A déplacé <strong>Groupe Vincent</strong> en Négociation (48 000 €)</>, tag: "Sales" },
  { time: "14:11", who: "Automation", what: <>Relance automatique envoyée à <strong>3 leads</strong> inactifs (J+7)</>, tag: "IA" },
  { time: "13:54", who: "Thomas R.", what: <>Deal gagné — <strong>Opti-Lux SARL</strong> (19 800 €)</>, tag: "Sales" },
  { time: "13:42", who: "Automation", what: <>Review Google collectée — <strong>5/5</strong> de Clinique Azur</>, tag: "IA" },
  { time: "13:20", who: "Samir C.", what: <>RDV programmé avec <strong>Restaurant Arcadia</strong> — 26/04 à 15h</>, tag: "Sales" },
  { time: "12:58", who: "Automation", what: <>Scoring recalculé pour <strong>28 contacts</strong></>, tag: "IA" },
];

const CHANNELS = [
  { name: "Meta Ads", value: 44, color: "oklch(0.74 0.155 55)", spend: "48 200 €", leads: 2917 },
  { name: "Google Ads", value: 29, color: "oklch(0.80 0.120 60)", spend: "32 400 €", leads: 1923 },
  { name: "Organique SEO", value: 18, color: "oklch(0.78 0.13 155)", spend: "0 €", leads: 1204 },
  { name: "Referral", value: 9, color: "oklch(0.70 0.12 240)", spend: "2 100 €", leads: 588 },
];

/* Leads entrants (CRM) — issus du tracking automatisé */
const INBOUND_LEADS = [
  { name: "Margaux Lefèvre", company: "Studio Lefèvre", source: "Meta Ads", campaign: "Spring Boost", landing: "/devis-rapide", score: 87, status: "new", owner: "—", time: "il y a 4 min", phone: "+33 6 12 34 56 78", email: "m.lefevre@studio-l.fr", utm: "meta_spring_boost_v3" },
  { name: "Karim Bensaïd", company: "Bensaïd Auto", source: "Google Ads", campaign: "Search · garages FR", landing: "/services", score: 74, status: "new", owner: "LM", time: "il y a 11 min", phone: "+33 6 88 22 14 09", email: "contact@bensaid-auto.fr", utm: "google_garages_q1" },
  { name: "Sophie Dumas", company: "Dumas & Associés", source: "Organique", campaign: "SEO blog", landing: "/blog/automatisation-cabinet", score: 92, status: "qualified", owner: "TR", time: "il y a 28 min", phone: "—", email: "s.dumas@dumas-asso.fr", utm: "organic_blog" },
  { name: "Antoine Roussel", company: "Roussel Habitat", source: "Referral", campaign: "Parrainage Villa Aurore", landing: "/?ref=villa-aurore", score: 81, status: "contacted", owner: "SC", time: "il y a 1h", phone: "+33 7 45 12 88 03", email: "a.roussel@rh-habitat.com", utm: "ref_villa_aurore" },
  { name: "Julie Mercier", company: "Mercier Pâtisserie", source: "Meta Ads", campaign: "Retargeting carrousel", landing: "/cas-clients", score: 68, status: "new", owner: "—", time: "il y a 1h", phone: "+33 6 71 09 44 12", email: "julie@mercier-patisserie.fr", utm: "meta_retargeting_v2" },
  { name: "Pierre-Yves Garnier", company: "PYG Conseil", source: "Google Ads", campaign: "Search · conseil B2B", landing: "/devis-rapide", score: 79, status: "contacted", owner: "LM", time: "il y a 2h", phone: "+33 6 32 18 77 04", email: "py.garnier@pyg.fr", utm: "google_conseil_b2b" },
  { name: "Élise Faure", company: "Faure Beauté", source: "Meta Ads", campaign: "Spring Boost", landing: "/?promo=spring", score: 55, status: "nurturing", owner: "EP", time: "il y a 3h", phone: "+33 6 09 87 22 41", email: "contact@faurebeaute.fr", utm: "meta_spring_boost_v3" },
  { name: "Marc Olivier", company: "Olivier Logistique", source: "Organique", campaign: "SEO landing", landing: "/services/logistique", score: 88, status: "qualified", owner: "TR", time: "il y a 4h", phone: "+33 6 14 56 78 99", email: "m.olivier@olivier-log.com", utm: "organic_landing" },
];

/* Tracking inbound — par source × dans le temps (12 mois) */
const INBOUND_BY_MONTH = MONTHS.map((m, i) => ({
  m,
  meta: 180 + i * 38 + Math.round(Math.sin(i * 0.6) * 20),
  google: 120 + i * 26 + Math.round(Math.cos(i * 0.5) * 18),
  organic: 60 + i * 18 + Math.round(Math.sin(i * 0.9) * 12),
  referral: 22 + i * 7,
}));

Object.assign(window, {
  MONTHS, REVENUE_DATA, LEADS_DATA, ROAS_DATA, KPIS, KPIS_B,
  PIPELINE, CUSTOMERS, AUTOMATIONS, INTEGRATIONS, TEAM, ACTIVITY, CHANNELS,
  INBOUND_LEADS, INBOUND_BY_MONTH
});
