export type GlobalRole = 'admin' | 'user';

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  role: GlobalRole;
  status: 'active' | 'suspended';
}

export type ViewMode = 
  | 'home' 
  | 'tournaments' 
  | 'tournament-detail' 
  | 'create-tournament' 
  | 'organizer-dashboard' 
  | 'profile' 
  | 'matches' 
  | 'teams'
  | 'admin-panel';

export type TournamentCategory = 'esports' | 'sports';

export type TournamentStatus = 'draft' | 'upcoming' | 'open' | 'live' | 'completed' | 'cancelled' | 'suspended';

export type TournamentFormat = 
  | 'single_elim' 
  | 'double_elim' 
  | 'group_stage' 
  | 'groups_elim' 
  | 'league' 
  | 'round_robin' 
  | 'battle_royale' 
  | 'custom';

export type AccessType = 'public' | 'private';

export type EntryFeeType = 'free' | 'paid_per_player' | 'paid_per_team';

export type PrizeType = 'monetary' | 'other' | 'no_prize';

export type PrizeClaimStatus = 
  | 'pending' 
  | 'winner_confirmed' 
  | 'available' 
  | 'claimed' 
  | 'processing' 
  | 'paid';

export interface Sponsor {
  id: string;
  name: string;
  logo: string;
  contribution: number; // Aportación monetaria
  link: string;
}

export interface TournamentLocation {
  type: 'online' | 'onsite';
  // Online
  platform?: string; // PC, Consola, Crossplay
  server?: string;
  region?: string;
  // Onsite
  venueName?: string;
  city?: string;
  address?: string;
}

export interface MortalKombatConfig {
  initialSetFormat: 'bo1' | 'bo3' | 'bo5';
  finalSetFormat: 'bo1' | 'bo3' | 'bo5';
  roundTimeSeconds: number;
  stageSelection: 'random' | 'manual';
  characterPolicy: 'all' | 'restricted';
  restrictedCharacters: string[];
  kameoPolicy: 'all' | 'restricted';
  restrictedKameos: string[];
  dlcAllowed: boolean;
  winnerCharacterRule: 'keep_character_and_kameo';
  loserCharacterRule: 'may_change_character_and_or_kameo';
  platform: 'PC' | 'PlayStation 5' | 'Xbox Series X|S';
  crossplay: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  gamerTag: string;
  avatar?: string;
  role: 'captain' | 'starter' | 'substitute';
  joinedAt: string;
}

export interface Team {
  id: string;
  tournamentId?: string;
  tournamentName?: string;
  name: string;
  tag: string;
  logo: string;
  captainId: string;
  captainName: string;
  captainEmail?: string;
  prizeResponsibleUserId: string; // El jugador que paga la inscripción queda registrado como responsable del premio
  members: TeamMember[];
  status: 'confirmed' | 'pending_approval' | 'pending_payment' | 'rejected';
  paymentStatus: 'paid' | 'unpaid';
  registrationDate: string;
  disputeNotes?: string;
}

export interface Participant {
  id: string;
  tournamentId?: string;
  name: string;
  tag: string;
  logo: string;
  seed?: number;
  membersCount?: number;
  captain?: string;
  captainId?: string;
  status: 'confirmed' | 'pending' | 'eliminated';
  score?: number;
}

export interface MatchDispute {
  id: string;
  reportedByUserId: string;
  reportedByTeamName: string;
  reason: string;
  evidenceUrl?: string;
  status: 'pending' | 'resolved' | 'rejected';
  resolutionNotes?: string;
  createdAt: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  tournamentTitle?: string;
  roundName: string;
  teamA: {
    id: string;
    name: string;
    tag: string;
    logo?: string;
    score?: number;
    isWinner?: boolean;
  };
  teamB: {
    id: string;
    name: string;
    tag: string;
    logo?: string;
    score?: number;
    isWinner?: boolean;
  };
  status: 'upcoming' | 'live' | 'finished';
  game: string;
  time: string;
  date: string;
  streamUrl?: string;
  streamPlatform?: 'twitch' | 'youtube';
  map?: string;
  serverInfo?: string;
  bracketPosition?: {
    round: number;
    matchIndex: number;
  };
  dispute?: MatchDispute;
  reportedByTeamA?: { scoreA: number; scoreB: number; evidence?: string };
  reportedByTeamB?: { scoreA: number; scoreB: number; evidence?: string };
  isConfirmedByOrganizer?: boolean;
}

