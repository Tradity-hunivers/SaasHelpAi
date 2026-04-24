#!/usr/bin/env node
/* Build c:/Users/decar/Desktop/Espace client Help AI/dashboard.html */
const fs = require('fs');
const path = require('path');

const DIR = 'c:/Users/decar/Desktop/Espace client Help AI/.claude/design2/helpai/project';
const read = (f) => fs.readFileSync(path.join(DIR, f), 'utf8');

const css              = read('styles.css');
const iconsJsx         = read('icons.jsx');
const chartsJsx        = read('charts.jsx');
const editableJsx      = read('editable.jsx');
const screensMain      = read('screens-main.jsx');
const screensPipeline  = read('screens-pipeline.jsx');
const screensAI        = read('screens-ai.jsx');
const screensArch      = read('screens-architecture.jsx');

/* ----------------------------------------------------------------------
 * Supabase-backed data loader.
 *
 * Exposes on window the SAME globals that mock-data.jsx defined, so every
 * screen component can consume them unchanged. When a given dataset is
 * empty (e.g. no agency_kpis yet), we emit empty-but-shaped values so the
 * React components render their empty state instead of crashing.
 * --------------------------------------------------------------------- */
const supabaseDataJsx = `
/* Supabase client + real data loader */

const SUPABASE_URL  = 'https://wodlupbffooqtshgasml.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZGx1cGJmZm9vcXRzaGdhc21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNzkwODQsImV4cCI6MjA4ODk1NTA4NH0.cpimdDxESdrsdOH2CtPSamgzATDiss3eTogf5s5IFy4';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
window.sb = sb;

/* ----- helpers ----- */
const MONTH_ABBR = ["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
const MONTH_SHORT = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];
function fmtMonthLabel(d) {
  return MONTH_SHORT[d.getMonth()] + " " + String(d.getFullYear()).slice(2);
}
function fmtEur(centimes) {
  const v = Math.round((centimes || 0) / 100);
  return v.toLocaleString("fr-FR");
}
function buildMonths(n=12) {
  const arr = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    arr.push({ d, key: d.toISOString().slice(0,7), label: fmtMonthLabel(d) });
  }
  return arr;
}
function timeAgo(iso) {
  if (!iso) return "—";
  const delta = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (delta < 60)    return "il y a " + delta + "s";
  if (delta < 3600)  return "il y a " + Math.floor(delta/60) + " min";
  if (delta < 86400) return "il y a " + Math.floor(delta/3600) + "h";
  const days = Math.floor(delta/86400);
  if (days < 30) return "il y a " + days + "j";
  return new Date(iso).toLocaleDateString("fr-FR");
}
function pct(a, b) {
  if (!b) return 0;
  return Math.round(((a - b) / b) * 1000) / 10;
}
function trendStr(delta) {
  if (delta > 0) return { trend: "+" + delta + "%", dir: "up" };
  if (delta < 0) return { trend: delta + "%", dir: "down" };
  return { trend: "stable", dir: "flat" };
}
function initials(s) {
  if (!s) return "??";
  return s.split(/\\s+/).filter(Boolean).map(x => x[0]).slice(0,2).join("").toUpperCase();
}

/* ----- loadAllData({isAdmin, clientId}) ----- */
async function loadAllData({ isAdmin, clientId }) {
  const monthsArr = buildMonths(12);
  const MONTHS = monthsArr.map(m => m.label);

  const clientFilter = isAdmin ? null : clientId;

  /* agency_clients */
  let qc = sb.from('agency_clients').select('*');
  if (clientFilter) qc = qc.eq('id', clientFilter);
  const { data: clientsRows = [] } = await qc;

  /* agency_leads */
  let ql = sb.from('agency_leads').select('*').order('created_at', { ascending: false }).limit(500);
  if (clientFilter) ql = ql.eq('client_id', clientFilter);
  const { data: leadsRows = [] } = await ql;

  /* agency_kpis */
  let qk = sb.from('agency_kpis').select('*');
  if (clientFilter) qk = qk.eq('client_id', clientFilter);
  const { data: kpisRows = [] } = await qk;

  /* agency_invoices (admin only for overview) */
  let invRows = [];
  if (isAdmin) {
    const { data } = await sb.from('agency_invoices').select('*').order('created_at', { ascending: false }).limit(200);
    invRows = data || [];
  } else if (clientFilter) {
    const { data } = await sb.from('agency_invoices').select('*').eq('client_id', clientFilter).order('created_at', { ascending: false });
    invRows = data || [];
  }

  /* agency_gmb_stats (all or scoped) */
  let gmbRows = [];
  try {
    let qg = sb.from('agency_gmb_stats').select('*');
    if (clientFilter) qg = qg.eq('agency_client_id', clientFilter);
    const { data } = await qg;
    gmbRows = data || [];
  } catch (e) { gmbRows = []; }

  /* KPIs cumulés : filtrer source='total' */
  const totals = kpisRows.filter(k => k.source === 'total');
  const totalByMonth = {};
  totals.forEach(k => {
    const key = (k.periode || '').slice(0,7);
    if (!totalByMonth[key]) totalByMonth[key] = { nb_leads:0, depense:0, ca_genere:0, deals:0, roas:0, cout_par_lead:0, panier_moyen:0, note_google:0, nb_avis_google:0, taux_rdv:0, leads_ref:0, pipeline:0 };
    const t = totalByMonth[key];
    t.nb_leads += k.nb_leads || 0;
    t.depense += k.depense || 0;
    t.ca_genere += k.ca_genere || 0;
    t.deals += k.deals || 0;
    t.roas = Math.max(t.roas, Number(k.roas) || 0);
    t.cout_par_lead = Math.max(t.cout_par_lead, k.cout_par_lead || 0);
    t.panier_moyen = Math.max(t.panier_moyen, k.panier_moyen || 0);
    t.note_google = Math.max(t.note_google, Number(k.note_google) || 0);
    t.nb_avis_google = Math.max(t.nb_avis_google, k.nb_avis_google || 0);
    t.taux_rdv = Math.max(t.taux_rdv, Number(k.taux_rdv) || 0);
    t.leads_ref = (t.leads_ref || 0) + (k.leads_ref || 0);
    t.pipeline = Math.max(t.pipeline, k.pipeline || 0);
  });

  /* REVENUE_DATA */
  const REVENUE_DATA = monthsArr.map(m => {
    const t = totalByMonth[m.key] || {};
    const ca = (t.ca_genere || 0) / 100;
    return { m: m.label, ca, ads: (t.depense || 0) / 100, goal: Math.round(ca * 1.1) };
  });

  /* LEADS_DATA: ads = google_ads + meta, organic = gmb + site, referral = autre */
  const leadsByMonthSource = {};
  kpisRows.filter(k => k.source !== 'total').forEach(k => {
    const key = (k.periode || '').slice(0,7);
    if (!leadsByMonthSource[key]) leadsByMonthSource[key] = {};
    leadsByMonthSource[key][k.source] = (leadsByMonthSource[key][k.source] || 0) + (k.nb_leads || 0);
  });
  const LEADS_DATA = monthsArr.map(m => {
    const src = leadsByMonthSource[m.key] || {};
    return {
      m: m.label,
      ads: (src.google_ads || 0) + (src.meta || 0),
      organic: (src.gmb || 0) + (src.site || 0),
      referral: (src.autre || 0),
    };
  });

  /* ROAS_DATA */
  const ROAS_DATA = monthsArr.map(m => {
    const t = totalByMonth[m.key] || {};
    return {
      m: m.label,
      roas: Number(t.roas) || 0,
      cpl: (t.cout_par_lead || 0) / 100,
    };
  });

  /* KPIs (6 cards) — current month totals + spark on 12 months */
  const lastIdx = monthsArr.length - 1;
  const curKey = monthsArr[lastIdx].key;
  const cur = totalByMonth[curKey] || {};
  const prev = totalByMonth[monthsArr[Math.max(0,lastIdx-1)].key] || {};

  const totalCa = totals.reduce((s, k) => s + (k.ca_genere || 0), 0) / 100;
  const totalLeads = totals.reduce((s, k) => s + (k.nb_leads || 0), 0);
  const totalDepense = totals.reduce((s, k) => s + (k.depense || 0), 0) / 100;
  const totalDeals = totals.reduce((s, k) => s + (k.deals || 0), 0);
  const avgCpl = totalLeads > 0 ? Math.round(totalDepense / totalLeads) : 0;
  const avgRoas = totalDepense > 0 ? (totalCa / totalDepense) : 0;
  const coutDeal = totalDeals > 0 ? Math.round(totalDepense / totalDeals) : 0;

  const sparkCA = REVENUE_DATA.map(d => Math.max(1, d.ca / 1000));
  const sparkLeads = LEADS_DATA.map(d => Math.max(1, d.ads + d.organic + d.referral));
  const sparkCpl = ROAS_DATA.map(d => Math.max(1, d.cpl || 1));
  const sparkRoas = ROAS_DATA.map(d => Math.max(0.1, d.roas || 0.1));
  const sparkDeals = monthsArr.map(m => (totalByMonth[m.key]||{}).deals || 0).map(v => Math.max(1, v));

  const KPIS = [
    { label: "CA total", value: totalCa.toLocaleString("fr-FR"), unit: "€",
      ...trendStr(pct(cur.ca_genere||0, prev.ca_genere||0)), spark: sparkCA },
    { label: "Leads total", value: totalLeads.toLocaleString("fr-FR"),
      ...trendStr(pct(cur.nb_leads||0, prev.nb_leads||0)), spark: sparkLeads },
    { label: "CPL moyen", value: avgCpl.toLocaleString("fr-FR"), unit: "€",
      ...(() => { const d = pct(prev.cout_par_lead||0, cur.cout_par_lead||0); return { trend: (d>=0?"+":"") + d + "%", dir: d>=0?"up":"down"}; })(),
      spark: sparkCpl },
    { label: "ROAS cumulé", value: avgRoas.toFixed(2), unit: "x",
      ...trendStr(pct(cur.roas||0, prev.roas||0)), spark: sparkRoas },
    { label: "Deals signés", value: totalDeals.toLocaleString("fr-FR"),
      ...trendStr(pct(cur.deals||0, prev.deals||0)), spark: sparkDeals },
    { label: "Coût par deal", value: coutDeal.toLocaleString("fr-FR"), unit: "€",
      trend: "—", dir: "flat", spark: sparkDeals },
  ];

  /* KPIS_B (secondary row) */
  const noShow = cur.taux_rdv ? Math.max(0, 100 - Number(cur.taux_rdv)) : 0;
  const pipeline = cur.pipeline || 0;
  const noteMoy = cur.note_google || 0;
  const nbAvis = cur.nb_avis_google || 0;
  const contratsActifs = clientsRows.filter(c => c.statut === 'actif').length;

  const KPIS_B = [
    { label: "No-show rate", value: noShow.toFixed(1), unit: "%", trend: "—", dir: "flat" },
    { label: "Pipeline en cours", value: String(pipeline), unit: "devis", trend: "—", dir: "flat" },
    { label: "Note moyenne", value: noteMoy ? Number(noteMoy).toFixed(1) : "—", unit: "/5", trend: nbAvis + " avis", dir: "flat" },
    { label: "Contrats actifs", value: String(contratsActifs), trend: "—", dir: "flat" },
    { label: "Tâches IA", value: "—", trend: "—", dir: "flat" },
  ];

  /* PIPELINE — bucket agency_leads by statut into kanban columns */
  const statutMap = {
    'nouveau':  'Nouveau',
    'contacté': 'Qualifié',
    'contacte': 'Qualifié',
    'qualifié': 'Devis envoyé',
    'qualifie': 'Devis envoyé',
    'gagné':    'Gagné',
    'gagne':    'Gagné',
  };
  const PIPELINE = { "Nouveau": [], "Qualifié": [], "Devis envoyé": [], "Négociation": [], "Gagné": [] };
  leadsRows.slice(0, 30).forEach(l => {
    const col = statutMap[(l.statut || '').toLowerCase()] || 'Nouveau';
    const clientName = (clientsRows.find(c => c.id === l.client_id) || {}).nom || l.nom || 'Lead';
    PIPELINE[col].push({
      name: clientName,
      value: (l.metadata && l.metadata.montant ? Math.round(l.metadata.montant/100) : 0).toLocaleString("fr-FR") + " €",
      source: ({ 'google_ads':'Google', 'meta':'Meta Ads', 'gmb':'GMB', 'site':'Organique', 'autre':'Referral' })[l.source] || (l.source || '—'),
      owner: initials(l.nom || ''),
      hot: l.statut === 'qualifié',
      age: timeAgo(l.created_at),
    });
  });

  /* CUSTOMERS (portfolio admin + single-client for client view) */
  const CUSTOMERS = clientsRows.map(c => {
    const lastInv = invRows.find(i => i.client_id === c.id);
    const montant = lastInv ? (lastInv.montant / 100).toLocaleString("fr-FR") + " €" : "—";
    const statut = c.statut === 'actif' ? 'ok' : c.statut === 'pause' ? 'warn' : 'bad';
    return {
      name: c.nom || '—',
      type: c.secteur || 'Standard',
      value: montant,
      health: c.statut === 'actif' ? 88 : c.statut === 'pause' ? 60 : 30,
      status: statut,
      owner: initials(c.nom || ''),
      since: c.created_at ? new Date(c.created_at).toLocaleDateString("fr-FR", { month:'short', year:'numeric' }) : "—",
      next: "—",
    };
  });

  /* INTEGRATIONS: derived from what's configured in agency_clients */
  const hasTg = clientsRows.some(c => c.telegram_notify);
  const hasStripe = clientsRows.some(c => c.stripe_customer_id);
  const hasDrive = clientsRows.some(c => c.drive_folder_id);
  const hasGmb = clientsRows.some(c => c.gmb_client_id);
  const INTEGRATIONS = [
    { name: "Supabase",       cat: "Data",          status: "connected",     last: "Temps réel",      events: String(leadsRows.length) + " leads" },
    { name: "Stripe",         cat: "Paiement",      status: hasStripe ? "connected" : "available", last: hasStripe ? "Actif" : "—", events: String(invRows.length) },
    { name: "Resend",         cat: "Email",         status: "connected",     last: "Via Edge Function", events: "—" },
    { name: "Telegram",       cat: "Notifications", status: hasTg ? "connected" : "available", last: hasTg ? "Actif" : "—", events: "—" },
    { name: "Google Business",cat: "Réputation",    status: hasGmb ? "connected" : "available", last: hasGmb ? "Sync" : "—", events: String(gmbRows.reduce((s,g)=>s+(g.nb_avis||0),0)) + " avis" },
    { name: "Google Drive",   cat: "Documentation", status: hasDrive ? "connected" : "available", last: hasDrive ? "Actif" : "—", events: "—" },
    { name: "Google Ads",     cat: "Acquisition",   status: "available",     last: "—", events: "—" },
    { name: "Meta Ads",       cat: "Acquisition",   status: "available",     last: "—", events: "—" },
  ];

  /* AUTOMATIONS: empty for now, screen will render the empty table */
  const AUTOMATIONS = [];

  /* TEAM: empty */
  const TEAM = [];

  /* ACTIVITY — latest 7 leads as live feed */
  const React = window.React;
  const ACTIVITY = leadsRows.slice(0, 7).map(l => {
    const when = l.created_at ? new Date(l.created_at).toLocaleTimeString("fr-FR", { hour:'2-digit', minute:'2-digit'}) : "--:--";
    const srcLbl = ({ 'google_ads':'Google Ads', 'meta':'Meta Ads', 'gmb':'GMB', 'site':'Site', 'autre':'Autre', 'appel':'Appel', 'lsa':'LSA' })[l.source] || (l.source || '—');
    const clientName = (clientsRows.find(c => c.id === l.client_id) || {}).nom || '—';
    return {
      time: when,
      who: clientName,
      what: React.createElement(React.Fragment, null,
        "Nouveau lead ",
        React.createElement("strong", null, l.nom || "Anonyme"),
        " — ",
        React.createElement("strong", null, srcLbl)
      ),
      tag: srcLbl,
    };
  });

  /* CHANNELS: repartition cur-month leads by source (for donut) */
  const curSourceLeads = kpisRows
    .filter(k => k.source !== 'total' && (k.periode || '').slice(0,7) === curKey)
    .reduce((acc, k) => { acc[k.source] = (acc[k.source]||0) + (k.nb_leads||0); return acc; }, {});
  const curSourceSpend = kpisRows
    .filter(k => k.source !== 'total' && (k.periode || '').slice(0,7) === curKey)
    .reduce((acc, k) => { acc[k.source] = (acc[k.source]||0) + (k.depense||0); return acc; }, {});
  const totalCurLeads = Object.values(curSourceLeads).reduce((s,v) => s+v, 0) || 1;
  const CHANNELS_RAW = [
    { src: 'meta',       name: 'Meta Ads',      color: 'oklch(0.74 0.155 55)' },
    { src: 'google_ads', name: 'Google Ads',    color: 'oklch(0.80 0.120 60)' },
    { src: 'gmb',        name: 'Organique GMB', color: 'oklch(0.78 0.13 155)' },
    { src: 'site',       name: 'Site web',      color: 'oklch(0.70 0.12 240)' },
    { src: 'autre',      name: 'Referral',      color: 'oklch(0.65 0.15 310)' },
  ];
  const CHANNELS = CHANNELS_RAW
    .filter(c => curSourceLeads[c.src])
    .map(c => ({
      name: c.name,
      value: Math.round((curSourceLeads[c.src] / totalCurLeads) * 100),
      color: c.color,
      spend: ((curSourceSpend[c.src]||0)/100).toLocaleString("fr-FR") + " €",
      leads: curSourceLeads[c.src] || 0,
    }));
  if (!CHANNELS.length) {
    CHANNELS.push({ name: "—", value: 100, color: "var(--surface-2)", spend: "0 €", leads: 0 });
  }

  /* INBOUND_LEADS: last 8 with enriched fields */
  const statutToLeadStatus = {
    'nouveau':'new', 'contacté':'contacted', 'contacte':'contacted',
    'qualifié':'qualified', 'qualifie':'qualified',
    'gagné':'qualified', 'gagne':'qualified', 'perdu':'nurturing',
  };
  const INBOUND_LEADS = leadsRows.slice(0, 12).map(l => {
    const srcLbl = ({ 'google_ads':'Google Ads', 'meta':'Meta Ads', 'gmb':'Organique', 'site':'Organique', 'autre':'Referral', 'appel':'Appel', 'lsa':'LSA' })[l.source] || (l.source || '—');
    const clientName = (clientsRows.find(c => c.id === l.client_id) || {}).nom || '—';
    return {
      name: l.nom || "Anonyme",
      company: clientName,
      source: srcLbl,
      campaign: l.utm_campaign || '—',
      landing: l.utm_content || '/—',
      score: 60 + Math.floor(Math.random() * 35),
      status: statutToLeadStatus[(l.statut||'').toLowerCase()] || 'new',
      owner: '—',
      time: timeAgo(l.created_at),
      phone: l.telephone || '—',
      email: l.email || '—',
      utm: l.utm_source || '',
    };
  });

  /* INBOUND_BY_MONTH : par source (meta/google/organic/referral) */
  const inboundKeyOf = (src) => src === 'meta' ? 'meta' :
                               src === 'google_ads' ? 'google' :
                               src === 'gmb' || src === 'site' ? 'organic' :
                               'referral';
  const INBOUND_BY_MONTH = monthsArr.map(m => {
    const src = leadsByMonthSource[m.key] || {};
    const row = { m: m.label, meta: 0, google: 0, organic: 0, referral: 0 };
    Object.entries(src).forEach(([k, v]) => { row[inboundKeyOf(k)] += v; });
    return row;
  });

  /* Publish on window so screen components can read */
  Object.assign(window, {
    MONTHS, REVENUE_DATA, LEADS_DATA, ROAS_DATA, KPIS, KPIS_B,
    PIPELINE, CUSTOMERS, AUTOMATIONS, INTEGRATIONS, TEAM, ACTIVITY, CHANNELS,
    INBOUND_LEADS, INBOUND_BY_MONTH,
    __HELPAI_CLIENTS_ROWS: clientsRows,
    __HELPAI_LEADS_ROWS: leadsRows,
    __HELPAI_INV_ROWS: invRows,
  });
}
window.loadAllData = loadAllData;

/* ======================================================================
 * AuthGate — renders login overlay until Supabase session exists.
 * Once logged in, loads data, resolves admin/client role, then mounts <App/>.
 * ==================================================================== */
function AuthGate() {
  const [state, setState] = React.useState({ status: 'booting' });
  const [email, setEmail]       = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loginError, setLoginError] = React.useState('');
  const [loggingIn, setLoggingIn] = React.useState(false);

  const resolveRole = React.useCallback(async (session) => {
    if (!session || !session.user) { setState({ status: 'login' }); return; }
    const user = session.user;
    const isAdmin = user.app_metadata && user.app_metadata.role === 'admin';
    let clientRow = null;
    if (!isAdmin) {
      const { data } = await sb.from('agency_clients').select('*').eq('user_id', user.id).maybeSingle();
      clientRow = data;
      if (!clientRow) {
        setState({ status: 'no_client', user });
        return;
      }
    }
    try {
      await loadAllData({ isAdmin, clientId: clientRow ? clientRow.id : null });
    } catch (e) {
      console.error('loadAllData failed', e);
    }
    setState({
      status: 'ready',
      user,
      isAdmin,
      client: clientRow,
      displayName: isAdmin ? (user.email || 'Admin') : (clientRow ? clientRow.nom : user.email),
    });
  }, []);

  React.useEffect(() => {
    sb.auth.getSession().then(({ data }) => resolveRole(data ? data.session : null));
    const { data: sub } = sb.auth.onAuthStateChange((evt, session) => {
      if (evt === 'SIGNED_OUT') setState({ status: 'login' });
      if (evt === 'SIGNED_IN' || evt === 'TOKEN_REFRESHED') resolveRole(session);
    });
    return () => { sub && sub.subscription && sub.subscription.unsubscribe(); };
  }, [resolveRole]);

  // Realtime: re-fetch on new leads
  React.useEffect(() => {
    if (state.status !== 'ready') return;
    const ch = sb
      .channel('agency_leads_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agency_leads' }, async () => {
        try { await loadAllData({ isAdmin: state.isAdmin, clientId: state.client ? state.client.id : null }); } catch {}
      })
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [state.status, state.isAdmin, state.client]);

  async function onLogin(e) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setLoggingIn(false);
    if (error) setLoginError(error.message || 'Identifiants invalides');
  }

  if (state.status === 'booting') {
    return React.createElement('div', { style: { minHeight:'100vh', display:'grid', placeItems:'center', color:'var(--text-3)' } },
      React.createElement('div', null, 'Chargement…'));
  }

  if (state.status === 'login') {
    return (
      <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', padding: 24 }}>
        <form onSubmit={onLogin} className="card fade-up" style={{ width:'100%', maxWidth: 380, padding: 28 }}>
          <div className="brand" style={{ justifyContent:'center', marginBottom: 18 }}>
            <div className="brand-mark">HA</div>
            <div>
              <div className="brand-name">HelpAi Agency</div>
              <div className="brand-sub">Business Copilot</div>
            </div>
          </div>
          <div className="stack-md">
            <div className="stack-xs">
              <label className="small muted">Email</label>
              <input className="search" style={{ minWidth: 0, cursor:'text' }}
                     type="email" autoComplete="username" required
                     value={email} onChange={e => setEmail(e.target.value)}/>
            </div>
            <div className="stack-xs">
              <label className="small muted">Mot de passe</label>
              <input className="search" style={{ minWidth: 0, cursor:'text' }}
                     type="password" autoComplete="current-password" required
                     value={password} onChange={e => setPassword(e.target.value)}/>
            </div>
            <button className="btn primary" type="submit"
                    disabled={loggingIn}
                    style={{ width:'100%', justifyContent:'center', height: 38 }}>
              {loggingIn ? 'Connexion…' : 'Se connecter'}
            </button>
            {loginError && <div className="small" style={{ color:'var(--danger)' }}>{loginError}</div>}
          </div>
        </form>
      </div>
    );
  }

  if (state.status === 'no_client') {
    return (
      <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', padding: 24 }}>
        <div className="card" style={{ padding: 28, maxWidth: 460, textAlign:'center' }}>
          <div className="brand" style={{ justifyContent:'center', marginBottom: 14 }}>
            <div className="brand-mark">HA</div>
            <div className="brand-name">HelpAi Agency</div>
          </div>
          <div className="muted small" style={{ marginBottom: 14 }}>
            Aucun espace client n'est associé à votre compte ({state.user.email}).
            <br/>Contactez l'agence à <strong>contactpro@helpaiagency.com</strong>.
          </div>
          <button className="btn" style={{ margin:'0 auto' }} onClick={() => sb.auth.signOut()}>Déconnexion</button>
        </div>
      </div>
    );
  }

  /* ready */
  return React.createElement(App, {
    isAdmin: state.isAdmin,
    displayName: state.displayName,
    userClient: state.client,
    onLogout: async () => { await sb.auth.signOut(); },
  });
}
window.AuthGate = AuthGate;
`;

