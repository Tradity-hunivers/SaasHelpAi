// agency-voice-webhook — Twilio voice events
// Deux phases :
//   (A) Appel entrant → on retourne TwiML <Dial> pour forward vers tél perso de l'artisan
//   (B) Status callback (DialCallStatus présent) → log appel + flag missed call
//
// Configurer dans Twilio Console : Phone Numbers > [num] > Voice
//   "A call comes in" → POST <SUPABASE_URL>/functions/v1/agency-voice-webhook
// L'attribut action="<même URL>" est ajouté au <Dial> ci-dessous → Twilio rappelle
// automatiquement la même URL avec le DialCallStatus.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const sb = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

function twiml(body = '') {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    headers: { 'Content-Type': 'application/xml' },
    status: 200,
  });
}

// Trouver le client (artisan) à qui appartient ce numéro Twilio.
// MVP : un seul client → on prend le premier actif. À étendre quand on aura
// agency_clients.twilio_phone (provisioning par artisan).
async function findClientByTwilioNumber(twilioNumber: string) {
  // TODO quand colonne twilio_phone existera :
  //   sb.from('agency_clients').select(...).eq('twilio_phone', twilioNumber).maybeSingle();
  const { data } = await sb
    .from('agency_clients')
    .select('id, nom, telephone, whatsapp_phone, telegram_chat_id, canal_notif')
    .eq('statut', 'actif')
    .limit(1)
    .maybeSingle();
  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return twiml();

  const form           = await req.formData();
  const callSid        = (form.get('CallSid') || '').toString();
  const fromPhone      = (form.get('From') || '').toString();   // numéro du prospect
  const toPhone        = (form.get('To') || '').toString();     // numéro Twilio appelé
  const callStatus     = (form.get('CallStatus') || '').toString();
  const direction      = (form.get('Direction') || '').toString();
  const dialCallStatus = (form.get('DialCallStatus') || '').toString();
  const callDuration   = parseInt((form.get('CallDuration') || '0').toString());
  const dialDuration   = parseInt((form.get('DialCallDuration') || '0').toString());

  const client = await findClientByTwilioNumber(toPhone);

  // ─── PHASE B : status callback (DialCallStatus présent) ─────────────────────
  if (dialCallStatus) {
    const isMissed = ['no-answer', 'busy', 'failed', 'canceled'].includes(dialCallStatus);
    const traite   = dialCallStatus === 'completed';

    let leadId: string | null = null;
    if (client?.id) {
      const { data: existing } = await sb
        .from('agency_leads')
        .select('id')
        .eq('client_id', client.id)
        .eq('telephone', fromPhone)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      leadId = existing?.id || null;

      if (!leadId && isMissed) {
        // Créer un lead "appel manqué" : permet à l'engine de déclencher
        // workflow #3 (SMS d'excuse + notif artisan)
        const { data: newLead } = await sb.from('agency_leads').insert({
          client_id:    client.id,
          telephone:    fromPhone,
          source:       'appel',
          statut:       'nouveau',
          appel_manque: true,
        }).select('id').single();
        leadId = newLead?.id || null;
      } else if (leadId && isMissed) {
        await sb.from('agency_leads').update({ appel_manque: true }).eq('id', leadId);
      } else if (leadId && traite) {
        await sb.from('agency_leads')
          .update({ appel_repondu_le: new Date().toISOString() })
          .eq('id', leadId);
      }
    }

    // Log dans agency_appels
    await sb.from('agency_appels').insert({
      client_id:      client?.id || null,
      lead_id:        leadId,
      phone_prospect: fromPhone,
      type:           isMissed ? 'manque' : 'repondu',
      duree_sec:      dialDuration || callDuration || 0,
      traite,
      sms_envoye:     false,
    });

    return twiml();
  }

  // ─── PHASE A : appel entrant → forward vers l'artisan ───────────────────────
  if (!client?.telephone) {
    return twiml('<Say voice="alice" language="fr-FR">Désolé, l\'artisan n\'est pas joignable. Merci de rappeler plus tard.</Say>');
  }

  const dialUrl = `${SUPABASE_URL}/functions/v1/agency-voice-webhook`;
  // callerId="${fromPhone}" : présente le vrai numéro du prospect à l'artisan,
  //    pas le numéro Twilio. Permet à l'artisan de voir qui appelle.
  // timeout="20" : 20s de sonnerie avant de considérer no-answer
  const xml = `<Dial timeout="20" callerId="${fromPhone}" action="${dialUrl}" method="POST"><Number>${client.telephone}</Number></Dial>`;
  return twiml(xml);
});
