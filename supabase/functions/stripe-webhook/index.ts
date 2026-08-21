import { createClient } from 'npm:@supabase/supabase-js@2';
import { jsonResponse } from '../_shared/http.ts';
import { stripeRequest, verifyStripeSignature } from '../_shared/stripe.ts';

Deno.serve(async request => {
  if (request.method !== 'POST') return jsonResponse(request, { error: 'Método no permitido.' }, 405);
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
  const stripeMode = Deno.env.get('STRIPE_MODE') || 'test';
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!webhookSecret || !stripeSecret || !supabaseUrl || !serviceKey) return jsonResponse(request, { error: 'Webhook no configurado.' }, 503);
  if (stripeMode === 'test' && !stripeSecret.startsWith('sk_test_')) return jsonResponse(request, { error: 'Clave de Stripe incompatible con el modo de prueba.' }, 503);

  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature') || '';
  if (!await verifyStripeSignature(rawBody, signature, webhookSecret)) return jsonResponse(request, { error: 'Firma de Stripe inválida.' }, 400);

  let event: any;
  try { event = JSON.parse(rawBody); } catch { return jsonResponse(request, { error: 'Evento inválido.' }, 400); }
  const admin = createClient(supabaseUrl, serviceKey);
  const { data: processed } = await admin.from('stripe_webhook_events').select('id').eq('id', event.id).maybeSingle();
  if (processed) return jsonResponse(request, { received: true, duplicate: true });

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      await completeCheckout(admin, event.data.object, stripeSecret);
    } else if (event.type === 'checkout.session.async_payment_failed') {
      await failCheckout(admin, event.data.object);
    } else if (event.type === 'checkout.session.expired') {
      await failCheckout(admin, event.data.object);
    } else if (event.type === 'charge.refunded') {
      await recordRefund(admin, event.data.object);
    } else if (event.type === 'payment_intent.succeeded') {
      if (event.data.object.metadata?.payment_kind === 'registration') await completeRegistrationIntent(admin, event.data.object, stripeSecret);
      else await completeOrganizerFunding(admin, event.data.object, stripeSecret);
    } else if (event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') {
      await failOrganizerFunding(admin, event.data.object);
    }

    const { error: eventError } = await admin.from('stripe_webhook_events').insert({ id: event.id, event_type: event.type, payload: event });
    if (eventError?.code !== '23505') throw eventError;
    // Deliver any transactional emails queued by database triggers. This is
    // intentionally best-effort: Stripe must not retry a valid payment event
    // merely because the mail provider is temporarily unavailable.
    fetch(`${supabaseUrl}/functions/v1/send-email-outbox`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        'Content-Type': 'application/json',
      },
      body: '{}',
    }).catch(error => console.error('Email outbox invocation failed', error));
    return jsonResponse(request, { received: true });
  } catch (error) {
    console.error('Stripe webhook processing failed', error);
    return jsonResponse(request, { error: 'No se pudo procesar el evento.' }, 500);
  }
});

async function completeCheckout(admin: any, session: any, stripeSecret: string) {
  if (session.payment_status !== 'paid') return;
  const registrationId = session.metadata?.registration_id;
  const tournamentId = session.metadata?.tournament_id;
  if (!registrationId || !tournamentId) throw new Error('Stripe session metadata is incomplete.');

  let chargeId: string | null = null;
  let stripeFeeMinor = 0;
  if (session.payment_intent) {
    const intent = await stripeRequest(`/payment_intents/${encodeURIComponent(session.payment_intent)}?expand[]=latest_charge.balance_transaction`, stripeSecret, { method: 'GET' });
    chargeId = typeof intent.latest_charge === 'string' ? intent.latest_charge : intent.latest_charge?.id || null;
    stripeFeeMinor = Number(typeof intent.latest_charge === 'object' ? intent.latest_charge?.balance_transaction?.fee || 0 : 0);
  }
  const grossMinor = Number(session.amount_total || 0);

  await admin.from('transactions').update({
    status: 'PAID',
    amount: grossMinor / 100,
    amount_minor: grossMinor,
    stripe_fee_minor: stripeFeeMinor,
    net_amount_minor: Math.max(grossMinor - stripeFeeMinor, 0),
    stripe_payment_intent_id: session.payment_intent || null,
    stripe_charge_id: chargeId,
  }).eq('stripe_checkout_session_id', session.id);

  await admin.from('registrations').update({ status: 'confirmed', payment_status: 'paid', stripe_payment_intent_id: session.payment_intent || null, paid_at: new Date().toISOString() }).eq('id', registrationId).neq('status', 'cancelled');
  await admin.from('tournaments').update({ has_received_payments: true }).eq('id', tournamentId);
}

async function failCheckout(admin: any, session: any) {
  await admin.from('transactions').update({ status: 'FAILED' }).eq('stripe_checkout_session_id', session.id);
  await admin.from('registrations').update({ payment_status: 'failed' }).eq('stripe_checkout_session_id', session.id);
}

