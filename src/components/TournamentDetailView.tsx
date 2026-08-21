import React, { useState } from 'react';
import { Tournament, Match, Participant, Team, UserProfile, ViewMode } from '../types';
import { Shield, Trophy, Share2, Sparkles, X, Check, Users, Calendar, ArrowLeft, Clock, Tv, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';
import { isRegistrationOpen, registrationClosedReason } from '../utils/tournamentAvailability';
import { getTeamRosterAvailability } from '../services/supabaseData';

function getStreamPresentation(stream?: Tournament['stream']) {
  if (!stream?.url) return null;
  try {
    const url = new URL(stream.url);
    if (url.protocol !== 'https:') return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (stream.platform === 'twitch' && host === 'twitch.tv') {
      const channel = url.pathname.split('/').filter(Boolean)[0];
      if (!channel || !/^[a-zA-Z0-9_]+$/.test(channel)) return { externalUrl: url.toString() };
      const parent = window.location.hostname || 'localhost';
      return { externalUrl: url.toString(), embedUrl: `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${encodeURIComponent(parent)}&autoplay=false` };
    }
    if (stream.platform === 'youtube' && (host === 'youtube.com' || host === 'youtu.be')) {
      const videoId = host === 'youtu.be' ? url.pathname.split('/').filter(Boolean)[0] : url.searchParams.get('v') || url.pathname.match(/\/(?:live|embed)\/([^/?]+)/)?.[1];
      if (!videoId || !/^[a-zA-Z0-9_-]+$/.test(videoId)) return { externalUrl: url.toString() };
      return { externalUrl: url.toString(), embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(videoId)}` };
    }
    return { externalUrl: url.toString() };
  } catch { return null; }
}

const formatLabels: Record<Tournament['format'], string> = {
  single_elim: 'Eliminación directa', double_elim: 'Doble eliminación',
  group_stage: 'Fase de grupos', groups_elim: 'Fase de grupos + eliminación',
  league: 'Liga por puntos', round_robin: 'Todos contra todos',
  battle_royale: 'Battle Royale', custom: 'Personalizado',
};

const setLabels = { bo1: 'Best of 1 (Bo1)', bo3: 'Best of 3 (Bo3)', bo5: 'Best of 5 (Bo5)' } as const;

interface TournamentDetailViewProps {
  tournament: Tournament;
  matches: Match[];
  participants: Participant[];
  teams: Team[];
  currentUser: UserProfile;
  onNavigate: (view: ViewMode, tournamentId?: string) => void;
  onRegister: (tournamentId: string, teamName: string, ign: string, type: 'team' | 'individual', teamId?: string, logoFile?: File, memberIds?: string[]) => Promise<'payment_pending' | 'confirmed'>;
  onLeaveRegistration: (tournamentId: string) => Promise<{ refunded: boolean }>;
}

export const TournamentDetailView: React.FC<TournamentDetailViewProps> = ({
  tournament,
  matches,
  participants,
  teams,
  currentUser,
  onNavigate,
  onRegister,
  onLeaveRegistration
}) => {
  const [activeTab, setActiveTab] = useState<'resumen' | 'bracket' | 'partidos' | 'participantes' | 'reglas' | 'premios'>('resumen');
  const [copiedLink, setCopiedLink] = useState(false);

  // Registration modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regType, setRegType] = useState<'team' | 'individual'>('team');
  const [regTeamName, setRegTeamName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('new');
  const [regTeamLogo, setRegTeamLogo] = useState<File | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberAvailability, setMemberAvailability] = useState<Record<string, boolean>>({});
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  const [leavingTournament, setLeavingTournament] = useState(false);
  const [leaveMessage, setLeaveMessage] = useState('');
  useEffect(()=>{if(!leaveMessage)return;const timer=window.setTimeout(()=>setLeaveMessage(''),5000);return()=>window.clearTimeout(timer);},[leaveMessage]);

  const handleLeaveTournament = async () => {
    if (!window.confirm('¿Seguro que quieres salir de este torneo? Si pagaste, se solicitará el reembolso en Stripe.')) return;
    setLeavingTournament(true);
    setLeaveMessage('');
    try {
      const result = await onLeaveRegistration(tournament.id);
      setLeaveMessage(result.refunded ? 'Saliste del torneo y Stripe procesó el reembolso.' : 'Saliste del torneo correctamente.');
    } catch (error) { setLeaveMessage(error instanceof Error ? error.message : 'No se pudo cancelar la inscripción.'); }
    finally { setLeavingTournament(false); }
  };

  const handleConfirmRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regType === 'team' && selectedTeamId === 'new' && !regTeamName.trim()) return;

    setRegistrationError('');
    try {
      const selectedTeam = teams.find(team => team.id === selectedTeamId);
      const rosterIds = regType === 'team' ? (selectedTeam ? selectedMemberIds : [currentUser.id]) : [];
      if (selectedTeam && rosterIds.length < tournament.minPlayersPerTeam) throw new Error(`Selecciona al menos ${tournament.minPlayersPerTeam} jugadores disponibles.`);
      const result = await onRegister(tournament.id, selectedTeam?.name || regTeamName, currentUser.gamerTag, regType, selectedTeam?.id, regTeamLogo || undefined, rosterIds);
      if (result === 'payment_pending') { setShowRegisterModal(false); return; }
      setRegistrationSuccess(true);
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
      setTimeout(() => { setShowRegisterModal(false); setRegistrationSuccess(false); }, 1500);
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : 'No se pudo completar la inscripción.');
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const tournamentMatches = matches.filter(m => m.tournamentId === tournament.id);
  const totalPrizePool = tournament.financials?.prizeAmount ?? tournament.basePrizePool;
  const registrationOpen = isRegistrationOpen(tournament);
  const streamPresentation = getStreamPresentation(tournament.stream);
  const captainTeams = teams.filter(team => team.captainId === currentUser.id);
  const selectedCaptainTeam = captainTeams.find(team => team.id === selectedTeamId);

  const detailTabs = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'bracket', label: 'Playoffs / Bracket' },
    { id: 'partidos', label: 'Partidos', badge: tournamentMatches.length },
    { id: 'participantes', label: 'Participantes', badge: participants.length },
    { id: 'reglas', label: 'Reglas' },
    { id: 'premios', label: 'Premios' },
  ];

  return (
    <div className="w-full min-h-screen bg-white text-black pb-16 font-['Golos_Text',sans-serif]">
      {/* Header Banner */}
      <div className="bg-black text-white py-10 px-4 md:px-8 border-b border-[#E5E7EB]">
        <div className="max-w-[1280px] mx-auto flex flex-col gap-4">
          <button 
            onClick={() => onNavigate('tournaments')}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 w-fit cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a torneos</span>
          </button>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {!registrationOpen ? (
                  <span className="px-3 py-1 rounded-full bg-white text-black text-[11px] font-black shadow-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-black animate-ping" />
                    {tournament.status === 'live' ? 'EN VIVO' : 'INSCRIPCIONES CERRADAS'}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-white text-black text-[11px] font-bold shadow-xs">
                    INSCRIPCIONES ABIERTAS
                  </span>
                )}
                <span className="px-3 py-1 rounded-full bg-gray-900 text-gray-300 border border-gray-800 text-xs font-bold">
                  {tournament.game} • {tournament.gameMode}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
                {tournament.title}
              </h1>

              <p className="text-xs sm:text-sm text-gray-400">
                Organizado por <span className="text-white font-bold">{tournament.organizer.name}</span> • {new Date(tournament.startDate).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={handleShare}
                className="px-4 py-2.5 rounded-full bg-transparent border border-gray-700 text-gray-300 hover:text-white hover:border-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Copiado' : 'Compartir'}</span>
              </button>

              {tournament.isUserOrganizing ? <button
                onClick={() => onNavigate('organizer-dashboard', tournament.id)}
                className="flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-black uppercase tracking-wider text-black transition hover:bg-gray-200"
              >
                <Shield className="h-4 w-4" />
                Administrar torneo
              </button> : tournament.isUserRegistered ? <button
                onClick={() => void handleLeaveTournament()}
                disabled={leavingTournament}
                className="rounded-full border border-red-400 bg-transparent px-6 py-2.5 text-xs font-black uppercase tracking-wider text-red-300 transition hover:bg-red-950 disabled:opacity-50"
              >
                {leavingTournament ? 'Saliendo…' : 'Salir del torneo'}
              </button> : registrationOpen ? <button
                onClick={() => {
                  setRegType(tournament.participantType);
                  setShowRegisterModal(true);
                }}
                className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-gray-200 active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-black" />
                <span>Inscribirme</span>
              </button> : <span className="rounded-full border border-white/30 px-5 py-2.5 text-xs font-bold text-white">Solo vista</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="bg-white border-b border-[#E5E7EB] py-4 px-4 md:px-8">
        <div className="max-w-[1280px] mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-3.5 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Premio Total</span>
            <span className="text-base font-black text-black">${totalPrizePool.toLocaleString()} MXN</span>
          </div>

          <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-3.5 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Entrada</span>
            <span className="text-base font-bold text-black">{tournament.entryFeeAmount === 0 ? 'Gratis' : `$${tournament.entryFeeAmount.toLocaleString()} MXN`}</span>
          </div>

          <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-3.5 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Participantes</span>
            <span className="text-base font-bold text-black">{tournament.participantsCount} / {tournament.maxParticipants} {tournament.participantType === 'individual' ? 'Jugadores' : 'Equipos'}</span>
          </div>

          <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-3.5 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Fechas</span>
            <span className="text-xs font-bold text-black truncate block mt-0.5">{new Date(tournament.startDate).toLocaleDateString('es-MX')} - {new Date(tournament.endDate).toLocaleDateString('es-MX')}</span>
          </div>
        </div>
      </div>

      {/* Main Content & Tabs */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-6">
        {!registrationOpen && tournament.status !== 'completed' && <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4"><p className="text-sm font-black text-amber-900">Las inscripciones han terminado</p><p className="mt-1 text-xs text-amber-800">{registrationClosedReason(tournament)} Ahora puedes seguir el torneo, consultar participantes, partidos y resultados.</p></div>}
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#E5E7EB] pb-3">
          {detailTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-[#E5E7EB] hover:border-black'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-white text-black' : 'bg-[#F3F4F6] text-black'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab 1: RESUMEN */}
        {activeTab === 'resumen' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] space-y-3 shadow-xs">
                <h2 className="text-base font-extrabold text-black">Información General</h2>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {tournament.description}
                </p>
              </div>

              {tournament.stream && streamPresentation && <div className="overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 p-5"><div className="flex items-center gap-3"><div className="rounded-xl bg-black p-2.5 text-white"><Tv className="h-5 w-5" /></div><div><h3 className="text-base font-extrabold">Transmisión oficial</h3><p className="text-xs text-gray-500">{tournament.stream.platform === 'twitch' ? 'Twitch' : 'YouTube'} · {tournament.stream.channelName || 'Canal oficial'}</p></div></div><a href={streamPresentation.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-black px-4 py-2 text-xs font-bold">Abrir transmisión <ExternalLink className="h-3.5 w-3.5" /></a></div>
                {streamPresentation.embedUrl ? <div className="aspect-video bg-black"><iframe src={streamPresentation.embedUrl} title={`Transmisión oficial de ${tournament.title}`} allowFullScreen allow="autoplay; fullscreen; picture-in-picture" className="h-full w-full border-0" /></div> : <div className="border-t bg-[#F9FAFB] p-5 text-xs text-gray-600">Este enlace no admite reproducción integrada, pero puedes abrir la transmisión en una pestaña nueva.</div>}
              </div>}

              <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] space-y-4 shadow-xs">
                <h3 className="text-base font-extrabold text-black">Formato de Competencia</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-3.5 rounded-2xl">
                    <span className="text-gray-500 block text-[10px] uppercase font-bold">Tipo de Llave</span>
                    <span className="text-black font-bold mt-0.5 block">{formatLabels[tournament.format]}</span>
                  </div>
                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-3.5 rounded-2xl">
                    <span className="text-gray-500 block text-[10px] uppercase font-bold">Modalidad</span>
                    <span className="text-black font-bold mt-0.5 block">{tournament.gameMode}</span>
                  </div>
                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-3.5 rounded-2xl">
                    <span className="text-gray-500 block text-[10px] uppercase font-bold">Clasificatorias</span>
                    <span className="text-black font-bold mt-0.5 block">{tournament.gameConfig ? setLabels[tournament.gameConfig.initialSetFormat] : 'Según reglamento'}</span>
                  </div>
                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-3.5 rounded-2xl">
                    <span className="text-gray-500 block text-[10px] uppercase font-bold">Gran Final</span>
                    <span className="text-black font-bold mt-0.5 block">{tournament.gameConfig ? setLabels[tournament.gameConfig.finalSetFormat] : 'Según reglamento'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] space-y-4 shadow-xs">
                <h3 className="text-base font-extrabold text-black">{tournament.isUserOrganizing ? 'Gestión del torneo' : 'Registro Inmediato'}</h3>
                {leaveMessage && <div role="status" className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-semibold"><span>{leaveMessage}</span><button aria-label="Cerrar aviso" onClick={()=>setLeaveMessage('')} className="px-2 text-base">×</button></div>}
                {tournament.isUserOrganizing ? <p className="text-xs text-gray-600">Como organizador administras esta competencia y no puedes inscribirte como participante. Usa el botón “Administrar torneo” de la parte superior para gestionar la competencia.</p> : tournament.isUserRegistered ? <><p className="text-xs text-gray-600">Tu inscripción está activa. Puedes salir antes de que comience el torneo.</p><button onClick={() => void handleLeaveTournament()} disabled={leavingTournament} className="w-full rounded-full border border-red-300 py-3 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">{leavingTournament ? 'Procesando…' : 'Salir del torneo'}</button></> : registrationOpen ? <>
                <p className="text-xs text-gray-600">{tournament.participantType === 'individual' ? 'Regístrate como jugador individual.' : 'Inscribe al equipo del que eres capitán.'}</p>
                {tournament.participantType === 'team' && <button
                  onClick={() => {
                    setRegType('team');
                    setShowRegisterModal(true);
                  }}
                  className="w-full py-3 rounded-full bg-black text-white font-bold text-xs hover:bg-gray-800 active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  Inscribir Equipo Completo
                </button>}
                {tournament.participantType === 'individual' && <button
                  onClick={() => {
                    setRegType('individual');
                    setShowRegisterModal(true);
                  }}
                  className="w-full py-3 rounded-full bg-white border border-[#E5E7EB] text-black font-bold text-xs hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Inscribirme como Agente Libre
                </button>}
                </> : <p className="rounded-xl bg-[#F9FAFB] p-4 text-xs font-semibold text-gray-600">Las inscripciones terminaron. Este torneo está disponible solo para seguimiento.</p>}
                </div>
              </div>
            </div>
        )}

        {/* Tab 2: BRACKET */}
        {activeTab === 'bracket' && (
          <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 overflow-x-auto shadow-xs">
            {tournamentMatches.length === 0 ? <div className="py-12 text-center text-xs text-gray-500">El organizador todavía no ha generado partidos para este torneo.</div> : <div className="min-w-[680px] grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{tournamentMatches.map(match => <div key={match.id} className="space-y-3 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-xs"><p className="border-b border-[#E5E7EB] pb-2 text-center font-bold">{match.roundName}</p><div className="flex justify-between"><span>{match.teamA.name}</span><b>{match.teamA.score ?? 0}</b></div><div className="flex justify-between text-gray-500"><span>{match.teamB.name}</span><b>{match.teamB.score ?? 0}</b></div></div>)}</div>}
          </div>
        )}

        {/* Tab 3: PARTIDOS */}
        {activeTab === 'partidos' && (
          <div className="space-y-3">
            {tournamentMatches.map(m => (
              <div key={m.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E7EB] flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-black">{m.roundName}</span>
                  <div className="text-xs text-black font-semibold">
                    <span>{m.teamA.name}</span> vs <span>{m.teamB.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-black">{m.teamA.score} - {m.teamB.score}</span>
                  <span className="px-2.5 py-1 rounded-full bg-[#F3F4F6] text-black text-[10px] font-bold">
                    {m.status === 'live' ? 'EN VIVO' : 'PROGRAMADO'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: PARTICIPANTES */}
        {activeTab === 'participantes' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {participants.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-2xl border border-[#E5E7EB] flex items-center gap-3">
                <div className="w-10 h-10 overflow-hidden rounded-xl bg-black text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {p.logo ? <img src={p.logo} alt={`Logo de ${p.name}`} className="h-full w-full object-cover" /> : p.tag || p.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-black truncate">{p.name}</h4>
                  <p className="text-[10px] text-gray-500 truncate">Capitán y responsable del premio: {p.captain || 'Sin asignar'} • {p.membersCount ?? 0} jugadores</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 5: REGLAS */}
        {activeTab === 'reglas' && (
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] space-y-4 text-xs text-black">
            <h3 className="text-base font-extrabold">Reglamento Oficial del Torneo</h3>
            {tournament.rules.length > 0 ? <ul className="list-disc pl-5 space-y-2 text-gray-600">{tournament.rules.map((rule, index) => <li key={`${index}-${rule}`}>{rule}</li>)}</ul> : <p className="text-gray-500">El organizador todavía no ha publicado reglas.</p>}
          </div>
        )}

        {/* Tab 6: PREMIOS */}
        {activeTab === 'premios' && <div className="space-y-4">
          {tournament.participantType === 'team' && <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 text-xs text-blue-950"><b>Premios por equipo:</b> cuando se confirme un equipo ganador, el premio quedará asociado al capitán registrado de ese equipo. Los demás integrantes no pueden cambiar al responsable ni solicitarlo por su cuenta.</div>}
          {tournament.prizeType === 'other' && <div className="rounded-3xl border border-amber-300 bg-amber-50 p-5 text-amber-950"><h3 className="font-black">Premio entregado por el organizador</h3><p className="mt-2 text-sm">{tournament.otherPrizeDescription || 'Premio externo pendiente de descripción.'}</p><p className="mt-3 text-xs"><b>Aviso:</b> este premio no monetario se entrega fuera de Stripe. TournamentX no lo custodia y no se responsabiliza si el organizador incumple su entrega.</p></div>}
          {tournament.entryFeeAmount > 0 && tournament.prizeType !== 'no_prize' && <div className="rounded-3xl border border-[#E5E7EB] bg-white p-5 text-xs text-gray-700"><p><b>Distribución del dinero:</b> el {tournament.organizerPercentage}% corresponde al organizador y el {100 - tournament.organizerPercentage}% restante queda destinado a los ganadores; no se entrega al organizador.</p>{tournament.financials && <p className="mt-2">Actualmente: organizador ${tournament.financials.organizerAmount.toLocaleString('es-MX')} MXN · ganadores ${tournament.financials.prizeAmount.toLocaleString('es-MX')} MXN.</p>}</div>}
          {tournament.prizesBreakdown.length > 0 ? <div className={`grid grid-cols-1 gap-4 ${tournament.prizesBreakdown.length > 1 ? 'sm:grid-cols-2' : ''} ${tournament.prizesBreakdown.length > 2 ? 'lg:grid-cols-3' : ''}`}>
            {tournament.prizesBreakdown.map((prize, index) => <div key={`${prize.place}-${index}`} className={`bg-white p-6 rounded-3xl text-center ${index === 0 ? 'border-2 border-black' : 'border border-[#E5E7EB]'}`}><span className="text-2xl">{['🏆', '🥈', '🥉'][index] || '🏅'}</span><h4 className="text-sm font-bold text-black mt-2">{prize.place}</h4><p className="text-xl font-black text-black mt-1">${prize.estimatedAmount.toLocaleString('es-MX')} MXN</p><p className="text-[11px] text-gray-500 mt-1">{prize.percentage}% de la bolsa neta de premios</p></div>)}
          </div> : tournament.prizeType === 'no_prize' ? <div className="rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] p-10 text-center"><h3 className="font-black">Este torneo no tiene premios</h3></div> : tournament.prizeType !== 'other' && <div className="rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] p-10 text-center"><h3 className="font-black">La bolsa todavía no tiene fondos confirmados</h3></div>}
        </div>}
      </div>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-black rounded-3xl max-w-md w-full p-6 border border-[#E5E7EB] shadow-2xl relative">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black text-sm font-bold cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-lg font-extrabold text-black mb-1">Inscripción al Torneo</h3>
            <p className="text-xs text-gray-500 mb-4">{tournament.title}</p>

            {registrationSuccess ? (
              <div className="bg-black text-white p-5 rounded-2xl text-center space-y-2">
                <Check className="w-8 h-8 mx-auto text-white" />
                <h4 className="font-bold text-sm">¡Inscripción Exitosa!</h4>
                <p className="text-xs text-gray-300">Tu equipo ha sido registrado en el bracket.</p>
              </div>
            ) : (
              <form onSubmit={handleConfirmRegistration} className="space-y-4">
                {registrationError && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{registrationError}</p>}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Tipo de Registro</label>
                  <div className="flex gap-2">
                    {tournament.participantType === 'team' &&
                    <button
                      type="button"
                      onClick={() => setRegType('team')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        regType === 'team' ? 'bg-black text-white' : 'bg-[#F3F4F6] text-black'
                      }`}
                    >
                      Equipo Completo
                    </button>}
                    {tournament.participantType === 'individual' &&
                    <button
                      type="button"
                      onClick={() => setRegType('individual')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        regType === 'individual' ? 'bg-black text-white' : 'bg-[#F3F4F6] text-black'
                      }`}
                    >
                      Agente Libre
                    </button>}
                  </div>
                </div>

                {regType === 'team' && (
                  <div className="space-y-3">
                    {captainTeams.length > 0 && <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Equipo que vas a inscribir</label><select value={selectedTeamId} onChange={event => { const teamId = event.target.value; setSelectedTeamId(teamId); setMemberAvailability({}); if (teamId === 'new') { setSelectedMemberIds([]); return; } const team = captainTeams.find(item => item.id === teamId); setLoadingRoster(true); void getTeamRosterAvailability(teamId, tournament.id).then(availability => { setMemberAvailability(availability); setSelectedMemberIds(team?.members.filter(member => !availability[member.id]).map(member => member.id) || []); }).catch(error => setRegistrationError(error instanceof Error ? error.message : 'No se pudo comprobar el roster.')).finally(() => setLoadingRoster(false)); }} className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 py-2.5 text-xs outline-none"><option value="new">Crear un equipo nuevo</option>{captainTeams.map(team => <option key={team.id} value={team.id}>{team.name} ({team.tag})</option>)}</select></div>}
                    {(captainTeams.length === 0 || selectedTeamId === 'new') && <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nombre del Equipo</label>
                      <input type="text" required placeholder="Ej: Sentinels Latam" value={regTeamName} onChange={(e) => setRegTeamName(e.target.value)} className="w-full bg-[#F9FAFB] border border-[#E5E7EB] focus:border-black rounded-xl px-3.5 py-2.5 text-xs text-black outline-none" />
                    </div>}
                    {(captainTeams.length === 0 || selectedTeamId === 'new') && <label className="block cursor-pointer rounded-xl border border-dashed border-gray-300 bg-[#F9FAFB] p-3 text-xs text-gray-600 hover:border-black">{regTeamLogo ? `Logo seleccionado: ${regTeamLogo.name}` : 'Agregar logo del equipo (opcional) · JPG, PNG o WebP · máximo 2 MB'}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={event => setRegTeamLogo(event.target.files?.[0] || null)} /></label>}
                    {selectedCaptainTeam && <div className="rounded-xl border border-gray-200 p-3"><p className="mb-2 text-xs font-black uppercase">Roster para este torneo ({selectedMemberIds.length} seleccionados)</p>{loadingRoster ? <p className="text-xs text-gray-500">Comprobando disponibilidad…</p> : <div className="space-y-2">{selectedCaptainTeam.members.map(member => { const unavailable = memberAvailability[member.id] ?? false; const isCaptain = member.id === selectedCaptainTeam.captainId; return <label key={member.id} className={`flex items-center justify-between gap-3 rounded-lg p-2 text-xs ${unavailable ? 'bg-red-50 text-red-700' : 'bg-gray-50'}`}><span><b>{member.gamerTag || member.name}</b>{isCaptain ? ' · Capitán' : ''}<small className="block font-normal">{unavailable ? 'Ya está inscrito en este torneo con otro equipo' : 'Disponible'}</small></span><input type="checkbox" disabled={unavailable || isCaptain} checked={selectedMemberIds.includes(member.id)} onChange={event => setSelectedMemberIds(previous => event.target.checked ? [...new Set([...previous, member.id])] : previous.filter(id => id !== member.id))} /></label>; })}</div>}<p className="mt-2 text-[11px] text-gray-500">El capitán siempre forma parte del roster. Puedes dejar fuera a otros miembros para esta inscripción.</p></div>}
                    <p className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-950">Solo puedes inscribir equipos donde eres capitán. Si el equipo gana, tú serás la persona responsable de recibir el premio.</p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">{regType === 'team' ? 'Capitán registrado' : 'Jugador registrado'}</label>
                  <div className="w-full rounded-xl border border-[#E5E7EB] bg-gray-100 px-3.5 py-2.5 text-xs font-bold text-black">{currentUser.gamerTag || currentUser.name} <span className="font-normal text-gray-500">({currentUser.name} · tú)</span></div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    className="flex-1 py-2.5 rounded-full border border-[#E5E7EB] text-xs text-gray-600 hover:bg-[#F3F4F6] font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-full bg-black text-white font-bold text-xs hover:bg-gray-800 active:scale-95 transition-all shadow-xs cursor-pointer"
                  >
                    Confirmar Registro
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
