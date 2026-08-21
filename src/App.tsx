import React, { useEffect, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { ViewMode, Tournament, Participant, Transaction, PendingApproval, UserProfile, Team } from './types';
import { INITIAL_TOURNAMENTS, INITIAL_USER_PROFILE, INITIAL_TRANSACTIONS, INITIAL_PENDING_APPROVALS, INITIAL_MATCHES, INITIAL_PARTICIPANTS, INITIAL_TEAMS } from './data/mockData';
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
import { supabase } from './lib/supabase';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [selectedTournamentId, setSelectedTournamentId] = useState('neon-city-clash-2024');
  const [tournaments, setTournaments] = useState<Tournament[]>(INITIAL_TOURNAMENTS);
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>(INITIAL_PENDING_APPROVALS);
  const [matches, setMatches] = useState(INITIAL_MATCHES);
  const [participants, setParticipants] = useState<Participant[]>(INITIAL_PARTICIPANTS);
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setAuthUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) setShowAuthModal(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser) return;
    const metadata = authUser.user_metadata;
    setUserProfile(previous => ({
      ...previous,
      id: authUser.id,
      name: metadata.full_name || metadata.name || previous.name,
      gamerTag: metadata.preferred_username || metadata.user_name || metadata.full_name || previous.gamerTag,
      email: authUser.email || previous.email,
      avatarUrl: metadata.avatar_url || metadata.picture || previous.avatarUrl,
    }));
  }, [authUser]);

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
    setAuthUser(null);
    setCurrentView('home');
  };

  const handleNavigate = (view: ViewMode, tournamentId?: string) => {
    if (tournamentId) setSelectedTournamentId(tournamentId);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTournamentCreated = (tournament: Tournament) => {
    setTournaments(previous => [{ ...tournament, isUserOrganizing: true }, ...previous]);
    setSelectedTournamentId(tournament.id);
  };

  const handleRegister = (tournamentId: string, teamName: string, ign: string, type: 'team' | 'individual') => {
    setTournaments(previous => previous.map(t => t.id === tournamentId ? { ...t, participantsCount: Math.min(t.maxParticipants, t.participantsCount + 1), isUserRegistered: true } : t));
    setParticipants(previous => [{ id: `p-${Date.now()}`, name: teamName, tag: teamName.slice(0, 3).toUpperCase(), logo: '', captain: ign, membersCount: type === 'team' ? 5 : 1, status: 'confirmed' }, ...previous]);
  };

  const approveTeam = (id: string, teamName: string) => {
    setPendingApprovals(previous => previous.filter(item => item.id !== id));
    setTransactions(previous => [{ id: `tx-${Date.now()}`, tournamentId: selectedTournamentId, tournamentTitle: 'TournamentX', userId: 'approved-user', userOrTeam: teamName, teamCode: teamName.slice(0, 3).toUpperCase(), feeType: 'entry_fee', transactionId: `#TXN-${Date.now().toString().slice(-4)}`, date: 'Ahora', amount: 500, currency: 'MXN', status: 'PAID', paymentMethod: 'Stripe' }, ...previous]);
  };

  const updateScore = (matchId: string, scoreA: number, scoreB: number) => setMatches(previous => previous.map(match => match.id === matchId ? { ...match, teamA: { ...match.teamA, score: scoreA, isWinner: scoreA > scoreB }, teamB: { ...match.teamB, score: scoreB, isWinner: scoreB > scoreA }, status: scoreA >= 2 || scoreB >= 2 ? 'finished' as const : 'live' as const } : match));

  const deleteTournament = (id: string) => {
    const tournament = tournaments.find(item => item.id === id);
    if (!tournament) return { success: false, message: 'Torneo no encontrado.' };
    if (tournament.status === 'live') return { success: false, message: 'No se puede eliminar un torneo en curso.' };
    setTournaments(previous => previous.filter(item => item.id !== id));
    return { success: true, message: `El torneo “${tournament.title}” fue eliminado.` };
  };

  const deleteTeam = (id: string) => {
    const team = teams.find(item => item.id === id);
    if (!team) return { success: false, message: 'Equipo no encontrado.' };
    if (tournaments.some(t => t.id === team.tournamentId && t.status === 'live')) return { success: false, message: 'No se puede eliminar un equipo que compite en un torneo activo.' };
    setTeams(previous => previous.filter(item => item.id !== id));
    return { success: true, message: `El equipo “${team.name}” fue eliminado.` };
  };

  const currentTournament = tournaments.find(t => t.id === selectedTournamentId) || tournaments[0];

  return <div className="flex min-h-screen flex-col bg-white text-black selection:bg-black selection:text-white">
    <Navbar currentView={currentView} onNavigate={handleNavigate} user={userProfile} authUser={authUser} onSignIn={() => setShowAuthModal(true)} onSignOut={handleSignOut} />
    <main className="flex-1 bg-[#f5f6f8] text-black">
      {currentView === 'home' && <HomeView tournaments={tournaments} onNavigate={handleNavigate} />}
      {currentView === 'tournaments' && <ExploreTournamentsView tournaments={tournaments} onNavigate={handleNavigate} />}
      {currentView === 'tournament-detail' && <TournamentDetailView tournament={currentTournament} matches={matches} participants={participants} onNavigate={handleNavigate} onRegister={handleRegister} />}
      {currentView === 'create-tournament' && <CreateTournamentWizard onTournamentCreated={handleTournamentCreated} onNavigate={handleNavigate} />}
      {currentView === 'organizer-dashboard' && currentTournament.isUserOrganizing && <OrganizerDashboardView transactions={transactions} pendingApprovals={pendingApprovals} tournaments={tournaments.filter(t => t.isUserOrganizing)} matches={matches} participants={participants} onNavigate={handleNavigate} onApproveTeam={approveTeam} onRejectTeam={id => setPendingApprovals(p => p.filter(item => item.id !== id))} onUpdateMatchScore={updateScore} />}
      {currentView === 'profile' && <ProfileAthleteView user={userProfile} onUpdateUser={setUserProfile} onNavigate={handleNavigate} />}
      {currentView === 'teams' && <TeamsView participants={participants} onNavigate={handleNavigate} onCreateTeam={team => setParticipants(previous => [team, ...previous])} />}
      {currentView === 'matches' && <MatchesView matches={matches} onNavigate={handleNavigate} />}
      {currentView === 'admin-panel' && userProfile.globalRole === 'admin' && <AdminDashboardView tournaments={tournaments} teams={teams} transactions={transactions} currentUser={userProfile} onNavigate={handleNavigate} onDeleteTournament={deleteTournament} onUpdateUserStatus={() => undefined} onDeleteUser={() => undefined} onDeleteTeam={deleteTeam} />}
    </main>
    <footer className="border-t border-white/10 bg-black px-6 py-8 text-xs text-gray-400"><div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 sm:flex-row"><b className="text-base text-white">TOURNAMENTX</b><span>Esports y deportes competitivos · © 2026</span><div className="flex gap-5"><button onClick={() => handleNavigate('tournaments')}>Torneos</button><button onClick={() => handleNavigate('matches')}>Partidos</button><button onClick={() => handleNavigate('profile')}>Mi cuenta</button></div></div></footer>
    {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
  </div>;
}
