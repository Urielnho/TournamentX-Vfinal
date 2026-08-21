import { AdminUserSummary, Match, Participant, PendingApproval, Team, Tournament, Transaction } from '../types';
import { supabase } from '../lib/supabase';

const defaultBanner = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1400&q=80';

const asNumber = (value: unknown) => Number(value ?? 0);

export async function flushEmailOutbox() {
  if (!supabase) return;
  try { await supabase.functions.invoke('send-email-outbox', { body: {} }); } catch { /* Notifications retry later and never block the main action. */ }
}

export async function uploadTournamentBanner(file: File): Promise<string> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  if (!allowedTypes.has(file.type)) throw new Error('La imagen debe ser JPG, PNG o WebP.');
  if (file.size > 5 * 1024 * 1024) throw new Error('La imagen no puede superar 5 MB.');
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error('Inicia sesión para subir una imagen.');
  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${authData.user.id}/tournaments/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from('tournament-media').upload(path, file, { cacheControl: '3600', contentType: file.type, upsert: false });
  if (error) throw error;
  return supabase.storage.from('tournament-media').getPublicUrl(path).data.publicUrl;
}

export async function uploadTeamLogo(file: File): Promise<string> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  if (!allowedTypes.has(file.type)) throw new Error('El logo debe ser JPG, PNG o WebP.');
  if (file.size > 2 * 1024 * 1024) throw new Error('El logo no puede superar 2 MB.');
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error('Inicia sesión para subir un logo.');
  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${authData.user.id}/teams/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from('tournament-media').upload(path, file, { cacheControl: '3600', contentType: file.type, upsert: false });
  if (error) throw error;
  return supabase.storage.from('tournament-media').getPublicUrl(path).data.publicUrl;
}

export async function getTeamRosterAvailability(teamId: string, tournamentId: string): Promise<Record<string, boolean>> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data, error } = await supabase.rpc('team_roster_availability', { target_team_id: teamId, target_tournament_id: tournamentId });
  if (error) throw error;
  return Object.fromEntries((data || []).map((row: { user_id: string; unavailable: boolean }) => [row.user_id, row.unavailable]));
}

export interface AppDatabaseData {
  tournaments: Tournament[];
  teams: Team[];
  participants: Participant[];
  matches: Match[];
  transactions: Transaction[];
  pendingApprovals: PendingApproval[];
  users: AdminUserSummary[];
}

export interface TeamInvitationSummary { id: string; token: string; teamId: string; teamName: string; expiresAt: string; }
export interface TeamJoinRequestSummary { id: string; teamId: string; teamName: string; userId: string; userName: string; gamerTag: string; }

export async function loadTeamCollaboration() {
  if (!supabase) return { invitations: [] as TeamInvitationSummary[], requests: [] as TeamJoinRequestSummary[] };
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { invitations: [] as TeamInvitationSummary[], requests: [] as TeamJoinRequestSummary[] };
  const [inviteResult, requestResult] = await Promise.all([
    supabase.from('team_invitations').select('id,token,team_id,expires_at,team:teams(name)').eq('invited_user_id', authData.user.id).eq('status', 'pending').gt('expires_at', new Date().toISOString()),
    supabase.from('team_join_requests').select('id,team_id,user_id,team:teams(name,captain_id),profile:profiles!team_join_requests_user_id_fkey(full_name,gamer_tag)').eq('status', 'pending'),
  ]);
  if (inviteResult.error) throw inviteResult.error;
  if (requestResult.error) throw requestResult.error;
  return {
    invitations: (inviteResult.data || []).map((row: any) => ({ id: row.id, token: row.token, teamId: row.team_id, teamName: row.team?.name || 'Equipo', expiresAt: row.expires_at })),
    requests: (requestResult.data || []).filter((row: any) => row.team?.captain_id === authData.user?.id).map((row: any) => ({ id: row.id, teamId: row.team_id, teamName: row.team?.name || 'Equipo', userId: row.user_id, userName: row.profile?.full_name || 'Jugador', gamerTag: row.profile?.gamer_tag || '' })),
  };
}

