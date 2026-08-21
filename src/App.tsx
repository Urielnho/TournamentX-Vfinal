import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { AdminUserSummary, Match, Participant, PendingApproval, Team, Tournament, Transaction, UserProfile, ViewMode } from './types';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { ExploreTournamentsView } from './components/ExploreTournamentsView';
import { TournamentDetailView } from './components/TournamentDetailView';
import { CreateTournamentWizard } from './components/CreateTournamentWizard';
import { OrganizerDashboardView } from './components/OrganizerDashboardView';
import { ProfileAthleteView } from './components/ProfileAthleteView';
import { TeamsView } from './components/TeamsView';
import { MatchesView } from './components/MatchesView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AuthModal } from './components/AuthModal';
import { OrganizerFundingPayment } from './components/OrganizerFundingPayment';
import { supabase } from './lib/supabase';
import { createRegistrationPaymentIntent, insertRegistration, insertTeam, insertTournament, loadAppData, updateTournamentSettings, waitForRegistrationPayment } from './services/supabaseData';

const EMPTY_PROFILE: UserProfile = {
  id: '', name: 'Visitante', gamerTag: 'Visitante', globalRole: 'user', rank: 'Sin clasificación', level: 0,
  avatarUrl: '', bannerUrl: '', email: '', totalWon: 0, pendingAmount: 0, gameAccounts: {},
  stats: { played: 0, won: 0, winRate: 0 }, recentMatches: [], financialHistory: [],
};

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState('');
  const [paymentNotice, setPaymentNotice] = useState('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [registrationPayment, setRegistrationPayment] = useState<{ clientSecret: string; paymentIntentId: string; amount: number; tournamentTitle: string } | null>(null);
  const dataRequestId = useRef(0);

  const refreshData = useCallback(async (userId?: string) => {
    const requestId = ++dataRequestId.current;
    setLoadingData(true);
    setDataError('');
    try {
      const data = await loadAppData(userId);
      if (requestId !== dataRequestId.current) return;
      setTournaments(data.tournaments);
      setTeams(data.teams);
      setParticipants(data.participants);
      setMatches(data.matches);
      setTransactions(data.transactions);
      setPendingApprovals(data.pendingApprovals);
      setUsers(data.users);
      setSelectedTournamentId(previous => previous || data.tournaments[0]?.id || '');
    } catch (error) {
      if (requestId !== dataRequestId.current) return;
      setDataError(error instanceof Error ? error.message : 'No se pudieron cargar los datos de Supabase.');
    } finally {
      if (requestId === dataRequestId.current) setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoadingData(false);
      setDataError('Supabase no está configurado.');
      return;
    }
    supabase.auth.getSession().then(({ data }) => { setAuthUser(data.session?.user ?? null); setAuthInitialized(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      setAuthInitialized(true);
      if (session?.user) setShowAuthModal(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authInitialized) return;
    void refreshData(authUser?.id);
    if (!authUser) {
      setUserProfile(EMPTY_PROFILE);
      return;
    }
    const metadata = authUser.user_metadata;
    setUserProfile(previous => ({ ...previous, id: authUser.id, name: metadata.full_name || metadata.name || 'Jugador', gamerTag: metadata.preferred_username || metadata.user_name || metadata.full_name || 'Jugador', email: authUser.email || '', avatarUrl: metadata.avatar_url || metadata.picture || '' }));
    supabase?.from('profiles').select('full_name, gamer_tag, avatar_url, global_role').eq('id', authUser.id).single().then(({ data }) => {
      if (!data) return;
      setUserProfile(previous => ({ ...previous, name: data.full_name || previous.name, gamerTag: data.gamer_tag || previous.gamerTag, avatarUrl: data.avatar_url || previous.avatarUrl, globalRole: data.global_role === 'admin' ? 'admin' : 'user' }));
    });
  }, [authInitialized, authUser, refreshData]);

  useEffect(() => {
    if (!authUser || !supabase) return;
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const sessionId = params.get('session_id');
    if (payment === 'cancelled') {
      setPaymentNotice('Pago cancelado. Tu inscripción aún no está confirmada.');
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    if (payment !== 'success' || !sessionId?.startsWith('cs_')) return;
    window.history.replaceState({}, '', window.location.pathname);
    let stopped = false;
    let attempts = 0;
    let timer: number | undefined;
    const poll = async () => {
      attempts += 1;
      const { data } = await supabase.from('transactions').select('status').eq('stripe_checkout_session_id', sessionId).maybeSingle();
      if (stopped) return;
      if (data?.status === 'PAID') {
        setPaymentNotice('Pago confirmado. Tu inscripción ya está registrada.');
        await refreshData(authUser.id);
      } else if (data?.status === 'FAILED') {
        setPaymentNotice('Stripe no pudo confirmar el pago. Inténtalo nuevamente.');
      } else if (attempts < 10) {
        setPaymentNotice('Pago recibido. Esperando confirmación segura de Stripe…');
        timer = window.setTimeout(poll, 2000);
      } else {
        setPaymentNotice('El pago sigue en validación. Actualiza la página en unos momentos.');
      }
    };
    void poll();
    return () => { stopped = true; if (timer) window.clearTimeout(timer); };
  }, [authUser, refreshData]);

  const requireSession = () => { if (authUser) return true; setShowAuthModal(true); return false; };
  const handleSignOut = async () => { await supabase?.auth.signOut(); setAuthUser(null); setCurrentView('home'); };
  const handleNavigate = (view: ViewMode, tournamentId?: string) => {
    if (['create-tournament', 'organizer-dashboard', 'profile'].includes(view) && !requireSession()) return;
    if (tournamentId) setSelectedTournamentId(tournamentId);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTournamentCreated = async (tournament: Tournament) => {
    if (!authUser) throw new Error('Inicia sesión para publicar un torneo.');
    const id = await insertTournament(tournament, authUser.id);
    await refreshData(authUser.id);
    setSelectedTournamentId(id);
    return { ...tournament, id, organizerId: authUser.id, organizer: { name: userProfile.name, avatar: userProfile.avatarUrl }, isUserOrganizing: true };
  };

  const handleRegister = async (tournamentId: string, teamName: string, _ign: string, type: 'team' | 'individual') => {
    if (!authUser) { setShowAuthModal(true); throw new Error('Inicia sesión para inscribirte.'); }
    const tournament = tournaments.find(item => item.id === tournamentId);
    if (!tournament) throw new Error('El torneo ya no está disponible.');
    if (tournament.organizerId === authUser.id) throw new Error('El organizador no puede participar en su propio torneo.');
    if (type !== tournament.participantType) throw new Error(tournament.participantType === 'individual' ? 'Este torneo solo acepta inscripciones individuales.' : 'Este torneo solo acepta inscripciones por equipo.');
    const existingTeam = type === 'team' ? teams.find(team => team.tournamentId === tournamentId && team.captainId === authUser.id && team.name.toLowerCase() === teamName.trim().toLowerCase()) : undefined;
    const teamId = type === 'team' ? existingTeam?.id || await insertTeam(tournamentId, authUser.id, teamName, teamName.slice(0, 5).toUpperCase()) : undefined;
    if (tournament.entryFeeType !== 'free' && tournament.entryFeeAmount > 0) {
      const payment = await createRegistrationPaymentIntent(tournamentId, teamId);
      setRegistrationPayment({ ...payment, amount: tournament.entryFeeAmount, tournamentTitle: tournament.title });
      return 'payment_pending' as const;
    }
    await insertRegistration(tournamentId, authUser.id, teamId, tournament?.accessType === 'private' ? 'pending' : 'confirmed');
    await refreshData(authUser.id);
    return 'confirmed' as const;
  };

  const handleRegistrationPaid = async () => {
    if (!registrationPayment) return;
    await waitForRegistrationPayment(registrationPayment.paymentIntentId);
    setRegistrationPayment(null);
    setPaymentNotice('Pago confirmado. Tu inscripción ya está registrada.');
    await refreshData(authUser?.id);
  };

  const handleCreateTeam = async (tournamentId: string, name: string, tag: string) => {
    if (!authUser) { setShowAuthModal(true); throw new Error('Inicia sesión para crear un equipo.'); }
    await insertTeam(tournamentId, authUser.id, name, tag);
    await refreshData(authUser.id);
  };

  const approveTeam = async (id: string) => { if (!supabase) return; await supabase.from('registrations').update({ status: 'confirmed' }).eq('id', id); await refreshData(authUser?.id); };
  const rejectTeam = async (id: string) => { if (!supabase) return; await supabase.from('registrations').update({ status: 'rejected' }).eq('id', id); await refreshData(authUser?.id); };
  const updateScore = async (matchId: string, scoreA: number, scoreB: number) => { if (!supabase) return; await supabase.from('matches').update({ score_a: scoreA, score_b: scoreB, status: scoreA > 0 || scoreB > 0 ? 'finished' : 'upcoming' }).eq('id', matchId); await refreshData(authUser?.id); };
  const saveTournamentSettings = async (tournamentId: string, settings: Parameters<typeof updateTournamentSettings>[1]) => { await updateTournamentSettings(tournamentId, settings); await refreshData(authUser?.id); };
  const updateProfile = async (profile: UserProfile) => {
    if (supabase && authUser) {
      const { error } = await supabase.from('profiles').update({ full_name: profile.name, gamer_tag: profile.gamerTag, avatar_url: profile.avatarUrl || null }).eq('id', authUser.id);
      if (error) throw error;
    }
    setUserProfile(profile);
  };

  const deleteTournament = (id: string) => {
    const tournament = tournaments.find(item => item.id === id);
    if (!tournament) return { success: false, message: 'Torneo no encontrado.' };
    if (tournament.status === 'live') return { success: false, message: 'No se puede eliminar un torneo en curso.' };
    void supabase?.from('tournaments').delete().eq('id', id).then(() => refreshData(authUser?.id));
    return { success: true, message: `El torneo “${tournament.title}” fue eliminado.` };
  };
  const deleteTeam = (id: string) => {
    const team = teams.find(item => item.id === id);
    if (!team) return { success: false, message: 'Equipo no encontrado.' };
    if (tournaments.some(t => t.id === team.tournamentId && t.status === 'live')) return { success: false, message: 'No se puede eliminar un equipo que compite en un torneo activo.' };
    void supabase?.from('teams').delete().eq('id', id).then(() => refreshData(authUser?.id));
    return { success: true, message: `El equipo “${team.name}” fue eliminado.` };
  };

  const currentTournament = tournaments.find(tournament => tournament.id === selectedTournamentId);
  const currentParticipants = participants.filter(participant => !participant.tournamentId || participant.tournamentId === selectedTournamentId);
  const teamCards: Participant[] = teams.map(team => ({ id: team.id, tournamentId: team.tournamentId, name: team.name, tag: team.tag, logo: team.logo, captain: team.captainName, captainId: team.captainId, membersCount: team.members.length, status: team.status === 'confirmed' ? 'confirmed' : 'pending' }));

  return <div className="flex min-h-screen flex-col bg-white text-black selection:bg-black selection:text-white">
    <Navbar currentView={currentView} onNavigate={handleNavigate} user={userProfile} authUser={authUser} onSignIn={() => setShowAuthModal(true)} onSignOut={handleSignOut} searchQuery={globalSearchQuery} onSearchQueryChange={setGlobalSearchQuery} onSearchSubmit={() => handleNavigate('tournaments')} />
    <main className="flex-1 bg-[#f5f6f8] text-black">
      {dataError && <div className="mx-auto mt-4 max-w-4xl rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700">{dataError}</div>}
      {paymentNotice && <div className="mx-auto mt-4 flex max-w-4xl items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold"><span>{paymentNotice}</span><button onClick={() => setPaymentNotice('')} className="text-xs text-gray-500">Cerrar</button></div>}
      {loadingData && <div className="mx-auto max-w-4xl px-6 py-4 text-center text-xs font-bold text-gray-500">Cargando datos de TournamentX…</div>}
      {currentView === 'home' && <HomeView tournaments={tournaments} onNavigate={handleNavigate} />}
      {currentView === 'tournaments' && <ExploreTournamentsView tournaments={tournaments} onNavigate={handleNavigate} searchQuery={globalSearchQuery} onSearchQueryChange={setGlobalSearchQuery} />}
      {currentView === 'tournament-detail' && (currentTournament ? <TournamentDetailView tournament={currentTournament} matches={matches} participants={currentParticipants} onNavigate={handleNavigate} onRegister={handleRegister} /> : <EmptyState message="Este torneo no existe o ya no está disponible." onBack={() => handleNavigate('tournaments')} />)}
      {currentView === 'create-tournament' && authUser && <CreateTournamentWizard onTournamentCreated={handleTournamentCreated} onTournamentPublished={async tournamentId => { await refreshData(authUser.id); setSelectedTournamentId(tournamentId); }} onNavigate={handleNavigate} />}
      {currentView === 'organizer-dashboard' && currentTournament?.isUserOrganizing && <OrganizerDashboardView transactions={transactions.filter(transaction => transaction.tournamentId === currentTournament.id)} pendingApprovals={pendingApprovals.filter(item => item.tournamentId === currentTournament.id)} tournaments={tournaments.filter(t => t.isUserOrganizing)} matches={matches.filter(match => match.tournamentId === currentTournament.id)} participants={currentParticipants} onNavigate={handleNavigate} onApproveTeam={id => void approveTeam(id)} onRejectTeam={id => void rejectTeam(id)} onUpdateMatchScore={(id, a, b) => void updateScore(id, a, b)} onUpdateTournamentSettings={saveTournamentSettings} />}
      {currentView === 'profile' && authUser && <ProfileAthleteView user={userProfile} onUpdateUser={profile => void updateProfile(profile)} onNavigate={handleNavigate} />}
      {currentView === 'teams' && <TeamsView participants={teamCards} tournaments={tournaments} onNavigate={handleNavigate} onCreateTeam={handleCreateTeam} />}
      {currentView === 'matches' && <MatchesView matches={matches} onNavigate={handleNavigate} />}
      {currentView === 'admin-panel' && userProfile.globalRole === 'admin' && <AdminDashboardView tournaments={tournaments} teams={teams} transactions={transactions} users={users} currentUser={userProfile} onNavigate={handleNavigate} onDeleteTournament={deleteTournament} onUpdateUserStatus={() => undefined} onDeleteUser={() => undefined} onDeleteTeam={deleteTeam} />}
    </main>
    <footer className="border-t border-white/10 bg-black px-6 py-8 text-xs text-gray-400"><div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 sm:flex-row"><b className="text-base text-white">TOURNAMENTX</b><span>Esports y deportes competitivos · © 2026</span><div className="flex gap-5"><button onClick={() => handleNavigate('tournaments')}>Torneos</button><button onClick={() => handleNavigate('matches')}>Partidos</button><button onClick={() => handleNavigate('profile')}>Mi cuenta</button></div></div></footer>
    {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    {registrationPayment && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"><div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"><button onClick={() => setRegistrationPayment(null)} className="absolute right-5 top-4 text-xl text-gray-500" aria-label="Cerrar pago">×</button><h2 className="pr-8 text-xl font-black">Paga tu inscripción</h2><p className="mb-5 text-sm text-gray-500">{registrationPayment.tournamentTitle}</p><OrganizerFundingPayment clientSecret={registrationPayment.clientSecret} amount={registrationPayment.amount} buttonLabel={`Pagar $${registrationPayment.amount.toLocaleString()} MXN e inscribirme`} onPaid={handleRegistrationPaid} /></div></div>}
  </div>;
}

const EmptyState: React.FC<{ message: string; onBack: () => void }> = ({ message, onBack }) => <div className="mx-auto max-w-xl px-6 py-24 text-center"><h2 className="text-2xl font-black">Sin información disponible</h2><p className="mt-2 text-sm text-gray-500">{message}</p><button onClick={onBack} className="mt-6 rounded-full bg-black px-6 py-3 text-sm font-bold text-white">Volver a torneos</button></div>;
