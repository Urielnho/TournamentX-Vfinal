import React, { useState, useMemo, useEffect } from 'react';
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
import { uploadTournamentBanner } from '../services/supabaseData';

interface OrganizerDashboardViewProps {
  activeTournamentId: string;
  activeSection: 'resumen' | 'finanzas' | 'participantes' | 'partidos' | 'configuracion';
  transactions: Transaction[];
  pendingApprovals: PendingApproval[];
  tournaments?: Tournament[];
  matches?: Match[];
  participants?: Participant[];
  onNavigate: (view: ViewMode, tournamentId?: string) => void;
  onSectionChange: (section: 'resumen' | 'finanzas' | 'participantes' | 'partidos' | 'configuracion') => void;
  onApproveTeam: (id: string, teamName: string) => void;
  onRejectTeam: (id: string) => void;
  onUpdateMatchScore?: (matchId: string, scoreA: number, scoreB: number, winnerId?: string) => void;
  onGenerateBracket: (tournamentId: string) => Promise<number>;
  onClearBracket: (tournamentId: string) => Promise<void>;
  onScheduleMatch: (matchId: string, scheduledAt: string, streamUrl?: string) => Promise<void>;
  onUpdateTournamentSettings: (tournamentId: string, settings: { title: string; description: string; bannerUrl: string; stream?: Tournament['stream']; organizerPercentage: number; status: Tournament['status'] }) => Promise<void>;
}

