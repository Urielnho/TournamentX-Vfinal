import React, { useState } from 'react';
import { Tournament, Match, Participant, ViewMode } from '../types';
import { Shield, Trophy, Share2, Sparkles, X, Check, Users, Calendar, ArrowLeft, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TournamentDetailViewProps {
  tournament: Tournament;
  matches: Match[];
  participants: Participant[];
  onNavigate: (view: ViewMode, tournamentId?: string) => void;
  onRegister: (tournamentId: string, teamName: string, ign: string, type: 'team' | 'individual') => void;
}

export const TournamentDetailView: React.FC<TournamentDetailViewProps> = ({
  tournament,
  matches,
  participants,
  onNavigate,
  onRegister
}) => {
  const [activeTab, setActiveTab] = useState<'resumen' | 'bracket' | 'partidos' | 'participantes' | 'reglas' | 'premios'>('resumen');
  const [copiedLink, setCopiedLink] = useState(false);

  // Registration modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regType, setRegType] = useState<'team' | 'individual'>('team');
  const [regTeamName, setRegTeamName] = useState('');
  const [regPlayerIgn, setRegPlayerIgn] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleConfirmRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (regType === 'team' && !regTeamName.trim()) return;
    if (!regPlayerIgn.trim()) return;

    onRegister(tournament.id, regTeamName || `${regPlayerIgn} Squad`, regPlayerIgn, regType);
    setRegistrationSuccess(true);
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.6 }
    });

    setTimeout(() => {
      setShowRegisterModal(false);
      setRegistrationSuccess(false);
    }, 1500);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const tournamentMatches = matches.filter(m => m.tournamentId === tournament.id || m.tournamentId === 'neon-city-clash-2024');
  const totalPrizePool = tournament.basePrizePool + tournament.sponsors.reduce((total, sponsor) => total + sponsor.contribution, 0);

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
                {tournament.status === 'live' ? (
                  <span className="px-3 py-1 rounded-full bg-white text-black text-[11px] font-black shadow-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-black animate-ping" />
                    EN VIVO
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
                Organizado por <span className="text-white font-bold">{tournament.organizer.name}</span> • {tournament.startDate}
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
              </button> : <button 
                onClick={() => {
                  setRegType('team');
                  setShowRegisterModal(true);
                }}
                className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-gray-200 active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-black" />
                <span>Inscribirme</span>
              </button>}
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
            <span className="text-base font-bold text-black">{tournament.participantsCount} / {tournament.maxParticipants} Equipos</span>
          </div>

          <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-3.5 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Fechas</span>
            <span className="text-xs font-bold text-black truncate block mt-0.5">{tournament.startDate} - {tournament.endDate}</span>
          </div>
        </div>
      </div>

      {/* Main Content & Tabs */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-6">
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

              <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] space-y-4 shadow-xs">
                <h3 className="text-base font-extrabold text-black">Formato de Competencia</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-3.5 rounded-2xl">
                    <span className="text-gray-500 block text-[10px] uppercase font-bold">Tipo de Llave</span>
                    <span className="text-black font-bold mt-0.5 block">Double Elimination</span>
                  </div>
                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-3.5 rounded-2xl">
                    <span className="text-gray-500 block text-[10px] uppercase font-bold">Modalidad</span>
                    <span className="text-black font-bold mt-0.5 block">{tournament.minPlayersPerTeam}v{tournament.minPlayersPerTeam} ({tournament.gameMode})</span>
                  </div>
                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-3.5 rounded-2xl">
                    <span className="text-gray-500 block text-[10px] uppercase font-bold">Clasificatorias</span>
                    <span className="text-black font-bold mt-0.5 block">Best of 3 (Bo3)</span>
                  </div>
                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-3.5 rounded-2xl">
                    <span className="text-gray-500 block text-[10px] uppercase font-bold">Gran Final</span>
                    <span className="text-black font-bold mt-0.5 block">Best of 5 (Bo5)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] space-y-4 shadow-xs">
                <h3 className="text-base font-extrabold text-black">Registro Inmediato</h3>
                <p className="text-xs text-gray-600">
                  Inscribe a tu equipo o súmate a la bolsa de agentes libres.
                </p>
                <button 
                  onClick={() => {
                    setRegType('team');
                    setShowRegisterModal(true);
                  }}
                  className="w-full py-3 rounded-full bg-black text-white font-bold text-xs hover:bg-gray-800 active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  Inscribir Equipo Completo
                </button>
                <button 
                  onClick={() => {
                    setRegType('individual');
                    setShowRegisterModal(true);
                  }}
                  className="w-full py-3 rounded-full bg-white border border-[#E5E7EB] text-black font-bold text-xs hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Inscribirme como Agente Libre
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: BRACKET */}
        {activeTab === 'bracket' && (
          <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 overflow-x-auto shadow-xs">
            <div className="min-w-[760px] grid grid-cols-3 gap-6">
              {/* Cuartos */}
              <div className="space-y-4">
                <div className="text-center font-bold text-xs text-black pb-2 border-b border-[#E5E7EB]">
                  Cuartos de Final (Bo3)
                </div>
                {tournamentMatches.slice(0, 2).map((m) => (
                  <div key={m.id} className="bg-[#F9FAFB] rounded-2xl p-3 border border-[#E5E7EB] space-y-2 text-xs">
                    <div className="flex justify-between items-center font-bold text-black">
                      <span>{m.teamA.name}</span>
                      <span className="font-black">{m.teamA.score}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-500">
                      <span>{m.teamB.name}</span>
                      <span>{m.teamB.score}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Semifinales */}
              <div className="space-y-4">
                <div className="text-center font-bold text-xs text-black pb-2 border-b border-[#E5E7EB]">
                  Semifinales (Bo3)
                </div>
                <div className="bg-[#F9FAFB] rounded-2xl p-3 border border-[#E5E7EB] space-y-2 text-xs">
                  <div className="flex justify-between items-center font-bold text-black">
                    <span>Cloud9 Apex</span>
                    <span className="font-black">2</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500">
                    <span>Sentinels Latam</span>
                    <span>1</span>
                  </div>
                </div>
              </div>

              {/* Gran Final */}
              <div className="space-y-4">
                <div className="text-center font-bold text-xs text-black pb-2 border-b border-[#E5E7EB]">
                  Gran Final (Bo5)
                </div>
                <div className="bg-black text-white rounded-2xl p-4 border border-gray-800 space-y-3 text-xs shadow-xs">
                  <div className="flex justify-between items-center font-bold text-white">
                    <span>Cloud9 Apex</span>
                    <span className="text-sm font-black">3</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-400">
                    <span>Sentinels Latam</span>
                    <span className="text-sm">2</span>
                  </div>
                  <div className="pt-2 border-t border-gray-800 text-[10px] text-gray-300 text-center font-bold">
                    ¡Cloud9 Campeón! ($6,000 USD)
                  </div>
                </div>
              </div>
            </div>
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
                <div className="w-10 h-10 rounded-xl bg-black text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {p.tag || p.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-black truncate">{p.name}</h4>
                  <p className="text-[10px] text-gray-500 truncate">Capitán: {p.captain || 'Asignado'} • {p.membersCount || 5} Jugadores</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 5: REGLAS */}
        {activeTab === 'reglas' && (
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] space-y-4 text-xs text-black">
            <h3 className="text-base font-extrabold">Reglamento Oficial del Torneo</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Todos los jugadores deben estar presentes 15 minutos antes de la hora pactada para el check-in.</li>
              <li>El uso de software de terceros para obtener ventajas injustas (cheats/hacks) resultará en descalificación inmediata.</li>
              <li>Ambos capitanes deben subir captura de pantalla de los resultados de cada mapa.</li>
              <li>Las pausas técnicas están limitadas a un máximo de 5 minutos por equipo por mapa.</li>
            </ul>
          </div>
        )}

        {/* Tab 6: PREMIOS */}
        {activeTab === 'premios' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-3xl border-2 border-black text-center">
              <span className="text-2xl">🏆</span>
              <h4 className="text-sm font-bold text-black mt-2">1er Lugar</h4>
              <p className="text-xl font-black text-black mt-1">${tournament.prizesBreakdown[0]?.estimatedAmount.toLocaleString() || '0'} MXN</p>
              <p className="text-[11px] text-gray-500 mt-1">60% de la bolsa total</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] text-center">
              <span className="text-2xl">🥈</span>
              <h4 className="text-sm font-bold text-black mt-2">2do Lugar</h4>
              <p className="text-xl font-black text-black mt-1">${tournament.prizesBreakdown[1]?.estimatedAmount.toLocaleString() || '0'} MXN</p>
              <p className="text-[11px] text-gray-500 mt-1">30% de la bolsa total</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] text-center">
              <span className="text-2xl">🥉</span>
              <h4 className="text-sm font-bold text-black mt-2">3er Lugar</h4>
              <p className="text-xl font-black text-black mt-1">${tournament.prizesBreakdown[2]?.estimatedAmount.toLocaleString() || '0'} MXN</p>
              <p className="text-[11px] text-gray-500 mt-1">10% de la bolsa total</p>
            </div>
          </div>
        )}
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
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Tipo de Registro</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRegType('team')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        regType === 'team' ? 'bg-black text-white' : 'bg-[#F3F4F6] text-black'
                      }`}
                    >
                      Equipo Completo
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegType('individual')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        regType === 'individual' ? 'bg-black text-white' : 'bg-[#F3F4F6] text-black'
                      }`}
                    >
                      Agente Libre
                    </button>
                  </div>
                </div>

                {regType === 'team' && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nombre del Equipo</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej: Sentinels Latam"
                      value={regTeamName}
                      onChange={(e) => setRegTeamName(e.target.value)}
                      className="w-full bg-[#F9FAFB] border border-[#E5E7EB] focus:border-black rounded-xl px-3.5 py-2.5 text-xs text-black outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Tu GamerTag / ID de Juego</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej: TenZ#NA1"
                    value={regPlayerIgn}
                    onChange={(e) => setRegPlayerIgn(e.target.value)}
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] focus:border-black rounded-xl px-3.5 py-2.5 text-xs text-black outline-none"
                  />
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
