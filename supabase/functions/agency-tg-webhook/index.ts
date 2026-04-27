// agency-tg-webhook — Webhook Telegram pour le bot HelpAi Agency
// Reçoit les réponses des artisans (clic boutons + texte libre).
// Mirror la logique de agency-wa-webhook côté artisan.
//
// SETUP côté Telegram (à faire une fois) :
//   1. Créer un bot via @BotFather → /newbot
//      (ou réutiliser un bot existant si pas en conflit avec telegram-gmb-bot)
//   2. Récupérer le BOT_TOKEN
//   3. Ajouter en secret Supabase : TELEGRAM_AGENCY_BOT_TOKEN=xxx
//   4. Configurer le webhook (1 fois) :
//      curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<SUPABASE_URL>/functions/v1/agency-tg-webhook"
//
// SETUP côté artisan (à faire à chaque nouvel artisan) :
//   1. Artisan envoie /start au bot
//   2. Webhook reçoit le chat_id → on l'enregistre dans agency_clients.telegram_chat_id
//      (manuel pour l'instant via UI dashboard, ou auto via /link <slug>)

import { createClient } from 'jsr:@supabase/supabase-js@2';

const sb = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Préférer un bot dédié HelpAi Agency, fallback sur le bot global
const TG_TOKEN = Deno.env.get('TELEGRAM_AGENCY_BOT_TOKEN') || Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers Telegram API
// ─────────────────────────────────────────────────────────────────────────────
async function tg(method: string, payload: Record<string, unknown>) {
  if (!TG_TOKEN) return null;
  const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return r.json().catch(() => null);
}

async function sendText(chatId: string | number, text: string) {
  return tg('sendMessage', { chat_id: chatId, text, parse_mode: 'Markdown' });
}

async function sendButtons(chatId: string | number, text: string, buttons: { id: string; title: string }[]) {
  // Layout : 2 colonnes (lisibilité mobile)
  const keyboard: { text: string; callback_data: string }[][] = [];
  for (let i = 0; i < buttons.length; i += 2) {
    keyboard.push(buttons.slice(i, i + 2).map(b => ({ text: b.title, callback_data: b.id })));
  }
  return tg('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: keyboard },
  });
}

async function answerCallback(callbackId: string) {
  return tg('answerCallbackQuery', { callback_query_id: callbackId });
}

