import React, { useState, useMemo } from 'react';
import { Tournament, ViewMode } from '../types';
import { Search, Plus, Trophy, Users, ArrowRight, Calendar, Filter } from 'lucide-react';
import { isRegistrationOpen, isViewOnlyTournament } from '../utils/tournamentAvailability';

interface ExploreTournamentsViewProps {
  tournaments: Tournament[];
  onNavigate: (view: ViewMode, tournamentId?: string) => void;
}

export const ExploreTournamentsView: React.FC<ExploreTournamentsViewProps> = ({ 
  tournaments, 
  onNavigate 
}) => {
  type TournamentTab = 'explorar' | 'en_vivo' | 'participando' | 'organizando' | 'historial';
  const [activeTab, setActiveTab] = useState<TournamentTab>('explorar');
  const [searchQuery, setSearchQuery] = useState('');
  const [sportFilter, setSportFilter] = useState('All Sports');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');

  const quickDisciplines = [
    { id: 'all', label: 'Todos' },
    { id: 'Valorant', label: 'Valorant' },
    { id: 'Marvel Rivals', label: 'Marvel Rivals' },
    { id: 'League of Legends', label: 'LoL' },
    { id: 'Rocket League', label: 'Rocket League' },
    { id: 'Fútbol', label: 'Fútbol 5' },
    { id: 'Pádel', label: 'Pádel' },
  ];

  const filteredTournaments = useMemo(() => {
    return tournaments.filter(t => {
      // Tab filter
      if (activeTab === 'explorar' && !isRegistrationOpen(t)) return false;
      if (activeTab === 'en_vivo' && !isViewOnlyTournament(t)) return false;
      if (activeTab === 'participando' && !t.isUserRegistered) return false;
      if (activeTab === 'organizando' && !t.isUserOrganizing) return false;
      if (activeTab === 'historial' && t.status !== 'completed') return false;
      if (activeTab !== 'historial' && statusFilter === 'All Status' && t.status === 'completed') return false;

      // Quick Discipline filter
      if (selectedDiscipline !== 'all' && !t.game.toLowerCase().includes(selectedDiscipline.toLowerCase())) {
        return false;
      }

      // Search query
      const matchSearch = 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.game.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.organizer.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      // Sport filter
      if (sportFilter === 'Esports' && t.category !== 'esports') return false;
      if (sportFilter === 'Physical Sports' && t.category !== 'sports') return false;

      // Status filter
      if (statusFilter === 'Open' && !isRegistrationOpen(t)) return false;
      if (statusFilter === 'Live' && !isViewOnlyTournament(t)) return false;
      if (statusFilter === 'Completed' && t.status !== 'completed') return false;

      return true;
    });
  }, [tournaments, activeTab, searchQuery, sportFilter, statusFilter, selectedDiscipline]);

  const navTabs: { id: TournamentTab; label: string; count: number }[] = [
    { id: 'explorar', label: 'Inscripciones abiertas', count: tournaments.filter(t => isRegistrationOpen(t)).length },
    { id: 'en_vivo', label: 'En vivo y para ver', count: tournaments.filter(t => isViewOnlyTournament(t)).length },
    { id: 'participando', label: 'Mis Inscripciones', count: tournaments.filter(t => t.isUserRegistered).length },
    { id: 'organizando', label: 'Mis Torneos', count: tournaments.filter(t => t.isUserOrganizing).length },
    { id: 'historial', label: 'Historial', count: tournaments.filter(t => t.status === 'completed').length },
  ];

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-6 font-['Golos_Text',sans-serif] text-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Catálogo Oficial
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-black mt-0.5">
            Explorador de Torneos y Ligas
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Encuentra competencias abiertas, inscríbete y escala en la tabla de posiciones.
          </p>
        </div>

        <button 
          onClick={() => onNavigate('create-tournament')}
          className="px-5 py-2.5 rounded-full bg-black text-white font-bold text-xs uppercase tracking-wider hover:bg-gray-800 active:scale-95 transition-all shadow-xs flex items-center gap-2 w-fit cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Torneo</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E5E7EB] pb-3">
        {navTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setStatusFilter(tab.id === 'historial' ? 'Completed' : 'All Status'); }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-black text-white shadow-xs'
                : 'bg-white text-gray-700 border border-[#E5E7EB] hover:border-black'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-white text-black' : 'bg-[#F3F4F6] text-black'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search and Filters Strip */}
      <div className="bg-white p-4 rounded-3xl border border-[#E5E7EB] flex flex-col gap-3 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar torneo por título, juego u organizador..."
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] focus:border-black rounded-2xl py-2.5 pl-10 pr-4 text-xs text-black placeholder-gray-400 outline-none"
            />
          </div>

          <div className="flex gap-2">
            <select 
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="bg-[#F9FAFB] border border-[#E5E7EB] focus:border-black rounded-2xl py-2.5 px-3 text-xs text-black cursor-pointer outline-none font-bold"
            >
              <option value="All Sports">Todas las Categorías</option>
              <option value="Esports">Esports</option>
              <option value="Physical Sports">Deportes Tradicionales</option>
            </select>

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#F9FAFB] border border-[#E5E7EB] focus:border-black rounded-2xl py-2.5 px-3 text-xs text-black cursor-pointer outline-none font-bold"
            >
              <option value="All Status">Todos los Estados</option>
              <option value="Open">Abierto</option>
              <option value="Live">En Vivo</option>
              <option value="Completed">Finalizado</option>
            </select>
          </div>
        </div>

        {/* Quick Discipline Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F3F4F6]">
          <span className="text-[11px] font-bold text-gray-500">Filtrar juego:</span>
          {quickDisciplines.map(d => (
            <button
              key={d.id}
              onClick={() => setSelectedDiscipline(d.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                selectedDiscipline === d.id
                  ? 'bg-black text-white'
                  : 'bg-[#F3F4F6] text-gray-700 hover:text-black'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tournaments Grid */}
      {filteredTournaments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E5E7EB] space-y-3">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto opacity-50" />
          <h3 className="text-base font-bold text-black">{activeTab === 'historial' ? 'Aún no hay torneos finalizados' : activeTab === 'participando' ? 'Aún no tienes inscripciones' : activeTab === 'organizando' ? 'Aún no administras torneos' : 'No se encontraron torneos'}</h3>
          <p className="text-xs text-gray-500">{activeTab === 'explorar' ? 'Intenta ajustar los filtros de búsqueda o categoría.' : 'Cuando exista actividad en esta sección aparecerá aquí.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map(t => (
            <div
              key={t.id}
              onClick={() => onNavigate('tournament-detail', t.id)}
              className="bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden hover:border-black hover:shadow-lg transition-all cursor-pointer flex flex-col group"
            >
              <div className="h-44 relative overflow-hidden bg-black">
                <img 
                  src={t.bannerUrl} 
                  alt={t.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute top-3 left-3">
                  {!isRegistrationOpen(t) ? (
                    <span className="px-2.5 py-1 rounded-full bg-white text-black text-[11px] font-black shadow-xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                      {t.status === 'live' ? 'EN VIVO' : 'INSCRIPCIONES CERRADAS'}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-black text-white text-[11px] font-bold shadow-xs">
                      ABIERTO
                    </span>
                  )}
                </div>

                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-xs text-white text-xs font-bold border border-white/20">
                  {t.game}
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="text-base font-bold truncate group-hover:text-gray-200 transition-colors">
                    {t.title}
                  </h3>
                  <p className="text-[11px] text-gray-300 truncate">{t.gameMode} • Org: {t.organizer.name}</p>
                </div>
              </div>

              <div className="p-5 flex flex-col justify-between flex-1 gap-4">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-2.5 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Premio</span>
                    <span className="text-sm font-black text-black">
                      ${(t.basePrizePool || t.prizesBreakdown?.reduce((acc, p) => acc + (p.estimatedAmount || 0), 0) || 0).toLocaleString()} MXN
                    </span>
                  </div>

                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-2.5 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Inscripción</span>
                    <span className="text-sm font-bold text-black">
                      {t.entryFeeType === 'free' || t.entryFeeAmount === 0 ? 'Gratis' : `${t.entryFeeAmount} MXN`}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[#E5E7EB] text-xs">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Users className="w-3.5 h-3.5" />
                    <span>{t.participantsCount} / {t.maxParticipants} Equipos</span>
                  </div>

                  <span className="text-xs font-bold text-black group-hover:underline flex items-center gap-1">
                    <span>{isRegistrationOpen(t) ? 'Inscribirme' : 'Ver torneo'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
