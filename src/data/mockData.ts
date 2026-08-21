import { Tournament, UserProfile, Transaction, PendingApproval, Match, Participant, Team, AdminDisputeTicket } from '../types';

export const INITIAL_USER_PROFILE: UserProfile = {
  id: 'usr-apex-01',
  name: 'Alex "Apex" Mercer',
  gamerTag: 'Apex',
  globalRole: 'user', // Can be switched to 'admin' dynamically
  rank: 'Diamond Rank',
  level: 84,
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxIaMTl64vDIxhttrpQBKNtyL_Hjev1QncVqMIFxkRIBqrEjUIXCXzyqtgK_tEEdXW5AG9R0-ojrmja3_iV-TwTUgpDEqMQTEtPiH4vsT89z5tgMQaRxrN6CGCI8E3UxUBx0i142HNlgtRYdn-vgMUJ6SwKN52pJ9_hoRqOyo4An1d1J6ETOOAxc-QFck1SmzXeAcxwTQyhgxVclSZd8OaOoCJ_WHnlVGYuK5RYnHNo40fBF-13x6H',
  bannerUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAv5qI94WfuDJsbw5gsHhUTs2D2Zn7N6VaiuiWQMWeDsp2A5z0iCuP1sh4mJKS3X7VOXrStlzrMV5dERYgCpZ7oT90y9iVqPFqbpCfQ0Zyab-eKTb7CYLtFmNQnwM_xwpjrfRJxnKw5OjsZSMyT764y_0hV11_eHTthxC-WBfP2bJDjWB-EjJhNKmKBTaOTKy--MGGbVuO6qg_IszGLFQzKfWy1uZcG-1N2E5wclj0FFfB997KinivI',
  email: 'apex.mercer@tournamentx.gg',
  totalWon: 35000,
  pendingAmount: 8500,
  gameAccounts: {
    riotId: 'Apex#LATAM',
    steamId: 'STEAM_0:1:78291039',
    epicId: 'Apex_Official',
    psnId: 'Apex_MX',
    xboxId: 'ApexWarrior'
  },
  stats: {
    played: 142,
    won: 48,
    winRate: 33.8
  },
  recentMatches: [
    {
      id: 'rm-1',
      opponent: 'Cloud9',
      tournament: 'Neon City Clash 2024 - Gran Final',
      result: 'W',
      score: '2-1',
      timeAgo: 'Hace 2 horas',
      game: 'Valorant'
    },
    {
      id: 'rm-2',
      opponent: 'Sentinels',
      tournament: 'Valorant Pro League 2024',
      result: 'L',
      score: '0-2',
      timeAgo: 'Hace 2 días',
      game: 'Valorant'
    },
    {
      id: 'rm-3',
      opponent: '100 Thieves Next',
      tournament: 'Neon City Clash 2024 - R16',
      result: 'W',
      score: '2-0',
      timeAgo: 'Hace 4 días',
      game: 'Valorant'
    },
    {
      id: 'rm-4',
      opponent: 'KRÜ Esports Academy',
      tournament: 'Latam Pro League S4',
      result: 'W',
      score: '3-1',
      timeAgo: 'Hace 2 semanas',
      game: 'Valorant'
    }
  ],
  financialHistory: [
    {
      id: 'fh-1',
      tournamentId: 'neon-city-clash-2024',
      tournament: 'Neon City Clash 2024',
      position: '1er Lugar',
      amount: 18000,
      currency: 'MXN',
      status: 'available', // Disponible para reclamar
      claimedAt: undefined
    },
    {
      id: 'fh-2',
      tournamentId: 'marvel-rivals-invitational',
      tournament: 'Marvel Rivals Invitational',
      position: 'Ganador Confirmado',
      amount: 8500,
      currency: 'MXN',
      status: 'winner_confirmed' // Ganador confirmado, pronto disponible
    },
    {
      id: 'fh-3',
      tournamentId: 'latam-pro-s4',
      tournament: 'Latam Pro League S4',
      position: '1er Lugar',
      amount: 20000,
      currency: 'MXN',
      status: 'claimed',
      claimedAt: '2026-08-10'
    },
    {
      id: 'fh-4',
      tournamentId: 'weekly-showdown-12',
      tournament: 'Weekly Showdown #12',
      position: '3er Lugar',
      amount: 3500,
      currency: 'MXN',
      status: 'processing',
      claimedAt: '2026-08-18'
    },
    {
      id: 'fh-5',
      tournamentId: 'cyber-arena-masters',
      tournament: 'Cyber Arena Masters',
      position: '2do Lugar',
      amount: 15000,
      currency: 'MXN',
      status: 'paid',
      paidAt: '2026-07-28'
    }
  ]
};

export const INITIAL_REGISTERED_USERS = [
  { id: 'usr-apex-01', name: 'Alex Mercer', gamerTag: 'Apex', email: 'apex.mercer@tournamentx.gg', role: 'user', status: 'active', tournamentsJoined: 14, createdAt: '2024-01-15' },
  { id: 'usr-tenz-02', name: 'Tyson Ngo', gamerTag: 'TenZ_Fan', email: 'tenzfan@c9amateur.gg', role: 'user', status: 'active', tournamentsJoined: 22, createdAt: '2024-02-10' },
  { id: 'usr-klaus-03', name: 'Nicolas Ferrari', gamerTag: 'Klaus_Pro', email: 'klaus@kruesports.lat', role: 'user', status: 'active', tournamentsJoined: 31, createdAt: '2024-03-01' },
  { id: 'usr-toxic-04', name: 'Carlos Mendez', gamerTag: 'RageQuitter99', email: 'carlos.toxic@gmail.com', role: 'user', status: 'suspended', tournamentsJoined: 2, createdAt: '2024-06-20' },
  { id: 'usr-admin-01', name: 'TournamentX Security Team', gamerTag: 'AdminRoot', email: 'security@tournamentx.gg', role: 'admin', status: 'active', tournamentsJoined: 0, createdAt: '2023-11-01' },
  { id: 'usr-viper-05', name: 'Valeria Ramos', gamerTag: 'NeonViper', email: 'valeria@neonknights.gg', role: 'user', status: 'active', tournamentsJoined: 18, createdAt: '2024-04-12' }
];

