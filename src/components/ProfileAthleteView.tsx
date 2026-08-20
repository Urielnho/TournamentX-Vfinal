import React, { useState } from 'react';
import { UserProfile, ViewMode } from '../types';
import { Trophy, Award, TrendingUp, DollarSign, Edit3, Shield, CheckCircle2, Gamepad2, Sparkles, X, User } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProfileAthleteViewProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onNavigate: (view: ViewMode, tournamentId?: string) => void;
}

export const ProfileAthleteView: React.FC<ProfileAthleteViewProps> = ({
  user,
  onUpdateUser,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'actividad' | 'premios' | 'perfil' | 'seguridad'>('actividad');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editTag, setEditTag] = useState(user.gamerTag);
  const [editEmail, setEditEmail] = useState(user.email);

  const handleClaimPrize = (itemIndex: number) => {
    const item = user.financialHistory[itemIndex];
    if (item.status !== 'available') return;

    const newHistory = [...user.financialHistory];
    newHistory[itemIndex] = { ...item, status: 'claimed' };

    const updated: UserProfile = {
      ...user,
      totalWon: user.totalWon + item.amount,
      pendingAmount: Math.max(0, user.pendingAmount - item.amount),
      financialHistory: newHistory
    };

    onUpdateUser(updated);

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      name: editName,
      gamerTag: editTag,
      email: editEmail
    });
    setShowEditModal(false);
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-6 font-['Golos_Text',sans-serif] text-black">
      {/* Profile Header */}
      <div className="relative w-full rounded-3xl overflow-hidden border border-[#E5E7EB] bg-white shadow-xs">
        {/* Backdrop Banner */}
        <div 
          className="w-full h-44 md:h-52 bg-cover bg-center bg-black"
          style={{ backgroundImage: `url('${user.bannerUrl}')` }}
        >
          <div className="w-full h-full bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </div>

        {/* Profile Info Row */}
        <div className="p-6 md:p-8 pt-0 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 -mt-16 md:-mt-20 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="relative">
              <img 
                src={user.avatarUrl} 
                alt={user.name}
                className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-white shadow-xl ring-2 ring-black bg-gray-900"
              />
              <span className="absolute bottom-1 right-1 px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] font-bold shadow-xs">
                PRO
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-black">
                  {user.name}
                </h1>
                <span className="w-2.5 h-2.5 rounded-full bg-black" />
              </div>
              <p className="text-xs sm:text-sm text-gray-700 font-bold flex flex-wrap items-center gap-2">
                <span>{user.rank}</span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500">Nivel {user.level}</span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500">{user.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowEditModal(true)}
              className="px-5 py-2.5 rounded-full bg-[#F3F4F6] text-black font-bold text-xs hover:bg-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Edit3 className="w-4 h-4 text-black" />
              <span>Editar Perfil</span>
            </button>

            <button
              onClick={() => onNavigate('create-tournament')}
              className="px-5 py-2.5 rounded-full bg-black text-white font-bold text-xs hover:bg-gray-800 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Trophy className="w-4 h-4" />
              <span>Crear Torneo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-xs">
          <div className="flex justify-between items-center text-gray-500 mb-1">
            <span className="text-[10px] uppercase font-bold">Total Ganado</span>
            <DollarSign className="w-4 h-4 text-black" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-black">${user.totalWon.toLocaleString()} USD</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-xs">
          <div className="flex justify-between items-center text-gray-500 mb-1">
            <span className="text-[10px] uppercase font-bold">Por Reclamar</span>
            <Trophy className="w-4 h-4 text-black" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-black">${user.pendingAmount.toLocaleString()} USD</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-xs">
          <div className="flex justify-between items-center text-gray-500 mb-1">
            <span className="text-[10px] uppercase font-bold">Win Rate</span>
            <TrendingUp className="w-4 h-4 text-black" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-black">{user.stats.winRate}%</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-xs">
          <div className="flex justify-between items-center text-gray-500 mb-1">
            <span className="text-[10px] uppercase font-bold">Torneos Jugados</span>
            <Award className="w-4 h-4 text-black" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-black">{new Set(user.recentMatches.map(match => match.tournament)).size}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E5E7EB] pb-3">
        {(['actividad', 'premios', 'perfil', 'seguridad'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all capitalize cursor-pointer ${
              activeTab === tab 
                ? 'bg-black text-white shadow-xs' 
                : 'bg-white text-gray-700 border border-[#E5E7EB] hover:border-black'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab: ACTIVIDAD */}
      {activeTab === 'actividad' && (
        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] space-y-4 shadow-xs">
          <h3 className="text-sm font-extrabold text-black">Historial de Partidas y Torneos</h3>
          <div className="space-y-3">
            {user.recentMatches.map((act) => (
              <div key={act.id} className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-black text-sm block">{act.tournament}</span>
                  <span className="text-gray-500">vs. {act.opponent} • {act.timeAgo} • {act.game}</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-black text-white font-bold text-xs">
                  {act.result} · {act.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: PREMIOS */}
      {activeTab === 'premios' && (
        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] space-y-4 shadow-xs">
          <h3 className="text-sm font-extrabold text-black">Bolsa de Premios y Recompensas</h3>
          <div className="space-y-3">
            {user.financialHistory?.map((item, idx) => (
              <div key={item.id} className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-black text-sm block">{item.tournament}</span>
                  <span className="text-gray-500">{item.position} • ${item.amount} {item.currency}</span>
                </div>

                {item.status === 'available' ? (
                  <button
                    onClick={() => handleClaimPrize(idx)}
                    className="px-4 py-1.5 rounded-full bg-black text-white font-bold hover:bg-gray-800 cursor-pointer shadow-xs"
                  >
                    Reclamar Premio
                  </button>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-800 font-bold">
                    Reclamado
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: PERFIL */}
      {activeTab === 'perfil' && (
        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] space-y-6 shadow-xs">
          <div>
            <h3 className="text-sm font-extrabold text-black">Detalles de la Cuenta de Atleta</h3>
            <p className="text-xs text-gray-500">Información verificada y configuraciones competitivas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-500">Nombre de Usuario</span>
              <p className="font-bold text-black text-sm">{user.name}</p>
            </div>

            <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-500">GamerTag / Nickname</span>
              <p className="font-bold text-black text-sm">{user.gamerTag}</p>
            </div>

            <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-500">Correo Electrónico</span>
              <p className="font-bold text-black text-sm">{user.email}</p>
            </div>

            <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-500">Rango / Nivel de Atleta</span>
              <p className="font-bold text-black text-sm">{user.rank} (Nivel {user.level})</p>
            </div>

            <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-500">Rol en la Plataforma</span>
              <p className="font-bold text-black text-sm uppercase">{user.globalRole}</p>
            </div>

            <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-500">Billetera de Pagos</span>
              <p className="font-bold text-black text-sm">Stripe Connect & Transferencia Bancaria</p>
            </div>
          </div>

          <div className="pt-2 flex">
            <button
              onClick={() => setShowEditModal(true)}
              className="px-6 py-2.5 rounded-full bg-black text-white font-bold text-xs hover:bg-gray-800 transition-all cursor-pointer shadow-xs"
            >
              Editar Credenciales
            </button>
          </div>
        </div>
      )}

      {/* Tab: SEGURIDAD */}
      {activeTab === 'seguridad' && (
        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] space-y-6 shadow-xs">
          <div>
            <h3 className="text-sm font-extrabold text-black">Seguridad & Autenticación</h3>
            <p className="text-xs text-gray-500">Protege tu cuenta de torneos, billetera y llaves de acceso.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-bold text-black text-sm block">Autenticación de Dos Factores (2FA)</span>
                <span className="text-gray-500">Protección adicional para retiros de premios y transacciones.</span>
              </div>
              <span className="px-3 py-1 bg-black text-white text-[11px] font-bold rounded-full">
                ACTIVADO
              </span>
            </div>

            <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-bold text-black text-sm block">Verificación de Identidad de Atleta (KYC)</span>
                <span className="text-gray-500">Documento de identidad verificado para cobro de premios mayores.</span>
              </div>
              <span className="px-3 py-1 bg-black text-white text-[11px] font-bold rounded-full">
                VERIFICADO
              </span>
            </div>

            <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-bold text-black text-sm block">Sesiones Activas</span>
                <span className="text-gray-500">Último acceso: Navegador Web (Chrome 128) - Actual</span>
              </div>
              <button 
                onClick={() => alert('Otras sesiones cerradas exitosamente.')}
                className="px-3 py-1.5 bg-white border border-[#E5E7EB] text-black text-xs font-bold rounded-full hover:bg-gray-100 cursor-pointer"
              >
                Cerrar Otras
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-black rounded-3xl max-w-md w-full p-6 border border-[#E5E7EB] shadow-2xl relative">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black text-sm font-bold cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-lg font-extrabold text-black mb-1">Editar Información</h3>
            <p className="text-xs text-gray-500 mb-4">Actualiza tus credenciales de atleta o clan.</p>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-600 uppercase block mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] focus:border-black rounded-xl px-3.5 py-2.5 text-black outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-600 uppercase block mb-1">GamerTag / Nickname</label>
                <input 
                  type="text" 
                  value={editTag}
                  onChange={(e) => setEditTag(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] focus:border-black rounded-xl px-3.5 py-2.5 text-black outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-600 uppercase block mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] focus:border-black rounded-xl px-3.5 py-2.5 text-black outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 rounded-full border border-[#E5E7EB] text-gray-600 hover:bg-[#F3F4F6] font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-black text-white font-bold hover:bg-gray-800 active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
