import React, { useState } from 'react';
import { Tournament, TournamentCategory, TournamentFormat, ViewMode, AccessType, EntryFeeType, PrizeType, Sponsor, TournamentLocation } from '../types';
import { GAMES_CATALOG } from '../data/mockData';
import { Trophy, CheckCircle2, ArrowRight, ArrowLeft, Gamepad2, Layers, DollarSign, Calendar, Sparkles, Shield, Upload, Globe, MapPin, Tv, Plus, Trash2, AlertCircle, Info, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { OrganizerFundingPayment } from './OrganizerFundingPayment';
import { createOrganizerPaymentIntent, uploadTournamentBanner, waitForOrganizerFunding } from '../services/supabaseData';

interface CreateTournamentWizardProps {
  onTournamentCreated: (newTournament: Tournament) => Promise<Tournament>;
  onTournamentPublished: (tournamentId: string) => Promise<void>;
  onNavigate: (view: ViewMode, tournamentId?: string) => void;
}

export const CreateTournamentWizard: React.FC<CreateTournamentWizardProps> = ({
  onTournamentCreated,
  onTournamentPublished,
  onNavigate
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Información General
  const [tournamentName, setTournamentName] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [hasStream, setHasStream] = useState(true);
  const [streamPlatform, setStreamPlatform] = useState<'twitch' | 'youtube'>('twitch');
  const [streamUrl, setStreamUrl] = useState('https://twitch.tv/tournamentx_live');
  const [channelName, setChannelName] = useState('TournamentX_Official');

  // Step 2: Categoría, Juego & Formato
  const [category, setCategory] = useState<TournamentCategory>('esports');
  const [selectedGameId, setSelectedGameId] = useState('lol');
  const [gameMode, setGameMode] = useState("5v5 Summoner's Rift Tournament Draft");
  const [format, setFormat] = useState<TournamentFormat>('single_elim');
  
  // Ubicación
  const [locationType, setLocationType] = useState<'online' | 'onsite'>('online');
  const [onlinePlatform, setOnlinePlatform] = useState('PC');
  const [onlineServer, setOnlineServer] = useState('Latam Norte / Bogotá');
  const [onlineRegion, setOnlineRegion] = useState('América Latina');
  const [venueName, setVenueName] = useState('Arena Esports México');
  const [venueAddress, setVenueAddress] = useState('Insurgentes Sur 1200, Benito Juárez, CDMX');

  // Step 3: Fechas, Acceso y Cupos
  const [startDate, setStartDate] = useState('2026-11-15T18:00');
  const [endDate, setEndDate] = useState('2026-11-18T23:00');
  const [registrationDeadline, setRegistrationDeadline] = useState('2026-11-14T23:59');
  const [accessType, setAccessType] = useState<AccessType>('public');
  const [participantType, setParticipantType] = useState<'individual' | 'team'>('team');
  const [maxParticipants, setMaxParticipants] = useState(16);
  const [minPlayersPerTeam, setMinPlayersPerTeam] = useState(5);

  // Reglas editables
  const [rules, setRules] = useState<string[]>([
    'Todos los jugadores deben registrar su ID de juego verificado.',
    'Check-in obligatorio 15 minutos antes de la hora estipulada.',
    'Respetar el código de conducta y fair-play de TournamentX.'
  ]);
  const [newRuleInput, setNewRuleInput] = useState('');

  // Step 4: Tarifas, Premios, Patrocinadores & Porcentaje Organizador
  const [entryFeeType, setEntryFeeType] = useState<EntryFeeType>('paid_per_team');
  const [entryFeeAmount, setEntryFeeAmount] = useState(250);
  const [organizerPercentage, setOrganizerPercentage] = useState(15);
  const [prizeType, setPrizeType] = useState<PrizeType>('monetary');
  const [basePrizePool, setBasePrizePool] = useState(5000);
  const [prizePercentages, setPrizePercentages] = useState<number[]>([100]);
  const [fundingClientSecret, setFundingClientSecret] = useState('');
  const [draftTournamentId, setDraftTournamentId] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [otherPrizeDesc, setOtherPrizeDesc] = useState('Trofeo de Campeón + Medallas');
  
  // Patrocinadores
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorContribution, setSponsorContribution] = useState(5000);
  const [sponsorLink, setSponsorLink] = useState('https://');
  const [formError, setFormError] = useState('');

  const selectedGame = GAMES_CATALOG.find(g => g.id === selectedGameId) || GAMES_CATALOG[0];

  const handleGameSelect = (gameId: string) => {
    setSelectedGameId(gameId);
    const game = GAMES_CATALOG.find(g => g.id === gameId);
    if (game) {
      if (game.modes.length > 0) {
        setGameMode(game.modes[0]);
      }
      setMinPlayersPerTeam(game.minPlayers);
      setParticipantType(game.minPlayers === 1 ? 'individual' : 'team');
      if (game.defaultRules) {
        setRules([...game.defaultRules]);
      }
    }
  };

  const handleAddSponsor = () => {
    if (!sponsorName.trim()) return;
    const newSponsor: Sponsor = {
      id: `sp-${Date.now()}`,
      name: sponsorName.trim(),
      logo: sponsorName.slice(0, 8).toUpperCase(),
      contribution: Number(sponsorContribution) || 0,
      link: sponsorLink.trim() || 'https://'
    };
    setSponsors([...sponsors, newSponsor]);
    setSponsorName('');
    setSponsorContribution(2000);
  };

  const handleRemoveSponsor = (id: string) => {
    setSponsors(sponsors.filter(s => s.id !== id));
  };

  const handleAddRule = () => {
    if (!newRuleInput.trim()) return;
    setRules([...rules, newRuleInput.trim()]);
    setNewRuleInput('');
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, idx) => idx !== index));
  };

  // Cálculos dinámicos
  const totalSponsorContributions = sponsors.reduce((acc, s) => acc + (Number(s.contribution) || 0), 0);
  const estimatedEntryFees = entryFeeType === 'free' ? 0 : entryFeeAmount * maxParticipants;
  const grossPrizePool = (prizeType === 'monetary' ? basePrizePool : 0) + estimatedEntryFees + totalSponsorContributions;
  const organizerCut = Math.round((grossPrizePool * organizerPercentage) / 100);
  const netPrizePool = Math.max(0, grossPrizePool - organizerCut);
  const prizePercentageTotal = prizePercentages.reduce((sum, value) => sum + value, 0);

  const validateStep = (step: number) => {
    let error = '';
    if (step === 1 && (!tournamentName.trim() || !description.trim())) error = 'Completa el nombre y la descripción del torneo.';
    else if (step === 1 && hasStream && !streamUrl.trim()) error = 'Agrega el enlace de la transmisión o desactiva esta opción.';
    else if (step === 2 && locationType === 'online' && (!onlinePlatform.trim() || !onlineServer.trim())) error = 'Indica la plataforma y el servidor del torneo en línea.';
    else if (step === 2 && locationType === 'onsite' && (!venueName.trim() || !venueAddress.trim())) error = 'Indica el recinto y la dirección del torneo presencial.';
    else if (step === 3 && (!startDate || !endDate || !registrationDeadline)) error = 'Completa las fechas del torneo y de inscripción.';
    else if (step === 3 && new Date(endDate) <= new Date(startDate)) error = 'La fecha de finalización debe ser posterior al inicio.';
    else if (step === 3 && new Date(registrationDeadline) > new Date(startDate)) error = 'El cierre de inscripciones no puede ser posterior al inicio.';
    else if (step === 3 && maxParticipants < 2) error = 'El torneo necesita al menos dos participantes.';
    else if (step === 3 && rules.length === 0) error = 'Agrega al menos una regla.';
    else if (step === 4 && entryFeeType !== 'free' && entryFeeAmount <= 0) error = 'La inscripción de pago debe tener un importe mayor a cero.';
    else if (step === 4 && prizeType === 'monetary' && (basePrizePool < 1 || basePrizePool > 10000000)) error = 'El premio monetario debe estar entre $1 y $10,000,000 MXN.';
    else if (step === 4 && prizeType === 'monetary' && prizePercentageTotal !== 100) error = 'Los porcentajes de los lugares premiados deben sumar exactamente 100%.';
    else if (step === 4 && prizeType === 'other' && !otherPrizeDesc.trim()) error = 'Describe el premio no monetario.';
    setFormError(error);
    return !error;
  };

  const handleContinue = () => {
    if (validateStep(currentStep)) setCurrentStep(prev => prev + 1);
  };

  const handleFinish = async () => {
    if (!validateStep(4)) return;
    const created: Tournament = {
      id: `tourn-${Date.now()}`,
      title: tournamentName.trim(),
      description: description.trim(),
      game: selectedGame.name,
      gameMode: gameMode,
      category: category,
      format: format,
      status: prizeType === 'monetary' && basePrizePool > 0 ? 'draft' : 'open',
      accessType: accessType,
      bannerUrl: bannerUrl.trim() || selectedGame.imageUrl,
      location: {
        type: locationType,
        platform: locationType === 'online' ? onlinePlatform : undefined,
        server: locationType === 'online' ? onlineServer : undefined,
        region: locationType === 'online' ? onlineRegion : undefined,
        venueName: locationType === 'onsite' ? venueName : undefined,
        address: locationType === 'onsite' ? venueAddress : undefined,
      },
      stream: hasStream ? {
        platform: streamPlatform,
        url: streamUrl,
        channelName: channelName || 'TournamentX Stream'
      } : undefined,
      startDate: startDate,
      endDate: endDate,
      registrationDeadline: registrationDeadline,
      participantType: participantType,
      minPlayersPerTeam: minPlayersPerTeam,
      participantsCount: 0,
      maxParticipants: maxParticipants,
      entryFeeType: entryFeeType,
      entryFeeAmount: entryFeeType === 'free' ? 0 : entryFeeAmount,
      organizerPercentage: organizerPercentage,
      hasReceivedPayments: false,
      prizeType: prizeType,
      basePrizePool: basePrizePool,
      otherPrizeDescription: prizeType === 'other' ? otherPrizeDesc : undefined,
      sponsors: sponsors,
      rules: rules,
      prizesBreakdown: prizeType === 'monetary' ? prizePercentages.map((percentage, index) => ({
        place: `${index + 1}.${index === 0 ? 'er' : 'º'} Lugar`, percentage,
        estimatedAmount: Math.round(netPrizePool * percentage / 100), description: `${percentage}% de la bolsa neta`
      })) : [],
      organizerId: '',
      organizer: {
        name: 'Organizador'
      },
      isUserOrganizing: true
    };

    try {
      setIsPublishing(true);
      const savedTournament = draftTournamentId ? { ...created, id: draftTournamentId } : await onTournamentCreated(created);
      if (created.status === 'draft') {
        setDraftTournamentId(savedTournament.id);
        const clientSecret = await createOrganizerPaymentIntent(savedTournament.id);
        setFundingClientSecret(clientSecret);
        setIsPublishing(false);
        return;
      }
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 } });
      onNavigate('tournament-detail', savedTournament.id);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No se pudo publicar el torneo.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleModeSelect = (mode: string) => {
    setGameMode(mode);
    const normalized = mode.toLowerCase();
    const individual = normalized.includes('individual') || normalized.includes('solo ') || normalized.includes('1v1');
    const sizeMatch = mode.match(/(\d+)v\d+|(?:dúo|dobles).*?(\d+)|escuadrón.*?(\d+)/i);
    const teamSize = Number(sizeMatch?.[1] || sizeMatch?.[2] || sizeMatch?.[3] || selectedGame.minPlayers);
    setParticipantType(individual ? 'individual' : 'team');
    setMinPlayersPerTeam(individual ? 1 : Math.max(2, teamSize));
  };

  const handleBannerUpload = async (file?: File) => {
    if (!file) return;
    setFormError('');
    setIsUploadingBanner(true);
    try { setBannerUrl(await uploadTournamentBanner(file)); }
    catch (error) { setFormError(error instanceof Error ? error.message : 'No se pudo subir la imagen.'); }
    finally { setIsUploadingBanner(false); }
  };

  const handleFundingPaid = async () => {
    await waitForOrganizerFunding(draftTournamentId);
    await onTournamentPublished(draftTournamentId);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 } });
    onNavigate('tournament-detail', draftTournamentId);
  };

  return (
    <div className="w-full max-w-[1000px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-6 font-['Golos_Text',sans-serif] text-black">
      {/* Header & Steps */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-black">
                Paso {currentStep} de 4
              </span>
              <span className="text-xs text-gray-500">• Módulo de Creación</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-black mt-0.5">
              {currentStep === 1 && 'Información General & Transmisión'}
              {currentStep === 2 && 'Categoría, Juego, Formato & Ubicación'}
              {currentStep === 3 && 'Fechas, Acceso, Cupos & Reglas'}
              {currentStep === 4 && 'Premios, Patrocinadores & Publicación'}
            </h1>
          </div>

          <button 
            onClick={() => onNavigate('tournaments')}
            className="text-xs text-gray-500 hover:text-black transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden flex">
          <div 
            className="bg-black h-full transition-all duration-300 rounded-full" 
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Form Box */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-xs">
        
        {/* STEP 1: INFORMACIÓN GENERAL */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-black uppercase flex items-center gap-1">
                  <span>Nombre del Torneo</span>
                  <span className="text-black font-black">*</span>
                </label>
                <span className="text-xs text-gray-500 font-bold">
                  {tournamentName.length} / 20 caracteres
                </span>
              </div>
              <input 
                type="text" 
                maxLength={20}
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                placeholder="Ej. Cyber Clash 2024"
                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-3.5 text-xs text-black focus:border-black outline-none font-medium"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-black uppercase flex items-center gap-1">
                  <span>Descripción del Torneo</span>
                  <span className="text-black font-black">*</span>
                </label>
                <span className="text-xs text-gray-500 font-bold">
                  {description.length} / 50 caracteres
                </span>
              </div>
              <input 
                type="text" 
                maxLength={50}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Torneo táctico de élite con gran final en vivo."
                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-3.5 text-xs text-black focus:border-black outline-none font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-black uppercase flex items-center gap-2">
                <Upload className="w-3.5 h-3.5 text-black" />
                <span>Banner del Torneo (Opcional)</span>
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-400 bg-[#F9FAFB] p-5 text-xs font-bold hover:border-black">
                <Upload className="h-4 w-4" />
                {isUploadingBanner ? 'Subiendo imagen…' : bannerUrl ? 'Cambiar imagen' : 'Seleccionar imagen desde tu equipo'}
                <input type="file" accept="image/jpeg,image/png,image/webp" disabled={isUploadingBanner} onChange={event => void handleBannerUpload(event.target.files?.[0])} className="sr-only" />
              </label>
              <p className="text-[11px] text-gray-500">Opcional · JPG, PNG o WebP · máximo 5 MB. Si no agregas una, se usará la imagen oficial de la disciplina seleccionada.</p>
              {bannerUrl && <div className="relative overflow-hidden rounded-2xl border"><img src={bannerUrl} alt="Vista previa del banner" className="h-36 w-full object-cover" /><button type="button" onClick={() => setBannerUrl('')} className="absolute right-2 top-2 rounded-full bg-black px-3 py-1.5 text-[11px] font-bold text-white">Usar predeterminada</button></div>}
            </div>

            <div className="p-5 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Tv className="w-5 h-5 text-black" />
                  <div>
                    <h3 className="font-bold text-xs text-black">Transmisión Oficial (Opcional)</h3>
                    <p className="text-[11px] text-gray-500">Embebe un stream de Twitch o YouTube para tus espectadores</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={hasStream} 
                  onChange={(e) => setHasStream(e.target.checked)} 
                  className="w-4 h-4 accent-black cursor-pointer"
                />
              </div>

              {hasStream && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E5E7EB]">
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-500 font-bold">Plataforma</label>
                    <select
                      value={streamPlatform}
                      onChange={(e) => setStreamPlatform(e.target.value as 'twitch' | 'youtube')}
                      className="w-full bg-white border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-black outline-none"
                    >
                      <option value="twitch">Twitch</option>
                      <option value="youtube">YouTube Live</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-500 font-bold">Canal / Nombre</label>
                    <input
                      type="text"
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      placeholder="Ej. TournamentX_Official"
                      className="w-full bg-white border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-black outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-500 font-bold">Enlace directo (URL)</label>
                    <input
                      type="url"
                      value={streamUrl}
                      onChange={(e) => setStreamUrl(e.target.value)}
                      placeholder="https://twitch.tv/..."
                      className="w-full bg-white border border-[#E5E7EB] rounded-xl p-2.5 text-xs text-black outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: CATEGORÍA, JUEGO, FORMATO & UBICACIÓN */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-black uppercase">
                1. Selecciona la Categoría
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setCategory('esports');
                    handleGameSelect('lol');
                  }}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                    category === 'esports'
                      ? 'border-black bg-[#F3F4F6] text-black font-bold shadow-xs'
                      : 'border-[#E5E7EB] bg-white text-gray-500'
                  }`}
                >
                  <Gamepad2 className="w-6 h-6 text-black" />
                  <span className="text-xs font-bold">Esports</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCategory('sports');
                    handleGameSelect('soccer');
                  }}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                    category === 'sports'
                      ? 'border-black bg-[#F3F4F6] text-black font-bold shadow-xs'
                      : 'border-[#E5E7EB] bg-white text-gray-500'
                  }`}
                >
                  <Trophy className="w-6 h-6 text-black" />
                  <span className="text-xs font-bold">Deportes Tradicionales</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-black uppercase">
                2. Disciplina / Título
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {GAMES_CATALOG.filter(g => g.category === category).map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => handleGameSelect(game.id)}
                    className={`rounded-2xl border overflow-hidden flex flex-col text-left transition-all cursor-pointer ${
                      selectedGameId === game.id
                        ? 'border-black ring-2 ring-black shadow-xs'
                        : 'border-[#E5E7EB] hover:border-black'
                    }`}
                  >
                    <div className="h-20 w-full relative overflow-hidden bg-black">
                      <img 
                        src={game.imageUrl} 
                        alt={game.name}
                        className="w-full h-full object-cover opacity-90" 
                      />
                      {selectedGameId === game.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black text-white flex items-center justify-center font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 bg-white flex-1">
                      <span className="font-bold text-xs text-black truncate block">{game.name}</span>
                      <span className="text-[10px] text-gray-500">{game.formatLabel}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-black uppercase">
                  Modo de Juego
                </label>
                <select 
                  value={gameMode}
                  onChange={(e) => handleModeSelect(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-3 text-xs text-black outline-none font-medium"
                >
                  {selectedGame.modes.map((mode, idx) => (
                    <option key={idx} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-black uppercase">
                  Formato del Torneo
                </label>
                <select 
                  value={format}
                  onChange={(e) => setFormat(e.target.value as TournamentFormat)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-3 text-xs text-black outline-none font-medium"
                >
                  <option value="single_elim">Eliminación directa (Single Elimination)</option>
                  <option value="double_elim">Doble eliminación (Winners & Losers)</option>
                  <option value="group_stage">Fase de grupos</option>
                  <option value="groups_elim">Fase de grupos + eliminación</option>
                  <option value="round_robin">Todos contra todos (Round Robin)</option>
                  <option value="league">Liga por puntos</option>
                  <option value="battle_royale">Battle Royale</option>
                  <option value="custom">Formato personalizado</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#E5E7EB]">
              <label className="text-xs font-bold text-black uppercase">Ubicación del torneo</label>
              <div className="grid grid-cols-2 gap-2">
                {([['online', 'En línea', Globe], ['onsite', 'Presencial', MapPin]] as const).map(([id, label, Icon]) => (
                  <button key={id} type="button" onClick={() => setLocationType(id)} className={`rounded-2xl border p-3 text-xs font-bold flex items-center justify-center gap-2 ${locationType === id ? 'border-black bg-black text-white' : 'border-[#E5E7EB] bg-white text-black'}`}>
                    <Icon className="w-4 h-4" />{label}
                  </button>
                ))}
              </div>
              {locationType === 'online' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input value={onlinePlatform} onChange={e => setOnlinePlatform(e.target.value)} placeholder="Plataforma" className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-xs outline-none" />
                  <input value={onlineServer} onChange={e => setOnlineServer(e.target.value)} placeholder="Servidor" className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-xs outline-none" />
                  <input value={onlineRegion} onChange={e => setOnlineRegion(e.target.value)} placeholder="Región" className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-xs outline-none" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input value={venueName} onChange={e => setVenueName(e.target.value)} placeholder="Nombre del recinto" className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-xs outline-none" />
                  <input value={venueAddress} onChange={e => setVenueAddress(e.target.value)} placeholder="Dirección completa" className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-xs outline-none" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: FECHAS, ACCESO, CUPOS & REGLAS */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-black uppercase flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-black" />
                  <span>Inicio del Torneo</span>
                </label>
                <input 
                  type="datetime-local" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-3 text-xs text-black outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-black uppercase flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-black" />
                  <span>Finalización</span>
                </label>
                <input 
                  type="datetime-local" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-3 text-xs text-black outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-black uppercase flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-black" />
                  <span>Cierre Inscripciones</span>
                </label>
                <input 
                  type="datetime-local" 
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-3 text-xs text-black outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#E5E7EB]">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-black uppercase">Cupo Máximo</label>
                <input
                  type="number"
                  min={2}
                  max={256}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-3 text-xs text-black outline-none font-bold"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[8, 16, 32, 64].map(n => <button key={n} type="button" onClick={() => setMaxParticipants(n)} className="rounded-full border border-[#E5E7EB] px-2.5 py-1 text-[10px] font-bold hover:border-black">{n}</button>)}
                </div>
                {maxParticipants % 2 !== 0 && <p className="text-[11px] text-gray-600">Cupo impar: la llave necesitará un BYE o un ajuste manual.</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-black uppercase">Modalidad</label>
                <select
                  value={participantType}
                  onChange={(e) => setParticipantType(e.target.value as 'individual' | 'team')}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-3 text-xs text-black outline-none font-bold"
                >
                  <option value="team">Por Equipos (Squad / Team)</option>
                  <option value="individual">Individual (1v1 / Solo)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-[#E5E7EB]">
              <label className="text-xs font-bold text-black uppercase">Acceso a inscripciones</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setAccessType('public')} className={`rounded-xl p-3 text-xs font-bold ${accessType === 'public' ? 'bg-black text-white' : 'border border-[#E5E7EB] bg-white'}`}>Público · ingreso directo</button>
                <button type="button" onClick={() => setAccessType('private')} className={`rounded-xl p-3 text-xs font-bold ${accessType === 'private' ? 'bg-black text-white' : 'border border-[#E5E7EB] bg-white'}`}>Privado · requiere aprobación</button>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#E5E7EB]">
              <label className="text-xs font-bold text-black uppercase flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-black" />
                <span>Reglas Oficiales del Torneo</span>
              </label>

              <div className="space-y-2">
                {rules.map((rule, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-xs text-black">
                    <span>• {rule}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveRule(idx)}
                      className="text-gray-500 hover:text-black ml-2 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newRuleInput}
                  onChange={(e) => setNewRuleInput(e.target.value)}
                  placeholder="Escribe una regla adicional..."
                  className="flex-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl px-3.5 py-2.5 text-xs text-black outline-none focus:border-black"
                />
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="px-4 py-2.5 bg-black text-white text-xs font-bold rounded-full hover:bg-gray-800 cursor-pointer"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PREMIOS, PATROCINADORES & PUBLICACIÓN */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-black uppercase">Tipo de premio</label>
              <div className="grid grid-cols-3 gap-2">
                {([['monetary', 'Monetario'], ['other', 'Otro premio'], ['no_prize', 'Sin premio']] as const).map(([id, label]) => (
                  <button key={id} type="button" onClick={() => { setPrizeType(id); if (id === 'no_prize') setOrganizerPercentage(0); }} className={`rounded-xl p-3 text-xs font-bold ${prizeType === id ? 'bg-black text-white' : 'border border-[#E5E7EB] bg-white'}`}>{label}</button>
                ))}
              </div>
              {prizeType === 'other' && <div className="space-y-1.5"><input value={otherPrizeDesc} onChange={e => setOtherPrizeDesc(e.target.value)} placeholder="Describe trofeo, productos o reconocimientos" className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-xs outline-none" /><p className="text-[11px] text-gray-500">El organizador es responsable de entregar los premios no monetarios descritos.</p></div>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-black uppercase">Costo de Inscripción</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEntryFeeType('free')}
                    className={`py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      entryFeeType === 'free' ? 'bg-black text-white' : 'bg-[#F9FAFB] text-gray-700'
                    }`}
                  >
                    Gratis
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryFeeType('paid_per_team')}
                    className={`py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      entryFeeType !== 'free' ? 'bg-black text-white' : 'bg-[#F9FAFB] text-gray-700'
                    }`}
                  >
                    De pago (MXN)
                  </button>
                </div>

                {entryFeeType !== 'free' && (
                  <input 
                    type="number" 
                    min={1} 
                    value={entryFeeAmount}
                    onChange={(e) => setEntryFeeAmount(Number(e.target.value))}
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-3 text-xs text-black outline-none mt-2"
                  />
                )}
              </div>

              {prizeType === 'monetary' && <div className="space-y-2">
                <label className="text-xs font-bold text-black uppercase">Aporte Base del Organizador (MXN)</label>
                <input 
                  type="number" 
                  min={1}
                  max={10000000}
                  value={basePrizePool}
                  onChange={(e) => setBasePrizePool(Number(e.target.value))}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-3 text-xs text-black outline-none"
                />
              </div>}
            </div>

            {prizeType !== 'no_prize' && <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><label className="text-xs font-bold uppercase">Porcentaje del organizador</label><div className="relative"><input type="number" min={0} max={50} value={organizerPercentage} onChange={e => setOrganizerPercentage(Math.min(50, Math.max(0, Number(e.target.value))))} className="w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 pr-9 text-xs outline-none" /><span className="absolute right-4 top-3 text-xs font-bold">%</span></div><p className="text-[11px] text-gray-500">Será visible antes de cualquier pago y se bloqueará al recibir el primero.</p></div>
              <div className="space-y-2"><label className="text-xs font-bold uppercase">Agregar patrocinador</label><div className="flex gap-2"><input value={sponsorName} onChange={e => setSponsorName(e.target.value)} placeholder="Nombre" className="min-w-0 flex-1 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-xs outline-none" /><input type="number" min={0} value={sponsorContribution} onChange={e => setSponsorContribution(Number(e.target.value))} className="w-28 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-xs outline-none" /><button type="button" onClick={handleAddSponsor} className="rounded-full bg-black px-3 text-white" aria-label="Agregar patrocinador"><Plus className="w-4 h-4" /></button></div><input type="url" value={sponsorLink} onChange={e => setSponsorLink(e.target.value)} placeholder="https://sitio-del-patrocinador.com" className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-xs outline-none" /></div>
            </div>}

            {prizeType !== 'no_prize' && sponsors.length > 0 && <div className="space-y-2">{sponsors.map(s => <div key={s.id} className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2 text-xs"><span><strong>{s.name}</strong> · ${s.contribution.toLocaleString()} MXN</span><button type="button" onClick={() => handleRemoveSponsor(s.id)} aria-label={`Quitar ${s.name}`}><Trash2 className="w-4 h-4" /></button></div>)}</div>}

            {prizeType === 'monetary' && <div className="space-y-3 rounded-2xl border border-[#E5E7EB] p-4">
              <div className="flex items-center justify-between"><div><h4 className="text-xs font-bold uppercase">Lugares premiados</h4><p className="text-[11px] text-gray-500">Puedes dejar solo el primer lugar o agregar más. El total debe ser 100%.</p></div><button type="button" disabled={prizePercentages.length >= 10} onClick={() => setPrizePercentages(values => [...values, 0])} className="rounded-full border px-3 py-2 text-xs font-bold disabled:opacity-40"><Plus className="inline h-3.5 w-3.5" /> Lugar</button></div>
              <div className="grid gap-2 sm:grid-cols-2">{prizePercentages.map((percentage, index) => <div key={index} className="flex items-center gap-2 rounded-xl bg-[#F9FAFB] p-2"><span className="min-w-20 text-xs font-bold">{index + 1}.{index === 0 ? 'er' : 'º'} lugar</span><input aria-label={`Porcentaje del lugar ${index + 1}`} type="number" min={0} max={100} step={0.01} value={percentage} onChange={event => setPrizePercentages(values => values.map((value, itemIndex) => itemIndex === index ? Math.min(100, Math.max(0, Number(event.target.value))) : value))} className="min-w-0 flex-1 rounded-lg border bg-white p-2 text-xs" /><span className="text-xs font-bold">%</span>{prizePercentages.length > 1 && <button type="button" aria-label={`Quitar lugar ${index + 1}`} onClick={() => setPrizePercentages(values => values.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></button>}</div>)}</div>
              <p className={`text-xs font-bold ${prizePercentageTotal === 100 ? 'text-green-700' : 'text-red-600'}`}>Total: {prizePercentageTotal}% {prizePercentageTotal === 100 ? '✓' : '— debe sumar 100%'}</p>
            </div>}

            {/* Cálculo de la Bolsa de Premios */}
            {prizeType === 'monetary' && <div className="bg-black text-white p-6 rounded-3xl border border-gray-800 space-y-4 shadow-xs">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-white" />
                  <span>Bolsa Neta de Premios a Entregar</span>
                </h4>
                <span className="text-base font-black text-white">
                  ${netPrizePool.toLocaleString()} MXN
                </span>
              </div>

              <div className="grid gap-3 text-xs pt-2 border-t border-gray-800 sm:grid-cols-2 lg:grid-cols-3">{prizePercentages.map((percentage, index) => <div key={index} className="bg-gray-900 border border-gray-800 p-3 rounded-2xl text-center"><span className="text-[10px] text-gray-400 block">{index + 1}.{index === 0 ? 'er' : 'º'} Lugar ({percentage}%)</span><span className="text-sm font-black text-white">${Math.round(netPrizePool * percentage / 100).toLocaleString()}</span></div>)}</div>
              <p className="text-[10px] text-gray-400">Proyección con cupo completo. La bolsa real solo contabilizará inscripciones efectivamente pagadas y aportes confirmados.</p>
            </div>}
            {fundingClientSecret && <div className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-sm"><h3 className="mb-1 text-lg font-black">Paga la bolsa inicial</h3><p className="mb-5 text-xs text-gray-500">El torneo permanecerá como borrador hasta que Stripe confirme el aporte.</p><OrganizerFundingPayment clientSecret={fundingClientSecret} amount={basePrizePool} onPaid={handleFundingPaid} /></div>}
          </div>
        )}

        {/* Wizard Footer Navigation */}
        {formError && <div role="alert" className="flex items-center gap-2 rounded-2xl border border-black bg-[#F9FAFB] px-4 py-3 text-xs font-bold"><AlertCircle className="w-4 h-4" />{formError}</div>}
        {!fundingClientSecret && <div className="flex justify-between items-center pt-4 border-t border-[#E5E7EB]">
          {currentStep > 1 ? (
            <button 
              type="button" 
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="px-5 py-2.5 rounded-full border border-[#E5E7EB] text-xs font-bold text-gray-700 hover:bg-[#F3F4F6] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Atrás</span>
            </button>
          ) : <div />}

          {currentStep < 4 ? (
            <button 
              type="button" 
              onClick={handleContinue}
              className="px-6 py-2.5 rounded-full bg-black text-white text-xs font-bold hover:bg-gray-800 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              type="button" 
              onClick={handleFinish}
              disabled={isPublishing}
              className="px-6 py-2.5 rounded-full bg-black text-white text-xs font-bold hover:bg-gray-800 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isPublishing ? 'Preparando pago…' : prizeType === 'monetary' ? 'Continuar al pago' : 'Publicar Torneo Oficial'}</span>
            </button>
          )}
        </div>}
      </div>
    </div>
  );
};