/* ----------------------------------------------------------------------
 * Modified app.jsx — no useTweaks / TweaksPanel, accepts props from AuthGate.
 * --------------------------------------------------------------------- */
const modifiedAppJsx = `
/* App shell + sidebar + routing — modified to consume AuthGate props */

function buildNav(isAdmin) {
  const nav = [
    { group: "Tableau de bord", items: [
      { id: "overview",    label: "Vue d'ensemble", icon: "overview" },
      { id: "acquisition", label: "Acquisition",    icon: "acquisition" },
      { id: "sales",       label: "Ventes",         icon: "sales" },
    ]},
    { group: "Intelligence", items: [
      { id: "ai", label: "Activité IA", icon: "ai", badge: "Live" },
    ]},
    { group: "Infrastructure", items: [
      { id: "architecture", label: "Architecture", icon: "integrations" },
    ]},
    { group: "Écosystème", items: [
      { id: "customers",    label: "CRM",          icon: "customers" },
      { id: "integrations", label: "Intégrations", icon: "integrations" },
    ]},
  ];
  if (isAdmin) {
    nav[1].items.push({ id: "automations", label: "Automations", icon: "automations" });
  }
  return nav;
}

const SCREEN_META = {
  overview:     { title: "Vue d'ensemble", sub: "Performance globale · 12 derniers mois", breadcrumb: "Tableau de bord" },
  acquisition:  { title: "Acquisition",    sub: "Leads, canaux, campagnes et funnel",     breadcrumb: "Tableau de bord" },
  sales:        { title: "Ventes",         sub: "Performance commerciale et CA signé",    breadcrumb: "Tableau de bord" },
  ai:           { title: "Activité IA",    sub: "Agent HelpAi",                            breadcrumb: "Intelligence" },
  automations:  { title: "Automations",    sub: "Workflows et déclencheurs",               breadcrumb: "Intelligence" },
  customers:    { title: "CRM",            sub: "Leads entrants, prospects et clients",    breadcrumb: "Écosystème" },
  architecture: { title: "Architecture",   sub: "Infrastructure HelpAi — 5 piliers",        breadcrumb: "Infrastructure" },
  integrations: { title: "Intégrations",   sub: "Services connectés à votre espace",       breadcrumb: "Écosystème" },
};

const EditContext = window.__HelpAi_EditContext || React.createContext({ editing: false });
window.__HelpAi_EditContext = EditContext;

function App({ isAdmin, displayName, userClient, onLogout }) {
  const [theme, setTheme] = React.useState(() => localStorage.getItem('theme') || 'dark');
  const [workspace, setWorkspace] = React.useState(isAdmin ? 'agency' : 'client');
  const [editMode, setEditMode] = React.useState(false);
  const [screen, setScreen] = React.useState("overview");

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  React.useEffect(() => {
    if (workspace === 'client' && screen === 'automations') setScreen('overview');
  }, [workspace, screen]);

  const meta = SCREEN_META[screen];
  const isAgencyView = isAdmin && workspace === 'agency';
  const editing = isAgencyView && editMode;

  const renderScreen = () => {
    switch (screen) {
      case "overview":    return <ScreenOverview/>;
      case "acquisition": return <ScreenAcquisition/>;
      case "sales":       return <ScreenSales/>;
      case "ai":          return <ScreenAI/>;
      case "automations": return isAgencyView ? <ScreenAutomations/> : <ScreenOverview/>;
      case "customers":   return <ScreenCustomers/>;
      case "architecture":return <ScreenArchitecture/>;
      case "integrations":return <ScreenIntegrations/>;
      default:            return <ScreenOverview/>;
    }
  };

  const NAV = buildNav(isAdmin);
  const clientLeads = window.__HELPAI_LEADS_ROWS || [];
  const unreadLeads = clientLeads.filter(l => l.statut === 'nouveau').length;

  return (
    <div className="app">
      {/* ============ SIDEBAR ============ */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">HA</div>
          <div>
            <div className="brand-name">HelpAi Agency</div>
            <div className="brand-sub">Business Copilot</div>
          </div>
        </div>

        <div className="workspace-switch">
          <div className="workspace-avatar">{(displayName || "??").slice(0,2).toUpperCase()}</div>
          <div className="workspace-info">
            <div className="workspace-name">{displayName || "—"}</div>
            <div className="workspace-role">{isAdmin ? (workspace === 'agency' ? "Agence · Admin" : "Vue client") : "Espace client"}</div>
          </div>
          <Icon name="chevDown" size={14} className="workspace-chev"/>
        </div>

        {isAdmin && (
          <div className="seg">
            <button className={workspace === "client" ? "active" : ""} onClick={() => setWorkspace("client")}>Vue Client</button>
            <button className={workspace === "agency" ? "active" : ""} onClick={() => setWorkspace("agency")}>Vue Agence</button>
          </div>
        )}

        <div className="stack-md" style={{ flex: 1, overflow: "auto" }}>
          {NAV.map((g, gi) => (
            <div key={gi} className="nav-group">
              <div className="nav-label">{g.group}</div>
              {g.items.map(it => {
                let badge = it.badge;
                if (it.id === 'customers' && unreadLeads) badge = String(unreadLeads);
                return (
                  <div
                    key={it.id}
                    className={"nav-item " + (screen === it.id ? "active" : "")}
                    onClick={() => setScreen(it.id)}
                  >
                    <Icon name={it.icon} size={16} className="nav-icon"/>
                    <span>{it.label}</span>
                    {badge && <span className="nav-badge">{badge}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="plan-usage">
            <span>{isAdmin ? "Admin Agence" : "Espace client"}</span>
            <span className="mono">v1.0</span>
          </div>
          <div className="usage-bar"><div style={{ width: "100%" }}/></div>
          <button className="btn ghost small" style={{ width:'100%', justifyContent:'center', marginTop: 10, height: 28 }} onClick={onLogout}>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ============ MAIN ============ */}
      <div className="main">
        <div className="topbar">
          <div className="crumbs">
            <span>{meta.breadcrumb}</span>
            <span className="crumb-sep">/</span>
            <strong>{meta.title}</strong>
          </div>
          <div className="spacer"/>
          <div className="search" onClick={() => {}}>
            <Icon name="search" size={14}/>
            <span>Chercher un lead, un client…</span>
            <kbd>⌘K</kbd>
          </div>
          {isAdmin && (
            <button
              className={"btn " + (editMode ? "primary" : "")}
              onClick={() => setEditMode(!editMode)}
              title="Activer l'édition manuelle"
            >
              <Icon name={editMode ? "check" : "edit"} size={13}/>
              {editMode ? "Terminer l'édition" : "Modifier"}
            </button>
          )}
          <button className="btn icon ghost" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Thème">
            <Icon name={theme === "dark" ? "sun" : "moon"} size={14}/>
          </button>
          <button className="btn icon ghost" title="Notifications"><Icon name="bell" size={14}/></button>
          <span className={"av md av-colors-3"}>{(displayName || "??").slice(0,2).toUpperCase()}</span>
        </div>

        {editing && (
          <div className="edit-banner">
            <Icon name="edit" size={13}/>
            <span><strong>Mode édition activé.</strong> Cliquez sur une valeur ou un nom pour l'éditer.</span>
            <button className="btn small ghost" onClick={() => setEditMode(false)}>Quitter</button>
          </div>
        )}
        <div className="page">
          <div className="page-header">
            <div>
              <h1 className="page-title">{meta.title}</h1>
              <div className="page-sub">{meta.sub}</div>
            </div>
            <div className="page-actions">
              <button className="btn" onClick={() => window.loadAllData && window.loadAllData({ isAdmin, clientId: userClient ? userClient.id : null }).then(()=>setScreen(s=>s))}>
                <Icon name="refresh" size={13}/> Actualiser
              </button>
              <button className="btn"><Icon name="download" size={13}/> Exporter</button>
            </div>
          </div>
          <EditContext.Provider value={{ editing }}>
            {renderScreen()}
          </EditContext.Provider>
        </div>
      </div>
    </div>
  );
}

window.App = App;

/* Mount */
ReactDOM.createRoot(document.getElementById("root")).render(<AuthGate/>);
`;