export const GAMES_CATALOG = [
  // ESPORTS (7 juegos especificados)
  {
    id: 'lol',
    name: 'League of Legends',
    formatLabel: 'En equipos (5v5)',
    category: 'esports',
    minPlayers: 5,
    supportsCustomRoster: true,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZMWz8mHk4syJY5PyUraVmTg5i33Vm_IT_sE7cAQAGV_wX7aygusg2k1UOG2vW73LlSooAUjO53CFkZrmTnxaimVEzLtYBUhKBDHQP7nFdcIfzeoK-ZVCwb2DrHMRz5zN0kD14aI_KJkEeoF8NmcWHvNM5-aylhWrsW5gIcOXC7hLn8vR8ry_nGtuTLwlarRLVre_XRdqs3kLIy5VNADL8JDts7qjFgDmpz7ULwCbqtiClyDKW-e10',
    modes: ["Equipos de 5 jugadores mínimo", "5v5 Summoner's Rift Tournament Draft", "5v5 ARAM Competitivo"],
    defaultRules: [
      "Torneo en modo Draft de Torneo oficial.",
      "Pausa técnica máxima de 10 minutos por equipo.",
      "Validación de cuenta Riot ID con nivel 30+ y mínimo 20 campeones.",
      "Prohibido el uso de scripts, macros o software de terceros."
    ]
  },
  {
    id: 'fortnite',
    name: 'Fortnite',
    formatLabel: '1 vs 1, Dúos o en equipos',
    category: 'esports',
    minPlayers: 1,
    supportsCustomRoster: true,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9loX5agj6IiTErYOCDrdMMDCNZpdpPoNirta-n__sd7zFJUNonGAZdr5RKk737Cf1kFU01wjZznLiAEX4x31Wt-QL6-36TMOFA178K4hpZEXnmnoN7ELQr0f-9mjlRfB2HTgS8_C-eVGSEtE-sfXgwOYFlPJ5PDB478B5p_rxfGuGtFBlX-JDC678LCYIKwkz-4gz0023LyFLJl4r28UsZZiWYHZU-7RASnwunrCIV3v8zbuPN1kd',
    modes: ["Individual (Solo Battle Royale)", "Dúo (2 jugadores)", "Escuadrón (mínimo 4 jugadores)"],
    defaultRules: [
      "Puntuación por eliminaciones y posición final (Placement Points).",
      "Claves de emparejamiento personalizadas proporcionadas por el Organizador.",
      "El teaming o colusión está estrictamente penalizado con baneo permanente."
    ]
  },
  {
    id: 'marvelrivals',
    name: 'Marvel Rivals',
    formatLabel: 'En equipos (6v6)',
    category: 'esports',
    minPlayers: 6,
    supportsCustomRoster: true,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrTxVDl5iTliF-KJ1_pFXrvWqPgXKfY9WcjIrxSUPgK5_wdtdTI4_5ZrqRIW1ssKmHGBFSivPiGYhl8wnQ6laejmVIGfqk6BP1InzfIh1LOkssyuG-N5TMxQuaIzQs0TtODUXoP5lmvWlp5u19VVHQwP0UD8W0XJjOpu3cxtogXYfw32eEuquJ8D4qixnrJy3rFonkMxRx6FrulBc3zvbAhDsto2J3Q0FciZfsbXQWzyd7n7jeXIam',
    modes: ["Equipos de 6 jugadores mínimo", "6v6 Convoy & Domination", "6v6 Tactical Team Battle"],
    defaultRules: [
      "Equipos compuestos por mínimo 6 titulares y hasta 2 suplentes.",
      "Reglas oficiales de roles (Vanguard, Duelist, Strategist).",
      "Partidas al mejor de 3 (Bo3) en servidor dedicado."
    ]
  },
  {
    id: 'rocketleague',
    name: 'Rocket League',
    formatLabel: '1v1, 2v2, 3v3 o 4v4',
    category: 'esports',
    minPlayers: 3,
    supportsCustomRoster: true,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzK9bnQxtdRDxWr1OgKqGs1xZeXwSk9OkTLhs-aVhESAhsjnU6-eGOKPDgFpg5ST2LCfWZtbFsYsjFpSLyjUhO46PzT6XLUF5m44kA20CECz6J-XRlrQTWzkUM2tVgH4nq88vFo6HpniL6gnKq7iUmr0zQvrhJaowzzwoWQVglOcR9Gpga2y3wCT2gXf-9PFI5On5tpKefVHr-2ZijRuvy1N05nHmmzudS7-0kB7QuJoAf_Hb0XIqI',
    modes: ["3v3 Estándar", "4v4 Chaos", "2v2 Doubles (Configuración Personalizada)", "1v1 Duel"],
    defaultRules: [
      "Estadios estándar de competición (DFH Stadium / Champions Field).",
      "Partidos estándar de 5 minutos con Overtime ilimitado.",
      "Cross-platform activado con reporte de marcador con captura."
    ]
  },
  {
    id: 'dota2',
    name: 'Dota 2',
    formatLabel: 'En equipos (5v5)',
    category: 'esports',
    minPlayers: 5,
    supportsCustomRoster: true,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZ6a2watCujoOGMeM2VvZjXZdXpkjo-QGH4ZYjkZzyGlpZpEfIItCQPN0eR8kwvKR_TLk9747pXXs-oefG2gbuetYaJDRRCj-mfM5DoiGZYGmuE2Q_oJvNirlBrkZbUAz3fQcfFHh0Y-8LCWZx2sOPIk7KjB5-IQlNDnlfteVSr6y1XxPqu2RPV6ILOyyEoGFbduyJVDkjvv4lVRaPNoW88v8f0SfzWEPiO0KyFJPQNJhXwsMu6Aau',
    modes: ["5 jugadores por equipo", "5v5 Captains Mode", "5v5 Mid Only"],
    defaultRules: [
      "Modo Capitanes oficial de Valve.",
      "Pausa reglamentaria máxima de 15 minutos en caso de desconexión.",
      "Servidor Latam / US East según acuerdo o moneda."
    ]
  },
  {
    id: 'mortalkombat',
    name: 'Mortal Kombat 1',
    formatLabel: '1 vs 1',
    category: 'esports',
    minPlayers: 1,
    supportsCustomRoster: false,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAS5AOXFhCvgLGyNNos_JkAMX28DKy70xSER5PqdCrTSqzs9ml0Ri8mnJSXgNO8P5MY-EiQSLsoqHXIAKujiqW-s2HkxIDOccoytdnNo6i30sTpg9HeOVDk9CcYFRPBZY0nxplISxYyMNXK5FfDCuDOQds5_vgQtIAAaLKhMj7guLJdb_kjX8DzKCanIsszOJx8T8O9EAfVR1hBN_eLtgoT-VJTCWtZdsbzJeQa319-lqcjTY_AXb9i',
    modes: ["Individual (1v1)", "1v1 Torneo Doble Eliminación"],
    defaultRules: [
      "Macros y Turbo: prohibidos.",
      "Cheats y Bots: prohibidos.",
      "Coaching durante el combate: prohibido.",
      "Las pausas reciben penalización según las reglas del torneo.",
      "El abandono del combate cuenta como derrota.",
      "Tiempo por ronda: 60 segundos.",
      "Escenario: selección aleatoria.",
      "Todos los personajes están permitidos.",
      "Todos los Kameos están permitidos.",
      "Personajes y Kameos DLC permitidos.",
      "Plataforma: PC.",
      "Crossplay activado.",
      "El ganador mantiene personaje y Kameo; el perdedor puede cambiar personaje y/o Kameo."
    ]
  },
  {
    id: 'smashbros',
    name: 'Super Smash Bros. Ultimate',
    formatLabel: '1 vs 1',
    category: 'esports',
    minPlayers: 1,
    supportsCustomRoster: false,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsrjbiF1-xf6aBi0FFcPDScDhF7b4qtCTPSOxSj9yOi7iNXBTzvdb1QErsvh263SpfNT0m-MobpCzwDTefIA7RaJgqgUnExYAfoaCZk7RQ8Vj4pPI9lsEoa9BtdDsZEQ8HY-U_BgOJBKNk-h8uovKN-KbnaKNOPQasTLZKrG_KmNUQrLoE5FawwEzcIdHgskCJr5kM0AQ-Lp4bo0-4OJYAf_8VqWUOD18albyrBIpbtJBPKoc8bal-',
    modes: ["Individual (1v1)", "1v1 Bracket Competitivo"],
    defaultRules: [
      "3 Vidas (Stocks), 7 Minutos, Objetos y Smash Final desactivados.",
      "Escenarios legales oficiales (Battlefield, Final Destination, Smashville, Small Battlefield, Hollow Bastion).",
      "Sistema de bans de escenarios 1-2-1."
    ]
  },

  // DEPORTES TRADICIONALES (4 deportes especificados)
  {
    id: 'soccer',
    name: 'Fútbol',
    formatLabel: 'En equipos (6v6 u 11v11)',
    category: 'sports',
    minPlayers: 6,
    supportsCustomRoster: true,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEpGzGVlCu2KR93i-msWvHXFTyCormSoU22Qi6g_ALCHMxWG_ni5teI2FeLaI0CdIIS5VqijKGfy8mGOcA2qGgryOI9uDensDF1iBAe2sTaakVYQpCcBBAFg7MXuiZOmkOh_W5JPB6Gud5F1qssqI1trLATbj0T1lAvsbfBkZrvR2yaR3N0Pm2KsA8vi0ip-V59ZNa6AOfB5LUJJQ1WuwWzJeaPfnzAS-q_9Wo5nrkvP0rbFYbjPU6',
    modes: ["6 jugadores mínimo (Fútbol 6 / 7)", "11 jugadores mínimo (Fútbol 11 Profesional)"],
    defaultRules: [
      "Reglamento oficial FIFA / Federación local.",
      "Uso obligatorio de canilleras y calzado reglamentario.",
      "Tiempos de 25 a 45 min por mitad según modalidad.",
      "Árbitros colegiados confirmarán el acta oficial de partido."
    ]
  },
  {
    id: 'basketball',
    name: 'Básquetbol',
    formatLabel: 'En equipos (3v3 o 5v5)',
    category: 'sports',
    minPlayers: 3,
    supportsCustomRoster: true,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxfhIi_Uc2E5XjaIxEr6oC36E1-LEnmhbcetDhsRqWdkyuWoQtGz9CJs3u_w2Ednj-ho04o1g0h4UOMXG2pnhq_uBy1TmzmOs_7FcQiFqyplMGJ-FPIvl9c4evuylX8tyuFagLDZ77K_PMErD8PNX1hb-HX2OcnzyB97jmjPbZ2ou5uBpYKC8jpMs90NyTZuPh13hQ3UsgAVKQMLbPqiBkKZDKq84LhITO4VoLRo3jZCyFEPJzpL0W',
    modes: ["3v3 Media Cancha (Reglas FIBA 3x3)", "5v5 Cancha Completa"],
    defaultRules: [
      "Modalidad 3v3 a 21 puntos o 10 minutos de juego.",
      "Modalidad 5v5 con 4 cuartos de 10 o 12 minutos reglamentarios.",
      "Límite de faltas personales y de equipo según FIBA."
    ]
  },
  {
    id: 'tennis',
    name: 'Tenis',
    formatLabel: '1 vs 1 o Dúos',
    category: 'sports',
    minPlayers: 1,
    supportsCustomRoster: false,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDD89uoywUWDbvETv4dfGl0xCodaipi21Xdr2Ip3gMq-SSGqYP5FurPI0iXpAdqQ7xm3MqiknXafN2hgFmzvRAJ8bN1IEwPVMIPsSArTYDFfLvVzyj2mulH4eexCNkTpP_9NF3yutCs5xyFn_HGmTgmH2caLS0CJ_IImzNYTKBn6Dt7_DlWqr5qC7I_qeYl8xDa3E-wR9Qz16ArSeIFu_HzNnaNttadUzBNuQqLbDOL1kSdlm1iVsPO',
    modes: ["Individual (Singles 1v1)", "Dobles (2v2)"],
    defaultRules: [
      "Partidos al mejor de 3 sets con Tie-Break tradicional.",
      "Canchas de arcilla o pista dura designadas por el Organizador.",
      "Pelotas oficiales nuevas provistas en cada fase eliminatoria."
    ]
  },
  {
    id: 'pingpong',
    name: 'Ping Pong (Tenis de Mesa)',
    formatLabel: '1 vs 1',
    category: 'sports',
    minPlayers: 1,
    supportsCustomRoster: false,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhdeQB_yFCO8jMtmO6bpy2LPXQ25klHsbAk0DLo25riTl9pzDizV33b-_KoaU-GUinLpS9yu0KD_l59Fj3ekRoRdpa1pWCog7SQzwOiE1oRnDkwkvaWuWmgsrmHx52W_8VtSDIu_uH0F1MXk0AIeOvAiwHio8X8gRqqaBnGcy88fcm2OZet9w0sIgkdv8z8AJ6m1GHoYHP-sfICbLgWb0w8-9PqtOM1XbZZK9Jkaarxc8eOVWLCAUo',
    modes: ["Individual (1v1)", "1v1 Torneo Abierto"],
    defaultRules: [
      "Sets a 11 puntos con diferencia de 2; al mejor de 5 sets (Bo5).",
      "Paleta reglamentaria con gomas aprobadas por la ITTF.",
      "Servicio alternado cada 2 puntos."
    ]
  }
];

