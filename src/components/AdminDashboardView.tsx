import React, { useState, useMemo } from 'react';
import { Tournament, UserProfile, Team, Transaction, AdminDisputeTicket, ViewMode } from '../types';
import { 
  Shield, 
  Users, 
  Trophy, 
  AlertTriangle, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Search, 
  Lock, 
  Unlock, 
  FileText, 
  Activity, 
  ChevronRight,
  Filter,
  Download,
  AlertCircle,
  Check
} from 'lucide-react';

interface AdminDashboardViewProps {
  tournaments: Tournament[];
  teams: Team[];
  transactions: Transaction[];
  currentUser: UserProfile;
  onNavigate: (view: ViewMode, tournamentId?: string) => void;
  onDeleteTournament: (tournamentId: string) => { success: boolean; message: string };
  onUpdateUserStatus: (userId: string, newStatus: 'active' | 'suspended') => void;
  onDeleteUser: (userId: string) => void;
  onDeleteTeam: (teamId: string) => { success: boolean; message: string };
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  tournaments,
  teams,
  transactions,
  currentUser,
  onNavigate,
  onDeleteTournament,
  onUpdateUserStatus,
  onDeleteUser,
  onDeleteTeam
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tournaments' | 'users' | 'teams' | 'disputes'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'open' | 'live' | 'completed'>('ALL');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Mock initial users for admin view
  const [userList, setUserList] = useState<Array<{ id: string; name: string; email: string; role: string; status: 'active' | 'suspended' }>>([
    { id: 'usr-1', name: 'Apex Warrior', email: 'apex@tournamentx.gg', role: 'Athlete', status: 'active' },
    { id: 'usr-2', name: 'League Master', email: 'org@lcs.gg', role: 'Organizer', status: 'active' },
    { id: 'usr-3', name: 'ToxicPlayer99', email: 'banned@cheater.gg', role: 'Athlete', status: 'suspended' },
    { id: 'usr-4', name: 'Valkyrie Main', email: 'valk@tournamentx.gg', role: 'Athlete', status: 'active' },
    { id: 'usr-5', name: 'CyberOrganizers SL', email: 'contact@cyberclash.es', role: 'Organizer', status: 'active' }
  ]);

  // Mock disputes
  const [disputes, setDisputes] = useState<Array<{ id: string; tournament: string; reason: string; reportedBy: string; status: 'pending' | 'resolved' }>>([
    { id: 'disp-1', tournament: 'Apex Championship 2024', reason: 'Disputa de captura de pantalla por uso de ping alto no reportado.', reportedBy: 'Cloud9 Apex', status: 'pending' },
    { id: 'disp-2', tournament: 'Valorant Champions Cup', reason: 'Equipo rival no se presentó a tiempo tras 15 minutos.', reportedBy: 'Sentinels Jr', status: 'pending' }
  ]);

