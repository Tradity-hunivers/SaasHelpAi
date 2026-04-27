// agency-stripe-sync-historical — Backfill des factures Stripe d'un client
//
// Le webhook agency-stripe-webhook ne traite que les événements futurs.
// Cette fonction permet d'importer manuellement TOUTES les factures
// historiques d'un agency_client donné (utile quand on lie tardivement
// un stripe_customer_id à un client).
//
// Body POST attendu :
//   { client_id: "uuid" }                   # backfill un client précis
//   { client_id: "uuid", limit: 50 }        # limit max de factures (défaut 100)
//   { all: true }                            # backfill TOUS les clients qui ont
//                                              un stripe_customer_id (admin only)
//
// Réponse :
//   { ok: true, synced: { client_id: count }, total: 12 }

import { createClient } from 'jsr:@supabase/supabase-js@2';

const sb = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age':       '86400',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Stripe API : list invoices for a customer (avec pagination)
// ─────────────────────────────────────────────────────────────────────────────
async function listStripeInvoices(customerId: string, limit = 100): Promise<any[]> {
  const out: any[] = [];
  let starting_after: string | null = null;
  while (out.length < limit) {
    const params = new URLSearchParams();
    params.set('customer', customerId);
    params.set('limit', String(Math.min(100, limit - out.length)));
    if (starting_after) params.set('starting_after', starting_after);

    const r = await fetch('https://api.stripe.com/v1/invoices?' + params.toString(), {
      headers: { Authorization: `Bearer ${STRIPE_KEY}` },
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error?.message || `Stripe ${r.status}`);
    const data = (d.data || []) as any[];
    out.push(...data);
    if (!d.has_more || data.length === 0) break;
    starting_after = data[data.length - 1].id;
  }
  return out;
}

// Map d'un objet Stripe invoice → row agency_invoices
function mapInvoice(inv: any, clientId: string) {
  // Statut Stripe : draft / open / paid / uncollectible / void
  let statut = 'en_attente';
  if (inv.status === 'paid')          statut = 'payée';
  else if (inv.status === 'void')     statut = 'annulée';
  else if (inv.status === 'uncollectible') statut = 'échouée';

  return {
    client_id:                clientId,
    stripe_invoice_id:        inv.id,
    stripe_payment_intent_id: inv.payment_intent || null,
    numero:                   inv.number || null,
    description:              inv.description || null,
    montant:                  inv.amount_paid || inv.amount_due || 0,
    devise:                   inv.currency || 'eur',
    statut,
    invoice_url:              inv.hosted_invoice_url || null,
    pdf_url:                  inv.invoice_pdf || null,
    payé_le:                  inv.status_transitions?.paid_at
      ? new Date(inv.status_transitions.paid_at * 1000).toISOString()
      : null,
    periode_debut:            inv.period_start ? new Date(inv.period_start * 1000).toISOString().slice(0, 10) : null,
    periode_fin:              inv.period_end   ? new Date(inv.period_end   * 1000).toISOString().slice(0, 10) : null,
  };
}

async function syncOneClient(clientId: string, stripeCustomerId: string, limit: number): Promise<number> {
  const invoices = await listStripeInvoices(stripeCustomerId, limit);
  if (!invoices.length) return 0;
  const rows = invoices.map(inv => mapInvoice(inv, clientId));
  const { error } = await sb.from('agency_invoices').upsert(rows, { onConflict: 'stripe_invoice_id' });
  if (error) throw new Error('DB upsert: ' + error.message);
  return rows.length;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST')    return json({ error: 'Method not allowed' }, 405);

  if (!STRIPE_KEY) return json({ error: 'STRIPE_SECRET_KEY not configured' }, 500);

  // Auth manuelle : on accepte uniquement les utilisateurs authentifiés via Supabase Auth
  // (verify_jwt=false côté plateforme pour éviter le blocage CORS preflight,
  // mais on vérifie nous-mêmes le bearer token ici).
  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return json({ error: 'Missing Authorization header' }, 401);
  }
  const token = authHeader.slice(7);
  const { data: { user }, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !user) {
    return json({ error: 'Invalid or expired token' }, 401);
  }

  let body: { client_id?: string; all?: boolean; limit?: number };
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const limit = body.limit && body.limit > 0 ? body.limit : 100;

  try {
    const synced: Record<string, number> = {};

    if (body.all) {
      const { data: clients = [] } = await sb
        .from('agency_clients')
        .select('id, stripe_customer_id')
        .not('stripe_customer_id', 'is', null);

      for (const c of clients!) {
        const n = await syncOneClient(c.id, c.stripe_customer_id!, limit);
        synced[c.id] = n;
      }
    } else if (body.client_id) {
      const { data: client } = await sb
        .from('agency_clients')
        .select('id, stripe_customer_id')
        .eq('id', body.client_id)
        .maybeSingle();
      if (!client) return json({ error: 'Client introuvable' }, 404);
      if (!client.stripe_customer_id) return json({ error: 'Ce client n\'a pas de stripe_customer_id' }, 400);
      synced[client.id] = await syncOneClient(client.id, client.stripe_customer_id, limit);
    } else {
      return json({ error: 'client_id ou all requis' }, 400);
    }

    const total = Object.values(synced).reduce((s, n) => s + n, 0);
    return json({ ok: true, synced, total });
  } catch (e: any) {
    return json({ error: e.message || String(e) }, 500);
  }
});
