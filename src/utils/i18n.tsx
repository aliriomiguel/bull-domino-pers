import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'es' | 'en';

export interface Translations {
  // Common
  langName: string;
  close: string;
  cancel: string;
  save: string;
  confirm: string;
  copy: string;
  copied: string;
  share: string;
  back: string;
  next: string;
  previous: string;
  points: string;
  score: string;
  target: string;
  round: string;
  match: string;
  victory: string;
  defeat: string;
  draw: string;
  pass: string;
  resume: string;
  restart: string;
  exitToTitle: string;
  paused: string;
  pausedSubtitle: string;
  muted: string;
  unmuted: string;

  // Header & Title Screen
  gameTitle: string;
  gameTagline: string;
  e2eeNetwork: string;
  quickMatch: string;
  quickMatchSub: string;
  privateRoom: string;
  privateRoomSub: string;
  soloCampaign: string;
  soloCampaignSub: string;
  tutorialRules: string;
  tutorialRulesSub: string;
  leaderboard: string;
  leaderboardSub: string;
  avatarProfile: string;
  avatarProfileSub: string;
  seasonTier: string;
  rankPoints: string;
  pressEnterToPlay: string;
  shortcutHint: string;

  // Game Board HUD
  modeDraw: string;
  modeBlock: string;
  modeAllFives: string;
  bonesInHand: string;
  thinking: string;
  yourTurnPrompt: string;
  yourTurnDirectionPrompt: string;
  noMovesDraw: string;
  noMovesPass: string;
  waitingForPlayer: string;
  choosePlacementFor: string;
  drawBoneyard: string;
  passTurn: string;
  rulesHelp: string;
  resetView: string;
  encryptedChat: string;
  openLeftEnd: string;
  openRightEnd: string;

  // Placement Directions & Leads
  leadVertical: string;
  leadHorizontal: string;
  straight: string;
  turnRight: string;
  turnLeft: string;
  turnUp: string;
  turnDown: string;
  directionLeft: string;
  directionRight: string;
  directionUp: string;
  directionDown: string;

  // Round Over & Game Over
  roundOver: string;
  gameOver: string;
  dominoHandEmptied: string;
  boardBlocked: string;
  gameWonCongratulations: string;
  gameConcluded: string;
  roundWinnerClaimsPoints: string;
  roundBlockedTie: string;
  playerReachedTarget: string;
  totalScore: string;
  nextRound: string;
  rematch: string;
  returnToTitle: string;

  // Private Room Modal
  privateRoomTitle: string;
  createRoomTab: string;
  joinRoomTab: string;
  gameModeLabel: string;
  targetScoreLabel: string;
  turnTimerLabel: string;
  customCodeOptional: string;
  createAndLaunchRoom: string;
  enterRoomCodePrompt: string;
  joinMatchBtn: string;
  roomLiveEncrypted: string;
  shareRoomCodePrompt: string;
  copyRoomCode: string;
  copyInviteLink: string;
  linkCopied: string;
  codeCopied: string;
  waitingOpponentAutoStart: string;

  // Match Types & 2v2 Lobby
  matchTypeLabel: string;
  matchType1v1: string;
  matchType1v1Desc: string;
  matchType2v2: string;
  matchType2v2Desc: string;
  team1: string;
  team2: string;
  yourTeam: string;
  rivalTeam: string;
  partner: string;
  opponent: string;
  addBotBtn: string;
  fillBotsAndStart: string;
  waitingPlayersLobby: string;
  quickMatchQueue: string;
  quickMatchQueueDesc: string;
  teamVictory: string;
  teamDefeat: string;
  teamWonRound: string;
  leaveLobby: string;

  // Campaign Modal
  campaignTitle: string;
  starsEarnedTotal: string;
  startStageBtn: string;
  unlocked: string;
  lockedRequirement: string;
  rewardSkinLabel: string;

  // Leaderboard Modal
  leaderboardTitle: string;
  globalLeaderboardTab: string;
  seasonRewardsTab: string;
  analyticsTab: string;
  rankCol: string;
  playerCol: string;
  tierCol: string;
  rpCol: string;
  winRateCol: string;
  dominoesCol: string;
  statsMatchesPlayed: string;
  statsMatchesWon: string;
  statsDominoes: string;
  statsHighestScore: string;
  statsWinStreak: string;
  statsBestStreak: string;

