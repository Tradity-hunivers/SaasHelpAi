// agency-sms-webhook — Réception des SMS entrants Twilio
// Twilio POST application/x-www-form-urlencoded :
//   From=+33...   To=+33...   Body=...   MessageSid=...
//
// Reproduit la logique de qualification/satisfaction/RDV de agency-wa-webhook
// mais pour les SMS (prospect uniquement). Les artisans répondent via WA/Telegram.
//
// Configurer dans Twilio Console : Phone Numbers > [num] > Messaging
//   "A message comes in" → POST <SUPABASE_URL>/functions/v1/agency-sms-webhook

import { createClient } from 'jsr:@supabase/supabase-js@2';

const sb = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const SID         = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TOKEN       = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const FROM        = Deno.env.get('TWILIO_PHONE_FROM')!;
const WA_TOKEN    = Deno.env.get('WA_ACCESS_TOKEN') || '';
const WA_PHONE_ID = Deno.env.get('WA_PHONE_NUMBER_ID') || '';
const TG_TOKEN    = Deno.env.get('TELEGRAM_AGENCY_BOT_TOKEN') || Deno.env.get('TELEGRAM_BOT_TOKEN') || '';

async function sendSms(from: string, to: string, body: string) {
  try {
    const auth = btoa(`${SID}:${TOKEN}`);
    const params = new URLSearchParams();
    params.set('From', from || FROM);
    params.set('To', to);
    params.set('Body', body);
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
  } catch (e) { console.error('sendSms err', e); }
}

