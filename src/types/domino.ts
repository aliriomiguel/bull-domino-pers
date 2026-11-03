/**
 * Types for Bull Domino
 */

export interface DominoTile {
  id: string; // e.g. "0-0", "6-5"
  left: number; // 0 to 6
  right: number; // 0 to 6
}

export type PlacementDirection = 'right' | 'left' | 'up' | 'down';

export interface CandidatePlacement {
  end: 'left' | 'right';
  direction: PlacementDirection;
  label: string; // e.g. "Straight", "Turn Down", "Turn Up"
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  gx: number;
  gy: number;
  orientation: 'horizontal' | 'vertical';
  pip1: number;
  pip2: number;
}

export interface PlacedTile {
  tile: DominoTile;
  placedEnd: 'left' | 'right' | 'root';
  orientation: 'horizontal' | 'vertical'; // doubles usually vertical
  // Which number touches the chain, and which number is open
  matchedPip: number; // the pip touching the adjacent tile
  openPip: number; // the pip facing outward
  boardIndex: number;
  displayLeft?: number;
  displayRight?: number;
  // 2D Layout coordinates
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  direction?: PlacementDirection;
}

export type GameMode = 'draw' | 'block' | 'all-fives';

export type AIDifficulty = 'novice' | 'tactician' | 'grandmaster';

export interface PlayerProfile {
  id: string;
  name: string;
  avatarSeed: {
    skin: string;
    accessory: string;
    bgColor: string;
    dominoBadge: string;
    expression: string;
  };
  title: string;
  rankPoints: number;
  seasonTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Domino Legend';
  stats: {
    matchesPlayed: number;
    matchesWon: number;
    dominoesCount: number; // Times player emptied their hand
    highestScore: number;
    winStreak: number;
    bestWinStreak: number;
  };
}

export type MatchType = '1v1' | '2v2';

export interface PlayerState {
  id: string;
  name: string;
  profile: PlayerProfile;
  hand: DominoTile[];
  score: number;
  team?: 1 | 2;
  seatIndex?: number; // 0: bottom (you), 1: right (opponent 1), 2: top (partner), 3: left (opponent 2)
  isAI?: boolean;
  isBot?: boolean;
  handCount?: number;
  aiDifficulty?: AIDifficulty;
  connected?: boolean;
}

export interface GameState {
  id: string;
  mode: GameMode;
  matchType?: MatchType;
  targetScore: number;
  team1Score?: number;
  team2Score?: number;
  players: PlayerState[];
  currentTurnIndex: number;
  board: PlacedTile[];
  leftEnd: number | null; // open pip on left side
  rightEnd: number | null; // open pip on right side
  boneyard: DominoTile[];
  isRoundOver: boolean;
  isGameOver: boolean;
  winnerId: string | null;
  winningTeam?: 1 | 2 | null;
  roundWinnerId: string | null;
  roundWinningTeam?: 1 | 2 | null;
  roundPointsAwarded: number;
  roundEndReason: 'domino' | 'blocked' | null;
  turnTimeLimit: number; // seconds (0 for no limit)
  turnTimeRemaining: number;
  consecutivePasses: number;
  history: string[];
}

export interface EncryptedChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  avatarColor: string;
  timestamp: number;
  encryptedData: string; // Base64 ciphertext
  iv: string; // Base64 IV
  isQuickReaction?: boolean;
  quickReactionEmoji?: string;
}

export interface CampaignStage {
  id: number;
  title: string;
  subtitle: string;
  mode: GameMode;
  targetScore: number;
  aiDifficulty: AIDifficulty;
  aiName: string;
  aiTitle: string;
  aiAvatar: PlayerProfile['avatarSeed'];
  description: string;
  rewardSkin: string;
  unlockRequirementStars: number;
}