async function teamRpc(name: string, args: Record<string, unknown>) {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  void flushEmailOutbox();
  return data;
}

export const inviteTeamMember = (teamId: string, gamerTag: string) => teamRpc('invite_team_member', { target_team_id: teamId, target_gamer_tag: gamerTag });
export const createTeamInviteLink = async (teamId: string) => String(await teamRpc('create_team_invite_link', { target_team_id: teamId }));
export const acceptTeamInvitation = (token: string) => teamRpc('accept_team_invitation', { invite_token: token });
export const rejectTeamInvitation = (invitationId: string) => teamRpc('reject_team_invitation', { invitation_id: invitationId });
export const requestToJoinTeam = (teamId: string) => teamRpc('request_to_join_team', { target_team_id: teamId });
export const respondTeamJoinRequest = (requestId: string, approve: boolean) => teamRpc('respond_team_join_request', { target_request_id: requestId, approve });
export const removeTeamMember = (teamId: string, userId: string) => teamRpc('remove_team_member', { target_team_id: teamId, target_user_id: userId });
export const leaveTeam = (teamId: string) => teamRpc('leave_team', { target_team_id: teamId });
export const archiveTeam = (teamId: string) => teamRpc('archive_team', { target_team_id: teamId });

export async function generateTournamentBracket(tournamentId: string): Promise<number> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data, error } = await supabase.rpc('generate_initial_bracket', { target_tournament_id: tournamentId });
  if (error) throw error;
  return Number(data || 0);
}

export async function clearTournamentBracket(tournamentId: string) {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { error } = await supabase.from('matches').delete().eq('tournament_id', tournamentId);
  if (error) throw error;
}

export async function updateMatchSchedule(matchId: string, scheduledAt: string, streamUrl?: string) {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const parsedDate = new Date(scheduledAt);
  if (!scheduledAt || Number.isNaN(parsedDate.getTime())) throw new Error('Selecciona una fecha y hora válidas.');
  const { error } = await supabase.rpc('schedule_tournament_match', {
    target_match_id: matchId,
    target_scheduled_at: parsedDate.toISOString(),
    target_stream_url: streamUrl?.trim() || null,
  });
  if (error) throw new Error(error.message || 'No se pudo programar el partido.');
}