export interface PrizeBreakdownItem {
  place: string;
  percentage: number; // Porcentaje de la bolsa neta
  estimatedAmount: number;
  description?: string;
}

export interface Tournament {
  id: string;
  title: string; // Max 50 chars
  description: string; // Max 80 chars
  subtitle?: string;
  bannerUrl: string;
  category: TournamentCategory;
  game: string;
  gameMode: string;
  gameConfig?: MortalKombatConfig;
  format: TournamentFormat;
  status: TournamentStatus;
  accessType: AccessType; // Público o Privado
  
  // Ubicación
  location: TournamentLocation;
  
  // Transmisión
  stream?: {
    platform: 'twitch' | 'youtube';
    url: string;
    channelName?: string;
  };

  // Fechas
  startDate: string;
  endDate: string;
  registrationDeadline: string;

  // Cupos y tipo de participante
  participantType: 'individual' | 'team';
  minPlayersPerTeam: number;
  participantsCount: number;
  maxParticipants: number;
  
  // Costos & Bolsa
  entryFeeType: EntryFeeType;
  entryFeeAmount: number; // en MXN
  organizerPercentage: number; // % del organizador (bloqueado tras recibir pagos)
  hasReceivedPayments: boolean; // Si es true, el porcentaje no puede cambiarse
  
  prizeType: PrizeType;
  basePrizePool: number; // Premios base aportados por organizador si aplica
  financials?: {
    registrationGross: number;
    sponsorGross: number;
    stripeFees: number;
    refunds: number;
    distributableNet: number;
    organizerAmount: number;
    prizeAmount: number;
    currency: string;
  };
  otherPrizeDescription?: string;
  
  // Patrocinadores
  sponsors: Sponsor[];

  // Reglas
  rules: string[];

  // Premios calculados
  prizesBreakdown: PrizeBreakdownItem[];

  // Organizador (Permiso contextual)
  organizerId: string;
  organizer: {
    name: string;
    avatar?: string;
    verified?: boolean;
  };

  // Ganador confirmado
  winnerTeamId?: string;
  winnerTeamName?: string;
  prizesReleased?: boolean;

  isUserRegistered?: boolean;
  isUserOrganizing?: boolean;
}

export interface Transaction {
  id: string;
  tournamentId: string;
  tournamentTitle: string;
  userOrTeam: string;
  userId: string;
  teamCode: string;
  transactionId: string;
  date: string;
  amount: number;
  currency: string;
  status: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  receiptUrl?: string;
  feeType: 'entry_fee' | 'sponsor_contribution' | 'prize_payout';
}

export interface PendingApproval {
  id: string;
  tournamentId: string;
  tournamentTitle: string;
  teamId?: string;
  teamName: string;
  captainName: string;
  captainEmail: string;
  logo: string;
  requestedAgo: string;
  playersCount: number;
  game: string;
}

export interface UserProfile {
  id: string;
  name: string;
  gamerTag: string;
  globalRole: GlobalRole; // 'admin' | 'user'
  rank: string;
  level: number;
  avatarUrl: string;
  bannerUrl: string;
  email: string;
  totalWon: number;
  pendingAmount: number;
  gameAccounts: {
    riotId?: string;
    steamId?: string;
    epicId?: string;
    psnId?: string;
    xboxId?: string;
  };
  stats: {
    played: number;
    won: number;
    winRate: number;
  };
  recentMatches: {
    id: string;
    opponent: string;
    tournament: string;
    result: 'W' | 'L';
    score: string;
    timeAgo: string;
    game: string;
  }[];
  financialHistory: {
    id: string;
    tournamentId: string;
    tournament: string;
    position: string;
    amount: number;
    currency: string;
    status: PrizeClaimStatus;
    claimedAt?: string;
    paidAt?: string;
  }[];
}

export interface AdminDisputeTicket {
  id: string;
  tournamentId: string;
  tournamentTitle: string;
  matchId: string;
  plaintiffTeam: string;
  defendantTeam: string;
  reason: string;
  evidenceUrl?: string;
  status: 'open' | 'under_review' | 'resolved';
  ruling?: string;
  createdAt: string;
}