export const INITIAL_TOURNAMENTS: Tournament[] = [
  {
    id: 'neon-city-clash-2024',
    title: 'Neon City Clash 2024', // <= 20 chars
    description: 'Torneo táctico de élite con gran final en vivo.', // <= 50 chars
    subtitle: 'The premier tactical competitive event of the season.',
    category: 'esports',
    game: 'Valorant',
    gameMode: '5v5 Competitive Standard',
    format: 'double_elim',
    status: 'live',
    accessType: 'public',
    location: {
      type: 'online',
      platform: 'PC',
      server: 'Latam Norte / Bogotá',
      region: 'América Latina'
    },
    stream: {
      platform: 'twitch',
      url: 'https://twitch.tv/tournamentx_live',
      channelName: 'TournamentX_Official'
    },
    organizerId: 'usr-apex-01',
    organizer: {
      name: 'Elite Gaming League',
      verified: true
    },
    bannerUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZ6a2watCujoOGMeM2VvZjXZdXpkjo-QGH4ZYjkZzyGlpZpEfIItCQPN0eR8kwvKR_TLk9747pXXs-oefG2gbuetYaJDRRCj-mfM5DoiGZYGmuE2Q_oJvNirlBrkZbUAz3fQcfFHh0Y-8LCWZx2sOPIk7KjB5-IQlNDnlfteVSr6y1XxPqu2RPV6ILOyyEoGFbduyJVDkjvv4lVRaPNoW88v8f0SfzWEPiO0KyFJPQNJhXwsMu6Aau',
    startDate: '2026-10-24T18:00:00Z',
    endDate: '2026-10-26T23:00:00Z',
    registrationDeadline: '2026-10-24T17:00:00Z',
    participantType: 'team',
    minPlayersPerTeam: 5,
    participantsCount: 12,
    maxParticipants: 16,
    entryFeeType: 'paid_per_team',
    entryFeeAmount: 500, // $500 MXN por equipo
    organizerPercentage: 15, // 15%
    hasReceivedPayments: true, // Bloqueado
    prizeType: 'monetary',
    basePrizePool: 10000,
    sponsors: [
      { id: 'sp-1', name: 'HyperX Esports', logo: 'HYPERX', contribution: 15000, link: 'https://hyperxgaming.com' },
      { id: 'sp-2', name: 'RedBull Gaming', logo: 'REDBULL', contribution: 10000, link: 'https://redbull.com' }
    ],
    rules: [
      'Todos los jugadores deben registrar su Riot ID verificado.',
      'Check-in obligatorio 30 minutos antes de cada ronda programada.',
      'Best of 3 (Bo3) para playoffs y Best of 5 (Bo5) para la Gran Final.',
      'Software anti-cheat y grabación de pantalla requerida en playoffs.'
    ],
    prizesBreakdown: [
      { place: '1er Lugar', percentage: 60, estimatedAmount: 18000, description: '60% de la bolsa acumulada' },
      { place: '2do Lugar', percentage: 26.6, estimatedAmount: 8000, description: '26.6% de la bolsa acumulada' },
      { place: '3er Lugar', percentage: 13.4, estimatedAmount: 4000, description: '13.4% de la bolsa acumulada' }
    ],
    isUserRegistered: true,
    isUserOrganizing: true
  },
  {
    id: 'marvel-rivals-invitational',
    title: 'Marvel Rivals Cup',
    description: 'Torneo 6v6 con héroes del multiverso Marvel.',
    subtitle: 'High octane superhero tactical combat tournament.',
    category: 'esports',
    game: 'Marvel Rivals',
    gameMode: 'Equipos de 6 jugadores mínimo',
    format: 'single_elim',
    status: 'open',
    accessType: 'private', // Privado (requiere aprobación del organizador)
    location: {
      type: 'online',
      platform: 'Crossplay (PC & Consolas)',
      server: 'US East / Miami',
      region: 'Global'
    },
    stream: {
      platform: 'youtube',
      url: 'https://youtube.com/@TournamentXEsports',
      channelName: 'TournamentX Esports TV'
    },
    organizerId: 'usr-nexus-09',
    organizer: {
      name: 'Nexus Gaming',
      verified: true
    },
    bannerUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrTxVDl5iTliF-KJ1_pFXrvWqPgXKfY9WcjIrxSUPgK5_wdtdTI4_5ZrqRIW1ssKmHGBFSivPiGYhl8wnQ6laejmVIGfqk6BP1InzfIh1LOkssyuG-N5TMxQuaIzQs0TtODUXoP5lmvWlp5u19VVHQwP0UD8W0XJjOpu3cxtogXYfw32eEuquJ8D4qixnrJy3rFonkMxRx6FrulBc3zvbAhDsto2J3Q0FciZfsbXQWzyd7n7jeXIam',
    startDate: '2026-11-02T19:00:00Z',
    endDate: '2026-11-04T23:00:00Z',
    registrationDeadline: '2026-11-01T23:59:00Z',
    participantType: 'team',
    minPlayersPerTeam: 6,
    participantsCount: 24,
    maxParticipants: 32,
    entryFeeType: 'free',
    entryFeeAmount: 0,
    organizerPercentage: 10,
    hasReceivedPayments: false,
    prizeType: 'monetary',
    basePrizePool: 25000,
    sponsors: [
      { id: 'sp-3', name: 'Rival Gear', logo: 'GEAR', contribution: 25000, link: 'https://rivalgear.com' }
    ],
    rules: [
      'Equipos de 6 jugadores mínimo con hasta 2 suplentes.',
      'Sin restricciones de héroes salvo reglas oficiales de rol.',
      'Puntualidad estricta de 15 minutos de tolerancia.'
    ],
    prizesBreakdown: [
      { place: '1er Lugar', percentage: 60, estimatedAmount: 15000 },
      { place: '2do Lugar', percentage: 30, estimatedAmount: 7500 },
      { place: '3er Lugar', percentage: 10, estimatedAmount: 2500 }
    ]
  },
  {
    id: 'copa-futbol-11-cdmx',
    title: 'Copa Fútbol 11 Tx',
    description: 'Torneo presencial en césped natural con árbitros.',
    subtitle: 'El torneo presencial más prestigioso de la ciudad.',
    category: 'sports',
    game: 'Fútbol',
    gameMode: '11 jugadores mínimo (Fútbol 11 Profesional)',
    format: 'league',
    status: 'open',
    accessType: 'public',
    location: {
      type: 'onsite',
      venueName: 'Estadio Olímpico Deportivo Chapultepec',
      address: 'Av. Paseo de la Reforma 450, Miguel Hidalgo, CDMX'
    },
    organizerId: 'usr-txsports-01',
    organizer: {
      name: 'Tx Sports México',
      verified: true
    },
    bannerUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEpGzGVlCu2KR93i-msWvHXFTyCormSoU22Qi6g_ALCHMxWG_ni5teI2FeLaI0CdIIS5VqijKGfy8mGOcA2qGgryOI9uDensDF1iBAe2sTaakVYQpCcBBAFg7MXuiZOmkOh_W5JPB6Gud5F1qssqI1trLATbj0T1lAvsbfBkZrvR2yaR3N0Pm2KsA8vi0ip-V59ZNa6AOfB5LUJJQ1WuwWzJeaPfnzAS-q_9Wo5nrkvP0rbFYbjPU6',
    startDate: '2026-11-15T09:00:00Z',
    endDate: '2026-12-10T18:00:00Z',
    registrationDeadline: '2026-11-10T20:00:00Z',
    participantType: 'team',
    minPlayersPerTeam: 11,
    participantsCount: 14,
    maxParticipants: 16,
    entryFeeType: 'paid_per_team',
    entryFeeAmount: 2500, // $2,500 MXN por escuadra
    organizerPercentage: 20,
    hasReceivedPayments: true,
    prizeType: 'monetary',
    basePrizePool: 10000,
    otherPrizeDescription: 'Copa de Oro + 25 Medallas Conmemorativas + Uniformes',
    sponsors: [
      { id: 'sp-4', name: 'Corona Sports', logo: 'CORONA', contribution: 20000, link: 'https://corona.mx' },
      { id: 'sp-5', name: 'Gatorade MX', logo: 'GATORADE', contribution: 15000, link: 'https://gatorade.com' }
    ],
    rules: [
      'Reglamento oficial FIFA.',
      'Uso de canilleras obligatorio.',
      'Tiempo reglamentario de 45 minutos por mitad.'
    ],
    prizesBreakdown: [
      { place: '1er Lugar', percentage: 65, estimatedAmount: 39000 },
      { place: '2do Lugar', percentage: 25, estimatedAmount: 15000 },
      { place: '3er Lugar', percentage: 10, estimatedAmount: 6000 }
    ]
  },
  {
    id: 'smash-ultimate-showdown',
    title: 'Smash Ultimate Open',
    description: 'Torneo 1v1 individual de doble eliminación.',
    subtitle: 'Compite 1v1 por la gloria y puntos de ranking.',
    category: 'esports',
    game: 'Super Smash Bros. Ultimate',
    gameMode: 'Individual (1v1)',
    format: 'double_elim',
    status: 'upcoming',
    accessType: 'public',
    location: {
      type: 'online',
      platform: 'Nintendo Switch',
      server: 'América Latina',
      region: 'México / Centroamérica'
    },
    organizerId: 'usr-apex-01',
    organizer: {
      name: 'Alex "Apex" Mercer (Tú)',
      verified: true
    },
    bannerUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsrjbiF1-xf6aBi0FFcPDScDhF7b4qtCTPSOxSj9yOi7iNXBTzvdb1QErsvh263SpfNT0m-MobpCzwDTefIA7RaJgqgUnExYAfoaCZk7RQ8Vj4pPI9lsEoa9BtdDsZEQ8HY-U_BgOJBKNk-h8uovKN-KbnaKNOPQasTLZKrG_KmNUQrLoE5FawwEzcIdHgskCJr5kM0AQ-Lp4bo0-4OJYAf_8VqWUOD18albyrBIpbtJBPKoc8bal-',
    startDate: '2026-11-20T17:00:00Z',
    endDate: '2026-11-21T22:00:00Z',
    registrationDeadline: '2026-11-19T23:59:00Z',
    participantType: 'individual',
    minPlayersPerTeam: 1,
    participantsCount: 48,
    maxParticipants: 64,
    entryFeeType: 'paid_per_player',
    entryFeeAmount: 150, // $150 MXN por jugador
    organizerPercentage: 15,
    hasReceivedPayments: true,
    prizeType: 'monetary',
    basePrizePool: 3000,
    sponsors: [
      { id: 'sp-6', name: 'PowerA Controllers', logo: 'POWERA', contribution: 5000, link: 'https://powera.com' }
    ],
    rules: [
      '3 Vidas, 7 Minutos, Sin Objetos.',
      'Escenarios competitivos oficiales.',
      'Conexión LAN requerida.'
    ],
    prizesBreakdown: [
      { place: '1er Lugar', percentage: 70, estimatedAmount: 8500 },
      { place: '2do Lugar', percentage: 20, estimatedAmount: 2500 },
      { place: '3er Lugar', percentage: 10, estimatedAmount: 1200 }
    ],
    isUserOrganizing: true
  },
  {
    id: 'fortnite-duos-royale',
    title: 'Fortnite Duos Cup',
    description: 'Batalla campal por puntos de eliminación.',
    subtitle: 'Battle Royale en parejas con premios acumulados.',
    category: 'esports',
    game: 'Fortnite',
    gameMode: 'Dúo (2 jugadores)',
    format: 'battle_royale',
    status: 'completed',
    accessType: 'public',
    location: {
      type: 'online',
      platform: 'Crossplay',
      server: 'NA-Central',
      region: 'Americas'
    },
    organizerId: 'usr-epic-org',
    organizer: {
      name: 'Battle Zone Latam',
      verified: true
    },
    bannerUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9loX5agj6IiTErYOCDrdMMDCNZpdpPoNirta-n__sd7zFJUNonGAZdr5RKk737Cf1kFU01wjZznLiAEX4x31Wt-QL6-36TMOFA178K4hpZEXnmnoN7ELQr0f-9mjlRfB2HTgS8_C-eVGSEtE-sfXgwOYFlPJ5PDB478B5p_rxfGuGtFBlX-JDC678LCYIKwkz-4gz0023LyFLJl4r28UsZZiWYHZU-7RASnwunrCIV3v8zbuPN1kd',
    startDate: '2026-10-01T18:00:00Z',
    endDate: '2026-10-02T22:00:00Z',
    registrationDeadline: '2026-09-30T23:59:00Z',
    participantType: 'team',
    minPlayersPerTeam: 2,
    participantsCount: 50,
    maxParticipants: 50,
    entryFeeType: 'free',
    entryFeeAmount: 0,
    organizerPercentage: 10,
    hasReceivedPayments: false,
    prizeType: 'monetary',
    basePrizePool: 12000,
    sponsors: [],
    rules: [
      '6 partidas personalizadas.',
      '1 punto por kill, 15 por Victory Royale.'
    ],
    prizesBreakdown: [
      { place: '1er Lugar', percentage: 60, estimatedAmount: 7200 },
      { place: '2do Lugar', percentage: 30, estimatedAmount: 3600 },
      { place: '3er Lugar', percentage: 10, estimatedAmount: 1200 }
    ],
    winnerTeamId: 'team-apex-duo',
    winnerTeamName: 'Apex & Viper (ACL)',
    prizesReleased: true
  }
];