export async function loadAppData(userId?: string): Promise<AppDatabaseData> {
  if (!supabase) return { tournaments: [], teams: [], participants: [], matches: [], transactions: [], pendingApprovals: [], users: [] };

  const [tournamentResult, teamResult, memberResult, registrationResult, rosterResult, matchResult, transactionResult, profileResult, countResult] = await Promise.all([
    supabase.from('tournaments').select('*, organizer:profiles!tournaments_organizer_id_fkey(full_name, avatar_url)').neq('status', 'draft').order('created_at', { ascending: false }),
    supabase.from('teams').select('*, captain:profiles!teams_captain_id_fkey(full_name, email)').is('archived_at',null).order('created_at', { ascending: false }),
    supabase.from('team_members').select('team_id, user_id, member_role, joined_at, profile:profiles!team_members_user_id_fkey(full_name, gamer_tag, avatar_url)'),
    supabase.from('registrations').select('id, tournament_id, user_id, team_id, status, created_at'),
    supabase.from('registration_members').select('registration_id, user_id, registration:registrations!registration_members_registration_id_fkey(tournament_id, status)'),
    supabase.from('matches').select('*, team_a:teams!matches_team_a_id_fkey(id, name, tag, logo_url), team_b:teams!matches_team_b_id_fkey(id, name, tag, logo_url), registration_a:registrations!matches_registration_a_id_fkey(id,profile:profiles!registrations_user_id_fkey(full_name,gamer_tag,avatar_url)), registration_b:registrations!matches_registration_b_id_fkey(id,profile:profiles!registrations_user_id_fkey(full_name,gamer_tag,avatar_url))').order('round_number', { ascending: true }).order('match_number', { ascending: true }),
    userId ? supabase.from('transactions').select('*, tournament:tournaments(title), profile:profiles(full_name)').order('created_at', { ascending: false }) : Promise.resolve({ data: [], error: null }),
    userId ? supabase.from('profiles').select('id, email, full_name, gamer_tag, avatar_url, global_role').order('created_at', { ascending: false }) : Promise.resolve({ data: [], error: null }),
    supabase.rpc('tournament_registration_counts'),
  ]);

  const firstError = [tournamentResult, teamResult, memberResult, registrationResult, rosterResult, matchResult, transactionResult, profileResult, countResult].find(result => result.error)?.error;
  if (firstError) throw firstError;

  const registrations = registrationResult.data ?? [];
  const registrationCounts = countResult.data ?? [];
  const members = memberResult.data ?? [];
  const rosterEntries = rosterResult.data ?? [];
  const financialResults = await Promise.all((tournamentResult.data ?? []).map((row: any) => supabase.rpc('tournament_financial_summary', { target_tournament_id: row.id })));
  const tournaments: Tournament[] = (tournamentResult.data ?? []).map((row: any) => {
    const tournamentRegistrations = registrations.filter((registration: any) => registration.tournament_id === row.id && !['rejected', 'cancelled'].includes(registration.status));
    const financialRow = financialResults.find((_result, index) => tournamentResult.data?.[index]?.id === row.id)?.data?.[0];
    const prizeAmount = asNumber(financialRow?.prize_amount_minor) / 100;
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      bannerUrl: row.banner_url || defaultBanner,
      category: row.category,
      game: row.game,
      gameMode: row.game_mode,
      gameConfig: row.game_config && Object.keys(row.game_config).length > 0 ? row.game_config : undefined,
      format: row.format,
      status: row.status,
      accessType: row.access_type,
      location: row.location,
      stream: row.stream ?? undefined,
      startDate: row.start_date,
      endDate: row.end_date,
      registrationDeadline: row.registration_deadline,
      participantType: row.participant_type,
      minPlayersPerTeam: row.min_players_per_team,
      participantsCount: Number(registrationCounts.find((count: any) => count.tournament_id === row.id)?.participants_count ?? tournamentRegistrations.length),
      maxParticipants: row.max_participants,
      entryFeeType: row.entry_fee_type,
      entryFeeAmount: asNumber(row.entry_fee_amount),
      organizerPercentage: asNumber(row.organizer_percentage),
      hasReceivedPayments: row.has_received_payments,
      prizeType: row.prize_type,
      basePrizePool: prizeAmount,
      financials: {
        registrationGross: asNumber(financialRow?.registration_gross_minor) / 100,
        sponsorGross: asNumber(financialRow?.sponsor_gross_minor) / 100,
        stripeFees: asNumber(financialRow?.stripe_fees_minor) / 100,
        refunds: asNumber(financialRow?.refundable_adjustments_minor) / 100,
        distributableNet: asNumber(financialRow?.distributable_net_minor) / 100,
        organizerAmount: asNumber(financialRow?.organizer_amount_minor) / 100,
        prizeAmount,
        currency: financialRow?.currency?.toUpperCase() || 'MXN',
      },
      otherPrizeDescription: row.other_prize_description ?? undefined,
      sponsors: Array.isArray(row.sponsors) ? row.sponsors : [],
      rules: Array.isArray(row.rules) ? row.rules : [],
      prizesBreakdown: Array.isArray(row.prize_distribution) ? row.prize_distribution.map((item: any) => ({ ...item, estimatedAmount: Math.round(prizeAmount * asNumber(item.percentage) / 100) })) : (prizeAmount > 0 ? [{ place: '1.º', percentage: 100, estimatedAmount: prizeAmount }] : []),
      organizerId: row.organizer_id,
      organizer: { name: row.organizer?.full_name || 'Organizador', avatar: row.organizer?.avatar_url || undefined },
      isUserRegistered: Boolean(userId && tournamentRegistrations.some((registration: any) => registration.user_id === userId)),
      isUserOrganizing: row.organizer_id === userId,
    };
  });

  const teams: Team[] = (teamResult.data ?? []).map((row: any) => ({
    id: row.id,
    tournamentId: row.tournament_id ?? undefined,
    tournamentName: tournaments.find(tournament => tournament.id === row.tournament_id)?.title,
    name: row.name,
    tag: row.tag,
    logo: row.logo_url || '',
    captainId: row.captain_id,
    captainName: row.captain?.full_name || 'Capitán',
    captainEmail: row.captain?.email || undefined,
    prizeResponsibleUserId: row.captain_id,
    members: members.filter((member: any) => member.team_id === row.id).map((member: any) => ({
      id: member.user_id,
      name: member.profile?.full_name || 'Jugador',
      gamerTag: member.profile?.gamer_tag || '',
      avatar: member.profile?.avatar_url || undefined,
      role: member.member_role,
      joinedAt: member.joined_at,
      registeredTournamentIds: rosterEntries.filter((entry: any) => entry.user_id === member.user_id && !['rejected', 'cancelled'].includes(entry.registration?.status)).map((entry: any) => entry.registration?.tournament_id).filter(Boolean),
    })),
    status: row.status,
    paymentStatus: row.payment_status,
    registrationDate: row.created_at,
  }));

  const participants: Participant[] = registrations.filter((registration: any) => registration.status === 'confirmed').map((registration: any) => {
    const team = teams.find(item => item.id === registration.team_id);
    const profile = (profileResult.data ?? []).find((item: any) => item.id === registration.user_id) as any;
    return team ? {
      id: registration.id,
      tournamentId: registration.tournament_id,
      name: team.name,
      tag: team.tag,
      logo: team.logo,
      membersCount: rosterEntries.filter((entry: any) => entry.registration_id === registration.id).length || team.members.length,
      captain: team.captainName,
      captainId: team.captainId,
      status: 'confirmed' as const,
    } : {
      id: registration.id,
      tournamentId: registration.tournament_id,
      name: profile?.gamer_tag || profile?.full_name || 'Participante',
      tag: (profile?.gamer_tag || profile?.full_name || 'USR').slice(0, 5).toUpperCase(),
      logo: profile?.avatar_url || '',
      membersCount: 1,
      captain: profile?.full_name || profile?.gamer_tag || 'Jugador',
      captainId: registration.user_id,
      status: 'confirmed' as const,
    };
  });

  const matches: Match[] = (matchResult.data ?? []).map((row: any) => {
    const matchRegistrationIds = [row.registration_a_id,row.registration_b_id].filter(Boolean);
    const participantByOwner = registrations.some((registration:any)=>matchRegistrationIds.includes(registration.id)&&registration.user_id===userId);
    const participantByRoster = rosterEntries.some((entry:any)=>matchRegistrationIds.includes(entry.registration_id)&&entry.user_id===userId);
    return ({
    id: row.id,
    tournamentId: row.tournament_id,
    tournamentTitle: tournaments.find(tournament => tournament.id === row.tournament_id)?.title,
    roundName: row.round_name,
    teamA: { id: row.team_a?.id || row.registration_a?.id || '', name: row.team_a?.name || row.registration_a?.profile?.gamer_tag || row.registration_a?.profile?.full_name || 'Por definir', tag: row.team_a?.tag || 'JUG', logo: row.team_a?.logo_url || row.registration_a?.profile?.avatar_url || undefined, score: row.score_a, isWinner: row.status === 'finished' && row.score_a > row.score_b },
    teamB: { id: row.team_b?.id || row.registration_b?.id || '', name: row.team_b?.name || row.registration_b?.profile?.gamer_tag || row.registration_b?.profile?.full_name || (row.registration_a ? 'BYE' : 'Por definir'), tag: row.team_b?.tag || 'JUG', logo: row.team_b?.logo_url || row.registration_b?.profile?.avatar_url || undefined, score: row.score_b, isWinner: row.status === 'finished' && row.score_b > row.score_a },
    status: row.status,
    game: tournaments.find(tournament => tournament.id === row.tournament_id)?.game || '',
    time: row.scheduled_at ? new Date(row.scheduled_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : 'Por definir',
    date: row.scheduled_at || '',
    streamUrl: row.stream_url || undefined,
    bracketPosition: { round: Number(row.round_number || 1), matchIndex: Number(row.match_number || 1) },
    isUserManaged: Boolean(userId && tournaments.find(tournament=>tournament.id===row.tournament_id)?.organizerId===userId),
    isUserParticipant: Boolean(userId && (participantByOwner||participantByRoster)),
  }); });

  const transactions: Transaction[] = (transactionResult.data ?? []).map((row: any) => ({
    id: row.id,
    tournamentId: row.tournament_id,
    tournamentTitle: row.tournament?.title || 'Torneo',
    userId: row.user_id,
    userOrTeam: row.profile?.full_name || 'Usuario',
    teamCode: '',
    transactionId: row.provider_reference || row.id,
    date: row.created_at,
    amount: asNumber(row.amount),
    currency: row.currency,
    status: row.status,
    paymentMethod: row.payment_method || (row.provider_reference ? 'Proveedor externo' : 'Pendiente'),
    feeType: row.fee_type,
  }));

  const pendingApprovals: PendingApproval[] = registrations.filter((row: any) => row.status === 'pending' && row.team_id).map((row: any) => {
    const team = teams.find(item => item.id === row.team_id);
    const tournament = tournaments.find(item => item.id === row.tournament_id);
    return {
      id: row.id,
      tournamentId: row.tournament_id,
      tournamentTitle: tournament?.title || 'Torneo',
      teamId: row.team_id,
      teamName: team?.name || 'Equipo',
      captainName: team?.captainName || 'Capitán',
      captainEmail: team?.captainEmail || '',
      logo: team?.logo || '',
      requestedAgo: row.created_at,
      playersCount: team?.members.length || 0,
      game: tournament?.game || '',
    };
  });

  const users: AdminUserSummary[] = (profileResult.data ?? []).map((row: any) => ({ id: row.id, name: row.full_name || 'Usuario', email: row.email || '', role: row.global_role === 'admin' ? 'admin' : 'user', status: 'active' }));

  return { tournaments, teams, participants, matches, transactions, pendingApprovals, users };
}

