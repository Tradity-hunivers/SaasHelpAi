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

const SID   = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const FROM  = Deno.env.get('TWILIO_PHONE_FROM')!;

async function sendSms(to: string, body: string) {
  try {
    const auth = btoa(`${SID}:${TOKEN}`);
    const params = new URLSearchParams();
    params.set('From', FROM);
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

function twiml(body = '') {
  // Réponse vide TwiML (Twilio 200 OK)
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    headers: { 'Content-Type': 'application/xml' },
    status: 200,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return twiml();

  const form      = await req.formData();
  const fromPhone = (form.get('From') || '').toString();
  const body      = ((form.get('Body') || '').toString()).trim();

  if (!fromPhone || !body) return twiml();

  // Trouver le lead le plus récent avec ce téléphone
  const { data: lead } = await sb
    .from('agency_leads')
    .select('*, agency_clients(id, nom, whatsapp_phone, telegram_chat_id, canal_notif, avis_google_url, agency_sites(avis_google_url))')
    .eq('telephone', fromPhone)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lead) {
    // Aucun lead : si STOP, on logue rien — sinon on ignore
    return twiml();
  }

  const clientId = lead.client_id;
  const leadId   = lead.id;
  const c        = lead.agency_clients as any;
  const lower    = body.toLowerCase();
  const etape    = lead.sms_etape || 0;

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
      await sendSms(fromPhone, "Je n'ai pas compris. Répondez PROPRIO ou LOCATAIRE.");
      return twiml();
    }
    await sb.from('agency_leads').update({ proprietaire: proprio, sms_etape: 2 }).eq('id', leadId);
    await sendSms(fromPhone, "Merci. Pour quelle prestation nous contactez-vous ? (ex: toiture, plomberie, rénovation...)");
    return twiml();
  }

  // Étape 2 : prestation
  if (etape === 2) {
    await sb.from('agency_leads').update({ prestation: body, sms_etape: 3 }).eq('id', leadId);
    await sendSms(fromPhone, "Compris. Votre demande est-elle urgente ?\n1 - Urgent (moins de 7 jours)\n2 - Moyen terme (15-30 jours)\n3 - Projet futur");
    return twiml();
  }

  // Étape 3 : urgence + qualification finale
  if (etape === 3) {
    let urgence = 'moyen';
    if (body === '1' || lower.includes('urgent')) urgence = 'urgent';
    if (body === '3' || lower.includes('futur'))  urgence = 'futur';
    const priorite = (lead.proprietaire === 'proprietaire' && urgence === 'urgent') ? 'haute' : 'normale';
    await sb.from('agency_leads').update({
      urgence,
      sms_etape: 0,
      qualifie:  true,
      statut:    'qualifie',
      priorite,
    }).eq('id', leadId);
    await sendSms(fromPhone, "Merci pour ces informations. Nous revenons vers vous très rapidement !");
    // La notif artisan (WA/Telegram selon canal_notif) est gérée par l'engine ou agency-notify
    return twiml();
  }

  // Confirmation RDV — réponse "OUI"
  if (lower === 'oui' && lead.rdv_datetime && !lead.rdv_confirme) {
    await sb.from('agency_leads').update({ rdv_confirme: true }).eq('id', leadId);
    await sendSms(fromPhone, "Parfait, à tout à l'heure !");
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
        await sendSms(fromPhone, msg);
      } else {
        await sendSms(fromPhone, "Merci pour votre retour. Nous revenons vers vous rapidement.");
        // TODO : notifier l'artisan (alerte client insatisfait) via canal_notif
      }
      return twiml();
    }
  }

  // Réponse libre du prospect après qualification : transmettre à l'artisan
  // (à intégrer dans une étape ultérieure via dispatcher agency-notify)

  return twiml();
});
