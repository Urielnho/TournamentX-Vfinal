import React, { useState } from 'react';
import { Match, ViewMode } from '../types';
import { ChevronRight, Edit2 } from 'lucide-react';

interface MatchesViewProps {
  matches: Match[];
  onNavigate: (view: ViewMode, tournamentId?: string) => void;
  onManageTournament: (tournamentId: string) => void;
}

export const MatchesView: React.FC<MatchesViewProps> = ({ matches, onNavigate, onManageTournament }) => {
  const [activeTab, setActiveTab] = useState<'mine' | 'managed' | 'live' | 'results'>('mine');
  const [filterGame, setFilterGame] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const filteredMatches = matches.filter(m => {
    if (filterGame !== 'ALL' && m.game !== filterGame) return false;
    if (filterStatus !== 'ALL' && m.status !== filterStatus) return false;
    if (activeTab === 'mine' && !m.isUserParticipant) return false;
    if (activeTab === 'managed' && !m.isUserManaged) return false;
    if (activeTab === 'live' && m.status !== 'live') return false;
    if (activeTab === 'results' && m.status !== 'finished') return false;
    return true;
  });

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-6 font-['Golos_Text',sans-serif] text-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-[#E5E7EB] pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Marcadores en Tiempo Real
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-black mt-0.5">
            Calendario de Partidos
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Revisa los resultados, enfrentamientos en vivo y horarios de las próximas rondas.
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={filterGame}
            onChange={(e) => setFilterGame(e.target.value)}
            className="bg-white border border-[#E5E7EB] focus:border-black rounded-2xl px-3 py-2 text-xs text-black outline-none cursor-pointer font-bold shadow-xs"
          >
            <option value="ALL">Todos los juegos</option>
            <option value="Valorant">Valorant</option>
            <option value="Marvel Rivals">Marvel Rivals</option>
            <option value="Rocket League">Rocket League</option>
            <option value="League of Legends">League of Legends</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-[#E5E7EB] focus:border-black rounded-2xl px-3 py-2 text-xs text-black outline-none cursor-pointer font-bold shadow-xs"
          >
            <option value="ALL">Todos los estados</option>
            <option value="live">En Vivo</option>
            <option value="finished">Finalizados</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-[#E5E7EB] pb-3">
        {[['mine', 'Mis partidos'], ['managed', 'Partidos que administro'], ['live', 'En vivo'], ['results', 'Resultados']].map(([id, label]) => <button key={id} onClick={() => { setActiveTab(id as typeof activeTab); setFilterStatus(id === 'live' ? 'live' : id === 'results' ? 'finished' : 'ALL'); }} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${activeTab === id ? 'bg-black text-white' : 'border border-gray-200 bg-white text-gray-600'}`}>{label}</button>)}
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        {filteredMatches.map((m) => (
          <div
            key={m.id}
            onClick={() => onNavigate('tournament-detail', m.tournamentId)}
            className="bg-white rounded-3xl border border-[#E5E7EB] p-5 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-black hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 w-full md:w-auto text-xs">
              {m.status === 'live' ? (
                <span className="px-2.5 py-1 rounded-full bg-black text-white text-[11px] font-bold shadow-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  EN VIVO
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-[#F3F4F6] text-black text-[11px] font-bold">
                  {m.roundName}
                </span>
              )}
              <span className="text-gray-600 font-medium">{m.game} • {m.date}</span>
            </div>

            {/* Scoreboard */}
            <div className="flex items-center justify-center gap-4 text-xs sm:text-sm font-bold w-full md:w-auto">
              <div className={`flex items-center gap-2.5 text-right ${m.teamA.isWinner ? 'text-black font-black' : 'text-gray-700'}`}>
                <span className="truncate max-w-[140px] sm:max-w-[200px]">{m.teamA.name}</span>
                <span className="bg-[#F3F4F6] px-2.5 py-1 rounded-xl text-base font-black text-black">
                  {m.teamA.score ?? 0}
                </span>
              </div>

              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">VS</span>

              <div className={`flex items-center gap-2.5 ${m.teamB.isWinner ? 'text-black font-black' : 'text-gray-700'}`}>
                <span className="bg-[#F3F4F6] px-2.5 py-1 rounded-xl text-base font-black text-black">
                  {m.teamB.score ?? 0}
                </span>
                <span className="truncate max-w-[140px] sm:max-w-[200px]">{m.teamB.name}</span>
              </div>
            </div>

            {activeTab === 'managed' && m.isUserManaged ? <button onClick={(event) => { event.stopPropagation(); onManageTournament(m.tournamentId); }} className="flex items-center gap-1 rounded-full bg-black px-4 py-2 text-xs font-bold text-white"><Edit2 className="w-3.5 h-3.5" />Administrar</button> : <div className="flex items-center gap-1 text-xs font-bold text-black group-hover:underline w-full md:w-auto justify-end"><span>Ver Bracket</span><ChevronRight className="w-4 h-4" /></div>}
          </div>
        ))}
        {filteredMatches.length === 0 && <div className="rounded-3xl border border-[#E5E7EB] bg-white p-10 text-center text-xs text-gray-500">No hay partidos para estos filtros.</div>}
      </div>
    </div>
  );
};