  const showNotification = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleToggleUserStatus = (userId: string) => {
    setUserList(prev => prev.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'active' ? 'suspended' : 'active';
        onUpdateUserStatus(userId, nextStatus);
        showNotification(`Estado de usuario actualizado a: ${nextStatus.toUpperCase()}`);
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const handleDeleteUserLocal = (userId: string) => {
    setUserList(prev => prev.filter(u => u.id !== userId));
    onDeleteUser(userId);
    showNotification('Usuario eliminado permanentemente del sistema.');
  };

  const handleResolveDispute = (id: string, action: 'approved' | 'dismissed') => {
    setDisputes(prev => prev.map(d => d.id === id ? { ...d, status: 'resolved' } : d));
    showNotification(`Disputa ${id} marcada como resuelta (${action.toUpperCase()}).`);
  };

  const filteredTournaments = useMemo(() => {
    return tournaments.filter(t => {
      const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.game.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.organizer.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      return true;
    });
  }, [tournaments, searchQuery, statusFilter]);

  const filteredUsers = useMemo(() => {
    return userList.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [userList, searchQuery]);

  const totalVolume = transactions.reduce((acc, t) => acc + (t.status === 'PAID' ? t.amount : 0), 0);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-6 font-['Golos_Text',sans-serif] text-black">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Panel de Administración Global
          </span>
          <h1 className="text-xl md:text-2xl font-extrabold text-black mt-0.5">
            Supervisión del Sistema TournamentX
          </h1>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {(['overview', 'tournaments', 'users', 'disputes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                activeTab === tab 
                  ? 'bg-black text-white shadow-xs' 
                  : 'bg-[#F3F4F6] text-gray-700 hover:text-black'
              }`}
            >
              {tab === 'overview' && 'RESUMEN'}
              {tab === 'tournaments' && `TORNEOS (${tournaments.length})`}
              {tab === 'users' && `USUARIOS (${userList.length})`}
              {tab === 'disputes' && `DISPUTAS (${disputes.filter(d => d.status === 'pending').length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Global Action Feedback */}
      {actionFeedback && (
        <div className="p-3.5 rounded-2xl bg-black text-white text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionFeedback}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-xs">
          <span className="text-[10px] text-gray-500 font-bold uppercase">Torneos Totales</span>
          <p className="text-2xl font-black text-black mt-1">{tournaments.length}</p>
          <span className="text-[11px] text-gray-500 mt-0.5 block">{tournaments.filter(t => t.status === 'live').length} en vivo actualmente</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-xs">
          <span className="text-[10px] text-gray-500 font-bold uppercase">Equipos Registrados</span>
          <p className="text-2xl font-black text-black mt-1">{teams.length + 12}</p>
          <span className="text-[11px] text-gray-500 mt-0.5 block">Escuadras activas</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-xs">
          <span className="text-[10px] text-gray-500 font-bold uppercase">Volumen Procesado</span>
          <p className="text-2xl font-black text-black mt-1">${totalVolume.toLocaleString()} USD</p>
          <span className="text-[11px] text-gray-500 mt-0.5 block">{transactions.length} transacciones</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-xs">
          <span className="text-[10px] text-gray-500 font-bold uppercase">Estado del Servidor</span>
          <p className="text-2xl font-black text-black mt-1">100% Óptimo</p>
          <span className="text-[11px] text-gray-500 mt-0.5 block">Latencia media 14ms</span>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Tournaments Summary */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] space-y-4 shadow-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-black">Torneos Recientes</h3>
              <button 
                onClick={() => setActiveTab('tournaments')}
                className="text-xs font-bold text-gray-500 hover:text-black cursor-pointer"
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-3">
              {tournaments.slice(0, 4).map((t) => (
                <div key={t.id} className="p-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-black text-sm block">{t.title}</span>
                    <span className="text-gray-500">{t.game} • {t.participantsCount} inscritos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] font-bold">
                      {t.status === 'live' ? 'EN VIVO' : t.status === 'open' ? 'ABIERTO' : 'FINALIZADO'}
                    </span>
                    <button
                      onClick={() => onNavigate('tournament-detail', t.id)}
                      className="px-3 py-1 bg-white border border-[#E5E7EB] text-black font-bold rounded-full hover:bg-gray-100 cursor-pointer"
                    >
                      Ver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disputes & Moderation */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] space-y-4 shadow-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-black">Cola de Arbitraje y Disputas</h3>
              <button 
                onClick={() => setActiveTab('disputes')}
                className="text-xs font-bold text-gray-500 hover:text-black cursor-pointer"
              >
                Ver panel
              </button>
            </div>

            <div className="space-y-3">
              {disputes.map((d) => (
                <div key={d.id} className="p-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-black">{d.tournament}</span>
                    <span className="px-2 py-0.5 rounded-full bg-black text-white text-[10px] font-bold">
                      {d.status === 'pending' ? 'PENDIENTE' : 'RESUELTO'}
                    </span>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{d.reason}</p>
                  {d.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleResolveDispute(d.id, 'approved')}
                        className="px-3 py-1 bg-black text-white rounded-full font-bold hover:bg-gray-800 cursor-pointer"
                      >
                        Aprobar Reclamo
                      </button>
                      <button
                        onClick={() => handleResolveDispute(d.id, 'dismissed')}
                        className="px-3 py-1 bg-white border border-[#E5E7EB] text-black rounded-full font-bold hover:bg-gray-100 cursor-pointer"
                      >
                        Desestimar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TOURNAMENTS MANAGEMENT */}
      {activeTab === 'tournaments' && (
        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-black">Gestionar Todos los Torneos</h3>
              <p className="text-xs text-gray-500">Supervisa, audita o elimina competiciones activas.</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar torneo..."
                className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-xs text-black outline-none focus:border-black"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-xs text-black outline-none cursor-pointer font-bold"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="open">Abierto</option>
                <option value="live">En Vivo</option>
                <option value="completed">Finalizado</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredTournaments.map((t) => (
              <div key={t.id} className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="px-2 py-0.5 rounded-full bg-black text-white text-[10px] font-bold">
                      {t.status === 'live' ? 'EN VIVO' : t.status === 'open' ? 'ABIERTO' : 'FINALIZADO'}
                    </span>
                    <span className="text-gray-500">{t.game} • {t.participantsCount} / {t.maxParticipants}</span>
                  </div>
                  <span className="font-bold text-black text-sm block">{t.title}</span>
                  <span className="text-gray-500 text-[11px]">Org: {t.organizer.name} • Fechas: {t.startDate}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('tournament-detail', t.id)}
                    className="px-3.5 py-1.5 rounded-full bg-black text-white font-bold hover:bg-gray-800 cursor-pointer"
                  >
                    Ver Detalles
                  </button>
                  <button
                    onClick={() => {
                      const res = onDeleteTournament(t.id);
                      showNotification(res.message || 'Torneo eliminado.');
                    }}
                    className="p-2 rounded-full bg-white border border-[#E5E7EB] text-black hover:bg-gray-100 cursor-pointer"
                    title="Eliminar Torneo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-black">Control de Usuarios y Roles</h3>
              <p className="text-xs text-gray-500">Suspende, reactiva o expulsa cuentas del sistema.</p>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, correo o rol..."
              className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-xs text-black outline-none focus:border-black"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-gray-500 text-[11px] uppercase">
                  <th className="py-3 font-bold">Usuario</th>
                  <th className="py-3 font-bold">Email</th>
                  <th className="py-3 font-bold">Rol</th>
                  <th className="py-3 font-bold">Estado</th>
                  <th className="py-3 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="text-black hover:bg-[#F9FAFB]">
                    <td className="py-3 font-bold">{u.name}</td>
                    <td className="py-3 text-gray-500">{u.email}</td>
                    <td className="py-3 font-medium">{u.role}</td>
                    <td className="py-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] font-bold">
                        {u.status === 'active' ? 'ACTIVO' : 'SUSPENDIDO'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleUserStatus(u.id)}
                          className="px-3 py-1 rounded-full bg-black text-white font-bold text-xs hover:bg-gray-800 cursor-pointer"
                        >
                          {u.status === 'active' ? 'Suspender' : 'Reactivar'}
                        </button>
                        <button
                          onClick={() => handleDeleteUserLocal(u.id)}
                          className="p-1.5 rounded-full bg-white border border-[#E5E7EB] text-black hover:bg-gray-100 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DISPUTES & ARBITRATION */}
      {activeTab === 'disputes' && (
        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] space-y-4 shadow-xs">
          <div>
            <h3 className="text-sm font-extrabold text-black">Centro de Arbitraje de Partidos</h3>
            <p className="text-xs text-gray-500">Revisa reclamaciones y evidencias remitidas por los capitanes.</p>
          </div>

          <div className="space-y-3">
            {disputes.map((d) => (
              <div key={d.id} className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-black text-sm">{d.tournament}</span>
                    <span className="px-2 py-0.5 rounded-full bg-black text-white text-[10px] font-bold">
                      {d.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-600">{d.reason}</p>
                  <span className="text-[11px] text-gray-400 block">Reportado por: {d.reportedBy}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleResolveDispute(d.id, 'approved')}
                    className="px-3.5 py-1.5 bg-black text-white rounded-full font-bold hover:bg-gray-800 cursor-pointer"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleResolveDispute(d.id, 'dismissed')}
                    className="px-3.5 py-1.5 bg-white border border-[#E5E7EB] text-black rounded-full font-bold hover:bg-gray-100 cursor-pointer"
                  >
                    Desestimar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