export const INITIAL_TEAMS: Team[] = [
  {
    id: 'team-apex-cyber',
    tournamentId: 'neon-city-clash-2024',
    tournamentName: 'Neon City Clash 2024',
    name: 'Apex Cyber Legion',
    tag: 'ACL',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAD-0f_C8g8jpci316UO19EItjtb8nZIm9gS1HNQ0H8_B5NMd2_OMPRrVkwegXW3KRgJOGXeLlRrwh5fSShAJyLUKw_o7VMi8_0-64Kwy0OW-OCsaJ9DhockP8H9FCyawFdGS3K4Op-sYSO_5YBhDj6AuD_Y9N6l20liIZBXFgcNZi9nALVRwjvpuRPmVxQhqqJWt4qvhYzddVa2g2KEXMZlNSuq7yj4lzaFQWIVfFP8d_FbubgU1po',
    captainId: 'usr-apex-01',
    captainName: 'Alex "Apex" Mercer',
    captainEmail: 'apex.mercer@tournamentx.gg',
    prizeResponsibleUserId: 'usr-apex-01', // El que pagó la inscripción
    paymentStatus: 'paid',
    status: 'confirmed',
    registrationDate: '2026-10-20',
    members: [
      { id: 'm-1', name: 'Alex Mercer', gamerTag: 'Apex (Capitán)', role: 'captain', joinedAt: '2026-10-20' },
      { id: 'm-2', name: 'Valeria Ramos', gamerTag: 'NeonViper', role: 'starter', joinedAt: '2026-10-20' },
      { id: 'm-3', name: 'Mateo Silva', gamerTag: 'GhostAim', role: 'starter', joinedAt: '2026-10-21' },
      { id: 'm-4', name: 'Lucia Gomez', gamerTag: 'Starlight', role: 'starter', joinedAt: '2026-10-21' },
      { id: 'm-5', name: 'Diego Torres', gamerTag: 'TitanShield', role: 'starter', joinedAt: '2026-10-22' }
    ]
  },
  {
    id: 'team-c9-amateur',
    tournamentId: 'neon-city-clash-2024',
    tournamentName: 'Neon City Clash 2024',
    name: 'Cloud9 Amateur',
    tag: 'C9',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDD89uoywUWDbvETv4dfGl0xCodaipi21Xdr2Ip3gMq-SSGqYP5FurPI0iXpAdqQ7xm3MqiknXafN2hgFmzvRAJ8bN1IEwPVMIPsSArTYDFfLvVzyj2mulH4eexCNkTpP_9NF3yutCs5xyFn_HGmTgmH2caLS0CJ_IImzNYTKBn6Dt7_DlWqr5qC7I_qeYl8xDa3E-wR9Qz16ArSeIFu_HzNnaNttadUzBNuQqLbDOL1kSdlm1iVsPO',
    captainId: 'usr-tenz-02',
    captainName: 'Tyson Ngo (TenZ_Fan)',
    captainEmail: 'tenzfan@c9amateur.gg',
    prizeResponsibleUserId: 'usr-tenz-02',
    paymentStatus: 'paid',
    status: 'confirmed',
    registrationDate: '2026-10-21',
    members: [
      { id: 'mc9-1', name: 'Tyson Ngo', gamerTag: 'TenZ_Fan', role: 'captain', joinedAt: '2026-10-21' },
      { id: 'mc9-2', name: 'Jordan Montemurro', gamerTag: 'Zellsis_Jr', role: 'starter', joinedAt: '2026-10-21' },
      { id: 'mc9-3', name: 'Francis Hoang', gamerTag: 'OXY_Latam', role: 'starter', joinedAt: '2026-10-21' },
      { id: 'mc9-4', name: 'Erick Santos', gamerTag: 'Xeppaa_Fan', role: 'starter', joinedAt: '2026-10-21' },
      { id: 'mc9-5', name: 'Kevin Tran', gamerTag: 'Vanity_Lead', role: 'starter', joinedAt: '2026-10-21' }
    ]
  },
  {
    id: 'team-rivals-squad',
    tournamentId: 'marvel-rivals-invitational',
    tournamentName: 'Marvel Rivals Invitational',
    name: 'Avengers Protocol',
    tag: 'AVP',
    logo: '',
    captainId: 'usr-apex-01',
    captainName: 'Alex "Apex" Mercer',
    captainEmail: 'apex.mercer@tournamentx.gg',
    prizeResponsibleUserId: 'usr-apex-01',
    paymentStatus: 'paid',
    status: 'pending_approval', // En torneo privado
    registrationDate: '2026-10-23',
    members: [
      { id: 'mav-1', name: 'Alex Mercer', gamerTag: 'Apex (Capitán)', role: 'captain', joinedAt: '2026-10-23' },
      { id: 'mav-2', name: 'Valeria Ramos', gamerTag: 'NeonViper', role: 'starter', joinedAt: '2026-10-23' },
      { id: 'mav-3', name: 'Samuel Diaz', gamerTag: 'IronManX', role: 'starter', joinedAt: '2026-10-23' },
      { id: 'mav-4', name: 'Elena Vega', gamerTag: 'ScarletWitch_Pro', role: 'starter', joinedAt: '2026-10-23' },
      { id: 'mav-5', name: 'Bruno Ortiz', gamerTag: 'HulkSmash', role: 'starter', joinedAt: '2026-10-23' },
      { id: 'mav-6', name: 'Dante Ruiz', gamerTag: 'DoctorStrange', role: 'starter', joinedAt: '2026-10-23' }
    ]
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    tournamentId: 'neon-city-clash-2024',
    tournamentTitle: 'Neon City Clash 2024',
    userOrTeam: 'Cloud9 Amateur',
    userId: 'usr-tenz-02',
    teamCode: 'C9',
    transactionId: '#TXN-8829',
    date: 'Oct 24, 2024 14:30',
    amount: 500.00,
    currency: 'MXN',
    status: 'PAID',
    paymentMethod: 'Credit Card / Stripe',
    feeType: 'entry_fee'
  },
  {
    id: 'tx-2',
    tournamentId: 'neon-city-clash-2024',
    tournamentTitle: 'Neon City Clash 2024',
    userOrTeam: 'Apex Cyber Legion',
    userId: 'usr-apex-01',
    teamCode: 'ACL',
    transactionId: '#TXN-8828',
    date: 'Oct 24, 2024 11:15',
    amount: 500.00,
    currency: 'MXN',
    status: 'PAID',
    paymentMethod: 'Stripe Instant Checkout',
    feeType: 'entry_fee'
  },
  {
    id: 'tx-3',
    tournamentId: 'copa-futbol-11-cdmx',
    tournamentTitle: 'Copa Fútbol 11 Tx',
    userOrTeam: 'Corona Sports (Patrocinio)',
    userId: 'usr-sponsor-corona',
    teamCode: 'CORONA',
    transactionId: '#TXN-8827',
    date: 'Oct 23, 2024 09:00',
    amount: 20000.00,
    currency: 'MXN',
    status: 'PAID',
    paymentMethod: 'Bank Wire / Sponsor Portal',
    feeType: 'sponsor_contribution'
  }
];

