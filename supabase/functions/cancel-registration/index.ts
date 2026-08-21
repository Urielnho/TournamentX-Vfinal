import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import { stripeForm, stripeRequest } from '../_shared/stripe.ts';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) });
  if (request.method !== 'POST') return jsonResponse(request, { error: 'Método no permitido.' }, 405);
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceKey) return jsonResponse(request, { error: 'Servicio no configurado.' }, 503);
  const authorization = request.headers.get('Authorization') || '';
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: authData } = await userClient.auth.getUser();
  if (!authData.user) return jsonResponse(request, { error: 'Inicia sesión para salir del torneo.' }, 401);
  let payload: { tournamentId?: string };
  try { payload = await request.json(); } catch { return jsonResponse(request, { error: 'Solicitud inválida.' }, 400); }
  if (!payload.tournamentId || !uuidPattern.test(payload.tournamentId)) return jsonResponse(request, { error: 'Torneo inválido.' }, 400);

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: tournament } = await admin.from('tournaments').select('id,status,start_date').eq('id', payload.tournamentId).maybeSingle();
  if (!tournament) return jsonResponse(request, { error: 'El torneo no existe.' }, 404);
  if (['live', 'completed'].includes(tournament.status) || new Date(tournament.start_date).getTime() <= Date.now()) return jsonResponse(request, { error: 'Ya no puedes salir porque el torneo comenzó.' }, 409);
  const { data: registration } = await admin.from('registrations').select('*').eq('tournament_id', tournament.id).eq('user_id', authData.user.id).not('status', 'in', '(rejected,cancelled)').maybeSingle();
  if (!registration) return jsonResponse(request, { error: 'No tienes una inscripción activa en este torneo.' }, 404);

  if (registration.payment_status === 'paid') {
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecret || !registration.stripe_payment_intent_id) return jsonResponse(request, { error: 'No se puede procesar el reembolso en este momento.' }, 503);
    try {
      await stripeRequest('/refunds', stripeSecret, { method: 'POST', headers: { 'Idempotency-Key': `registration-refund-${registration.id}` }, body: stripeForm({ payment_intent: registration.stripe_payment_intent_id, reason: 'requested_by_customer' }) });
    } catch (error) {
      return jsonResponse(request, { error: error instanceof Error ? error.message : 'Stripe no pudo procesar el reembolso.' }, 502);
    }
    const { data: transaction } = await admin.from('transactions').select('amount_minor').eq('registration_id', registration.id).maybeSingle();
    await admin.from('transactions').update({ status: 'REFUNDED', refunded_amount_minor: Number(transaction?.amount_minor || 0) }).eq('registration_id', registration.id);
    await admin.from('registrations').update({ status: 'cancelled', payment_status: 'refunded' }).eq('id', registration.id);
    return jsonResponse(request, { refunded: true });
  }

  if (registration.payment_status === 'pending' && registration.stripe_payment_intent_id) {
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    if (stripeSecret) {
      try { await stripeRequest(`/payment_intents/${encodeURIComponent(registration.stripe_payment_intent_id)}/cancel`, stripeSecret, { method: 'POST' }); }
      catch { /* The registration is still cancelled server-side; Stripe webhooks cannot reactivate it. */ }
    }
    await admin.from('transactions').update({ status: 'FAILED' }).eq('registration_id', registration.id).eq('status', 'PENDING');
  }
  await admin.from('registrations').update({ status: 'cancelled', payment_status: registration.payment_status === 'pending' ? 'failed' : registration.payment_status }).eq('id', registration.id);
  return jsonResponse(request, { refunded: false });
});