// Los inputs datetime-local entregan "2026-08-25T18:00", sin zona horaria. Postgres
// interpreta ese texto como UTC al guardarlo en un timestamptz, así que la fecha
// acababa adelantándose tantas horas como el huso local (7 en Hermosillo) y un
// cierre de inscripciones puesto para hoy por la tarde nacía ya vencido.
// new Date() sí parsea la cadena como hora local, así que toISOString da el instante real.
function toInstant(localDateTime: string) {
  const parsed = new Date(localDateTime);
  return Number.isNaN(parsed.getTime()) ? localDateTime : parsed.toISOString();
}

export async function insertTournament(tournament: Tournament, organizerId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  if (tournament.status === 'draft') {
    const { data: reusableDraft } = await supabase.from('tournaments').select('id').eq('organizer_id', organizerId).eq('status', 'draft').eq('title', tournament.title).eq('base_prize_pool', tournament.basePrizePool).is('organizer_payment_intent_id', null).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (reusableDraft) return reusableDraft.id;
  }
  const { data, error } = await supabase.from('tournaments').insert({
    organizer_id: organizerId,
    title: tournament.title,
    description: tournament.description,
    banner_url: tournament.bannerUrl || null,
    category: tournament.category,
    game: tournament.game,
    game_mode: tournament.gameMode,
    game_config: tournament.gameConfig || {},
    format: tournament.format,
    status: tournament.status,
    access_type: tournament.accessType,
    location: tournament.location,
    stream: tournament.stream || null,
    start_date: toInstant(tournament.startDate),
    end_date: toInstant(tournament.endDate),
    registration_deadline: toInstant(tournament.registrationDeadline),
    participant_type: tournament.participantType,
    min_players_per_team: tournament.minPlayersPerTeam,
    max_participants: tournament.maxParticipants,
    entry_fee_type: tournament.entryFeeType,
    entry_fee_amount: tournament.entryFeeAmount,
    organizer_percentage: tournament.organizerPercentage,
    prize_type: tournament.prizeType,
    base_prize_pool: tournament.basePrizePool,
    prize_distribution: tournament.prizesBreakdown.map(({ place, percentage }) => ({ place, percentage })),
    organizer_funding_status: tournament.prizeType === 'monetary' && tournament.basePrizePool > 0 ? 'pending' : 'not_required',
    other_prize_description: tournament.otherPrizeDescription || null,
    rules: tournament.rules,
    sponsors: tournament.sponsors,
  }).select('id').single();
  if (error) throw error;
  void flushEmailOutbox();
  return data.id;
}