export const INITIAL_PENDING_APPROVALS: PendingApproval[] = [
  {
    id: 'pa-1',
    tournamentId: 'marvel-rivals-invitational',
    tournamentTitle: 'Marvel Rivals Invitational',
    teamId: 'team-rivals-squad',
    teamName: 'Avengers Protocol',
    captainName: 'Alex "Apex" Mercer',
    captainEmail: 'apex.mercer@tournamentx.gg',
    logo: '',
    requestedAgo: 'Hace 1 hora',
    playersCount: 6,
    game: 'Marvel Rivals'
  },
  {
    id: 'pa-2',
    tournamentId: 'marvel-rivals-invitational',
    tournamentTitle: 'Marvel Rivals Invitational',
    teamName: 'Mutant Brotherhood',
    captainName: 'Magneto_Fan',
    captainEmail: 'brotherhood@esports.com',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsrjbiF1-xf6aBi0FFcPDScDhF7b4qtCTPSOxSj9yOi7iNXBTzvdb1QErsvh263SpfNT0m-MobpCzwDTefIA7RaJgqgUnExYAfoaCZk7RQ8Vj4pPI9lsEoa9BtdDsZEQ8HY-U_BgOJBKNk-h8uovKN-KbnaKNOPQasTLZKrG_KmNUQrLoE5FawwEzcIdHgskCJr5kM0AQ-Lp4bo0-4OJYAf_8VqWUOD18albyrBIpbtJBPKoc8bal-',
    requestedAgo: 'Hace 3 horas',
    playersCount: 6,
    game: 'Marvel Rivals'
  }
];

