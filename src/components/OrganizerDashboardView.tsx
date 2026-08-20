import React, { useState, useMemo } from 'react';
import { Transaction, PendingApproval, ViewMode, Tournament, Match, Participant } from '../types';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  AlertCircle, 
  Check, 
  X, 
  Search, 
  Download, 
  Filter, 
  ChevronRight, 
  LayoutDashboard, 
  Calendar, 
  Settings, 
  Award, 
  Shield, 
  FileText, 
  CheckCircle2,
  Plus,
  Edit2,
  Trophy,
  Play,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OrganizerDashboardViewProps {
  transactions: Transaction[];
  pendingApprovals: PendingApproval[];
  tournaments?: Tournament[];
  matches?: Match[];
  participants?: Participant[];
  onNavigate: (view: ViewMode, tournamentId?: string) => void;
  onApproveTeam: (id: string, teamName: string) => void;
  onRejectTeam: (id: string) => void;
  onUpdateMatchScore?: (matchId: string, scoreA: number, scoreB: number, winnerId?: string) => void;
}

export const OrganizerDashboardView: React.FC<OrganizerDashboardViewProps> = ({
  transactions,
  pendingApprovals,
  tournaments = [],
  matches = [],
  participants = [],
  onNavigate,
  onApproveTeam,
  onRejectTeam,
  onUpdateMatchScore
}) => {
  const [activeSidebarItem, setActiveSidebarItem] = useState<
    'resumen' | 'finanzas' | 'participantes' | 'partidos' | 'configuracion'
  >('resumen');
  
  const [searchTx, setSearchTx] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Manual Add Team state
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCaptain, setNewTeamCaptain] = useState('');

  // Selected tournament for management
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(
    tournaments[0]?.id || 'neon-city-clash-2024'
  );

  // Match score edit state
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editScoreA, setEditScoreA] = useState<number>(0);
  const [editScoreB, setEditScoreB] = useState<number>(0);

  // Tournament settings editable state
  const currentTourn = tournaments.find(t => t.id === selectedTournamentId) || tournaments[0];
  const [tournTitle, setTournTitle] = useState(currentTourn?.title || 'Torneo Principal');
  const [organizerFeePercent, setOrganizerFeePercent] = useState(currentTourn?.organizerPercentage ?? 15);
  const [tournStatus, setTournStatus] = useState<string>(currentTourn?.status || 'open');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchSearch = tx.userOrTeam.toLowerCase().includes(searchTx.toLowerCase()) ||
                          tx.transactionId.toLowerCase().includes(searchTx.toLowerCase()) ||
                          tx.teamCode.toLowerCase().includes(searchTx.toLowerCase());
      if (!matchSearch) return false;
      if (statusFilter !== 'ALL' && tx.status !== statusFilter) return false;
      return true;
    });
  }, [transactions, searchTx, statusFilter]);

  const handleExportCSV = () => {
    const headers = 'Equipo,Codigo,Transaccion,Fecha,Monto,Estado,Metodo\n';
    const rows = filteredTransactions.map(t => 
      `"${t.userOrTeam}","${t.teamCode}","${t.transactionId}","${t.date}",${t.amount},"${t.status}","${t.paymentMethod}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_financiero_tournamentx_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setActionSuccessMessage('Reporte CSV descargado correctamente.');
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  const handleManualAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    onApproveTeam(`team-${Date.now()}`, newTeamName.trim());
    setShowAddTeamModal(false);
    setNewTeamName('');
    setNewTeamCaptain('');
    setActionSuccessMessage(`Equipo "${newTeamName}" inscrito exitosamente.`);
    confetti({ particleCount: 40, spread: 50 });
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  const handleSaveScore = (matchId: string) => {
    if (onUpdateMatchScore) {
      const winner = editScoreA > editScoreB ? 'teamA' : editScoreB > editScoreA ? 'teamB' : undefined;
      onUpdateMatchScore(matchId, editScoreA, editScoreB, winner);
    }
    setEditingMatchId(null);
    setActionSuccessMessage('Marcador de partido actualizado con éxito.');
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setActionSuccessMessage('Configuración del torneo guardada.');
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  const totalRevenue = transactions.reduce((acc, t) => acc + (t.status === 'PAID' ? t.amount : 0), 0);
  const organizerCommission = Math.round((totalRevenue * organizerFeePercent) / 100);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row gap-6 font-['Golos_Text',sans-serif] text-black">
      
      {/* Organizer Sidebar */}
      <aside className="w-full md:w-64 shrink-0 flex flex-col gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-4 space-y-1 shadow-xs">
          <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            Gestión de Liga
          </div>

          <button
            onClick={() => setActiveSidebarItem('resumen')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors cursor-pointer ${
              activeSidebarItem === 'resumen' ? 'bg-black text-white' : 'text-gray-700 hover:bg-[#F3F4F6] hover:text-black'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Resumen General</span>
          </button>

          <button
            onClick={() => setActiveSidebarItem('finanzas')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors cursor-pointer ${
              activeSidebarItem === 'finanzas' ? 'bg-black text-white' : 'text-gray-700 hover:bg-[#F3F4F6] hover:text-black'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Finanzas y Pagos</span>
          </button>

          <button
            onClick={() => setActiveSidebarItem('participantes')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors cursor-pointer ${
              activeSidebarItem === 'participantes' ? 'bg-black text-white' : 'text-gray-700 hover:bg-[#F3F4F6] hover:text-black'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4" />
              <span>Participantes</span>
            </div>
            {pendingApprovals.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeSidebarItem === 'participantes' ? 'bg-white text-black' : 'bg-black text-white'}`}>
                {pendingApprovals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSidebarItem('partidos')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors cursor-pointer ${
              activeSidebarItem === 'partidos' ? 'bg-black text-white' : 'text-gray-700 hover:bg-[#F3F4F6] hover:text-black'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Partidos & Bracket</span>
          </button>

          <button
            onClick={() => setActiveSidebarItem('configuracion')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors cursor-pointer ${
              activeSidebarItem === 'configuracion' ? 'bg-black text-white' : 'text-gray-700 hover:bg-[#F3F4F6] hover:text-black'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configuración</span>
          </button>
        </div>

        {/* Quick Tournament Switcher */}
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-4 space-y-2 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
            Torneo Activo
          </span>
          <select
            value={selectedTournamentId}
            onChange={(e) => setSelectedTournamentId(e.target.value)}
            className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-bold text-black outline-none cursor-pointer"
          >
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col gap-6">
        
        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-xs">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Panel Organizador
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold text-black mt-0.5">
              {activeSidebarItem === 'resumen' && 'Control General del Torneo'}
              {activeSidebarItem === 'finanzas' && 'Finanzas, Recaudación & Facturación'}
              {activeSidebarItem === 'participantes' && 'Gestión de Equipos & Aprobaciones'}
              {activeSidebarItem === 'partidos' && 'Administración de Partidos & Resultados'}
              {activeSidebarItem === 'configuracion' && 'Ajustes y Reglas de la Competición'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('create-tournament')}
              className="px-4 py-2.5 rounded-full bg-black text-white hover:bg-gray-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Torneo</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-full border border-[#E5E7EB] text-black hover:bg-[#F3F4F6] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {actionSuccessMessage && (
          <div className="p-3.5 rounded-2xl bg-black text-white text-xs font-bold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button onClick={() => setActionSuccessMessage(null)} className="text-gray-400 hover:text-white text-xs">✕</button>
          </div>
        )}

        {/* TAB 1: RESUMEN GENERAL */}
        {activeSidebarItem === 'resumen' && (
          <div className="space-y-6">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-xs">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Recaudación Total</span>
                <p className="text-2xl font-black text-black mt-1">${totalRevenue.toLocaleString()} USD</p>
                <span className="text-[11px] text-gray-500 mt-1 block">Inscripciones confirmadas</span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-xs">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Margen Organizador</span>
                <p className="text-2xl font-black text-black mt-1">${organizerCommission.toLocaleString()} USD</p>
                <span className="text-[11px] text-gray-500 mt-1 block">{organizerFeePercent}% de comisión</span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-xs">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Equipos Registrados</span>
                <p className="text-2xl font-black text-black mt-1">{participants.length + 8}</p>
                <span className="text-[11px] text-gray-500 mt-1 block">{pendingApprovals.length} por autorizar</span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-xs">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Partidos Totales</span>
                <p className="text-2xl font-black text-black mt-1">{matches.length || 6}</p>
                <span className="text-[11px] text-gray-500 mt-1 block">Brackets sincronizados</span>
              </div>
            </div>

            {/* Quick Actions & Live Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Pending Approvals Box */}
              <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] space-y-4 shadow-xs">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-extrabold text-black flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Aprobaciones Pendientes ({pendingApprovals.length})</span>
                  </h3>
                  <button 
                    onClick={() => setActiveSidebarItem('participantes')}
                    className="text-xs font-bold text-gray-600 hover:text-black hover:underline cursor-pointer"
                  >
                    Ver todas
                  </button>
                </div>

                {pendingApprovals.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4">No hay solicitudes pendientes en este momento.</p>
                ) : (
                  <div className="space-y-2">
                    {pendingApprovals.slice(0, 3).map((app) => (
                      <div key={app.id} className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-black">{app.teamName}</span>
                          <span className="text-[11px] text-gray-500 block">Cap: {app.captainName} • {app.requestedAgo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              onApproveTeam(app.id, app.teamName);
                              setActionSuccessMessage(`Aprobado: ${app.teamName}`);
                            }}
                            className="px-3 py-1 rounded-full bg-black text-white font-bold text-xs hover:bg-gray-800 cursor-pointer"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => {
                              onRejectTeam(app.id);
                              setActionSuccessMessage(`Rechazado: ${app.teamName}`);
                            }}
                            className="px-3 py-1 rounded-full bg-white border border-[#E5E7EB] text-black font-bold text-xs hover:bg-gray-100 cursor-pointer"
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Active Matches Summary */}
              <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] space-y-4 shadow-xs">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-extrabold text-black flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    <span>Partidos Próximos / En Curso</span>
                  </h3>
                  <button 
                    onClick={() => setActiveSidebarItem('partidos')}
                    className="text-xs font-bold text-gray-600 hover:text-black hover:underline cursor-pointer"
                  >
                    Gestionar
                  </button>
                </div>

                <div className="space-y-2">
                  {matches.slice(0, 3).map((m) => (
                    <div key={m.id} className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl flex items-center justify-between text-xs">
                      <div className="overflow-hidden">
                        <span className="font-bold text-black truncate block">{m.teamA.name} vs {m.teamB.name}</span>
                        <span className="text-[11px] text-gray-500">{m.game} • {m.roundName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-black text-white text-[10px] font-bold">
                          {m.status === 'live' ? 'EN VIVO' : 'PROGRAMADO'}
                        </span>
                        <span className="font-black text-black">{m.teamA.score} - {m.teamB.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FINANZAS & PAGOS */}
        {activeSidebarItem === 'finanzas' && (
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-black">Historial de Pagos & Inscripciones</h3>
                <p className="text-xs text-gray-500">Transacciones bancarias y billetera verificadas por TournamentX.</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchTx}
                  onChange={(e) => setSearchTx(e.target.value)}
                  placeholder="Buscar transacción..."
                  className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-xs text-black outline-none focus:border-black"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-xs text-black outline-none cursor-pointer font-bold"
                >
                  <option value="ALL">Todos los Estados</option>
                  <option value="PAID">Pagados</option>
                  <option value="PENDING">Pendientes</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-gray-500 text-[11px] uppercase">
                    <th className="py-3 font-bold">Equipo / Atleta</th>
                    <th className="py-3 font-bold">Código</th>
                    <th className="py-3 font-bold">ID Transacción</th>
                    <th className="py-3 font-bold">Fecha</th>
                    <th className="py-3 font-bold">Monto</th>
                    <th className="py-3 font-bold">Método</th>
                    <th className="py-3 font-bold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="text-black hover:bg-[#F9FAFB]">
                      <td className="py-3.5 font-bold">{tx.userOrTeam}</td>
                      <td className="py-3.5 text-gray-500">{tx.teamCode}</td>
                      <td className="py-3.5 font-mono text-gray-500">{tx.transactionId}</td>
                      <td className="py-3.5 text-gray-500">{tx.date}</td>
                      <td className="py-3.5 font-black">${tx.amount} USD</td>
                      <td className="py-3.5 text-gray-500">{tx.paymentMethod}</td>
                      <td className="py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] font-bold">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PARTICIPANTES */}
        {activeSidebarItem === 'participantes' && (
          <div className="space-y-6">
            {/* Header with add team button */}
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-xs">
              <div>
                <h3 className="text-sm font-extrabold text-black">Control de Escuadras & Rosters</h3>
                <p className="text-xs text-gray-500">Valida inscripciones o añade equipos de manera directa.</p>
              </div>
              <button
                onClick={() => setShowAddTeamModal(true)}
                className="px-4 py-2 rounded-full bg-black text-white text-xs font-bold hover:bg-gray-800 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Inscribir Equipo Manualmente</span>
              </button>
            </div>

            {/* Pending Approvals Section */}
            <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] space-y-4 shadow-xs">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Solicitudes Pendientes ({pendingApprovals.length})
              </h4>
              
              {pendingApprovals.length === 0 ? (
                <p className="text-xs text-gray-500">No hay solicitudes pendientes.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pendingApprovals.map((app) => (
                    <div key={app.id} className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-black text-sm block">{app.teamName}</span>
                        <span className="text-gray-500">Capitán: {app.captainName}</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">{app.requestedAgo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onApproveTeam(app.id, app.teamName);
                            setActionSuccessMessage(`Aprobado: ${app.teamName}`);
                          }}
                          className="px-3 py-1.5 rounded-full bg-black text-white font-bold text-xs hover:bg-gray-800 cursor-pointer"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => {
                            onRejectTeam(app.id);
                            setActionSuccessMessage(`Rechazado: ${app.teamName}`);
                          }}
                          className="px-3 py-1.5 rounded-full bg-white border border-[#E5E7EB] text-black font-bold text-xs hover:bg-gray-100 cursor-pointer"
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirmed Teams List */}
            <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] space-y-4 shadow-xs">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Equipos Confirmados
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {participants.map((p) => (
                  <div key={p.id} className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-black text-sm block">{p.name}</span>
                      <span className="text-gray-500">Tag: {p.tag} • Seed #{p.seed}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-black text-white text-[10px] font-bold">
                      CONFIRMADO
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GESTIÓN DE PARTIDOS */}
        {activeSidebarItem === 'partidos' && (
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] space-y-4 shadow-xs">
            <div>
              <h3 className="text-sm font-extrabold text-black">Gestionar Resultados y Marcadores</h3>
              <p className="text-xs text-gray-500">Actualiza los marcadores de las series para avanzar en el bracket.</p>
            </div>

            <div className="space-y-3">
              {matches.map((m) => (
                <div key={m.id} className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-black text-white text-[10px] font-bold">
                        {m.status === 'live' ? 'EN VIVO' : 'PROGRAMADO'}
                      </span>
                      <span className="text-gray-500">{m.game} • {m.roundName}</span>
                    </div>
                    <span className="font-bold text-black text-sm">{m.teamA.name} vs {m.teamB.name}</span>
                  </div>

                  {editingMatchId === m.id ? (
                    <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-[#E5E7EB]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">{m.teamA.name}:</span>
                        <input
                          type="number"
                          value={editScoreA}
                          onChange={(e) => setEditScoreA(Number(e.target.value))}
                          className="w-12 px-2 py-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-center font-black outline-none"
                        />
                      </div>
                      <span className="font-bold">-</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={editScoreB}
                          onChange={(e) => setEditScoreB(Number(e.target.value))}
                          className="w-12 px-2 py-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-center font-black outline-none"
                        />
                        <span className="font-bold">:{m.teamB.name}</span>
                      </div>
                      <button
                        onClick={() => handleSaveScore(m.id)}
                        className="px-3 py-1 bg-black text-white rounded-xl font-bold hover:bg-gray-800 cursor-pointer"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingMatchId(null)}
                        className="px-2 py-1 bg-gray-100 text-black rounded-xl font-bold hover:bg-gray-200 cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-black text-black">
                        {m.teamA.score} - {m.teamB.score}
                      </div>
                      <button
                        onClick={() => {
                          setEditingMatchId(m.id);
                          setEditScoreA(m.teamA.score || 0);
                          setEditScoreB(m.teamB.score || 0);
                        }}
                        className="px-3 py-1.5 rounded-full bg-black text-white font-bold text-xs hover:bg-gray-800 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Editar Marcador</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CONFIGURACIÓN */}
        {activeSidebarItem === 'configuracion' && (
          <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-[#E5E7EB] space-y-4 shadow-xs">
            <div>
              <h3 className="text-sm font-extrabold text-black">Configuración del Torneo</h3>
              <p className="text-xs text-gray-500">Parámetros generales, comisión del organizador y estado.</p>
            </div>

            <div className="space-y-3 max-w-xl text-xs">
              <div>
                <label className="font-bold text-black block mb-1">Nombre del Torneo</label>
                <input
                  type="text"
                  value={tournTitle}
                  onChange={(e) => setTournTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-black font-medium outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="font-bold text-black block mb-1">Comisión del Organizador (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={organizerFeePercent}
                  onChange={(e) => setOrganizerFeePercent(Number(e.target.value))}
                  disabled={Boolean(currentTourn?.hasReceivedPayments)}
                  className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-black font-medium outline-none focus:border-black disabled:cursor-not-allowed disabled:opacity-60"
                />
                <p className="mt-1 text-[11px] text-gray-500">{currentTourn?.hasReceivedPayments ? 'Bloqueada porque el torneo ya recibió pagos.' : 'Este porcentaje será visible antes del primer pago.'}</p>
              </div>

              <div>
                <label className="font-bold text-black block mb-1">Estado de la Competición</label>
                <select
                  value={tournStatus}
                  onChange={(e) => setTournStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-black font-bold outline-none cursor-pointer"
                >
                  <option value="open">Abierto / Registros Activos</option>
                  <option value="live">En Vivo / En Progreso</option>
                  <option value="completed">Finalizado</option>
                </select>
              </div>

              <button
                type="submit"
                className="mt-4 px-6 py-2.5 bg-black text-white rounded-full font-bold text-xs hover:bg-gray-800 cursor-pointer shadow-xs"
              >
                Guardar Ajustes
              </button>
            </div>
          </form>
        )}

      </main>

      {/* Manual Add Team Modal */}
      {showAddTeamModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-black shadow-2xl border border-gray-200">
            <h3 className="text-lg font-black text-black">Inscribir Equipo Manualmente</h3>
            <p className="text-xs text-gray-500 mt-1">Añade un equipo directamente sin pasar por la pasarela de pago.</p>

            <form onSubmit={handleManualAddTeam} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Nombre del Equipo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Astralis Academy"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Capitán / Contacto</label>
                <input
                  type="text"
                  placeholder="Ej: Dev1ce"
                  value={newTeamCaptain}
                  onChange={(e) => setNewTeamCaptain(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl outline-none focus:border-black"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="flex-1 py-2.5 rounded-full bg-gray-100 text-black font-bold text-xs hover:bg-gray-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-black text-white font-bold text-xs hover:bg-gray-800 cursor-pointer shadow-xs"
                >
                  Confirmar Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