// ─────────────────────────────────────────────────────────────────────────────
// Parsing date (RDV) via Claude Haiku — réutilise la logique wa-webhook
// ─────────────────────────────────────────────────────────────────────────────
async function parseRdvDate(text: string): Promise<string | null> {
  if (!ANTHROPIC_KEY) return null;
  try {
    const now = new Date().toISOString();
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        messages: [{ role: 'user', content: `Date actuelle: ${now}\nTexte: "${text}"\nExtrait la date et l'heure de RDV au format ISO 8601. Réponds UNIQUEMENT avec la date ISO ou NULL si non détectable.` }],
      }),
    });
    const d = await r.json();
    const raw = d.content?.[0]?.text?.trim();
    if (!raw || raw === 'NULL') return null;
    const parsed = new Date(raw);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString();
  } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('OK', { status: 200 });

  let update: any;
  try { update = await req.json(); }
  catch { return new Response('Invalid JSON', { status: 400 }); }

  // chat_id soit du message texte, soit du callback (clic bouton)
  const chatId = String(
    update.message?.chat?.id ??
    update.callback_query?.message?.chat?.id ??
    ''
  );
  if (!chatId) return new Response('OK', { status: 200 });

  // Identifier l'artisan via telegram_chat_id
  const { data: artisanClient } = await sb
    .from('agency_clients')
    .select('id, nom, telegram_chat_id, telegram_actif, canal_notif')
    .eq('telegram_chat_id', chatId)
    .maybeSingle();

  // Cas spécial : commande /start (avant qu'un chat_id soit lié à un artisan)
  if (update.message?.text === '/start') {
    if (artisanClient) {
      await sendText(chatId, `✅ Bienvenue ${artisanClient.nom} ! Le bot HelpAi Agency est connecté.\nVous recevrez ici les notifs de leads, RDV et chantiers.`);
    } else {
      await sendText(chatId, `👋 Bienvenue !\n\nVotre Chat ID est : *${chatId}*\n\nCopiez-le et donnez-le à l'agence pour activer votre compte.`);
    }
    return new Response('OK', { status: 200 });
  }

  if (!artisanClient) {
    // Chat inconnu : réponse polie sans agir
    await sendText(chatId, "Ce compte Telegram n'est pas encore lié à un artisan HelpAi. Contactez l'agence.");
    return new Response('OK', { status: 200 });
  }

  // Logger l'inbound dans agency_lead_conversations (pour audit)
  const inboundContent = update.callback_query?.data || update.message?.text || '';
  await sb.from('agency_wa_messages').insert({
    client_id:  artisanClient.id,
    direction:  'inbound',
    phone_from: chatId,
    contenu:    inboundContent,
    type:       'reponse_artisan_telegram',
  });

  // ══════════════════════════════════════════════════════════════════════
  // CAS 1 : RÉPONSE BOUTON (callback_query)
  // ══════════════════════════════════════════════════════════════════════
  if (update.callback_query) {
    const cb        = update.callback_query;
    const cbId      = cb.id;
    const data      = cb.data || ''; // format "action:leadId"
    await answerCallback(cbId);

    const [action, leadId] = data.split(':');
    if (!leadId) return new Response('OK', { status: 200 });

    const { data: lead } = await sb
      .from('agency_leads')
      .select('*, agency_clients(nom, whatsapp_phone, telegram_chat_id, canal_notif)')
      .eq('id', leadId)
      .single();
    const nom           = lead?.nom || 'le prospect';
    const prospectPhone = lead?.telephone;

    // Map action → statut (mirror exact de agency-wa-webhook)
    const actionStatuts: Record<string, string> = {
      contacte:             'contacté',
      rdv:                  'rdv_pris',
      devis:                'devis_a_envoyer',
      perdu:                'perdu',
      rappel:               'rappel',
      rdv_ok:               'rdv_effectue',
      noshow:               'no_show',
      reporte:              'rdv_pris',
      devis_signe:          'devis_signe',
      devis_attente:        'devis_envoye',
      devis_perdu:          'devis_perdu',
      devis_envoye_confirm: 'devis_envoye',
      chantier_ok:          'chantier_termine',
      chantier_non:         'devis_signe',
    };
    const newStatut = actionStatuts[action];
    if (newStatut) {
      const updateData: Record<string, unknown> = { statut: newStatut };
      if (newStatut === 'devis_envoye') updateData.devis_envoye_le = new Date().toISOString();
      await sb.from('agency_leads').update(updateData).eq('id', leadId);
    }

    // Actions spécifiques (suite de conversation)
    switch (action) {
      case 'rdv':
        await sendText(chatId, `📅 Quelle date et heure pour le RDV ?\nExemple : *mardi 14h* ou *lundi 15 mai 10h30*`);
        await sb.from('agency_leads').update({ sms_etape: 99 }).eq('id', leadId);
        break;

      case 'reporte':
        await sendText(chatId, `📅 Quelle est la nouvelle date et heure du RDV ?`);
        await sb.from('agency_leads').update({ sms_etape: 99 }).eq('id', leadId);
        break;

      case 'rdv_ok':
        await sendButtons(chatId, `Suite du RDV avec ${nom} :`, [
          { id: `devis:${leadId}`, title: '📋 Devis à envoyer' },
          { id: `perdu:${leadId}`, title: '❌ Pas intéressant' },
        ]);
        break;

      case 'noshow':
        if (prospectPhone) {
          // Le prospect reçoit un SMS auto quand on déploiera Twilio.
          // Pour l'instant on le note dans le log.
        }
        await sendText(chatId, `❌ No-show enregistré pour ${nom}.`);
        break;

      case 'devis_signe':
        await sendText(chatId, `🏆 Quel est le montant du chantier signé ? (en euros, ex: 3500)`);
        await sb.from('agency_leads').update({ sms_etape: 98 }).eq('id', leadId);
        break;

      case 'chantier_ok':
        await sendText(chatId, `👏 Chantier marqué comme terminé ! Le système va demander un avis au client.`);
        break;

      default:
        if (newStatut) await sendText(chatId, `✅ Statut mis à jour : *${newStatut}*`);
    }

    return new Response('OK', { status: 200 });
  }

  // ══════════════════════════════════════════════════════════════════════
  // CAS 2 : MESSAGE TEXTE LIBRE (suite d'une question précédente)
  // ══════════════════════════════════════════════════════════════════════
  const text = (update.message?.text || '').trim();
  if (!text) return new Response('OK', { status: 200 });

  // Trouver le lead "en attente" pour cet artisan (sms_etape 99 = date RDV, 98 = montant)
  const { data: pendingLead } = await sb
    .from('agency_leads')
    .select('*')
    .eq('client_id', artisanClient.id)
    .in('sms_etape', [98, 99])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!pendingLead) {
    // Pas de question en attente : transmettre éventuellement à l'admin (TODO)
    return new Response('OK', { status: 200 });
  }

  // Étape 99 : attente de date RDV
  if (pendingLead.sms_etape === 99) {
    const rdvDate = await parseRdvDate(text);
    if (rdvDate) {
      await sb.from('agency_leads').update({
        rdv_datetime: rdvDate,
        sms_etape:    0,
        statut:       'rdv_pris',
      }).eq('id', pendingLead.id);
      const heure = new Date(rdvDate).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
      await sendText(chatId, `✅ RDV créé : *${heure}*\nLes rappels automatiques sont activés pour ${pendingLead.nom || 'le prospect'}.`);
    } else {
      await sendText(chatId, `Je n'ai pas compris la date. Précisez ex: *mardi 14h* ou *15 mai 10h30*`);
    }
    return new Response('OK', { status: 200 });
  }

  // Étape 98 : attente du montant chantier
  if (pendingLead.sms_etape === 98) {
    const montant = parseInt(text.replace(/[^0-9]/g, ''));
    if (montant > 0) {
      await sb.from('agency_leads').update({
        montant_chantier: montant * 100, // centimes
        sms_etape:        0,
      }).eq('id', pendingLead.id);
      await sendText(chatId, `✅ Montant enregistré : *${montant.toLocaleString('fr-FR')} €* 💪`);
    } else {
      await sendText(chatId, `Saisissez le montant en chiffres (ex: *3500*)`);
    }
    return new Response('OK', { status: 200 });
  }

  return new Response('OK', { status: 200 });
});