export const INITIAL_MATCHES: Match[] = [
  {
    id: 'm-1',
    tournamentId: 'neon-city-clash-2024',
    tournamentTitle: 'Neon City Clash 2024',
    roundName: 'Cuartos de Final',
    teamA: {
      id: 't-c9',
      name: 'Cloud9 Amateur',
      tag: 'C9',
      score: 2,
      isWinner: true
    },
    teamB: {
      id: 't-g2',
      name: 'G2 Arctic',
      tag: 'G2',
      score: 0,
      isWinner: false
    },
    status: 'finished',
    game: 'Valorant',
    time: 'Finalizado',
    date: 'Oct 24',
    map: 'Ascent',
    bracketPosition: { round: 1, matchIndex: 0 },
    isConfirmedByOrganizer: true
  },
  {
    id: 'm-2',
    tournamentId: 'neon-city-clash-2024',
    tournamentTitle: 'Neon City Clash 2024',
    roundName: 'Gran Final',
    teamA: {
      id: 'team-apex-cyber',
      name: 'Apex Cyber Legion',
      tag: 'ACL',
      score: 2,
      isWinner: false
    },
    teamB: {
      id: 'team-c9-amateur',
      name: 'Cloud9 Amateur',
      tag: 'C9',
      score: 1,
      isWinner: false
    },
    status: 'live',
    game: 'Valorant',
    time: 'EN VIVO - Mapa 3',
    date: 'Hoy',
    map: 'Haven',
    streamUrl: 'https://twitch.tv/tournamentx_live',
    streamPlatform: 'twitch',
    bracketPosition: { round: 2, matchIndex: 0 }
  }
];