  // Avatar Modal
  avatarStudioTitle: string;
  playerNameLabel: string;
  honorificTitleLabel: string;
  skinToneLabel: string;
  accessoryLabel: string;
  dominoBadgeLabel: string;
  bgColorLabel: string;
  saveAvatarBtn: string;

  // Chat Drawer
  chatTitle: string;
  chatSubtitle: string;
  chatPlaceholder: string;
  sendBtn: string;
  quickReactionsTitle: string;
  quickPhrasesTitle: string;

  // Share Modal
  shareTitle: string;
  shareSubtitle: string;
  shareVictoryHeadline: string;
  shareViaTwitter: string;
  shareViaWhatsapp: string;
  shareViaTelegram: string;
  copyShareText: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  es: {
    // General
    langName: 'Español',
    close: 'Cerrar',
    cancel: 'Cancelar',
    save: 'Guardar',
    confirm: 'Confirmar',
    copy: 'Copiar',
    copied: '¡Copiado!',
    share: 'Compartir',
    back: 'Volver',
    next: 'Siguiente',
    previous: 'Anterior',
    points: 'Puntos',
    score: 'Puntos',
    target: 'Meta',
    round: 'Ronda',
    match: 'Partida',
    victory: '¡Victoria!',
    defeat: 'Derrota',
    draw: 'Robo',
    pass: 'Paso',
    resume: 'Reanudar Partida',
    restart: 'Reiniciar',
    exitToTitle: 'Salir al Menú Principal',
    paused: 'Partida en Pausa',
    pausedSubtitle: 'Tómate un respiro. Puedes reanudar en cualquier momento o reiniciar.',
    muted: 'Silenciar Audio',
    unmuted: 'Activar Audio',

    // Header & Title Screen
    gameTitle: 'BULL DOMINO',
    gameTagline: 'El Simulador Definitivo de Dominó Competitivo con Cifrado E2EE',
    e2eeNetwork: 'Red Cifrada E2EE',
    quickMatch: 'Partida Rápida',
    quickMatchSub: 'Juega al instante contra IA táctica',
    privateRoom: 'Sala Privada con Amigos',
    privateRoomSub: 'Crea o únete mediante código o enlace',
    soloCampaign: 'Campaña Gran Maestro',
    soloCampaignSub: '6 capítulos temáticos y recompensas',
    tutorialRules: 'Tutorial y Reglas',
    tutorialRulesSub: 'Aprende a jugar, trancar y contar',
    leaderboard: 'Clasificación Mundial',
    leaderboardSub: 'Compite por los rangos de temporada',
    avatarProfile: 'Estudio de Avatar',
    avatarProfileSub: 'Personaliza tu personaje y título',
    seasonTier: 'Nivel',
    rankPoints: 'Puntos RP',
    pressEnterToPlay: 'Presiona ENTER o ESPACIO para Jugar Rápido',
    shortcutHint: 'Atajos: [Espacio] Jugar/Robar • [M] Silenciar • [0/R] Centrar • [Esc] Pausa',

    // Game Board HUD
    modeDraw: 'Modo Robo',
    modeBlock: 'Modo Clásico / Tranca',
    modeAllFives: 'Todos los Cincos (Muggins)',
    bonesInHand: 'fichas',
    thinking: 'PENSANDO',
    yourTurnPrompt: '¡TU TURNO! • Toca una ficha resaltada para jugar',
    yourTurnDirectionPrompt: '¡ELIGE DIRECCIÓN! • Toca un marcador en la mesa o un botón',
    noMovesDraw: '¡Sin jugadas! Roba ficha del pozo',
    noMovesPass: '¡Sin jugadas! Toca la mesa para Pasar',
    waitingForPlayer: 'Esperando jugada de',
    choosePlacementFor: 'Elige colocación para la ficha',
    drawBoneyard: 'Robar',
    passTurn: 'Paso',
    rulesHelp: 'Reglas',
    resetView: 'Centrar',
    encryptedChat: 'Chat Cifrado',
    openLeftEnd: 'Extremo Izquierdo Abierto',
    openRightEnd: 'Extremo Derecho Abierto',

    // Placement Directions & Leads
    leadVertical: 'Salida Vertical',
    leadHorizontal: 'Salida Horizontal',
    straight: 'Recto',
    turnRight: 'Giro Derecha',
    turnLeft: 'Giro Izquierda',
    turnUp: 'Giro Arriba',
    turnDown: 'Giro Abajo',
    directionLeft: 'Izquierda',
    directionRight: 'Derecha',
    directionUp: 'Arriba',
    directionDown: 'Abajo',

    // Round Over & Game Over
    roundOver: 'Ronda Terminada',
    gameOver: 'Partida Concluida',
    dominoHandEmptied: '¡DOMINÓ! ¡MANO VACÍA!',
    boardBlocked: '¡MESA TRANCA / CERRADA!',
    gameWonCongratulations: '¡VICTORIA! ¡CAMPEÓN DE LA MESA!',
    gameConcluded: 'PARTIDA FINALIZADA',
    roundWinnerClaimsPoints: 'gana la ronda y suma',
    roundBlockedTie: '¡Empate exacto en puntos en la mesa cerrada!',
    playerReachedTarget: 'ha alcanzado el objetivo de',
    totalScore: 'Puntuación Total',
    nextRound: 'Siguiente Ronda',
    rematch: 'Revancha',
    returnToTitle: 'Volver al Menú',

    // Private Room Modal
    privateRoomTitle: 'Sala Privada para Amigos',
    createRoomTab: 'Crear Sala',
    joinRoomTab: 'Unirse con Código',
    gameModeLabel: 'Modalidad de Juego',
    targetScoreLabel: 'Puntos para Ganar',
    turnTimerLabel: 'Tiempo por Turno (Segundos)',
    customCodeOptional: 'Código Personalizado (Opcional, 4-8 letras)',
    createAndLaunchRoom: 'Crear Sala y Esperar Rival',
    enterRoomCodePrompt: 'Introduce el Código de la Sala (6 caracteres)',
    joinMatchBtn: 'Unirse a la Partida',
    roomLiveEncrypted: 'Sala Activa • Cifrado E2EE 256-bit',
    shareRoomCodePrompt: 'Comparte este Código con tu Amigo o Amiga',
    copyRoomCode: 'Copiar Código',
    copyInviteLink: 'Copiar Enlace de Invitación',
    linkCopied: '¡Enlace Copiado!',
    codeCopied: '¡Código Copiado!',
    waitingOpponentAutoStart: 'Esperando jugadores... ¡La partida iniciará al completarse la mesa!',

    // Match Types & 2v2 Lobby
    matchTypeLabel: 'Modalidad de Enfrentamiento',
    matchType1v1: '1 vs 1 (Duelo Individual)',
    matchType1v1Desc: '2 jugadores • Pozo activo',
    matchType2v2: '2 vs 2 (Partida por Parejas)',
    matchType2v2Desc: '4 jugadores • 7 fichas c/u • Sin pozo',
    team1: 'Equipo 1',
    team2: 'Equipo 2',
    yourTeam: 'Tu Equipo',
    rivalTeam: 'Rivales',
    partner: 'Compañero',
    opponent: 'Rival',
    addBotBtn: '+ Añadir Bot',
    fillBotsAndStart: 'Completar con Bots y Jugar',
    waitingPlayersLobby: 'Sala de Espera Multijugador',
    quickMatchQueue: 'Buscando Partida en Línea...',
    quickMatchQueueDesc: 'Conectando con la mejor mesa disponible',
    teamVictory: '¡Victoria de tu Equipo!',
    teamDefeat: 'Derrota del Equipo',
    teamWonRound: 'gana la ronda',
    leaveLobby: 'Abandonar Sala',

    // Campaign Modal
    campaignTitle: 'Campaña Gran Maestro',
    starsEarnedTotal: 'Estrellas Totales Conseguidas',
    startStageBtn: 'Comenzar Duelo',
    unlocked: 'Desbloqueado',
    lockedRequirement: 'Requiere',
    rewardSkinLabel: 'Recompensa de Aspecto',

    // Leaderboard Modal
    leaderboardTitle: 'Clasificación y Temporadas',
    globalLeaderboardTab: 'Tabla Global',
    seasonRewardsTab: 'Recompensas de Temporada',
    analyticsTab: 'Mis Estadísticas',
    rankCol: 'Puesto',
    playerCol: 'Jugador',
    tierCol: 'Nivel',
    rpCol: 'Puntos RP',
    winRateCol: '% Victorias',
    dominoesCol: 'Dominós',
    statsMatchesPlayed: 'Partidas Jugadas',
    statsMatchesWon: 'Partidas Ganadas',
    statsDominoes: 'Fichas Dominadas',
    statsHighestScore: 'Mejor Puntuación',
    statsWinStreak: 'Racha Actual',
    statsBestStreak: 'Mejor Racha',

    // Avatar Modal
    avatarStudioTitle: 'Estudio de Avatar y Perfil',
    playerNameLabel: 'Nombre de Jugador',
    honorificTitleLabel: 'Título Honorífico',
    skinToneLabel: 'Tono de Piel',
    accessoryLabel: 'Accesorio de Cabeza',
    dominoBadgeLabel: 'Insignia de Dominó',
    bgColorLabel: 'Color de Fondo',
    saveAvatarBtn: 'Guardar Perfil de Avatar',

    // Chat Drawer
    chatTitle: 'Chat Cifrado de Partida',
    chatSubtitle: 'Cifrado E2EE con clave AES-GCM derivada de la sala',
    chatPlaceholder: 'Escribe un mensaje seguro...',
    sendBtn: 'Enviar',
    quickReactionsTitle: 'Reacciones Rápidas',
    quickPhrasesTitle: 'Frases de Mesa',

    // Share Modal
    shareTitle: 'Compartir Logro y Victoria',
    shareSubtitle: 'Muestra tus resultados y reta a tus amigos',
    shareVictoryHeadline: '¡He ganado una partida en Bull Domino!',
    shareViaTwitter: 'Compartir en X (Twitter)',
    shareViaWhatsapp: 'Compartir en WhatsApp',
    shareViaTelegram: 'Compartir en Telegram',
    copyShareText: 'Copiar Mensaje al Portapapeles',
  },