export async function updateTournamentSettings(tournamentId: string, settings: {
  title: string;
  description: string;
  bannerUrl: string;
  stream?: Tournament['stream'];
  organizerPercentage: number;
  status: Tournament['status'];
}) {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { error } = await supabase.from('tournaments').update({
    title: settings.title.trim(),
    description: settings.description.trim(),
    banner_url: settings.bannerUrl.trim() || null,
    stream: settings.stream || null,
    organizer_percentage: settings.organizerPercentage,
    status: settings.status,
  }).eq('id', tournamentId).select('id').single();
  if (error) throw error;
}

export async function deleteTournament(tournamentId: string) {
  if (!supabase) throw new Error('Supabase no está configurado.');
  // count: 'exact' distingue "se borró" de "la política RLS no encontró nada que borrar",
  // que sin el conteo devolvería éxito sin haber eliminado nada.
  const { error, count } = await supabase.from('tournaments').delete({ count: 'exact' }).eq('id', tournamentId);
  if (error) {
    // transactions y sponsor_contributions referencian el torneo con on delete restrict.
    if (error.code === '23503') throw new Error('Este torneo tiene pagos o aportaciones registradas, así que no puede eliminarse. Cancélalo en lugar de borrarlo.');
    throw error;
  }
  if (!count) throw new Error('No se eliminó el torneo: ya no existe o no tienes permiso para borrarlo.');
}

