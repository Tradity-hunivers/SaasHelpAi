// agency-sms-send — Envoi SMS sortant via Twilio
// Appelée par agency-automation-engine pour les messages aux PROSPECTS
// (qualification, rappels RDV, no-show, devis, satisfaction)
//
// Body JSON attendu :
// { to: "+33...", body: "...", lead_id?: "uuid", client_id?: "uuid", type_msg?: "qualification" }
//
// Réponse : { ok: true, sid: "SMxxxx" } ou { ok: false, error: "..." }

import { createClient } from 'jsr:@supabase/supabase-js@2';

const sb = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const SID   = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const FROM  = Deno.env.get('TWILIO_PHONE_FROM')!;

interface SendBody {
  to: string;            // E.164 (+33612345678)
  body: string;
  lead_id?: string;
  client_id?: string;
  type_msg?: string;
  from?: string;         // override explicite (sinon dérivé de client_id ou env)
}

// Trouver le numéro Twilio à utiliser comme expéditeur pour un client donné.
// Cascade : from explicite → client.twilio_phone → env TWILIO_PHONE_FROM
async function resolveFrom(clientId: string | undefined, fromOverride?: string): Promise<string> {
  if (fromOverride) return fromOverride;
  if (clientId) {
    const { data } = await sb
      .from('agency_clients')
      .select('twilio_phone')
      .eq('id', clientId)
      .maybeSingle();
    if (data?.twilio_phone) return data.twilio_phone;
  }
  return FROM;
}

async function sendSms(from: string, to: string, body: string): Promise<{ sid: string | null; error?: string }> {
  try {
    const auth   = btoa(`${SID}:${TOKEN}`);
    const params = new URLSearchParams();
    params.set('From', from);
    params.set('To', to);
    params.set('Body', body);
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const d = await r.json();
    if (!r.ok) return { sid: null, error: d.message || `HTTP ${r.status}` };
    return { sid: d.sid };
  } catch (e: any) {
    return { sid: null, error: e.message };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body: SendBody;
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } }); }

  if (!body.to || !body.body) {
    return new Response(JSON.stringify({ error: 'to + body required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const fromPhone = await resolveFrom(body.client_id, body.from);
  const result = await sendSms(fromPhone, body.to, body.body);

  // Logger dans agency_lead_conversations
  if (body.lead_id || body.client_id) {
    await sb.from('agency_lead_conversations').insert({
      lead_id:   body.lead_id || null,
      client_id: body.client_id || null,
      direction: 'outbound',
      de:        'system',
      phone:     body.to,
      contenu:   body.body,
      type_msg:  body.type_msg || 'sms',
    });
  }

  if (result.sid) {
    return new Response(JSON.stringify({ ok: true, sid: result.sid }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ ok: false, error: result.error }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
});