  en: {
    // General
    langName: 'English',
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    confirm: 'Confirm',
    copy: 'Copy',
    copied: 'Copied!',
    share: 'Share',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    points: 'Points',
    score: 'Score',
    target: 'Target',
    round: 'Round',
    match: 'Match',
    victory: 'Victory!',
    defeat: 'Defeat',
    draw: 'Draw',
    pass: 'Pass',
    resume: 'Resume Match',
    restart: 'Restart',
    exitToTitle: 'Exit to Title Screen',
    paused: 'Match Paused',
    pausedSubtitle: 'Take a breather. You can resume anytime or restart.',
    muted: 'Mute Audio',
    unmuted: 'Unmute Audio',

    // Header & Title Screen
    gameTitle: 'BULL DOMINO',
    gameTagline: 'The Ultimate Competitive Domino Simulator with E2EE Networking',
    e2eeNetwork: 'E2EE Encrypted Network',
    quickMatch: 'Quick Match',
    quickMatchSub: 'Play instantly vs smart tactical AI',
    privateRoom: 'Private Friend Room',
    privateRoomSub: 'Create or join via code or invite link',
    soloCampaign: 'Grandmaster Campaign',
    soloCampaignSub: '6 chapters with themed opponents & skins',
    tutorialRules: 'Tutorial & Rules',
    tutorialRulesSub: 'Learn matching, blocking, and scoring',
    leaderboard: 'World Leaderboard',
    leaderboardSub: 'Climb the seasonal tiers and ranks',
    avatarProfile: 'Avatar Studio',
    avatarProfileSub: 'Customize your persona and title',
    seasonTier: 'Tier',
    rankPoints: 'RP Points',
    pressEnterToPlay: 'Press ENTER or SPACE for Quick Match',
    shortcutHint: 'Shortcuts: [Space] Play/Draw • [M] Mute • [0/R] Center • [Esc] Pause',

    // Game Board HUD
    modeDraw: 'Draw Mode',
    modeBlock: 'Block Mode',
    modeAllFives: 'All-Fives Mode (Muggins)',
    bonesInHand: 'bones',
    thinking: 'THINKING',
    yourTurnPrompt: 'YOUR TURN • Tap a highlighted tile to play',
    yourTurnDirectionPrompt: 'CHOOSE DIRECTION • Tap a marker on the board or button',
    noMovesDraw: 'No moves! Draw from Boneyard',
    noMovesPass: 'No moves! Knock / Pass turn',
    waitingForPlayer: 'Waiting for',
    choosePlacementFor: 'Choose placement for tile',
    drawBoneyard: 'Draw',
    passTurn: 'Pass',
    rulesHelp: 'Rules',
    resetView: 'Center',
    encryptedChat: 'Encrypted Chat',
    openLeftEnd: 'Open Left End',
    openRightEnd: 'Open Right End',

    // Placement Directions & Leads
    leadVertical: 'Vertical Lead',
    leadHorizontal: 'Horizontal Lead',
    straight: 'Straight',
    turnRight: 'Turn Right',
    turnLeft: 'Turn Left',
    turnUp: 'Turn Up',
    turnDown: 'Turn Down',
    directionLeft: 'Left',
    directionRight: 'Right',
    directionUp: 'Up',
    directionDown: 'Down',

    // Round Over & Game Over
    roundOver: 'Round Over',
    gameOver: 'Match Concluded',
    dominoHandEmptied: 'DOMINO! HAND EMPTIED!',
    boardBlocked: 'BOARD BLOCKED!',
    gameWonCongratulations: 'VICTORY! CHAMPION OF BONES!',
    gameConcluded: 'MATCH FINISHED',
    roundWinnerClaimsPoints: 'wins the round and claims',
    roundBlockedTie: 'The round ended in a dead heat tie!',
    playerReachedTarget: 'has reached the target score of',
    totalScore: 'Total Score',
    nextRound: 'Next Round',
    rematch: 'Rematch',
    returnToTitle: 'Return to Title',

    // Private Room Modal
    privateRoomTitle: 'Private Friend Match',
    createRoomTab: 'Create Room',
    joinRoomTab: 'Join with Code',
    gameModeLabel: 'Game Mode',
    targetScoreLabel: 'Target Score',
    turnTimerLabel: 'Turn Time Limit (Seconds)',
    customCodeOptional: 'Custom Room Code (Optional, 4-8 letters)',
    createAndLaunchRoom: 'Create Room & Await Opponent',
    enterRoomCodePrompt: 'Enter 6-character Room Code',
    joinMatchBtn: 'Join Match',
    roomLiveEncrypted: 'Room Live • E2EE Encrypted 256-bit',
    shareRoomCodePrompt: 'Share this Code with your Friend',
    copyRoomCode: 'Copy Code',
    copyInviteLink: 'Copy Invite Link',
    linkCopied: 'Link Copied!',
    codeCopied: 'Code Copied!',
    waitingOpponentAutoStart: 'Waiting for players... Match will start once table is filled!',

    // Match Types & 2v2 Lobby
    matchTypeLabel: 'Match Format',
    matchType1v1: '1 vs 1 (Single Duel)',
    matchType1v1Desc: '2 players • Active boneyard',
    matchType2v2: '2 vs 2 (Team Play)',
    matchType2v2Desc: '4 players • 7 tiles each • No draw',
    team1: 'Team 1',
    team2: 'Team 2',
    yourTeam: 'Your Team',
    rivalTeam: 'Opponents',
    partner: 'Partner',
    opponent: 'Opponent',
    addBotBtn: '+ Add Bot',
    fillBotsAndStart: 'Fill with Bots & Start',
    waitingPlayersLobby: 'Multiplayer Waiting Room',
    quickMatchQueue: 'Searching for Online Match...',
    quickMatchQueueDesc: 'Connecting you to the best table available',
    teamVictory: 'Your Team Wins!',
    teamDefeat: 'Team Defeat',
    teamWonRound: 'claims the round',
    leaveLobby: 'Leave Room',

    // Campaign Modal
    campaignTitle: 'Grandmaster Campaign',
    starsEarnedTotal: 'Total Stars Earned',
    startStageBtn: 'Start Duel',
    unlocked: 'Unlocked',
    lockedRequirement: 'Requires',
    rewardSkinLabel: 'Reward Skin',

    // Leaderboard Modal
    leaderboardTitle: 'Leaderboard & Seasons',
    globalLeaderboardTab: 'Global Ranks',
    seasonRewardsTab: 'Season Rewards',
    analyticsTab: 'My Analytics',
    rankCol: 'Rank',
    playerCol: 'Player',
    tierCol: 'Tier',
    rpCol: 'RP Points',
    winRateCol: 'Win %',
    dominoesCol: 'Dominoes',
    statsMatchesPlayed: 'Matches Played',
    statsMatchesWon: 'Matches Won',
    statsDominoes: 'Bones Dominoed',
    statsHighestScore: 'Highest Score',
    statsWinStreak: 'Current Streak',
    statsBestStreak: 'Best Streak',

    // Avatar Modal
    avatarStudioTitle: 'Avatar Studio & Profile',
    playerNameLabel: 'Player Name',
    honorificTitleLabel: 'Honorific Title',
    skinToneLabel: 'Skin Tone',
    accessoryLabel: 'Head Accessory',
    dominoBadgeLabel: 'Domino Badge',
    bgColorLabel: 'Background Color',
    saveAvatarBtn: 'Save Avatar Profile',

    // Chat Drawer
    chatTitle: 'Encrypted Match Chat',
    chatSubtitle: 'E2EE encryption with AES-GCM room key',
    chatPlaceholder: 'Type a secure message...',
    sendBtn: 'Send',
    quickReactionsTitle: 'Quick Reactions',
    quickPhrasesTitle: 'Table Phrases',

    // Share Modal
    shareTitle: 'Share Achievement & Victory',
    shareSubtitle: 'Showcase your performance and invite challengers',
    shareVictoryHeadline: 'I just won a match in Bull Domino!',
    shareViaTwitter: 'Share on X (Twitter)',
    shareViaWhatsapp: 'Share on WhatsApp',
    shareViaTelegram: 'Share on Telegram',
    copyShareText: 'Copy Text to Clipboard',
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('domino_language');
      if (saved === 'en' || saved === 'es') return saved;
    }
    return 'es'; // Default to Spanish per user request
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('domino_language', lang);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  const value: I18nContextType = {
    language,
    setLanguage,
    toggleLanguage,
    t: TRANSLATIONS[language],
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      language: 'es',
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: TRANSLATIONS['es'],
    };
  }
  return context;
}

export const LanguageSwitcherButton: React.FC<{
  className?: string;
  size?: 'sm' | 'md';
}> = ({ className = '', size = 'md' }) => {
  const { language, toggleLanguage } = useI18n();

  return (
    <button
      onClick={toggleLanguage}
      aria-label={`Switch language. Current: ${language === 'es' ? 'Español' : 'English'}`}
      title={language === 'es' ? 'Cambiar a English' : 'Switch to Español'}
      className={`relative inline-flex items-center gap-1.5 rounded-full font-bold transition-all shadow-md active:scale-95 border ${
        size === 'sm' ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'
      } bg-stone-900/90 hover:bg-stone-800 text-stone-200 hover:text-amber-300 border-amber-500/40 hover:border-amber-400 ${className}`}
    >
      <span className="text-sm">{language === 'es' ? '🇪🇸' : '🇺🇸'}</span>
      <span className="font-mono tracking-wider uppercase font-black">
        {language === 'es' ? 'ES' : 'EN'}
      </span>
      <span className="text-stone-500 text-[10px] font-normal">|</span>
      <span className="text-stone-400 text-[10px] hover:text-amber-200">
        {language === 'es' ? 'EN' : 'ES'}
      </span>
    </button>
  );
};