export async function createOrganizerPaymentIntent(tournamentId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data, error } = await supabase.functions.invoke('create-organizer-payment-intent', { body: { tournamentId } });
  if (error) {
    let message = error.message;
    try {
      const response = (error as { context?: Response }).context;
      const payload = response ? await response.clone().json() : null;
      if (payload?.error) message = payload.error;
    } catch { /* Response was not JSON. */ }
    throw new Error(message);
  }
  if (!data?.clientSecret) throw new Error('Stripe no devolvió el formulario de pago.');
  return data.clientSecret;
}

export async function waitForOrganizerFunding(tournamentId: string) {
  if (!supabase) throw new Error('Supabase no está configurado.');
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { data } = await supabase.from('tournaments').select('status, organizer_funding_status').eq('id', tournamentId).single();
    if (data?.organizer_funding_status === 'paid' && data.status === 'open') { void flushEmailOutbox(); return; }
    if (data?.organizer_funding_status === 'failed') throw new Error('Stripe marcó el pago como fallido.');
    await new Promise(resolve => window.setTimeout(resolve, 1500));
  }
  throw new Error('Stripe recibió el pago, pero la publicación sigue en validación. Actualiza en unos momentos.');
}

export async function insertRegistration(tournamentId: string, _userId: string, teamId?: string, status: 'pending' | 'confirmed' = 'confirmed', memberIds: string[] = []) {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { error } = await supabase.rpc('create_free_registration', { target_tournament_id: tournamentId, target_team_id: teamId || null, selected_member_ids: memberIds, requested_status: status });
  if (error) throw error;
  void flushEmailOutbox();
}