export const INITIAL_ADMIN_DISPUTES: AdminDisputeTicket[] = [
  {
    id: 'disp-101',
    tournamentId: 'neon-city-clash-2024',
    tournamentTitle: 'Neon City Clash 2024',
    matchId: 'm-1',
    plaintiffTeam: 'G2 Arctic',
    defendantTeam: 'Cloud9 Amateur',
    reason: 'Desconexión no consensuada durante la ronda 14 de Ascent sin pausa técnica autorizada.',
    evidenceUrl: 'https://tournamentx.gg/evidence/demo_ascent_r14.mp4',
    status: 'open',
    createdAt: '2026-10-24 16:30'
  },
  {
    id: 'disp-102',
    tournamentId: 'copa-futbol-11-cdmx',
    tournamentTitle: 'Copa Fútbol 11 Tx',
    matchId: 'm-soc-1',
    plaintiffTeam: 'Deportivo Condesa',
    defendantTeam: 'Real Roma Norte',
    reason: 'Alineación indebida de jugador expulsado en la jornada previa.',
    evidenceUrl: 'https://tournamentx.gg/evidence/cedula_arbitral.pdf',
    status: 'resolved',
    ruling: 'Sanción aplicada: Pérdida del partido por 3-0 y suspensión de 2 fechas al jugador infractor.',
    createdAt: '2026-10-22 19:15'
  }
];

