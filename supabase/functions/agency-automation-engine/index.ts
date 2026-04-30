// agency-automation-engine — moteur d'automation HelpAi
//
// Refactor v2 :
//   - Multi-canal : prospect = SMS (Twilio), artisan = WhatsApp OU Telegram
//     selon agency_clients.canal_notif
//   - Gating par workflow : chaque AUTO vérifie agency_workflow_settings.enabled
//     pour le couple (client_id, workflow_slug) avant d'agir
//   - Logs unifiés via agency_automation_log (anti-doublons via unique key)
//
// Déclencheur recommandé : pg_cron toutes les 5 min POST sur cette URL.
// Hot-swap : le déploiement remplace l'instance, aucune persistance d'état entre runs.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const sb = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WA_TOKEN      = Deno.env.get('WA_ACCESS_TOKEN') || '';
const WA_PHONE_ID   = Deno.env.get('WA_PHONE_NUMBER_ID') || '';
const TG_BOT_TOKEN  = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';

// ─────────────────────────────────────────────────────────────────────────────
// Cache des workflow_settings par client (rechargé à chaque tick)
// Contient pour chaque clientId :
//   - enabled : Set des slugs activés
//   - messages : map { slug → { [idx]: customText } } des templates custom
// ─────────────────────────────────────────────────────────────────────────────
type ClientSettings = { enabled: Set<string>; messages: Record<string, Record<number, string>> };
const settingsCache = new Map<string, ClientSettings>();

async function loadWorkflowSettings() {
  settingsCache.clear();
  const { data } = await sb.from('agency_workflow_settings').select('client_id, workflow_slug, enabled, config');
  for (const row of (data || [])) {
    if (!settingsCache.has(row.client_id)) {
      settingsCache.set(row.client_id, { enabled: new Set(), messages: {} });
    }
    const s = settingsCache.get(row.client_id)!;
    if (row.enabled) s.enabled.add(row.workflow_slug);
    const msgs = row.config?.messages;
    if (msgs && typeof msgs === 'object') s.messages[row.workflow_slug] = msgs;
  }
}

function isWorkflowEnabled(clientId: string, slug: string): boolean {
  const s = settingsCache.get(clientId);
  if (!s) return true; // défaut = activé pour les clients sans settings
  return s.enabled.has(slug);
}

// Template renderer : renvoie soit le custom (si défini par le client) soit le fallback,
// avec interpolation des {{variables}}.
function tpl(clientId: string, slug: string, idx: number, fallback: string, vars: Record<string, string> = {}): string {
  const custom = settingsCache.get(clientId)?.messages[slug]?.[idx];
  const text   = custom || fallback;
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ''));
}

// ─────────────────────────────────────────────────────────────────────────────
// Envoi prospect — toujours SMS via Twilio (agency-sms-send)
// ─────────────────────────────────────────────────────────────────────────────
async function sendToProspect(lead: any, body: string, type_msg = 'sms'): Promise<boolean> {
  if (!lead?.telephone) return false;
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/agency-sms-send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE}`,
      },
      body: JSON.stringify({
        to:        lead.telephone,
        body,
        lead_id:   lead.id,
        client_id: lead.client_id,
        type_msg,
      }),
    });
    return r.ok;
  } catch (e) {
    console.error('sendToProspect err', e);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Envoi artisan — WhatsApp ou Telegram selon canal_notif
// ─────────────────────────────────────────────────────────────────────────────
async function sendWaText(to: string, text: string): Promise<string | null> {
  if (!WA_TOKEN || !WA_PHONE_ID) return null;
  try {
    const r = await fetch(`https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }),
    });
    const d = await r.json();
    return d?.messages?.[0]?.id || null;
  } catch { return null; }
}