export async function insertTeam(tournamentId: string | undefined, captainId: string, name: string, tag: string, logoUrl?: string) {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data, error } = await supabase.from('teams').insert({ tournament_id: tournamentId || null, captain_id: captainId, name, tag, logo_url: logoUrl || null, status: 'confirmed', payment_status: 'unpaid' }).select('id').single();
  if (error?.code === '23505') throw new Error('Ese nombre o tag de equipo ya está registrado. Elige otro.');
  if (error) throw new Error(error.message);
  const { error: memberError } = await supabase.from('team_members').insert({ team_id: data.id, user_id: captainId, member_role: 'captain' });
  if (memberError) {
    await supabase.from('teams').delete().eq('id', data.id);
    throw memberError;
  }
  void flushEmailOutbox();
  return data.id;
}

export async function startPaidRegistration(tournamentId: string, teamId?: string): Promise<never> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data, error } = await supabase.functions.invoke('create-checkout-session', { body: { tournamentId, teamId } });
  if (error) {
    let message = error.message;
    try {
      const response = (error as { context?: Response }).context;
      const payload = response ? await response.clone().json() : null;
      if (payload?.error) message = payload.error;
    } catch { /* Supabase did not return a JSON error body. */ }
    throw new Error(message);
  }
  if (!data?.checkoutUrl || typeof data.checkoutUrl !== 'string' || !data.checkoutUrl.startsWith('https://checkout.stripe.com/')) throw new Error('Stripe no devolvió una página de pago válida.');
  window.location.assign(data.checkoutUrl);
  return await new Promise<never>(() => undefined);
}

export async function createRegistrationPaymentIntent(tournamentId: string, teamId?: string, memberIds: string[] = []) {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data, error } = await supabase.functions.invoke('create-registration-payment-intent', { body: { tournamentId, teamId, memberIds } });
  if (error) {
    let message = error.message;
    try {
      const response = (error as { context?: Response }).context;
      const payload = response ? await response.clone().json() : null;
      if (payload?.error) message = payload.error;
    } catch { /* Response was not JSON. */ }
    throw new Error(message);
  }
  if (!data?.clientSecret || !data?.paymentIntentId) throw new Error('Stripe no devolvió el formulario de pago.');
  return { clientSecret: data.clientSecret as string, paymentIntentId: data.paymentIntentId as string };
}

export async function waitForRegistrationPayment(paymentIntentId: string) {
  if (!supabase) throw new Error('Supabase no está configurado.');
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { data } = await supabase.from('transactions').select('status').eq('stripe_payment_intent_id', paymentIntentId).eq('fee_type', 'entry_fee').maybeSingle();
    if (data?.status === 'PAID') { void flushEmailOutbox(); return; }
    if (data?.status === 'FAILED') throw new Error('Stripe marcó el pago como fallido.');
    await new Promise(resolve => window.setTimeout(resolve, 1500));
  }
  throw new Error('El pago sigue en validación. Actualiza en unos momentos.');
}

export async function cancelTournamentRegistration(tournamentId: string): Promise<{ refunded: boolean }> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data, error } = await supabase.functions.invoke('cancel-registration', { body: { tournamentId } });
  if (error) {
    let message = error.message;
    try { const payload = await (error as { context?: Response }).context?.clone().json(); if (payload?.error) message = payload.error; } catch { /* response was not JSON */ }
    throw new Error(message);
  }
  return { refunded: Boolean(data?.refunded) };
}