export const INITIAL_PARTICIPANTS: Participant[] = [
  { id: 'p-1', name: 'Apex Cyber Legion', tag: 'ACL', logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAD-0f_C8g8jpci316UO19EItjtb8nZIm9gS1HNQ0H8_B5NMd2_OMPRrVkwegXW3KRgJOGXeLlRrwh5fSShAJyLUKw_o7VMi8_0-64Kwy0OW-OCsaJ9DhockP8H9FCyawFdGS3K4Op-sYSO_5YBhDj6AuD_Y9N6l20liIZBXFgcNZi9nALVRwjvpuRPmVxQhqqJWt4qvhYzddVa2g2KEXMZlNSuq7yj4lzaFQWIVfFP8d_FbubgU1po', seed: 1, captain: 'Alex "Apex" Mercer', membersCount: 5, status: 'confirmed' },
  { id: 'p-2', name: 'Cloud9 Amateur', tag: 'C9', logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDD89uoywUWDbvETv4dfGl0xCodaipi21Xdr2Ip3gMq-SSGqYP5FurPI0iXpAdqQ7xm3MqiknXafN2hgFmzvRAJ8bN1IEwPVMIPsSArTYDFfLvVzyj2mulH4eexCNkTpP_9NF3yutCs5xyFn_HGmTgmH2caLS0CJ_IImzNYTKBn6Dt7_DlWqr5qC7I_qeYl8xDa3E-wR9Qz16ArSeIFu_HzNnaNttadUzBNuQqLbDOL1kSdlm1iVsPO', seed: 2, captain: 'TenZ_Fan', membersCount: 5, status: 'confirmed' },
  { id: 'p-3', name: 'Sentinels Academy', tag: 'SEN', logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhdeQB_yFCO8jMtmO6bpy2LPXQ25klHsbAk0DLo25riTl9pzDizV33b-_KoaU-GUinLpS9yu0KD_l59Fj3ekRoRdpa1pWCog7SQzwOiE1oRnDkwkvaWuWmgsrmHx52W_8VtSDIu_uH0F1MXk0AIeOvAiwHio8X8gRqqaBnGcy88fcm2OZet9w0sIgkdv8z8AJ6m1GHoYHP-sfICbLgWb0w8-9PqtOM1XbZZK9Jkaarxc8eOVWLCAUo', seed: 3, captain: 'SEN_Zellsis', membersCount: 5, status: 'confirmed' },
  { id: 'p-4', name: 'KRÜ Elite', tag: 'KRU', logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1iz_ceNzQOr5alQJpSCsP0rOVZfJ_zB6WXPugWb263kMOeWHhQVEV7Mnv39f1_56tw2Q_tz3Y8ifbVw71ajlQlFH8UysFBjB9rorOsHnZU_95yC8P1uQuovuHDQW76mO73eniNxrc1y2d2tbxsTVZAT7zgDIxbxovs42YErHnBSTlqcOrJtR2tYtnb_5adWUjArd8qV43DQoyYayfTqZH3EhBPtjrkwfIdVI86-9rR9kmO9Ena0wd', seed: 4, captain: 'KRU_Klaus', membersCount: 5, status: 'confirmed' }
];
