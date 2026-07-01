import { PlayerColor, Token, Coordinate, START_INDEX, HOME_ENTRY_INDEX, SAFE_COORDINATES, TRACK_COORDINATES } from './types';

// Check if a specific coordinate is a safe zone
export function isSafeZone(row: number, col: number): boolean {
  return SAFE_COORDINATES.some(c => c.row === row && c.col === col);
}

// Check if cell is safe zone by track index
export function isSafeIndex(index: number): boolean {
  if (index < 0 || index >= 52) return false;
  const coord = TRACK_COORDINATES[index];
  return isSafeZone(coord.row, coord.col);
}

// Calculate the next step for a token
export function getNextPosition(token: Token, dice: number): { position: number; stepCount: number } | null {
  const startIdx = START_INDEX[token.color];
  const homeEntryIdx = HOME_ENTRY_INDEX[token.color];

  // Token is in BASE
  if (token.position === -1) {
    if (dice === 6) {
      return { position: startIdx, stepCount: 0 };
    }
    return null;
  }

  // Token is already HOME
  if (token.position === 57) {
    return null;
  }

  // Token is on HOME PATH
  if (token.position >= 52 && token.position <= 56) {
    const remaining = 57 - token.position;
    if (dice <= remaining) {
      const nextPos = token.position + dice;
      return { position: nextPos, stepCount: token.stepCount + dice };
    }
    return null;
  }

  // Token is on common track
  let currentPos = token.position;
  let stepsMoved = token.stepCount;

  for (let i = 1; i <= dice; i++) {
    if (currentPos === homeEntryIdx) {
      // Enter Home path
      const stepsToHome = dice - i;
      const targetPos = 52 + stepsToHome;
      if (targetPos <= 57) {
        return { position: targetPos, stepCount: stepsMoved + dice };
      }
      return null;
    }
    currentPos = (currentPos + 1) % 52;
  }

  return { position: currentPos, stepCount: stepsMoved + dice };
}

// Get all tokens that a player can move for a given dice roll
export function getMovableTokens(tokens: Token[], color: PlayerColor, dice: number): Token[] {
  return tokens.filter(t => {
    if (t.color !== color) return false;
    return getNextPosition(t, dice) !== null;
  });
}

// Scan for opponent token at target coordinate that can be captured
export function checkCapture(
  tokens: Token[],
  movingToken: Token,
  targetPos: number
): Token | null {
  // If target position is BASE or HOME, cannot capture
  if (targetPos === -1 || targetPos === 57) return null;

  let targetCoord: Coordinate;
  if (targetPos >= 52 && targetPos <= 56) {
    return null; // Home path is exclusive to player color
  } else {
    targetCoord = TRACK_COORDINATES[targetPos];
  }

  // If safe zone, no capture
  if (isSafeZone(targetCoord.row, targetCoord.col)) return null;

  // Look for any opponent token on the same coordinate
  for (const t of tokens) {
    if (t.color === movingToken.color) continue; // friendly token

    let oppCoord: Coordinate | null = null;
    if (t.position === -1) continue;
    if (t.position === 57) continue;
    if (t.position >= 52 && t.position <= 56) continue;
    
    oppCoord = TRACK_COORDINATES[t.position];

    if (oppCoord && oppCoord.row === targetCoord.row && oppCoord.col === targetCoord.col) {
      return t;
    }
  }

  return null;
}

// AI decision logic: Easy (random), Medium (captures or progression), Hard (safety checks + strategy)
export function calculateBestAIMove(
  tokens: Token[],
  aiColor: PlayerColor,
  dice: number,
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
): Token | null {
  const movables = getMovableTokens(tokens, aiColor, dice);
  if (movables.length === 0) return null;
  if (movables.length === 1) return movables[0];

  if (difficulty === 'EASY') {
    const randIdx = Math.floor(Math.random() * movables.length);
    return movables[randIdx];
  }

  let bestToken: Token | null = null;
  let bestScore = -Infinity;

  for (const t of movables) {
    const nextState = getNextPosition(t, dice);
    if (!nextState) continue;

    let score = 0;

    // 1. Capture opponent is ALWAYS top priority (+1000 points)
    const victim = checkCapture(tokens, t, nextState.position);
    if (victim) {
      score += 1000;
    }

    // 2. Getting a token Home is amazing (+500 points)
    if (nextState.position === 57) {
      score += 500;
    }

    // 3. Opening token from base (+400 points)
    if (t.position === -1 && dice === 6) {
      score += 400;
    }

    // 4. Moving a token out of unsafe zone / danger (+150 points)
    if (difficulty === 'HARD') {
      const currentCoord = t.position >= 0 && t.position < 52 ? TRACK_COORDINATES[t.position] : null;
      if (currentCoord && !isSafeZone(currentCoord.row, currentCoord.col)) {
        // If an opponent is right behind us, we are in danger
        const inDanger = checkOpponentWithinReach(tokens, t.color, t.position);
        if (inDanger) {
          score += 250;
        }
      }

      // Landing on safe zone (+200 points)
      const destCoord = nextState.position >= 0 && nextState.position < 52 ? TRACK_COORDINATES[nextState.position] : null;
      if (destCoord && isSafeZone(destCoord.row, destCoord.col)) {
        score += 200;
      }

      // Favor tokens closer to home
      score += t.stepCount * 0.2;
    } else {
      // Medium weighting
      score += t.stepCount * 0.1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestToken = t;
    }
  }

  return bestToken || movables[0];
}

// Helper to check if any opponent is behind within a dice roll reach (1 to 6)
function checkOpponentWithinReach(tokens: Token[], myColor: PlayerColor, myPos: number): boolean {
  for (const t of tokens) {
    if (t.color === myColor) continue;
    if (t.position === -1 || t.position === 57 || t.position >= 52) continue;

    // Calculate clockwise distance on common track
    const dist = (myPos - t.position + 52) % 52;
    if (dist > 0 && dist <= 6) {
      return true;
    }
  }
  return false;
}