export const OrganizerDashboardView: React.FC<OrganizerDashboardViewProps> = ({
  activeTournamentId,
  activeSection,
  transactions,
  pendingApprovals,
  tournaments = [],
  matches = [],
  participants = [],
  onNavigate,
  onSectionChange,
  onApproveTeam,
  onRejectTeam,
  onUpdateMatchScore,
  onGenerateBracket,
  onClearBracket,
  onScheduleMatch,
  onUpdateTournamentSettings,
}) => {
  const activeSidebarItem = activeSection;
  
  const [searchTx, setSearchTx] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [isGeneratingBracket, setIsGeneratingBracket] = useState(false);

  // Manual Add Team state
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCaptain, setNewTeamCaptain] = useState('');

  // Selected tournament for management
  // Match score edit state
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editScoreA, setEditScoreA] = useState<number>(0);
  const [editScoreB, setEditScoreB] = useState<number>(0);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleStream, setScheduleStream] = useState('');

  // Tournament settings editable state
  const currentTourn = tournaments.find(t => t.id === activeTournamentId) || tournaments[0];
  const [tournTitle, setTournTitle] = useState(currentTourn?.title || 'Torneo Principal');
  const [tournDescription, setTournDescription] = useState(currentTourn?.description || '');
  const [tournBannerUrl, setTournBannerUrl] = useState(currentTourn?.bannerUrl || '');
  const [streamEnabled, setStreamEnabled] = useState(Boolean(currentTourn?.stream));
  const [streamPlatform, setStreamPlatform] = useState<'twitch' | 'youtube'>(currentTourn?.stream?.platform || 'twitch');
  const [streamChannel, setStreamChannel] = useState(currentTourn?.stream?.channelName || '');
  const [streamUrl, setStreamUrl] = useState(currentTourn?.stream?.url || '');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [organizerFeePercent, setOrganizerFeePercent] = useState(currentTourn?.organizerPercentage ?? 15);
  const [tournStatus, setTournStatus] = useState<string>(currentTourn?.status || 'open');

  useEffect(() => {
    if (!currentTourn) return;
    setTournTitle(currentTourn.title);
    setTournDescription(currentTourn.description);
    setTournBannerUrl(currentTourn.bannerUrl);
    setOrganizerFeePercent(currentTourn.organizerPercentage);
    setTournStatus(currentTourn.status);
    setStreamEnabled(Boolean(currentTourn.stream));
    setStreamPlatform(currentTourn.stream?.platform || 'twitch');
    setStreamChannel(currentTourn.stream?.channelName || '');
    setStreamUrl(currentTourn.stream?.url || '');
    setSettingsError('');
  }, [currentTourn?.id]);

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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTourn) return;
    setSettingsError('');
    if (!tournTitle.trim() || tournTitle.trim().length > 50) return setSettingsError('El nombre debe tener entre 1 y 50 caracteres.');
    if (!tournDescription.trim() || tournDescription.trim().length > 80) return setSettingsError('La descripción debe tener entre 1 y 80 caracteres.');
    if (tournBannerUrl.trim()) {
      try { const parsed = new URL(tournBannerUrl); if (parsed.protocol !== 'https:') throw new Error(); }
      catch { return setSettingsError('La imagen necesita una URL HTTPS válida.'); }
    }
    if (streamEnabled) {
      try {
        const parsed = new URL(streamUrl);
        if (parsed.protocol !== 'https:') throw new Error();
      } catch { return setSettingsError('La transmisión necesita una URL HTTPS válida.'); }
    }
    try {
      setIsSavingSettings(true);
      await onUpdateTournamentSettings(currentTourn.id, { title: tournTitle, description: tournDescription, bannerUrl: tournBannerUrl, stream: streamEnabled ? { platform: streamPlatform, url: streamUrl.trim(), channelName: streamChannel.trim() || undefined } : undefined, organizerPercentage: organizerFeePercent, status: tournStatus as Tournament['status'] });
      setActionSuccessMessage('Configuración del torneo guardada.');
      setTimeout(() => setActionSuccessMessage(null), 3000);
    } catch (error) { setSettingsError(error instanceof Error ? error.message : 'No se pudo guardar la configuración.'); }
    finally { setIsSavingSettings(false); }
  };

  const handleGenerateBracket = async () => {
    setActionError(''); setIsGeneratingBracket(true);
    try { const count = await onGenerateBracket(activeTournamentId); setActionSuccessMessage(`Bracket generado con ${count} partidos reales.`); }
    catch (error) { setActionError(error instanceof Error ? error.message : 'No se pudo generar el bracket.'); }
    finally { setIsGeneratingBracket(false); }
  };

  const handleClearBracket = async () => {
    if (!window.confirm('¿Eliminar todos los partidos de esta llave? Esta acción no se puede deshacer.')) return;
    setActionError('');
    try { await onClearBracket(activeTournamentId); setActionSuccessMessage('Bracket eliminado. Ya puedes generar uno nuevo.'); }
    catch (error) { setActionError(error instanceof Error ? error.message : 'No se pudo eliminar el bracket.'); }
  };

  const handleSaveSchedule = async (matchId: string) => {
    if (!scheduleDate) return setActionError('Selecciona la fecha y hora del partido.');
    setActionError('');
    try { await onScheduleMatch(matchId, scheduleDate, scheduleStream); setEditingScheduleId(null); setActionSuccessMessage('Horario del partido actualizado.'); }
    catch (error) { setActionError(error instanceof Error ? error.message : 'No se pudo programar el partido.'); }
  };

  const handleBannerFile = async (file?: File) => {
    if (!file) return;
    setSettingsError('');
    try { setIsUploadingBanner(true); setTournBannerUrl(await uploadTournamentBanner(file)); }
    catch (error) { setSettingsError(error instanceof Error ? error.message : 'No se pudo subir la imagen.'); }
    finally { setIsUploadingBanner(false); }
  };

  const totalRevenue = (currentTourn?.financials?.registrationGross || 0) + (currentTourn?.financials?.sponsorGross || 0);
  const organizerCommission = currentTourn?.financials?.organizerAmount || 0;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row gap-6 font-['Golos_Text',sans-serif] text-black">
      
      {/* Organizer Sidebar */}
      <aside className="w-full md:w-64 shrink-0 flex flex-col gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-4 space-y-1 shadow-xs">
          <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            Gestión de Liga
          </div>

          <button
            onClick={() => onSectionChange('resumen')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors cursor-pointer ${
              activeSidebarItem === 'resumen' ? 'bg-black text-white' : 'text-gray-700 hover:bg-[#F3F4F6] hover:text-black'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Resumen General</span>
          </button>

          <button
            onClick={() => onSectionChange('finanzas')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors cursor-pointer ${
              activeSidebarItem === 'finanzas' ? 'bg-black text-white' : 'text-gray-700 hover:bg-[#F3F4F6] hover:text-black'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Finanzas y Pagos</span>
          </button>

          <button
            onClick={() => onSectionChange('participantes')}
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
            onClick={() => onSectionChange('partidos')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors cursor-pointer ${
              activeSidebarItem === 'partidos' ? 'bg-black text-white' : 'text-gray-700 hover:bg-[#F3F4F6] hover:text-black'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Partidos & Bracket</span>
          </button>

          <button
            onClick={() => onSectionChange('configuracion')}
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
            value={activeTournamentId}
            onChange={(e) => onNavigate('organizer-dashboard', e.target.value)}
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
        {actionError && <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-700">{actionError}</div>}

        {/* TAB 1: RESUMEN GENERAL */}
        {activeSidebarItem === 'resumen' && (
          <div className="space-y-6">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-xs">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Recaudación Total</span>
                <p className="text-2xl font-black text-black mt-1">${totalRevenue.toLocaleString()} MXN</p>
                <span className="text-[11px] text-gray-500 mt-1 block">Cobros confirmados por Stripe</span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-xs">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Margen Organizador</span>
                <p className="text-2xl font-black text-black mt-1">${organizerCommission.toLocaleString()} MXN</p>
                <span className="text-[11px] text-gray-500 mt-1 block">{organizerFeePercent}% del neto distribuible</span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-xs">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Equipos Registrados</span>
                <p className="text-2xl font-black text-black mt-1">{participants.length}</p>
                <span className="text-[11px] text-gray-500 mt-1 block">{pendingApprovals.length} por autorizar</span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-xs">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Partidos Totales</span>
                <p className="text-2xl font-black text-black mt-1">{matches.length}</p>
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
                    onClick={() => onSectionChange('participantes')}
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
                    onClick={() => onSectionChange('partidos')}
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
                      <td className="py-3.5 font-black">${tx.amount.toLocaleString('es-MX')} {tx.currency || 'MXN'}</td>
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
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div><h3 className="text-sm font-extrabold text-black">Organizar Partidos y Bracket</h3><p className="text-xs text-gray-500">Genera cruces únicamente con inscripciones confirmadas, programa horarios y captura resultados.</p></div>
              <div className="flex gap-2">{matches.length === 0 ? <button onClick={() => void handleGenerateBracket()} disabled={isGeneratingBracket || participants.length < 2} className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white disabled:opacity-40">{isGeneratingBracket ? 'Generando…' : 'Generar bracket'}</button> : <button onClick={() => void handleClearBracket()} className="rounded-full border border-red-200 px-4 py-2 text-xs font-bold text-red-700">Regenerar llave</button>}</div>
            </div>

            <div className="space-y-3">
              {matches.length === 0 && <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-xs text-gray-600">{participants.length < 2 ? 'Necesitas al menos dos participantes confirmados para generar la llave.' : 'Todavía no hay partidos. Genera el bracket cuando estén listas las inscripciones.'}</div>}
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

                  <div className="flex flex-col items-end gap-2">
                  {editingScheduleId === m.id && <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-white p-2"><input type="datetime-local" value={scheduleDate} onChange={e=>setScheduleDate(e.target.value)} className="rounded-lg border p-1.5 text-xs"/><input type="url" value={scheduleStream} onChange={e=>setScheduleStream(e.target.value)} placeholder="Stream HTTPS (opcional)" className="rounded-lg border p-1.5 text-xs"/><button onClick={()=>void handleSaveSchedule(m.id)} className="rounded-lg bg-black px-3 py-1.5 font-bold text-white">Guardar horario</button></div>}
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
                    <div className="flex flex-wrap items-center justify-end gap-3">
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
                      <button onClick={() => { setEditingScheduleId(m.id); setScheduleDate(m.date ? new Date(new Date(m.date).getTime() - new Date(m.date).getTimezoneOffset()*60000).toISOString().slice(0,16) : ''); setScheduleStream(m.streamUrl || ''); }} className="rounded-full border px-3 py-1.5 text-xs font-bold">Programar</button>
                    </div>
                  )}
                  </div>
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

            <div className="space-y-4 max-w-3xl text-xs">
              {settingsError && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 font-semibold text-red-700">{settingsError}</div>}
              <div>
                <label className="font-bold text-black block mb-1">Nombre del Torneo</label>
                <input
                  type="text"
                  value={tournTitle}
                  onChange={(e) => setTournTitle(e.target.value)}
                  maxLength={50}
                  className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-black font-medium outline-none focus:border-black"
                />
                <p className="mt-1 text-[11px] text-gray-500">{tournTitle.length}/50 caracteres</p>
              </div>

              <div><label className="font-bold text-black block mb-1">Descripción</label><textarea value={tournDescription} onChange={event => setTournDescription(event.target.value)} maxLength={80} rows={3} className="w-full resize-none rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 text-black outline-none focus:border-black" /><p className="mt-1 text-[11px] text-gray-500">{tournDescription.length}/80 caracteres</p></div>

              <div className="space-y-2 rounded-2xl border border-[#E5E7EB] p-4"><div><p className="font-bold text-black">Imagen del torneo</p><p className="text-[11px] text-gray-500">Sube JPG, PNG o WebP de máximo 5 MB, o pega una URL HTTPS.</p></div>{tournBannerUrl && <img src={tournBannerUrl} alt="Vista previa del torneo" className="h-40 w-full rounded-2xl object-cover" />}<input type="url" value={tournBannerUrl} onChange={event => setTournBannerUrl(event.target.value)} placeholder="https://..." className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 outline-none focus:border-black" /><label className="inline-flex w-fit cursor-pointer rounded-full border border-black px-4 py-2 font-bold"><input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={event => void handleBannerFile(event.target.files?.[0])} />{isUploadingBanner ? 'Subiendo…' : 'Subir nueva imagen'}</label></div>

              <div className="space-y-3 rounded-2xl border border-[#E5E7EB] p-4"><label className="flex items-center justify-between gap-3"><span><b className="block">Transmisión oficial</b><span className="text-[11px] text-gray-500">Muestra Twitch o YouTube en el detalle del torneo.</span></span><input type="checkbox" checked={streamEnabled} onChange={event => setStreamEnabled(event.target.checked)} className="h-5 w-5 accent-black" /></label>{streamEnabled && <div className="grid gap-3 md:grid-cols-3"><select value={streamPlatform} onChange={event => setStreamPlatform(event.target.value as 'twitch' | 'youtube')} className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 font-bold"><option value="twitch">Twitch</option><option value="youtube">YouTube</option></select><input value={streamChannel} onChange={event => setStreamChannel(event.target.value)} placeholder="Canal / nombre" maxLength={80} className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 outline-none focus:border-black" /><input type="url" value={streamUrl} onChange={event => setStreamUrl(event.target.value)} placeholder={streamPlatform === 'twitch' ? 'https://twitch.tv/canal' : 'https://youtube.com/watch?v=...'} className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 outline-none focus:border-black" /></div>}</div>

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
                disabled={isSavingSettings || isUploadingBanner}
                className="mt-4 px-6 py-2.5 bg-black text-white rounded-full font-bold text-xs hover:bg-gray-800 cursor-pointer shadow-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingSettings ? 'Guardando…' : 'Guardar Ajustes'}
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