/* ----------------------------------------------------------------------
 * Assemble final HTML.
 * --------------------------------------------------------------------- */
const html = `<!DOCTYPE html>
<html lang="fr" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=1400, initial-scale=1">
  <title>HelpAi Agency — Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
${css}
  </style>
</head>
<body>
  <div id="root"></div>

  <script src="https://unpkg.com/react@18.3.1/umd/react.development.js" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

  <script type="text/babel" data-presets="env,react">
${iconsJsx}
  </script>

  <script type="text/babel" data-presets="env,react">
${chartsJsx}
  </script>

  <script type="text/babel" data-presets="env,react">
${editableJsx}
  </script>

  <script type="text/babel" data-presets="env,react">
${supabaseDataJsx}
  </script>

  <script type="text/babel" data-presets="env,react">
${screensMain}
  </script>

  <script type="text/babel" data-presets="env,react">
${screensPipeline}
  </script>

  <script type="text/babel" data-presets="env,react">
${screensAI}
  </script>

  <script type="text/babel" data-presets="env,react">
${screensArch}
  </script>

  <script type="text/babel" data-presets="env,react">
${modifiedAppJsx}
  </script>
</body>
</html>
`;

const OUT = 'c:/Users/decar/Desktop/Espace client Help AI/dashboard.html';
fs.writeFileSync(OUT, html);
console.log('Wrote', OUT, '—', html.length, 'bytes,', html.split('\n').length, 'lines');
