import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import { stripeForm, stripeRequest } from '../_shared/stripe.ts';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) });
  if (request.method !== 'POST') return jsonResponse(request, { error: 'Método no permitido.' }, 405);
  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
  const stripeMode = Deno.env.get('STRIPE_MODE') || 'test';
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!stripeSecret || !supabaseUrl || !anonKey || !serviceKey) return jsonResponse(request, { error: 'El servicio de pagos no está configurado.' }, 503);
  if (stripeMode === 'test' && !stripeSecret.startsWith('sk_test_')) return jsonResponse(request, { error: 'La clave no corresponde al modo de prueba.' }, 503);

  const authorization = request.headers.get('Authorization') || '';
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: authData } = await userClient.auth.getUser();
  if (!authData.user) return jsonResponse(request, { error: 'Inicia sesión para financiar el torneo.' }, 401);
  let payload: { tournamentId?: string };
  try { payload = await request.json(); } catch { return jsonResponse(request, { error: 'Solicitud inválida.' }, 400); }
  if (!payload.tournamentId || !uuidPattern.test(payload.tournamentId)) return jsonResponse(request, { error: 'Torneo inválido.' }, 400);

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: tournament } = await admin.from('tournaments').select('*').eq('id', payload.tournamentId).eq('organizer_id', authData.user.id).single();
  if (!tournament) return jsonResponse(request, { error: 'No puedes financiar este torneo.' }, 403);
  if (tournament.organizer_funding_status === 'paid') return jsonResponse(request, { error: 'La bolsa inicial ya fue pagada.' }, 409);
  if (tournament.status !== 'draft' || tournament.prize_type !== 'monetary') return jsonResponse(request, { error: 'El torneo no requiere este pago.' }, 409);
  const amountMinor = Math.round(Number(tournament.base_prize_pool) * 100);
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 100 || amountMinor > 1_000_000_000) return jsonResponse(request, { error: 'El aporte base no es válido.' }, 400);

  try {
    let intent: any;
    if (tournament.organizer_payment_intent_id) {
      intent = await stripeRequest(`/payment_intents/${encodeURIComponent(tournament.organizer_payment_intent_id)}`, stripeSecret, { method: 'GET' });
    } else {
      intent = await stripeRequest('/payment_intents', stripeSecret, {
        method: 'POST', headers: { 'Idempotency-Key': `organizer-funding-${tournament.id}` },
        body: stripeForm({
          amount: amountMinor, currency: 'mxn', 'automatic_payment_methods[enabled]': true,
          description: `Bolsa inicial: ${tournament.title}`,
          'metadata[payment_kind]': 'organizer_contribution',
          'metadata[tournament_id]': tournament.id,
          'metadata[user_id]': authData.user.id,
        }),
      });
      await admin.from('tournaments').update({ organizer_payment_intent_id: intent.id, organizer_funding_status: 'pending' }).eq('id', tournament.id);
      const { error: transactionError } = await admin.from('transactions').insert({
        tournament_id: tournament.id, user_id: authData.user.id, amount: amountMinor / 100, amount_minor: amountMinor,
        net_amount_minor: amountMinor, currency: 'MXN', status: 'PENDING', payment_method: 'Stripe Elements',
        fee_type: 'organizer_contribution', stripe_payment_intent_id: intent.id, provider_reference: intent.id,
      });
      if (transactionError) throw transactionError;
    }
    if (!intent.client_secret) return jsonResponse(request, { error: 'Stripe no devolvió un secreto de confirmación.' }, 502);
    return jsonResponse(request, { clientSecret: intent.client_secret });
  } catch (error) {
    return jsonResponse(request, { error: error instanceof Error ? error.message : 'No se pudo preparar el pago.' }, 502);
  }
});