async function sendWaButtons(to: string, text: string, buttons: { id: string; title: string }[]): Promise<string | null> {
  if (!WA_TOKEN || !WA_PHONE_ID) return null;
  try {
    const r = await fetch(`https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp', to, type: 'interactive',
        interactive: {
          type: 'button', body: { text },
          action: { buttons: buttons.slice(0, 3).map(b => ({ type: 'reply', reply: { id: b.id, title: b.title } })) },
        },
      }),
    });
    const d = await r.json();
    return d?.messages?.[0]?.id || null;
  } catch { return null; }
}

async function sendTelegramText(chatId: string, text: string): Promise<boolean> {
  if (!TG_BOT_TOKEN) return false;
  try {
    const r = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
    return r.ok;
  } catch { return false; }
}

async function sendTelegramButtons(chatId: string, text: string, buttons: { id: string; title: string }[]): Promise<boolean> {
  if (!TG_BOT_TOKEN) return false;
  try {
    // 2 colonnes max pour la lisibilité mobile
    const keyboard = [];
    for (let i = 0; i < buttons.length; i += 2) {
      keyboard.push(buttons.slice(i, i + 2).map(b => ({ text: b.title, callback_data: b.id })));
    }
    const r = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId, text, parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard },
      }),
    });
    return r.ok;
  } catch { return false; }
}

async function sendToArtisan(client: any, body: string, buttons?: { id: string; title: string }[]): Promise<boolean> {
  const canal = (client?.canal_notif || 'whatsapp').toLowerCase();
  const wantTg = canal === 'telegram' || canal === 'les_deux';
  const wantWa = canal === 'whatsapp' || canal === 'les_deux' || !canal;
  let ok = false;

  // Telegram (si demandé et configuré)
  if (wantTg && client?.telegram_chat_id && client?.telegram_actif) {
    const tgOk = buttons?.length
      ? await sendTelegramButtons(client.telegram_chat_id, body, buttons)
      : await sendTelegramText(client.telegram_chat_id, body);
    ok = ok || tgOk;
  }

  // WhatsApp (si demandé et configuré)
  if (wantWa && client?.whatsapp_phone && client?.whatsapp_actif) {
    if (buttons?.length) {
      const id = await sendWaButtons(client.whatsapp_phone, body, buttons);
      ok = ok || !!id;
      // WA limite à 3 boutons : si 4e, on l'ajoute en texte
      if (buttons.length > 3) {
        const extras = buttons.slice(3).map((b, i) => `${i + 4}. ${b.title}`).join('\n');
        await sendWaText(client.whatsapp_phone, `Ou répondez :\n${extras}`);
      }
    } else {
      const id = await sendWaText(client.whatsapp_phone, body);
      ok = ok || !!id;
    }
  }

  return ok;
}

// ─────────────────────────────────────────────────────────────────────────────
// Logger automation (anti-doublon via unique constraint)
// ─────────────────────────────────────────────────────────────────────────────
async function logAuto(lead_id: string, client_id: string, type: string, cible: string, detail?: string): Promise<boolean> {
  const { error } = await sb.from('agency_automation_log').insert({ lead_id, client_id, type, cible, detail });
  if (error?.code === '23505') return false; // déjà fait
  return !error;
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  const now = new Date();
  const results: any[] = [];

  try {
    await loadWorkflowSettings();

    const { data: leads } = await sb
      .from('agency_leads')
      .select(`
        *,
        agency_clients(
          id, nom, whatsapp_phone, whatsapp_actif,
          telegram_chat_id, telegram_actif, canal_notif,
          gmb_client_id, avis_google_url,
          agency_sites(avis_google_url)
        )
      `)
      .not('statut', 'in', '("perdu","devis_perdu","chantier_termine","desinscrit")');

    for (const lead of (leads || [])) {
      const c        = lead.agency_clients as any;
      if (!c) continue;
      const cId      = lead.client_id;
      const leadId   = lead.id;
      const nom      = lead.nom || 'votre prospect';
      const nomPref  = lead.nom ? ' ' + lead.nom.split(' ')[0] : '';
      const srcLbl   = ({ site:'Site web', google_ads:'Google Ads', meta:'Meta Ads', appel:'Appel', lsa:'LSA', gmb:'GMB', autre:'Autre' } as any)[lead.source] || lead.source || '?';
      const avisUrl  = c?.avis_google_url || c?.agency_sites?.[0]?.avis_google_url || '';

      // Variables de template (utilisées par tpl() pour rendre les messages custom)
      const v = {
        nom,
        nom_prefix:  nomPref,
        telephone:   lead.telephone || '',
        prestation:  lead.prestation || '',
        urgence:     lead.urgence || '',
        source:      srcLbl,
        ville:       (lead.metadata && (lead.metadata as any).ville) || '',
        avis_url:    avisUrl,
        artisan_nom: c?.nom || '',
      };

      // ──────────────────────────────────────────────────────────────────────
      // AUTO 1 — sms_qualification_prospect : SMS qualif étape 1 (proprio?)
      //   Déclenché uniquement pour les leads venant d'un FORMULAIRE
      //   (site / meta / google_ads / gmb). Pas pour les appels — un prospect
      //   qui appelle attend qu'on le rappelle, pas un quiz par SMS.
      // ──────────────────────────────────────────────────────────────────────
      if (isWorkflowEnabled(cId, 'sms_qualification_prospect')
          && lead.statut === 'nouveau'
          && !lead.sms_qualification_sent
          && lead.telephone
          && lead.source !== 'appel'
          && lead.source !== 'lsa'
          && !lead.appel_manque
          && !lead.appel_repondu_le) {
        if (await logAuto(leadId, cId, 'sms_qual_1', 'prospect')) {
          const msg = tpl(cId, 'sms_qualification_prospect', 0,
            "Bonjour{{nom_prefix}}, merci pour votre demande !\n\nPour mieux comprendre votre besoin :\nÊtes-vous propriétaire ou locataire ?\n\nRépondez : PROPRIO ou LOCATAIRE", v);
          await sendToProspect(lead, msg, 'qualification');
          await sb.from('agency_leads').update({
            sms_qualification_sent: true, sms_etape: 1, statut: 'qualification_en_cours',
          }).eq('id', leadId);
          results.push({ type: 'qual_1', lead: nom });
        }
      }

      // ──────────────────────────────────────────────────────────────────────
      // AUTO 2 — appel_manque_relance : SMS d'excuse au prospect + notif artisan
      //   Délai court de 2 min — le temps que l'artisan ait une chance de
      //   rappeler manuellement avant que le système prenne le relais.
      // ──────────────────────────────────────────────────────────────────────
      if (isWorkflowEnabled(cId, 'appel_manque_relance')
          && lead.appel_manque
          && !lead.sms_qualification_sent
          && lead.telephone) {
        const cutoff2m = new Date(now.getTime() - 2 * 60 * 1000).toISOString();
        if (lead.created_at < cutoff2m) {
          if (await logAuto(leadId, cId, 'appel_manque_sms', 'prospect')) {
            await sendToProspect(lead, tpl(cId, 'appel_manque_relance', 0,
              "Bonjour, je suis actuellement indisponible. Pouvez-vous me préciser votre besoin ? Je vous rappelle rapidement.", v), 'appel_manque');
            await sendToArtisan(c, `📞 Appel manqué de ${nom}${lead.telephone ? ` (${lead.telephone})` : ''}\nSource : ${srcLbl}\n\nÀ rappeler rapidement.`);
            results.push({ type: 'appel_manque', lead: nom });
          }
        }
      }

      // ──────────────────────────────────────────────────────────────────────
      // AUTO 3 — post_appel_menu : 10 min après appel répondu
      // ──────────────────────────────────────────────────────────────────────
      if (isWorkflowEnabled(cId, 'post_appel_menu')
          && lead.appel_repondu_le
          && !lead.post_appel_sent) {
        const cutoff10m = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
        if (lead.appel_repondu_le < cutoff10m) {
          if (await logAuto(leadId, cId, 'post_appel', 'artisan')) {
            await sendToArtisan(c, `📞 Suite à l'appel avec *${nom}*, que s'est-il passé ?`, [
              { id: `rdv:${leadId}`,    title: '📅 RDV pris' },
              { id: `devis:${leadId}`,  title: '📋 Devis à envoyer' },
              { id: `perdu:${leadId}`,  title: '❌ Pas intéressant' },
              { id: `rappel:${leadId}`, title: '🔁 À rappeler' },
            ]);
            await sb.from('agency_leads').update({ post_appel_sent: true }).eq('id', leadId);
            results.push({ type: 'post_appel', lead: nom });
          }
        }
      }

      // ──────────────────────────────────────────────────────────────────────
      // AUTO 4 — rdv_rappels_prospect : J-1 / 2h / 30 min
      // AUTO 5 — rdv_check_no_show : 30 min après l'heure RDV
      // ──────────────────────────────────────────────────────────────────────
      if (lead.rdv_datetime && ['rdv_pris', 'qualifie', 'contacte'].includes(lead.statut) && lead.telephone) {
        const rdvTime = new Date(lead.rdv_datetime);
        const diffH   = (rdvTime.getTime() - now.getTime()) / 36e5;

        // Rappels prospect
        if (isWorkflowEnabled(cId, 'rdv_rappels_prospect')) {
          if (diffH > 20 && diffH < 28 && !lead.rdv_rappel_j1_sent) {
            if (await logAuto(leadId, cId, 'rdv_rappel_j1', 'prospect')) {
              const heure = rdvTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              await sendToProspect(lead, tpl(cId, 'rdv_rappels_prospect', 0,
                "RDV confirmé demain à {{rdv_heure}}.\nSi besoin de modifier, dites-le moi ici.",
                { ...v, rdv_heure: heure }), 'rdv');
              await sb.from('agency_leads').update({ rdv_rappel_j1_sent: true }).eq('id', leadId);
              results.push({ type: 'rdv_j1', lead: nom });
            }
          }
          if (diffH > 1.5 && diffH < 2.5 && !lead.rdv_rappel_2h_sent) {
            if (await logAuto(leadId, cId, 'rdv_rappel_2h', 'prospect')) {
              const heure = rdvTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              await sendToProspect(lead, tpl(cId, 'rdv_rappels_prospect', 1,
                "C'est toujours OK pour le RDV à {{rdv_heure}} ?\nRépondez OUI pour confirmer.",
                { ...v, rdv_heure: heure }), 'rdv');
              await sb.from('agency_leads').update({ rdv_rappel_2h_sent: true }).eq('id', leadId);
              results.push({ type: 'rdv_2h', lead: nom });
            }
          }
          if (diffH > 0.3 && diffH < 0.6 && !lead.rdv_rappel_30m_sent) {
            if (await logAuto(leadId, cId, 'rdv_rappel_30m', 'prospect')) {
              await sendToProspect(lead, tpl(cId, 'rdv_rappels_prospect', 2,
                "Je suis disponible dans 30 minutes.", v), 'rdv');
              await sb.from('agency_leads').update({ rdv_rappel_30m_sent: true }).eq('id', leadId);
              results.push({ type: 'rdv_30m', lead: nom });
            }
          }
        }

        // Risque no-show + check
        if (isWorkflowEnabled(cId, 'rdv_check_no_show')) {
          if (diffH > 1 && diffH < 1.5 && lead.rdv_rappel_2h_sent && !lead.rdv_confirme && !lead.rdv_risque_noshow) {
            if (await logAuto(leadId, cId, 'rdv_noshow_risk', 'artisan')) {
              await sendToArtisan(c, `⚠️ *${nom}* n'a pas confirmé le RDV de tout à l'heure.\nRisque de no-show — prévenez-vous.`);
              await sb.from('agency_leads').update({ rdv_risque_noshow: true }).eq('id', leadId);
              results.push({ type: 'noshow_risk', lead: nom });
            }
          }
          if (diffH < -0.5 && diffH > -2) {
            if (await logAuto(leadId, cId, 'noshow_check', 'artisan')) {
              await sendToArtisan(c, `Le RDV avec *${nom}* a-t-il eu lieu ?`, [
                { id: `rdv_ok:${leadId}`,  title: '✅ Oui' },
                { id: `noshow:${leadId}`,  title: '❌ No-show' },
                { id: `reporte:${leadId}`, title: '🔄 Reporté' },
              ]);
              results.push({ type: 'noshow_check', lead: nom });
            }
          }
        }
      }

      // ──────────────────────────────────────────────────────────────────────
      // AUTO 6 — no_show_relances : prospect 0/2h/J+1
      // ──────────────────────────────────────────────────────────────────────
      if (isWorkflowEnabled(cId, 'no_show_relances')
          && lead.statut === 'no_show'
          && lead.telephone) {
        const ref = new Date(lead.rdv_datetime || lead.updated_at);
        const sinceH = (now.getTime() - ref.getTime()) / 36e5;
        if (sinceH < 0.5) {
          if (await logAuto(leadId, cId, 'noshow_immediat', 'prospect')) {
            await sendToProspect(lead, tpl(cId, 'no_show_relances', 0,
              "Je vous attendais pour notre RDV, tout va bien ?\nOn peut reprogrammer rapidement si besoin.", v), 'relance');
            results.push({ type: 'noshow_0', lead: nom });
          }
        }
        if (sinceH > 2 && sinceH < 3) {
          if (await logAuto(leadId, cId, 'noshow_2h', 'prospect')) {
            await sendToProspect(lead, tpl(cId, 'no_show_relances', 1,
              "Je reste disponible pour votre projet.\nDites-moi quand vous êtes disponible pour reprogrammer.", v), 'relance');
            results.push({ type: 'noshow_2h', lead: nom });
          }
        }
        if (sinceH > 22 && sinceH < 27) {
          if (await logAuto(leadId, cId, 'noshow_j1', 'prospect')) {
            await sendToProspect(lead, tpl(cId, 'no_show_relances', 2,
              "Je me permets de revenir vers vous. Votre projet est-il toujours d'actualité ?", v), 'relance');
            results.push({ type: 'noshow_j1', lead: nom });
          }
        }
      }

      // ──────────────────────────────────────────────────────────────────────
      // AUTO 7 — devis_relances_prospect : J+2 / J+5 / J+15
      // ──────────────────────────────────────────────────────────────────────
      if (isWorkflowEnabled(cId, 'devis_relances_prospect')
          && lead.statut === 'devis_envoye'
          && lead.devis_envoye_le
          && lead.telephone) {
        const sinceD = (now.getTime() - new Date(lead.devis_envoye_le).getTime()) / 86400e3;
        if (sinceD > 2 && sinceD < 3 && !lead.devis_relance_j2) {
          if (await logAuto(leadId, cId, 'devis_relance_j2', 'prospect')) {
            await sendToProspect(lead, tpl(cId, 'devis_relances_prospect', 0,
              "Bonjour{{nom_prefix}}, avez-vous pu consulter le devis ?", v), 'devis');
            await sb.from('agency_leads').update({ devis_relance_j2: true }).eq('id', leadId);
            results.push({ type: 'devis_j2', lead: nom });
          }
        }
        if (sinceD > 5 && sinceD < 6 && !lead.devis_relance_j5) {
          if (await logAuto(leadId, cId, 'devis_relance_j5', 'prospect')) {
            await sendToProspect(lead, tpl(cId, 'devis_relances_prospect', 1,
              "Bonjour, je me permets de revenir vers vous concernant votre projet. Avez-vous des questions sur le devis ?", v), 'devis');
            await sb.from('agency_leads').update({ devis_relance_j5: true }).eq('id', leadId);
            results.push({ type: 'devis_j5', lead: nom });
          }
        }
        if (sinceD > 15 && sinceD < 16 && !lead.devis_relance_j15) {
          if (await logAuto(leadId, cId, 'devis_relance_j15', 'prospect')) {
            await sendToProspect(lead, tpl(cId, 'devis_relances_prospect', 2,
              "Bonjour, je me permets de faire une dernière relance concernant votre devis. Votre projet est-il toujours d'actualité ?", v), 'devis');
            await sb.from('agency_leads').update({ devis_relance_j15: true }).eq('id', leadId);
            results.push({ type: 'devis_j15', lead: nom });
          }
        }
      }

      // ──────────────────────────────────────────────────────────────────────
      // AUTO 8 — devis_suivi_artisan : J+7
      // ──────────────────────────────────────────────────────────────────────
      if (isWorkflowEnabled(cId, 'devis_suivi_artisan')
          && lead.statut === 'devis_envoye'
          && lead.devis_envoye_le) {
        const sinceD = (now.getTime() - new Date(lead.devis_envoye_le).getTime()) / 86400e3;
        if (sinceD > 7 && !lead.relance_artisan_devis) {
          if (await logAuto(leadId, cId, 'suivi_devis_artisan', 'artisan')) {
            await sendToArtisan(c, `📋 Le devis de *${nom}* est-il signé ?`, [
              { id: `devis_signe:${leadId}`,    title: '✅ Signé' },
              { id: `devis_attente:${leadId}`,  title: '⏳ Pas encore' },
              { id: `devis_perdu:${leadId}`,    title: '❌ Perdu' },
            ]);
            await sb.from('agency_leads').update({ relance_artisan_devis: true }).eq('id', leadId);
            results.push({ type: 'suivi_devis', lead: nom });
          }
        }
      }

      // ──────────────────────────────────────────────────────────────────────
      // AUTO 9 — satisfaction_post_chantier : note 1-5 par SMS
      // ──────────────────────────────────────────────────────────────────────
      if (isWorkflowEnabled(cId, 'satisfaction_post_chantier')
          && lead.statut === 'chantier_termine'
          && !lead.avis_demande
          && lead.telephone) {
        if (await logAuto(leadId, cId, 'satisfaction', 'prospect')) {
          await sendToProspect(lead, tpl(cId, 'satisfaction_post_chantier', 0,
            "Merci pour votre confiance.\n\nSur une échelle de 1 à 5, êtes-vous satisfait du travail réalisé ?\n\nRépondez avec le chiffre : 1, 2, 3, 4 ou 5", v), 'satisfaction');
          await sb.from('agency_leads').update({ avis_demande: true }).eq('id', leadId);
          results.push({ type: 'satisfaction', lead: nom });
        }
      }

      // ──────────────────────────────────────────────────────────────────────
      // AUTO 10 — relances_internes_artisan : 24h / 48h / 30j
      // ──────────────────────────────────────────────────────────────────────
      if (isWorkflowEnabled(cId, 'relances_internes_artisan')) {
        const createdH = (now.getTime() - new Date(lead.created_at).getTime()) / 36e5;

        if (lead.statut === 'nouveau' && createdH > 24 && !lead.relance_artisan_24h) {
          if (await logAuto(leadId, cId, 'artisan_relance_24h', 'artisan')) {
            await sendToArtisan(c, `⚠️ Tu n'as pas encore traité le lead *${nom}*.\nPense à le rappeler rapidement.`);
            await sb.from('agency_leads').update({ relance_artisan_24h: true }).eq('id', leadId);
            results.push({ type: 'artisan_24h', lead: nom });
          }
        }

        if (lead.statut === 'devis_a_envoyer') {
          const sinceH = (now.getTime() - new Date(lead.updated_at).getTime()) / 36e5;
          if (sinceH > 48 && !lead.relance_artisan_devis) {
            if (await logAuto(leadId, cId, 'artisan_devis_rappel', 'artisan')) {
              await sendToArtisan(c, `📋 Tu avais un devis à envoyer à *${nom}*.\nEst-ce fait ?`, [
                { id: `devis_envoye_confirm:${leadId}`, title: '✅ Oui, envoyé' },
                { id: `devis_pas_envoye:${leadId}`,    title: '⏳ Pas encore' },
              ]);
              await sb.from('agency_leads').update({ relance_artisan_devis: true }).eq('id', leadId);
              results.push({ type: 'artisan_devis_rappel', lead: nom });
            }
          }
        }

        if (lead.statut === 'devis_signe') {
          const sinceD = (now.getTime() - new Date(lead.updated_at).getTime()) / 86400e3;
          if (sinceD > 30 && !lead.relance_artisan_chantier) {
            if (await logAuto(leadId, cId, 'artisan_chantier_check', 'artisan')) {
              await sendToArtisan(c, `🔧 Le chantier de *${nom}* est-il terminé ?`, [
                { id: `chantier_ok:${leadId}`,  title: '✅ Oui, terminé' },
                { id: `chantier_non:${leadId}`, title: '🔧 En cours' },
              ]);
              await sb.from('agency_leads').update({ relance_artisan_chantier: true }).eq('id', leadId);
              results.push({ type: 'artisan_chantier', lead: nom });
            }
          }
        }
      }
    } // fin boucle leads

    return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
});
