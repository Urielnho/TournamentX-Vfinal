import React, { useState } from 'react';
import { Participant, ViewMode } from '../types';
import { Plus, X, Search, Users, Trophy, Shield, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TeamsViewProps {
  participants: Participant[];
  onNavigate: (view: ViewMode, tournamentId?: string) => void;
  onCreateTeam: (newTeam: Participant) => void;
}

export const TeamsView: React.FC<TeamsViewProps> = ({
  participants,
  onNavigate,
  onCreateTeam
}) => {
  const [activeTab, setActiveTab] = useState<'mine' | 'managed' | 'invites' | 'history'>('mine');
  const [invitationVisible, setInvitationVisible] = useState(true);
  const [invitationMessage, setInvitationMessage] = useState('');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamTag, setTeamTag] = useState('');
  const [captainName, setCaptainName] = useState('Apex (Tú)');

  const filteredTeams = participants.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.tag.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !teamTag.trim()) return;

    const newTeam: Participant = {
      id: `team-${Date.now()}`,
      name: teamName,
      tag: teamTag.toUpperCase(),
      logo: '',
      seed: participants.length + 1,
      captain: captainName,
      membersCount: 5,
      status: 'confirmed'
    };

    onCreateTeam(newTeam);
    setShowCreateModal(false);
    setTeamName('');
    setTeamTag('');
    confetti({ particleCount: 50, spread: 50 });
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-6 font-['Golos_Text',sans-serif] text-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-[#E5E7EB] pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Comunidad y Escuadras
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-black mt-0.5">
            Equipos y Rosters
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Administra tus equipos temporales, integrantes e invitaciones dentro de cada torneo.
          </p>
        </div>

        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-full bg-black text-white font-bold text-xs uppercase tracking-wider hover:bg-gray-800 active:scale-95 transition-all shadow-xs flex items-center gap-2 w-fit cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Crear equipo para un torneo</span>
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-[#E5E7EB] pb-3">
        {[
          ['mine', 'Mis equipos'], ['managed', 'Equipos que administro'], ['invites', 'Invitaciones'], ['history', 'Historial']
        ].map(([id, label]) => <button key={id} onClick={() => setActiveTab(id as typeof activeTab)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${activeTab === id ? 'bg-black text-white' : 'border border-gray-200 bg-white text-gray-600'}`}>{label}{id === 'invites' && <span className="ml-2 rounded-full bg-black px-2 py-0.5 text-[10px] text-white">2</span>}</button>)}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-[#E5E7EB] flex items-center gap-3 shadow-xs">
        <Search className="w-4 h-4 text-gray-400 ml-1" />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar equipo por nombre o tag..."
          className="w-full bg-transparent text-xs text-black placeholder-gray-400 outline-none"
        />
      </div>

      {activeTab === 'invites' && <div className="grid gap-3 sm:grid-cols-2">{invitationVisible ? <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5"><p className="text-xs font-bold text-gray-500">ROCKET LEAGUE CHAMPIONSHIP</p><h3 className="mt-1 font-black">Rocket Kings</h3><p className="mt-2 text-xs text-gray-500">Invitación de NovaCaptain · 3/4 integrantes</p><div className="mt-4 flex gap-2"><button onClick={() => { setInvitationVisible(false); setInvitationMessage('Invitación aceptada. Ya formas parte de Rocket Kings.'); }} className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white">Aceptar</button><button onClick={() => { setInvitationVisible(false); setInvitationMessage('Invitación rechazada.'); }} className="rounded-full border px-4 py-2 text-xs font-bold">Rechazar</button></div></div> : <div className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-6 text-center text-xs font-bold">{invitationMessage || 'No tienes invitaciones pendientes.'}</div>}</div>}

      {activeTab === 'history' && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{participants.slice(0, 2).map(team => <div key={`history-${team.id}`} className="rounded-3xl border border-[#E5E7EB] bg-white p-5"><div className="flex items-center justify-between"><strong>{team.name}</strong><span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[10px] font-bold">FINALIZADO</span></div><p className="mt-2 text-xs text-gray-500">Equipo temporal · roster cerrado</p><div className="mt-4 flex items-center justify-between border-t border-[#E5E7EB] pt-3 text-xs"><span>Participación registrada</span><Trophy className="w-4 h-4" /></div></div>)}</div>}

      {/* Teams Grid */}
      {activeTab !== 'invites' && activeTab !== 'history' &&
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredTeams.map((team) => (
          <div 
            key={team.id}
            className="bg-white rounded-3xl border border-[#E5E7EB] p-5 flex flex-col justify-between gap-4 hover:border-black hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F9FAFB] text-black font-black text-sm flex items-center justify-center border border-[#E5E7EB] shrink-0">
                {team.tag}
              </div>

              <div className="overflow-hidden flex-1 text-xs">
                <h3 className="font-bold text-black truncate text-sm">{team.name}</h3>
                <p className="text-[11px] text-gray-500 truncate mt-0.5">Capitán: {team.captain || 'Oficial'}</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#F3F4F6] text-xs">
              <span className="text-[11px] text-gray-500 flex items-center gap-1 font-medium">
                <Users className="w-3.5 h-3.5" />
                <span>{team.membersCount || 5} Atletas</span>
              </span>

              <span className="px-2.5 py-0.5 rounded-full bg-black text-white font-bold text-[10px]">
                CONFIRMADO
              </span>
            </div>
          </div>
        ))}
      </div>}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-black rounded-3xl max-w-md w-full p-6 border border-[#E5E7EB] shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black text-sm font-bold cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-lg font-extrabold text-black mb-1">Crear equipo temporal</h3>
            <p className="text-xs text-gray-500 mb-4">Este equipo solo existirá dentro del torneo seleccionado.</p>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div><label className="font-bold text-gray-600 uppercase block mb-1">Torneo</label><select required className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 py-2.5 outline-none"><option value="">Selecciona un torneo</option><option>Rocket League Championship</option><option>Marvel Rivals Cup</option></select></div>
              <div>
                <label className="font-bold text-gray-600 uppercase block mb-1">Nombre del Equipo</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Cloud9 Apex"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] focus:border-black rounded-xl px-3.5 py-2.5 text-black outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-600 uppercase block mb-1">Tag / Siglas (3-5 Letras)</label>
                <input 
                  type="text" 
                  required
                  maxLength={5}
                  placeholder="Ej: C9"
                  value={teamTag}
                  onChange={(e) => setTeamTag(e.target.value.toUpperCase())}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] focus:border-black rounded-xl px-3.5 py-2.5 text-black uppercase font-bold outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-600 uppercase block mb-1">Capitán / Líder</label>
                <input 
                  type="text" 
                  value={captainName}
                  onChange={(e) => setCaptainName(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] focus:border-black rounded-xl px-3.5 py-2.5 text-black outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-full border border-[#E5E7EB] text-gray-600 hover:bg-[#F3F4F6] font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-black text-white font-bold hover:bg-gray-800 active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  Crear Escuadra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
