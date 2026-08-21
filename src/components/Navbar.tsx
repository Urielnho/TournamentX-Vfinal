import React, { useEffect, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { ViewMode, UserProfile } from '../types';
import { Bell, ChevronDown, CreditCard, History, LogIn, LogOut, Menu, Search, Settings, ShieldCheck, Trophy, User, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AppNotification { id: string; title: string; body: string; event_type: string; read_at: string | null; created_at: string; }

interface NavbarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode, tournamentId?: string) => void;
  user: UserProfile;
  authUser: SupabaseUser | null;
  onSignIn: () => void;
  onSignOut: () => Promise<void>;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearchSubmit: () => void;
}
const links: { label: string; view: ViewMode }[] = [{ label: 'Inicio', view: 'home' }, { label: 'Equipos', view: 'teams' }, { label: 'Torneos', view: 'tournaments' }, { label: 'Partidos', view: 'matches' }];

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, user, authUser, onSignIn, onSignOut, searchQuery, onSearchQueryChange, onSearchSubmit }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const unreadCount = notifications.filter(item => !item.read_at).length;

  const loadNotifications = async () => {
    if (!supabase || !authUser) { setNotifications([]); return; }
    setNotificationsLoading(true);
    const { data } = await supabase.from('notifications').select('id,title,body,event_type,read_at,created_at').order('created_at',{ascending:false}).limit(20);
    setNotifications((data || []) as AppNotification[]); setNotificationsLoading(false);
  };
  useEffect(() => {
    void loadNotifications();
    if (!supabase || !authUser) return;
    const channel = supabase.channel(`notifications:${authUser.id}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:`user_id=eq.${authUser.id}`},payload=>setNotifications(previous=>[payload.new as AppNotification,...previous].slice(0,20))).subscribe();
    return () => { void supabase?.removeChannel(channel); };
  }, [authUser?.id]);

  const openNotification = async (item: AppNotification) => {
    if (supabase && !item.read_at) { const readAt=new Date().toISOString(); await supabase.from('notifications').update({read_at:readAt}).eq('id',item.id); setNotifications(previous=>previous.map(current=>current.id===item.id?{...current,read_at:readAt}:current)); }
    setNotificationsOpen(false);
    if (item.event_type.includes('team')) go('teams'); else if (item.event_type.includes('payment')) go('profile'); else go('tournaments');
  };
  const markAllRead = async () => {
    if (!supabase || !authUser || unreadCount===0) return; const readAt=new Date().toISOString();
    await supabase.from('notifications').update({read_at:readAt}).is('read_at',null); setNotifications(previous=>previous.map(item=>({...item,read_at:item.read_at||readAt})));
  };
  const go = (view: ViewMode) => { onNavigate(view); setProfileOpen(false); setMobileOpen(false); };
  const isActive = (view: ViewMode) => currentView === view || (view === 'tournaments' && ['tournament-detail', 'create-tournament', 'organizer-dashboard'].includes(currentView));
  const accountItems = [[User, 'Mi cuenta'], [CreditCard, 'Pagos'], [Trophy, 'Premios'], [History, 'Historial'], [Settings, 'Configuración']] as const;

  return <nav className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/95 text-black backdrop-blur-xl">
    <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-5 px-4 md:px-8">
      <button onClick={() => go('home')} className="shrink-0 text-xl font-black tracking-tight">TOURNAMENTX</button>
      <div className="hidden items-center gap-1 md:flex">{links.map(link => <button key={link.view} onClick={() => go(link.view)} className={`px-4 py-2 text-sm font-bold transition ${isActive(link.view) ? 'text-black' : 'text-gray-500 hover:text-black'}`}>{link.label}</button>)}</div>
      <form onSubmit={event => { event.preventDefault(); onSearchSubmit(); }} className="ml-auto hidden max-w-sm flex-1 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] px-3 py-2 focus-within:border-black lg:flex"><Search className="h-4 w-4 text-gray-400" /><input aria-label="Buscar torneos" value={searchQuery} onChange={event => onSearchQueryChange(event.target.value)} placeholder="Buscar por torneo, juego, modo u organizador" className="w-full bg-transparent text-xs outline-none placeholder:text-gray-400" /><button type="submit" className="sr-only">Buscar</button></form>
      <div className="ml-auto flex items-center gap-2 lg:ml-0">
        <div className="relative"><button aria-label={`Notificaciones${unreadCount?` (${unreadCount} sin leer)`:''}`} onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); if(!notificationsOpen) void loadNotifications(); }} className="relative rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-2.5 hover:border-black"><Bell className="h-4 w-4" />{unreadCount>0&&<span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-black px-1 text-center text-[9px] font-black leading-4 text-white">{unreadCount>9?'9+':unreadCount}</span>}</button>
          {notificationsOpen && <div className="absolute right-0 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl"><div className="flex items-center justify-between border-b p-4"><p className="text-sm font-black">Notificaciones</p>{unreadCount>0&&<button onClick={()=>void markAllRead()} className="text-[11px] font-bold text-gray-500 hover:text-black">Marcar todas como leídas</button>}</div><div className="max-h-96 overflow-y-auto p-2">{notificationsLoading?<p className="p-5 text-center text-xs text-gray-500">Cargando…</p>:!authUser?<button onClick={onSignIn} className="w-full rounded-xl bg-black p-3 text-xs font-bold text-white">Inicia sesión para ver tus avisos</button>:notifications.length===0?<p className="rounded-xl bg-[#F8F9FA] p-4 text-center text-xs text-gray-500">No tienes notificaciones.</p>:notifications.map(item=><button key={item.id} onClick={()=>void openNotification(item)} className={`mb-1 w-full rounded-xl p-3 text-left hover:bg-gray-100 ${item.read_at?'bg-white':'bg-gray-50'}`}><div className="flex gap-2"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.read_at?'bg-transparent':'bg-black'}`}/><div><p className="text-xs font-black">{item.title}</p><p className="mt-1 line-clamp-2 text-[11px] leading-4 text-gray-500">{item.body}</p><p className="mt-1.5 text-[10px] text-gray-400">{new Date(item.created_at).toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'})}</p></div></div></button>)}</div></div>}
        </div>
        {authUser ? <div className="relative"><button onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }} className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-1.5 pr-2 hover:border-black"><img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-lg object-cover" /><span className="hidden text-xs font-bold sm:block">{user.gamerTag}</span><ChevronDown className="h-3.5 w-3.5 text-gray-400" /></button>
          {profileOpen && <div className="absolute right-0 mt-3 w-60 rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-2xl"><div className="border-b border-[#E5E7EB] px-3 py-2"><p className="text-sm font-bold">{user.name}</p><p className="truncate text-[11px] text-gray-500">{authUser.email}</p></div>{user.globalRole === 'admin' && <button onClick={() => go('admin-panel')} className="flex w-full items-center gap-3 rounded-xl bg-black px-3 py-2.5 text-left text-xs font-bold text-white"><ShieldCheck className="h-4 w-4" />Panel de administración</button>}{accountItems.map(([Icon, label]) => <button key={label} onClick={() => go('profile')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-gray-600 hover:bg-[#F8F9FA] hover:text-black"><Icon className="h-4 w-4" />{label}</button>)}<button onClick={() => void onSignOut()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-gray-500 hover:bg-[#F8F9FA] hover:text-black"><LogOut className="h-4 w-4" />Cerrar sesión</button></div>}
        </div> : <button onClick={onSignIn} className="flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs font-black text-white transition hover:bg-gray-800"><LogIn className="h-4 w-4" /><span className="hidden sm:inline">Iniciar sesión</span></button>}
        <button aria-label="Abrir menú" onClick={() => setMobileOpen(!mobileOpen)} className="rounded-xl border border-white/10 p-2.5 md:hidden">{mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</button>
      </div>
    </div>
    {mobileOpen && <div className="grid grid-cols-4 border-t border-[#E5E7EB] bg-white px-2 py-2 md:hidden">{links.map(link => <button key={link.view} onClick={() => go(link.view)} className={`py-2 text-xs font-bold ${isActive(link.view) ? 'text-black' : 'text-gray-400'}`}>{link.label}</button>)}</div>}
  </nav>;
};