// ─── WhatsApp / Telegram dispatch vers l'artisan ────────────────────────────
async function sendWaText(to: string, text: string) {
  if (!WA_TOKEN || !WA_PHONE_ID) return false;
  try {
    const r = await fetch(`https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }),
    });
    return r.ok;
  } catch (e) { console.error('sendWaText err', e); return false; }
}

async function sendTelegramText(chatId: string, text: string) {
  if (!TG_TOKEN) return false;
  try {
    const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
    return r.ok;
  } catch (e) { console.error('sendTelegramText err', e); return false; }
}

async function notifyArtisan(client: any, body: string): Promise<boolean> {
  const canal = (client?.canal_notif || 'whatsapp').toLowerCase();
  let ok = false;
  if ((canal === 'telegram' || canal === 'les_deux') && client?.telegram_chat_id && client?.telegram_actif) {
    ok = await sendTelegramText(client.telegram_chat_id, body) || ok;
  }
  if ((canal === 'whatsapp' || canal === 'les_deux' || !canal) && client?.whatsapp_phone && client?.whatsapp_actif) {
    ok = await sendWaText(client.whatsapp_phone, body) || ok;
  }
  return ok;
}

function twiml(body = '') {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    headers: { 'Content-Type': 'application/xml' },
    status: 200,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return twiml();

  const form      = await req.formData();
  const fromPhone = (form.get('From') || '').toString();
  const toPhone   = (form.get('To') || '').toString();
  const body      = ((form.get('Body') || '').toString()).trim();

  if (!fromPhone || !body) return twiml();

  // Identifier le client (artisan) qui possède toPhone
  let toFromForReply = FROM;
  if (toPhone) {
    const variants = [toPhone, toPhone.replace(/^\+/, ''), '+' + toPhone.replace(/^\+/, '')];
    const { data: ownerClient } = await sb
      .from('agency_clients')
      .select('twilio_phone, twilio_phone_ads')
      .or(`twilio_phone.in.(${variants.map(v => `"${v}"`).join(',')}),twilio_phone_ads.in.(${variants.map(v => `"${v}"`).join(',')})`)
      .limit(1)
      .maybeSingle();
    if (ownerClient?.twilio_phone) toFromForReply = ownerClient.twilio_phone;
    else if (ownerClient?.twilio_phone_ads) toFromForReply = ownerClient.twilio_phone_ads;
  }

  // Trouver le lead le plus récent avec ce téléphone
  const { data: lead } = await sb
    .from('agency_leads')
    .select('*, agency_clients(id, nom, whatsapp_phone, whatsapp_actif, telegram_chat_id, telegram_actif, canal_notif, avis_google_url, agency_sites(avis_google_url))')
    .eq('telephone', fromPhone)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lead) {
    return twiml();
  }

  const clientId = lead.client_id;
  const leadId   = lead.id;
  const c        = lead.agency_clients as any;
  const lower    = body.toLowerCase();
  const etape    = lead.sms_etape || 0;
  const nom      = lead.nom || 'Anonyme';

  // Logger inbound
  await sb.from('agency_lead_conversations').insert({
    lead_id:   leadId,
    client_id: clientId,
    direction: 'inbound',
    de:        'prospect',
    phone:     fromPhone,
    contenu:   body,
    type_msg:  'qualification',
  });

  // STOP / désinscription RGPD
  if (lower === 'stop') {
    await sb.from('agency_leads').update({ statut: 'desinscrit' }).eq('id', leadId);
    return twiml();
  }

  // Étape 1 : proprio / locataire
  if (etape === 1) {
    let proprio: string | null = null;
    if (lower.includes('proprio') || lower.includes('propriétaire')) proprio = 'proprietaire';
    else if (lower.includes('locataire') || lower.includes('locat')) proprio = 'locataire';

    if (!proprio) {
      await sendSms(toFromForReply, fromPhone, "Je n'ai pas compris. Répondez PROPRIO ou LOCATAIRE.");
      return twiml();
    }
    await sb.from('agency_leads').update({ proprietaire: proprio, sms_etape: 2 }).eq('id', leadId);
    await sendSms(toFromForReply, fromPhone, "Merci. Pour quelle prestation nous contactez-vous ? (ex: toiture, plomberie, rénovation...)");
    return twiml();
  }

  // Étape 2 : prestation
  if (etape === 2) {
    await sb.from('agency_leads').update({ prestation: body, sms_etape: 3 }).eq('id', leadId);
    await sendSms(toFromForReply, fromPhone, "Compris. Votre demande est-elle urgente ?\n1 - Urgent (moins de 7 jours)\n2 - Moyen terme (15-30 jours)\n3 - Projet futur");
    return twiml();
  }

  // Étape 3 : urgence + qualification finale + NOTIF ARTISAN
  if (etape === 3) {
    let urgence = 'moyen';
    if (body === '1' || lower.includes('urgent')) urgence = 'urgent';
    if (body === '3' || lower.includes('futur'))  urgence = 'futur';
    const priorite = (lead.proprietaire === 'proprietaire' && urgence === 'urgent') ? 'haute' : 'normale';
    const { data: updLead } = await sb.from('agency_leads').update({
      urgence,
      sms_etape: 0,
      qualifie:  true,
      statut:    'qualifie',
      priorite,
    }).eq('id', leadId).select().single();
    await sendSms(toFromForReply, fromPhone, "Merci pour ces informations. Nous revenons vers vous très rapidement !");

    // Notif artisan via WA / Telegram avec récap du lead qualifié
    if (updLead) {
      const isPrioritaire = updLead.priorite === 'haute';
      const emoji         = isPrioritaire ? '🔴' : '🟡';
      const urgLabel      = ({ urgent: 'Urgent < 7j', moyen: '15-30 jours', futur: 'Projet futur' } as any)[urgence] || urgence;
      const srcLabel      = ({ site: 'Site web', google_ads: 'Google Ads', meta: 'Meta Ads', appel: 'Appel', lsa: 'LSA', gmb: 'GMB', autre: 'Autre' } as any)[lead.source] || lead.source || '?';

      const msgArtisan = `${emoji} *${isPrioritaire ? 'Nouveau lead PRIORITAIRE' : 'Nouveau lead qualifié'}*

👤 ${nom}
📞 ${fromPhone}
🏠 ${lead.proprietaire === 'proprietaire' ? 'Propriétaire' : 'Locataire'}
🔧 Besoin : ${updLead.prestation || lead.prestation || '—'}
⏰ Urgence : ${urgLabel}
📍 Source : ${srcLabel}${isPrioritaire ? '\n\n⚠️ À rappeler rapidement !' : ''}`;

      await notifyArtisan(c, msgArtisan);
    }
    return twiml();
  }

  // Confirmation RDV — réponse "OUI"
  if (lower === 'oui' && lead.rdv_datetime && !lead.rdv_confirme) {
    await sb.from('agency_leads').update({ rdv_confirme: true }).eq('id', leadId);
    await sendSms(toFromForReply, fromPhone, "Parfait, à tout à l'heure !");
    // Notif artisan : confirmation RDV
    await notifyArtisan(c, `✅ ${nom} a confirmé le RDV de tout à l'heure.`);
    return twiml();
  }

  // Satisfaction post-chantier (note 1-5)
  if (lead.statut === 'chantier_termine' && lead.avis_demande && !lead.satisfaction_note) {
    const note = parseInt(body);
    if (note >= 1 && note <= 5) {
      await sb.from('agency_leads').update({ satisfaction_note: note }).eq('id', leadId);
      if (note >= 4) {
        const url = c?.avis_google_url || (c?.agency_sites?.[0]?.avis_google_url);
        const msg = url
          ? `Merci beaucoup ! Votre avis nous aiderait énormément :\n${url}`
          : "Merci beaucoup, votre satisfaction est notre priorité !";
        await sendSms(toFromForReply, fromPhone, msg);
        await notifyArtisan(c, `⭐ ${nom} a noté ${note}/5. Lien d'avis Google envoyé.`);
      } else {
        await sendSms(toFromForReply, fromPhone, "Merci pour votre retour. Nous revenons vers vous rapidement.");
        await notifyArtisan(c, `⚠️ *Client insatisfait !*\n${nom} a donné une note de *${note}/5*.\nÀ recontacter rapidement.`);
      }
      return twiml();
    }
  }

  // ─── Réponse libre du prospect (hors qualification / RDV / satisfaction) ───
  // → on forward intégralement le message à l'artisan via son canal de notif.
  // L'artisan voit la conversation continuer en "live" sur son WA/Telegram.
  await notifyArtisan(c, `💬 *Message de ${nom}* (${fromPhone})\n\n"${body}"`);
  return twiml();
});
