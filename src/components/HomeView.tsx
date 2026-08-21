import React, { useState } from 'react';
import { ArrowRight, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { Tournament, ViewMode } from '../types';
import { isRegistrationOpen, isViewOnlyTournament } from '../utils/tournamentAvailability';

interface HomeViewProps {
  tournaments: Tournament[];
  onNavigate: (view: ViewMode, tournamentId?: string) => void;
}

const faqs = [
  { q: '¿Cómo me registro en un torneo?', a: 'Explora el catálogo, selecciona el evento y utiliza “Inscribirme”. Puedes participar individualmente o mediante un equipo, según la modalidad.' },
  { q: '¿Qué disciplinas están disponibles?', a: 'TournamentX incluye esports y deportes tradicionales, con formatos individuales y por equipos.' },
  { q: '¿Cómo se crean y gestionan torneos?', a: 'El asistente de creación permite definir modalidad, formato, cupo, reglas, inscripción y premios. Las herramientas de administración aparecen dentro de los torneos que hayas creado.' },
  { q: '¿Cómo se resuelven las disputas?', a: 'Los participantes pueden reportar una disputa y el organizador del torneo revisa evidencias, resultados y resolución dentro del contexto de la competencia.' },
];

export const HomeView: React.FC<HomeViewProps> = ({ tournaments, onNavigate }) => {
  const [selectedGameFilter, setSelectedGameFilter] = useState('ALL');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const matchingTournaments = tournaments.filter(tournament => {
    if (selectedGameFilter === 'ALL') return true;
    if (selectedGameFilter === 'Esports') return tournament.category === 'esports';
    if (selectedGameFilter === 'Traditional') return tournament.category === 'sports';
    return tournament.game.toLowerCase().includes(selectedGameFilter.toLowerCase());
  });
  const filteredTournaments = matchingTournaments.filter(tournament => isRegistrationOpen(tournament));
  const viewOnlyTournaments = matchingTournaments.filter(tournament => isViewOnlyTournament(tournament));
  const liveCount = tournaments.filter(tournament => isViewOnlyTournament(tournament)).length;
  const upcomingCount = tournaments.filter(tournament => isRegistrationOpen(tournament)).length;
  const recentWinners = tournaments.filter(tournament => tournament.status === 'completed').slice(0, 3);

  return <div className="flex w-full flex-col bg-white text-black font-['Golos_Text',sans-serif]">
    <section className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-10 px-6 py-12 md:px-12 md:py-20 lg:grid-cols-12 lg:gap-14">
      <div className="flex flex-col items-start justify-center lg:col-span-6">
        <h1 className="text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">Domina tus Torneos</h1>
        <h2 className="mt-1 text-4xl font-normal leading-[1.1] tracking-tight text-[#6C757D] sm:text-5xl lg:text-6xl">Esports y Deportes</h2>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-[#6C757D] sm:text-base">Bienvenido a TournamentX, donde la competencia se siente real. Crea torneos, forma equipos y demuestra tu habilidad.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={() => onNavigate('tournaments')} className="flex items-center gap-2 rounded-full bg-black px-8 py-3.5 text-sm font-bold text-white transition hover:bg-[#222]"><span>Explorar torneos</span><ChevronRight className="h-4 w-4" /></button>
          <button onClick={() => onNavigate('create-tournament')} className="rounded-full border border-black bg-white px-8 py-3.5 text-sm font-bold text-black transition hover:bg-gray-100">Crear mi torneo</button>
        </div>
      </div>
      <div className="lg:col-span-6"><div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2.5rem] border border-[#F1F3F5] bg-[#F8F9FA] shadow-sm md:aspect-[16/11]"><img src="https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80" alt="Competencia deportiva" className="h-full w-full object-cover transition duration-700 hover:scale-105" /></div></div>
    </section>

    <section className="mx-auto grid w-full max-w-[1440px] gap-4 px-6 pb-12 md:grid-cols-3 md:px-12">
      <button onClick={() => onNavigate('matches')} className="rounded-3xl border border-[#E5E7EB] bg-white p-6 text-left transition hover:border-black"><span className="text-xs font-bold uppercase text-gray-500">Ahora</span><strong className="mt-2 block text-3xl font-black">{liveCount}</strong><span className="text-sm text-gray-600">competencias en vivo</span></button>
      <button onClick={() => onNavigate('tournaments')} className="rounded-3xl border border-[#E5E7EB] bg-[#F8F9FA] p-6 text-left transition hover:border-black"><span className="text-xs font-bold uppercase text-gray-500">Próximamente</span><strong className="mt-2 block text-3xl font-black">{upcomingCount}</strong><span className="text-sm text-gray-600">torneos con registro abierto</span></button>
      <button onClick={() => onNavigate('create-tournament')} className="rounded-3xl bg-black p-6 text-left text-white transition hover:bg-[#222]"><span className="text-xs font-bold uppercase text-white/60">Tu competencia</span><strong className="mt-2 block text-xl font-black">Crear un torneo</strong><span className="mt-1 flex items-center gap-1 text-sm text-white/80">Configurar ahora <ArrowRight className="h-4 w-4" /></span></button>
    </section>

    <section className="mx-auto w-full max-w-[1440px] px-6 py-12 md:px-12">
      <div className="relative flex min-h-[430px] w-full flex-col justify-between overflow-hidden rounded-[2.5rem] bg-black p-8 text-white shadow-xl md:p-14">
        <img src="https://images.unsplash.com/photo-1560012057-4372e14c5085?auto=format&fit=crop&w=1600&q=80" alt="Cancha deportiva" className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/85 to-transparent" />
        <div className="relative z-10 max-w-xl"><span className="text-xs font-semibold text-white/90">Competencias destacadas</span><h2 className="mt-3 text-4xl font-black leading-[1.1] sm:text-5xl lg:text-6xl">Compite. Organiza.<br />Conquista.</h2><p className="mt-4 max-w-md text-sm leading-relaxed text-white/90 sm:text-base">Descubre torneos próximos, competencias en vivo y nuevas oportunidades para demostrar quién domina.</p><button onClick={() => onNavigate('tournaments')} className="mt-8 flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-black transition hover:bg-gray-200"><span>Ver torneos</span><ChevronRight className="h-4 w-4" /></button></div>
      </div>
    </section>

    <section id="tournaments-catalog" className="mx-auto w-full max-w-[1440px] border-t border-[#F1F3F5] px-6 py-16 md:px-12">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><span className="text-xs font-bold uppercase tracking-widest text-gray-500">Catálogo oficial</span><h2 className="mt-0.5 text-3xl font-extrabold tracking-tight sm:text-4xl">Torneos disponibles</h2><p className="text-xs text-[#6C757D] sm:text-sm">Inscríbete, asegura tu cupo y compite por premios.</p></div><div className="flex flex-wrap gap-2">{[{ id: 'ALL', label: 'Todos' }, { id: 'Esports', label: 'Esports' }, { id: 'Traditional', label: 'Deportes' }, { id: 'Valorant', label: 'Valorant' }, { id: 'Marvel Rivals', label: 'Marvel Rivals' }].map(filter => <button key={filter.id} onClick={() => setSelectedGameFilter(filter.id)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${selectedGameFilter === filter.id ? 'bg-black text-white' : 'border border-[#E5E7EB] bg-[#F8F9FA] text-[#6C757D] hover:border-black hover:text-black'}`}>{filter.label}</button>)}</div></div>
      {filteredTournaments.length === 0 ? <div className="rounded-3xl border border-[#E5E7EB] bg-[#F8F9FA] px-6 py-12 text-center"><h3 className="font-black">No hay inscripciones abiertas</h3><p className="mt-2 text-sm text-gray-500">Los torneos que cerraron sus inscripciones aparecen en “En vivo y para ver”.</p></div> : <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{filteredTournaments.slice(0, 6).map(tournament => <article key={tournament.id} onClick={() => onNavigate('tournament-detail', tournament.id)} className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white transition hover:border-black hover:shadow-xl"><div className="relative h-44 overflow-hidden bg-black"><img src={tournament.bannerUrl} alt={tournament.title} className="h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" /><span className="absolute left-3 top-3 rounded-full bg-black px-2.5 py-1 text-[11px] font-bold text-white">ABIERTO</span><span className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/70 px-2.5 py-1 text-xs font-bold text-white">{tournament.game}</span><div className="absolute bottom-3 left-3 right-3 text-white"><h3 className="truncate text-base font-bold">{tournament.title}</h3><p className="truncate text-[11px] text-gray-300">{tournament.gameMode} · {tournament.organizer.name}</p></div></div><div className="flex flex-1 flex-col justify-between gap-4 p-5"><div className="grid grid-cols-2 gap-2 text-xs"><div className="rounded-2xl border border-[#E5E7EB] bg-[#F8F9FA] p-2.5"><span className="block text-[10px] font-bold uppercase text-[#6C757D]">Premio</span><b className="text-sm">${tournament.basePrizePool.toLocaleString()} MXN</b></div><div className="rounded-2xl border border-[#E5E7EB] bg-[#F8F9FA] p-2.5"><span className="block text-[10px] font-bold uppercase text-[#6C757D]">Inscripción</span><b className="text-sm">{tournament.entryFeeAmount === 0 ? 'Gratis' : `$${tournament.entryFeeAmount} MXN`}</b></div></div><div className="flex items-center justify-between border-t border-[#E5E7EB] pt-3 text-xs"><span className="flex items-center gap-1 text-[#6C757D]"><Users className="h-3.5 w-3.5" />{tournament.participantsCount} / {tournament.maxParticipants}</span><span className="flex items-center gap-1 font-bold">Inscribirme<ArrowRight className="h-3 w-3" /></span></div></div></article>)}</div>}
      <div className="mt-10 text-center"><button onClick={() => onNavigate('tournaments')} className="inline-flex items-center gap-2 rounded-full bg-black px-8 py-3.5 text-sm font-bold text-white transition hover:bg-[#222]">Ver todos los torneos ({tournaments.length})<ArrowRight className="h-4 w-4" /></button></div>
    </section>

    {viewOnlyTournaments.length > 0 && <section className="mx-auto w-full max-w-[1440px] border-t border-[#F1F3F5] px-6 py-14 md:px-12"><div className="mb-6"><span className="text-xs font-bold uppercase tracking-widest text-gray-500">Competencia en curso</span><h2 className="mt-1 text-3xl font-extrabold">En vivo y para ver</h2><p className="mt-1 text-sm text-gray-500">Las inscripciones terminaron, pero puedes seguir sus partidos y resultados.</p></div><div className="grid gap-4 md:grid-cols-3">{viewOnlyTournaments.slice(0, 6).map(tournament => <button key={tournament.id} onClick={() => onNavigate('tournament-detail', tournament.id)} className="overflow-hidden rounded-3xl border border-[#E5E7EB] bg-black text-left text-white transition hover:-translate-y-1"><img src={tournament.bannerUrl} alt={tournament.title} className="h-32 w-full object-cover opacity-70" /><div className="p-5"><span className="text-[10px] font-black uppercase tracking-widest">{tournament.status === 'live' ? '● En vivo' : 'Inscripciones cerradas'}</span><strong className="mt-2 block text-base">{tournament.title}</strong><span className="mt-1 flex items-center gap-1 text-xs text-gray-300">Ver torneo <ArrowRight className="h-3.5 w-3.5" /></span></div></button>)}</div></section>}

    {recentWinners.length > 0 && <section className="mx-auto w-full max-w-[1440px] border-t border-[#F1F3F5] px-6 py-14 md:px-12"><div className="mb-6"><span className="text-xs font-bold uppercase tracking-widest text-gray-500">Resultados oficiales</span><h2 className="mt-1 text-3xl font-extrabold">Últimos campeones</h2></div><div className="grid gap-4 md:grid-cols-3">{recentWinners.map(tournament => <button key={tournament.id} onClick={() => onNavigate('tournament-detail', tournament.id)} className="flex items-center justify-between rounded-3xl border border-[#E5E7EB] bg-white p-5 text-left transition hover:border-black"><div><span className="text-[10px] font-bold uppercase text-gray-500">{tournament.game}</span><strong className="mt-1 block text-sm">{tournament.title}</strong><span className="mt-1 block text-xs text-gray-500">Torneo finalizado · ver resultados</span></div><ArrowRight className="h-4 w-4" /></button>)}</div></section>}

    <section className="mx-auto w-full max-w-4xl border-t border-[#F1F3F5] px-6 py-16 md:px-12"><div className="mb-10 text-center"><span className="text-xs font-bold uppercase tracking-widest text-gray-500">Dudas comunes</span><h2 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Preguntas frecuentes</h2></div><div className="space-y-4">{faqs.map((faq, index) => <div key={faq.q} className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#F8F9FA]"><button onClick={() => setOpenFaq(openFaq === index ? null : index)} className="flex w-full items-center justify-between gap-4 p-5 text-left"><b className="text-sm sm:text-base">{faq.q}</b><ChevronDown className={`h-5 w-5 text-[#6C757D] transition ${openFaq === index ? 'rotate-180' : ''}`} /></button>{openFaq === index && <div className="border-t border-[#E5E7EB] px-5 pb-5 pt-3 text-xs leading-relaxed text-[#6C757D] sm:text-sm">{faq.a}</div>}</div>)}</div></section>
  </div>;
};
