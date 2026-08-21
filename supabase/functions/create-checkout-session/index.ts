import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse, safeReturnOrigin } from '../_shared/http.ts';
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
  if (stripeMode === 'test' && !stripeSecret.startsWith('sk_test_')) return jsonResponse(request, { error: 'TournamentX está en modo de prueba y rechazó una clave de producción.' }, 503);

  const authorization = request.headers.get('Authorization') || '';
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user?.email) return jsonResponse(request, { error: 'Inicia sesión para pagar una inscripción.' }, 401);

  let payload: { tournamentId?: string; teamId?: string };
  try { payload = await request.json(); } catch { return jsonResponse(request, { error: 'Solicitud inválida.' }, 400); }
  if (!payload.tournamentId || !uuidPattern.test(payload.tournamentId)) return jsonResponse(request, { error: 'Torneo inválido.' }, 400);
  if (payload.teamId && !uuidPattern.test(payload.teamId)) return jsonResponse(request, { error: 'Equipo inválido.' }, 400);

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: tournament, error: tournamentError } = await admin.from('tournaments').select('*').eq('id', payload.tournamentId).single();
  if (tournamentError || !tournament) return jsonResponse(request, { error: 'El torneo no existe.' }, 404);
  if (tournament.status !== 'open') return jsonResponse(request, { error: 'Las inscripciones no están abiertas.' }, 409);
  if (new Date(tournament.registration_deadline).getTime() <= Date.now()) return jsonResponse(request, { error: 'Las inscripciones ya cerraron.' }, 409);
  if (tournament.entry_fee_type === 'free' || Number(tournament.entry_fee_amount) <= 0) return jsonResponse(request, { error: 'Este torneo no requiere pago.' }, 409);
  const { count: occupiedPlaces } = await admin.from('registrations').select('id', { count: 'exact', head: true }).eq('tournament_id', tournament.id).in('status', ['pending', 'confirmed']);
  if ((occupiedPlaces || 0) >= tournament.max_participants) return jsonResponse(request, { error: 'El torneo ya no tiene cupos disponibles.' }, 409);

  if (tournament.participant_type === 'team') {
    if (!payload.teamId) return jsonResponse(request, { error: 'Selecciona un equipo válido.' }, 400);
    const { data: team } = await admin.from('teams').select('id').eq('id', payload.teamId).eq('tournament_id', tournament.id).eq('captain_id', authData.user.id).maybeSingle();
    if (!team) return jsonResponse(request, { error: 'Solo el capitán puede pagar por este equipo.' }, 403);
  } else if (payload.teamId) {
    return jsonResponse(request, { error: 'La inscripción individual no acepta equipos.' }, 400);
  }

  const { data: existing } = await admin.from('registrations').select('id, team_id, payment_status, stripe_checkout_session_id').eq('tournament_id', tournament.id).eq('user_id', authData.user.id).not('status', 'in', '(rejected,cancelled)').maybeSingle();
  if (existing?.payment_status === 'paid') return jsonResponse(request, { error: 'Esta inscripción ya está pagada.' }, 409);
  if (existing && existing.team_id !== (payload.teamId || null)) return jsonResponse(request, { error: 'Ya existe una inscripción pendiente con otro participante o equipo.' }, 409);

  let registration = existing;
  if (!registration) {
    const { data, error } = await admin.from('registrations').insert({ tournament_id: tournament.id, user_id: authData.user.id, team_id: payload.teamId || null, status: 'pending', payment_status: 'pending' }).select('id, payment_status, stripe_checkout_session_id').single();
    if (error) return jsonResponse(request, { error: 'No se pudo reservar la inscripción.' }, 400);
    registration = { ...data, team_id: payload.teamId || null };
  }

  const amountMinor = Math.round(Number(tournament.entry_fee_amount) * 100);
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 100 || amountMinor > 1_000_000_000) return jsonResponse(request, { error: 'El importe configurado no es válido.' }, 400);
  const returnOrigin = safeReturnOrigin(request);

  try {
    const session = await stripeRequest('/checkout/sessions', stripeSecret, {
      method: 'POST',
      headers: { 'Idempotency-Key': `registration-${registration.id}` },
      body: stripeForm({
        mode: 'payment',
        success_url: `${returnOrigin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnOrigin}/?payment=cancelled`,
        customer_email: authData.user.email,
        'line_items[0][price_data][currency]': 'mxn',
        'line_items[0][price_data][unit_amount]': amountMinor,
        'line_items[0][price_data][product_data][name]': `Inscripción: ${tournament.title}`,
        'line_items[0][quantity]': 1,
        'metadata[registration_id]': registration.id,
        'metadata[tournament_id]': tournament.id,
        'metadata[user_id]': authData.user.id,
        'payment_intent_data[metadata][registration_id]': registration.id,
        'payment_intent_data[metadata][tournament_id]': tournament.id,
      }),
    });

    await admin.from('registrations').update({ stripe_checkout_session_id: session.id, payment_status: 'pending' }).eq('id', registration.id);
    const { error: transactionError } = await admin.from('transactions').upsert({
      tournament_id: tournament.id,
      user_id: authData.user.id,
      registration_id: registration.id,
      amount: Number(tournament.entry_fee_amount),
      amount_minor: amountMinor,
      net_amount_minor: amountMinor,
      currency: 'MXN',
      status: 'PENDING',
      payment_method: 'Stripe Checkout',
      fee_type: 'entry_fee',
      stripe_checkout_session_id: session.id,
      provider_reference: session.id,
    }, { onConflict: 'stripe_checkout_session_id' });
    if (transactionError) throw transactionError;
    return jsonResponse(request, { checkoutUrl: session.url, registrationId: registration.id });
  } catch (error) {
    return jsonResponse(request, { error: error instanceof Error ? error.message : 'No se pudo iniciar el pago.' }, 502);
  }
});
