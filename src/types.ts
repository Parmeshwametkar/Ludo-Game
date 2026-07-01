export type PlayerColor = 'GREEN' | 'YELLOW' | 'BLUE' | 'RED';

export interface Token {
  id: number; // 0, 1, 2, 3
  color: PlayerColor;
  position: number; // -1 for BASE, 0-51 for common path, 52-56 for HOME_PATH, 57 for HOME
  stepCount: number; // total steps moved (0 to 57)
}

export interface Player {
  color: PlayerColor;
  name: string;
  isAI: boolean;
  isOnline: boolean;
  avatarId: string;
  tokens: Token[];
  hasRolled: boolean;
  hasCompleted: boolean;
  coins: number;
  xp: number;
}

export type GameMode = 'AI' | 'LOCAL' | 'ONLINE';

export interface GameState {
  roomId: string | null;
  mode: GameMode;
  players: Player[];
  currentTurn: PlayerColor;
  diceValue: number;
  isRolling: boolean;
  consecutiveSixes: number;
  winner: PlayerColor | null;
  isGameOver: boolean;
  gameStarted: boolean;
  turnTimer: number; // seconds left for current turn
  rollHistory: { color: PlayerColor; value: number }[];
  chatMessages: ChatMessage[];
  aiDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface ChatMessage {
  id: string;
  sender: string;
  color: PlayerColor | 'SYSTEM';
  text: string;
  timestamp: string;
}

export interface MatchHistoryEntry {
  id: string;
  date: string;
  mode: string;
  players: { name: string; color: string; winner: boolean }[];
  winnerName: string;
  duration: string;
}

// Coordinate mapping type for 15x15 board
export interface Coordinate {
  row: number;
  col: number;
}

// 52 common path track coordinates in clockwise order starting from (6,0)
export const TRACK_COORDINATES: Coordinate[] = [
  { row: 6, col: 0 }, { row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 3 }, { row: 6, col: 4 }, { row: 6, col: 5 },
  { row: 5, col: 6 }, { row: 4, col: 6 }, { row: 3, col: 6 }, { row: 2, col: 6 }, { row: 1, col: 6 }, { row: 0, col: 6 },
  { row: 0, col: 7 },
  { row: 0, col: 8 }, { row: 1, col: 8 }, { row: 2, col: 8 }, { row: 3, col: 8 }, { row: 4, col: 8 }, { row: 5, col: 8 },
  { row: 6, col: 9 }, { row: 6, col: 10 }, { row: 6, col: 11 }, { row: 6, col: 12 }, { row: 6, col: 13 }, { row: 6, col: 14 },
  { row: 7, col: 14 },
  { row: 8, col: 14 }, { row: 8, col: 13 }, { row: 8, col: 12 }, { row: 8, col: 11 }, { row: 8, col: 10 }, { row: 8, col: 9 },
  { row: 9, col: 8 }, { row: 10, col: 8 }, { row: 11, col: 8 }, { row: 12, col: 8 }, { row: 13, col: 8 }, { row: 14, col: 8 },
  { row: 14, col: 7 },
  { row: 14, col: 6 }, { row: 13, col: 6 }, { row: 12, col: 6 }, { row: 11, col: 6 }, { row: 10, col: 6 }, { row: 9, col: 6 },
  { row: 8, col: 5 }, { row: 8, col: 4 }, { row: 8, col: 3 }, { row: 8, col: 2 }, { row: 8, col: 1 }, { row: 8, col: 0 },
  { row: 7, col: 0 }
];

// Home paths for each color (5 steps leading to home)
export const HOME_PATHS: Record<PlayerColor, Coordinate[]> = {
  GREEN: [
    { row: 7, col: 1 }, { row: 7, col: 2 }, { row: 7, col: 3 }, { row: 7, col: 4 }, { row: 7, col: 5 }
  ],
  YELLOW: [
    { row: 1, col: 7 }, { row: 2, col: 7 }, { row: 3, col: 7 }, { row: 4, col: 7 }, { row: 5, col: 7 }
  ],
  BLUE: [
    { row: 7, col: 13 }, { row: 7, col: 12 }, { row: 7, col: 11 }, { row: 7, col: 10 }, { row: 7, col: 9 }
  ],
  RED: [
    { row: 13, col: 7 }, { row: 12, col: 7 }, { row: 11, col: 7 }, { row: 10, col: 7 }, { row: 9, col: 7 }
  ]
};

// Safe Zone Track Indices or raw Row/Col checks
export const SAFE_COORDINATES: Coordinate[] = [
  { row: 6, col: 1 },  // Green Start
  { row: 1, col: 8 },  // Yellow Start
  { row: 8, col: 13 }, // Blue Start
  { row: 13, col: 6 }, // Red Start
  { row: 8, col: 2 },  // Left Arm Star
  { row: 2, col: 6 },  // Top Arm Star
  { row: 6, col: 12 }, // Right Arm Star
  { row: 12, col: 8 }  // Bottom Arm Star
];

// Starting track indices in TRACK_COORDINATES
export const START_INDEX: Record<PlayerColor, number> = {
  GREEN: 1,
  YELLOW: 14,
  BLUE: 27,
  RED: 40
};

// Index right before entering the home path
export const HOME_ENTRY_INDEX: Record<PlayerColor, number> = {
  GREEN: 51,
  YELLOW: 12,
  BLUE: 25,
  RED: 38
};

// Yard coordinates for token positioning inside bases
export const BASE_COORDINATES: Record<PlayerColor, Coordinate[]> = {
  GREEN: [
    { row: 2, col: 2 }, { row: 2, col: 3 },
    { row: 3, col: 2 }, { row: 3, col: 3 }
  ],
  YELLOW: [
    { row: 2, col: 11 }, { row: 2, col: 12 },
    { row: 3, col: 11 }, { row: 3, col: 12 }
  ],
  BLUE: [
    { row: 11, col: 11 }, { row: 11, col: 12 },
    { row: 12, col: 11 }, { row: 12, col: 12 }
  ],
  RED: [
    { row: 11, col: 2 }, { row: 11, col: 3 },
    { row: 12, col: 2 }, { row: 12, col: 3 }
  ]
};

// Final home cells
export const HOME_COORDINATES: Record<PlayerColor, Coordinate> = {
  GREEN: { row: 7, col: 6 },
  YELLOW: { row: 6, col: 7 },
  BLUE: { row: 7, col: 8 },
  RED: { row: 8, col: 7 }
};
