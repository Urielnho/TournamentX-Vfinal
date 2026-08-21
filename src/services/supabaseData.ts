import { AdminUserSummary, Match, Participant, PendingApproval, Team, Tournament, Transaction } from '../types';
import { supabase } from '../lib/supabase';

const defaultBanner = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1400&q=80';

const asNumber = (value: unknown) => Number(value ?? 0);

export interface AppDatabaseData {
  tournaments: Tournament[];
  teams: Team[];
  participants: Participant[];
  matches: Match[];
  transactions: Transaction[];
  pendingApprovals: PendingApproval[];
  users: AdminUserSummary[];
}

export async function loadAppData(userId?: string): Promise<AppDatabaseData> {
  if (!supabase) return { tournaments: [], teams: [], participants: [], matches: [], transactions: [], pendingApprovals: [], users: [] };

  const [tournamentResult, teamResult, memberResult, registrationResult, matchResult, transactionResult, profileResult, countResult] = await Promise.all([
    supabase.from('tournaments').select('*, organizer:profiles!tournaments_organizer_id_fkey(full_name, avatar_url)').order('created_at', { ascending: false }),
    supabase.from('teams').select('*, captain:profiles!teams_captain_id_fkey(full_name, email)').order('created_at', { ascending: false }),
    supabase.from('team_members').select('team_id, user_id, member_role, joined_at, profile:profiles!team_members_user_id_fkey(full_name, gamer_tag, avatar_url)'),
    supabase.from('registrations').select('id, tournament_id, user_id, team_id, status, created_at'),
    supabase.from('matches').select('*, team_a:teams!matches_team_a_id_fkey(id, name, tag, logo_url), team_b:teams!matches_team_b_id_fkey(id, name, tag, logo_url)').order('scheduled_at', { ascending: true }),
    userId ? supabase.from('transactions').select('*, tournament:tournaments(title), profile:profiles(full_name)').order('created_at', { ascending: false }) : Promise.resolve({ data: [], error: null }),
    userId ? supabase.from('profiles').select('id, email, full_name, gamer_tag, avatar_url, global_role').order('created_at', { ascending: false }) : Promise.resolve({ data: [], error: null }),
    supabase.rpc('tournament_registration_counts'),
  ]);

  const firstError = [tournamentResult, teamResult, memberResult, registrationResult, matchResult, transactionResult, profileResult, countResult].find(result => result.error)?.error;
  if (firstError) throw firstError;

  const registrations = registrationResult.data ?? [];
  const registrationCounts = countResult.data ?? [];
  const members = memberResult.data ?? [];
  const tournaments: Tournament[] = (tournamentResult.data ?? []).map((row: any) => {
    const tournamentRegistrations = registrations.filter((registration: any) => registration.tournament_id === row.id && !['rejected', 'cancelled'].includes(registration.status));
    const projectedPool = asNumber(row.base_prize_pool) + (row.entry_fee_type === 'free' ? 0 : tournamentRegistrations.length * asNumber(row.entry_fee_amount));
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      bannerUrl: row.banner_url || defaultBanner,
      category: row.category,
      game: row.game,
      gameMode: row.game_mode,
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
      basePrizePool: asNumber(row.base_prize_pool),
      otherPrizeDescription: row.other_prize_description ?? undefined,
      sponsors: Array.isArray(row.sponsors) ? row.sponsors : [],
      rules: Array.isArray(row.rules) ? row.rules : [],
      prizesBreakdown: projectedPool > 0 ? [{ place: '1.º', percentage: 100, estimatedAmount: projectedPool }] : [],
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
      membersCount: team.members.length,
      captain: team.captainName,
      captainId: team.captainId,
      status: 'confirmed' as const,
    } : {
      id: registration.id,
      tournamentId: registration.tournament_id,
      name: profile?.full_name || 'Participante',
      tag: (profile?.gamer_tag || profile?.full_name || 'USR').slice(0, 5).toUpperCase(),
      logo: profile?.avatar_url || '',
      membersCount: 1,
      captainId: registration.user_id,
      status: 'confirmed' as const,
    };
  });

  const matches: Match[] = (matchResult.data ?? []).map((row: any) => ({
    id: row.id,
    tournamentId: row.tournament_id,
    tournamentTitle: tournaments.find(tournament => tournament.id === row.tournament_id)?.title,
    roundName: row.round_name,
    teamA: { id: row.team_a?.id || '', name: row.team_a?.name || 'Por definir', tag: row.team_a?.tag || 'TBD', logo: row.team_a?.logo_url || undefined, score: row.score_a, isWinner: row.status === 'finished' && row.score_a > row.score_b },
    teamB: { id: row.team_b?.id || '', name: row.team_b?.name || 'Por definir', tag: row.team_b?.tag || 'TBD', logo: row.team_b?.logo_url || undefined, score: row.score_b, isWinner: row.status === 'finished' && row.score_b > row.score_a },
    status: row.status,
    game: tournaments.find(tournament => tournament.id === row.tournament_id)?.game || '',
    time: row.scheduled_at ? new Date(row.scheduled_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : 'Por definir',
    date: row.scheduled_at || '',
    streamUrl: row.stream_url || undefined,
  }));

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
    paymentMethod: row.provider_reference ? 'Proveedor externo' : 'Pendiente',
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

export async function insertTournament(tournament: Tournament, organizerId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data, error } = await supabase.from('tournaments').insert({
    organizer_id: organizerId,
    title: tournament.title,
    description: tournament.description,
    banner_url: tournament.bannerUrl || null,
    category: tournament.category,
    game: tournament.game,
    game_mode: tournament.gameMode,
    format: tournament.format,
    status: tournament.status,
    access_type: tournament.accessType,
    location: tournament.location,
    stream: tournament.stream || null,
    start_date: tournament.startDate,
    end_date: tournament.endDate,
    registration_deadline: tournament.registrationDeadline,
    participant_type: tournament.participantType,
    min_players_per_team: tournament.minPlayersPerTeam,
    max_participants: tournament.maxParticipants,
    entry_fee_type: tournament.entryFeeType,
    entry_fee_amount: tournament.entryFeeAmount,
    organizer_percentage: tournament.organizerPercentage,
    prize_type: tournament.prizeType,
    base_prize_pool: tournament.basePrizePool,
    other_prize_description: tournament.otherPrizeDescription || null,
    rules: tournament.rules,
    sponsors: tournament.sponsors,
  }).select('id').single();
  if (error) throw error;
  return data.id;
}

export async function insertRegistration(tournamentId: string, userId: string, teamId?: string, status: 'pending' | 'confirmed' = 'confirmed') {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { error } = await supabase.from('registrations').insert({ tournament_id: tournamentId, user_id: userId, team_id: teamId || null, status });
  if (error) throw error;
}

export async function insertTeam(tournamentId: string, captainId: string, name: string, tag: string) {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data, error } = await supabase.from('teams').insert({ tournament_id: tournamentId, captain_id: captainId, name, tag, status: 'confirmed', payment_status: 'unpaid' }).select('id').single();
  if (error) throw error;
  await supabase.from('team_members').insert({ team_id: data.id, user_id: captainId, member_role: 'captain' });
  return data.id;
}