async function recordRefund(admin: any, charge: any) {
  const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) return;
  const refundedMinor = Number(charge.amount_refunded || 0);
  await admin.from('transactions').update({
    status: refundedMinor >= Number(charge.amount || 0) ? 'REFUNDED' : 'PAID',
    refunded_amount_minor: refundedMinor,
  }).eq('stripe_payment_intent_id', paymentIntentId);
  if (refundedMinor >= Number(charge.amount || 0)) await admin.from('registrations').update({ status: 'cancelled', payment_status: 'refunded' }).eq('stripe_payment_intent_id', paymentIntentId);
  if (refundedMinor >= Number(charge.amount || 0)) {
    const { data: transaction } = await admin.from('transactions').select('tournament_id, fee_type').eq('stripe_payment_intent_id', paymentIntentId).maybeSingle();
    if (transaction?.fee_type === 'organizer_contribution') await admin.from('tournaments').update({ organizer_funding_status: 'refunded', status: 'draft' }).eq('id', transaction.tournament_id);
  }
}

async function completeOrganizerFunding(admin: any, paymentIntent: any, stripeSecret: string) {
  if (paymentIntent.metadata?.payment_kind !== 'organizer_contribution') return;
  const tournamentId = paymentIntent.metadata?.tournament_id;
  if (!tournamentId) throw new Error('Organizer payment metadata is incomplete.');
  const intent = await stripeRequest(`/payment_intents/${encodeURIComponent(paymentIntent.id)}?expand[]=latest_charge.balance_transaction`, stripeSecret, { method: 'GET' });
  const chargeId = typeof intent.latest_charge === 'string' ? intent.latest_charge : intent.latest_charge?.id || null;
  const stripeFeeMinor = Number(typeof intent.latest_charge === 'object' ? intent.latest_charge?.balance_transaction?.fee || 0 : 0);
  const grossMinor = Number(intent.amount_received || intent.amount || 0);
  await admin.from('transactions').update({
    status: 'PAID', amount: grossMinor / 100, amount_minor: grossMinor, stripe_fee_minor: stripeFeeMinor,
    net_amount_minor: Math.max(grossMinor - stripeFeeMinor, 0), stripe_charge_id: chargeId,
  }).eq('stripe_payment_intent_id', intent.id).eq('fee_type', 'organizer_contribution');
  await admin.from('tournaments').update({ organizer_funding_status: 'paid', status: 'open', has_received_payments: true, published_at: new Date().toISOString() }).eq('id', tournamentId).eq('organizer_payment_intent_id', intent.id);
}

async function failOrganizerFunding(admin: any, paymentIntent: any) {
  if (paymentIntent.metadata?.payment_kind === 'registration') {
    await admin.from('transactions').update({ status: 'FAILED' }).eq('stripe_payment_intent_id', paymentIntent.id).eq('fee_type', 'entry_fee');
    await admin.from('registrations').update({ payment_status: 'failed' }).eq('stripe_payment_intent_id', paymentIntent.id);
    return;
  }
  if (paymentIntent.metadata?.payment_kind !== 'organizer_contribution') return;
  await admin.from('transactions').update({ status: 'FAILED' }).eq('stripe_payment_intent_id', paymentIntent.id).eq('fee_type', 'organizer_contribution');
  await admin.from('tournaments').update({ organizer_funding_status: 'failed' }).eq('organizer_payment_intent_id', paymentIntent.id);
}

async function completeRegistrationIntent(admin: any, paymentIntent: any, stripeSecret: string) {
  const registrationId = paymentIntent.metadata?.registration_id;
  const tournamentId = paymentIntent.metadata?.tournament_id;
  if (!registrationId || !tournamentId) throw new Error('Registration payment metadata is incomplete.');
  const intent = await stripeRequest(`/payment_intents/${encodeURIComponent(paymentIntent.id)}?expand[]=latest_charge.balance_transaction`, stripeSecret, { method: 'GET' });
  const chargeId = typeof intent.latest_charge === 'string' ? intent.latest_charge : intent.latest_charge?.id || null;
  const stripeFeeMinor = Number(typeof intent.latest_charge === 'object' ? intent.latest_charge?.balance_transaction?.fee || 0 : 0);
  const grossMinor = Number(intent.amount_received || intent.amount || 0);
  await admin.from('transactions').update({ status: 'PAID', amount: grossMinor / 100, amount_minor: grossMinor, stripe_fee_minor: stripeFeeMinor, net_amount_minor: Math.max(grossMinor - stripeFeeMinor, 0), stripe_charge_id: chargeId }).eq('stripe_payment_intent_id', intent.id).eq('fee_type', 'entry_fee');
  await admin.from('registrations').update({ status: 'confirmed', payment_status: 'paid', paid_at: new Date().toISOString() }).eq('id', registrationId).eq('stripe_payment_intent_id', intent.id).neq('status', 'cancelled');
  await admin.from('tournaments').update({ has_received_payments: true }).eq('id', tournamentId);
}
