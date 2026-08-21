import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import { stripeForm, stripeRequest } from '../_shared/stripe.ts';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) });
  if (request.method !== 'POST') return jsonResponse(request, { error: 'Método no permitido.' }, 405);
  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!stripeSecret || !supabaseUrl || !anonKey || !serviceKey || !stripeSecret.startsWith('sk_test_')) return jsonResponse(request, { error: 'Pagos de prueba no configurados.' }, 503);
  const authorization = request.headers.get('Authorization') || '';
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: authData } = await userClient.auth.getUser();
  if (!authData.user) return jsonResponse(request, { error: 'Inicia sesión para pagar la inscripción.' }, 401);
  let payload: { tournamentId?: string; teamId?: string };
  try { payload = await request.json(); } catch { return jsonResponse(request, { error: 'Solicitud inválida.' }, 400); }
  if (!payload.tournamentId || !uuidPattern.test(payload.tournamentId) || (payload.teamId && !uuidPattern.test(payload.teamId))) return jsonResponse(request, { error: 'Datos de inscripción inválidos.' }, 400);

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: tournament } = await admin.from('tournaments').select('*').eq('id', payload.tournamentId).single();
  if (!tournament || tournament.status !== 'open') return jsonResponse(request, { error: 'Las inscripciones no están abiertas.' }, 409);
  if (new Date(tournament.registration_deadline).getTime() <= Date.now()) return jsonResponse(request, { error: 'Las inscripciones ya cerraron.' }, 409);
  if (tournament.entry_fee_type === 'free' || Number(tournament.entry_fee_amount) <= 0) return jsonResponse(request, { error: 'Este torneo no requiere pago.' }, 409);
  const { count } = await admin.from('registrations').select('id', { count: 'exact', head: true }).eq('tournament_id', tournament.id).in('status', ['pending', 'confirmed']);
  if ((count || 0) >= tournament.max_participants) return jsonResponse(request, { error: 'El torneo ya no tiene cupos.' }, 409);
  if (tournament.participant_type === 'team') {
    if (!payload.teamId) return jsonResponse(request, { error: 'Selecciona un equipo.' }, 400);
    const { data: team } = await admin.from('teams').select('id').eq('id', payload.teamId).eq('tournament_id', tournament.id).eq('captain_id', authData.user.id).maybeSingle();
    if (!team) return jsonResponse(request, { error: 'Solo el capitán puede pagar por este equipo.' }, 403);
  } else if (payload.teamId) return jsonResponse(request, { error: 'La inscripción individual no acepta equipos.' }, 400);

  const { data: existing } = await admin.from('registrations').select('*').eq('tournament_id', tournament.id).eq('user_id', authData.user.id).not('status', 'in', '(rejected,cancelled)').maybeSingle();
  if (existing?.payment_status === 'paid') return jsonResponse(request, { error: 'La inscripción ya está pagada.' }, 409);
  if (existing && existing.team_id !== (payload.teamId || null)) return jsonResponse(request, { error: 'Ya existe una inscripción pendiente diferente.' }, 409);
  let registration = existing;
  if (!registration) {
    const inserted = await admin.from('registrations').insert({ tournament_id: tournament.id, user_id: authData.user.id, team_id: payload.teamId || null, status: 'pending', payment_status: 'pending' }).select('*').single();
    if (inserted.error) return jsonResponse(request, { error: 'No se pudo reservar la inscripción.' }, 400);
    registration = inserted.data;
  }
  const amountMinor = Math.round(Number(tournament.entry_fee_amount) * 100);
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 100 || amountMinor > 1_000_000_000) return jsonResponse(request, { error: 'Importe inválido.' }, 400);
  try {
    let intent: any;
    if (registration.stripe_payment_intent_id) intent = await stripeRequest(`/payment_intents/${encodeURIComponent(registration.stripe_payment_intent_id)}`, stripeSecret, { method: 'GET' });
    else {
      intent = await stripeRequest('/payment_intents', stripeSecret, { method: 'POST', headers: { 'Idempotency-Key': `registration-elements-${registration.id}` }, body: stripeForm({
        amount: amountMinor, currency: 'mxn', 'automatic_payment_methods[enabled]': true, description: `Inscripción: ${tournament.title}`,
        'metadata[payment_kind]': 'registration', 'metadata[registration_id]': registration.id,
        'metadata[tournament_id]': tournament.id, 'metadata[user_id]': authData.user.id,
      }) });
      await admin.from('registrations').update({ stripe_payment_intent_id: intent.id, payment_status: 'pending' }).eq('id', registration.id);
      const transaction = await admin.from('transactions').insert({ tournament_id: tournament.id, user_id: authData.user.id, registration_id: registration.id, amount: amountMinor / 100, amount_minor: amountMinor, net_amount_minor: amountMinor, currency: 'MXN', status: 'PENDING', payment_method: 'Stripe Elements', fee_type: 'entry_fee', stripe_payment_intent_id: intent.id, provider_reference: intent.id });
      if (transaction.error) throw transaction.error;
    }
    if (!intent.client_secret) throw new Error('Stripe no devolvió el formulario de pago.');
    return jsonResponse(request, { clientSecret: intent.client_secret, registrationId: registration.id, paymentIntentId: intent.id });
  } catch (error) { return jsonResponse(request, { error: error instanceof Error ? error.message : 'No se pudo preparar el pago.' }, 502); }
});
