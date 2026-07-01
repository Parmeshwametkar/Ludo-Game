import React, { useState } from 'react';
import { 
  PlayerColor, 
  Token, 
  Coordinate, 
  TRACK_COORDINATES, 
  HOME_PATHS, 
  SAFE_COORDINATES, 
  START_INDEX, 
  HOME_ENTRY_INDEX,
  BASE_COORDINATES, 
  HOME_COORDINATES 
} from '../types';
import { Star, Shield, HelpCircle, Trophy, Sparkles } from 'lucide-react';

interface GameBoardProps {
  tokens: Token[];
  currentTurn: PlayerColor;
  diceValue: number;
  hasRolled: boolean;
  onTokenClick: (token: Token) => void;
  movableTokens: Token[];
}

export default function GameBoard({ 
  tokens, 
  currentTurn, 
  diceValue, 
  hasRolled, 
  onTokenClick, 
  movableTokens 
}: GameBoardProps) {
  const [hoveredToken, setHoveredToken] = useState<Token | null>(null);

  // Helper to determine cell styling and categories in the 15x15 board
  const getCellType = (row: number, col: number) => {
    // Yards (covered by absolute container)
    if (row < 6 && col < 6) return { type: 'YARD', color: 'GREEN' as PlayerColor };
    if (row < 6 && col > 8) return { type: 'YARD', color: 'YELLOW' as PlayerColor };
    if (row > 8 && col < 6) return { type: 'YARD', color: 'RED' as PlayerColor };
    if (row > 8 && col > 8) return { type: 'YARD', color: 'BLUE' as PlayerColor };

    // Center Home (3x3 triangle center)
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) {
      return { type: 'CENTER' };
    }

    // Home paths
    if (row === 7 && col >= 1 && col <= 5) return { type: 'HOME_PATH', color: 'GREEN' as PlayerColor };
    if (col === 7 && row >= 1 && row <= 5) return { type: 'HOME_PATH', color: 'YELLOW' as PlayerColor };
    if (row === 7 && col >= 9 && col <= 13) return { type: 'HOME_PATH', color: 'BLUE' as PlayerColor };
    if (col === 7 && row >= 9 && row <= 13) return { type: 'HOME_PATH', color: 'RED' as PlayerColor };

    // Common track safe coordinates
    const isSafe = SAFE_COORDINATES.some(coord => coord.row === row && coord.col === col);
    if (isSafe) {
      // Determine if it is a starting cell of a specific color
      if (row === 6 && col === 1) return { type: 'SAFE_START', color: 'GREEN' as PlayerColor };
      if (row === 1 && col === 8) return { type: 'SAFE_START', color: 'YELLOW' as PlayerColor };
      if (row === 8 && col === 13) return { type: 'SAFE_START', color: 'BLUE' as PlayerColor };
      if (row === 13 && col === 6) return { type: 'SAFE_START', color: 'RED' as PlayerColor };
      return { type: 'SAFE_STAR' };
    }

    // Normal cells
    return { type: 'NORMAL' };
  };

  // Get tokens occupying a specific grid position (row, col)
  const getTokensAtCell = (row: number, col: number): Token[] => {
    return tokens.filter(t => {
      let coord: Coordinate | null = null;
      if (t.position === -1) {
        // Excluded from standard cell rendering because they are beautifully housed in our 6x6 bases
        return false;
      } else if (t.position === 57) {
        // HOME
        coord = HOME_COORDINATES[t.color];
      } else if (t.position >= 52 && t.position <= 56) {
        // HOME PATH
        const path = HOME_PATHS[t.color];
        coord = path[t.position - 52];
      } else {
        // COMMON TRACK
        coord = TRACK_COORDINATES[t.position];
      }

      return coord && coord.row === row && coord.col === col;
    });
  };

  // Check if a token is movable right now
  const isTokenMovable = (token: Token) => {
    return movableTokens.some(mt => mt.color === token.color && mt.id === token.id);
  };

  // Calculate destination coordinate for hover preview
  const getHoverPreviewCoordinate = (token: Token): Coordinate | null => {
    if (!isTokenMovable(token)) return null;

    let targetPos = token.position;
    if (token.position === -1) {
      if (diceValue === 6) targetPos = START_INDEX[token.color];
    } else {
      targetPos = token.position + diceValue;
    }

    if (targetPos === 57) return HOME_COORDINATES[token.color];
    if (targetPos >= 52 && targetPos <= 56) return HOME_PATHS[token.color][targetPos - 52];
    if (targetPos >= 0 && targetPos <= 51) return TRACK_COORDINATES[targetPos];
    return null;
  };

  // Compute every coordinate step traversed during movement
  const getTraversedCoordinates = (token: Token, dice: number): Coordinate[] => {
    if (!isTokenMovable(token)) return [];
    
    const startIdx = START_INDEX[token.color];
    const homeEntryIdx = HOME_ENTRY_INDEX[token.color];
    const pathCoords: Coordinate[] = [];

    // Token in BASE
    if (token.position === -1) {
      if (dice === 6) {
        return [TRACK_COORDINATES[startIdx]];
      }
      return [];
    }

    // Token already HOME
    if (token.position === 57) {
      return [];
    }

    // Token on HOME PATH
    if (token.position >= 52 && token.position <= 56) {
      const remaining = 57 - token.position;
      if (dice <= remaining) {
        for (let i = 1; i <= dice; i++) {
          const pos = token.position + i;
          if (pos === 57) {
            pathCoords.push(HOME_COORDINATES[token.color]);
          } else {
            pathCoords.push(HOME_PATHS[token.color][pos - 52]);
          }
        }
      }
      return pathCoords;
    }

    // Token on common track
    let currentPos = token.position;
    for (let i = 1; i <= dice; i++) {
      if (currentPos === homeEntryIdx) {
        const stepsRemaining = dice - i;
        for (let j = 0; j <= stepsRemaining; j++) {
          const pos = 52 + j;
          if (pos === 57) {
            pathCoords.push(HOME_COORDINATES[token.color]);
          } else {
            pathCoords.push(HOME_PATHS[token.color][pos - 52]);
          }
        }
        break;
      }
      currentPos = (currentPos + 1) % 52;
      pathCoords.push(TRACK_COORDINATES[currentPos]);
    }

    return pathCoords;
  };

  const previewCoord = hoveredToken ? getHoverPreviewCoordinate(hoveredToken) : null;
  const traversedCoords = hoveredToken ? getTraversedCoordinates(hoveredToken, diceValue) : [];

  // Outer border glow styling for active turn
  const turnGlowClasses: Record<PlayerColor, string> = {
    GREEN: 'shadow-[0_0_35px_rgba(16,185,129,0.4)] border-emerald-500/50 ring-8 ring-emerald-500/10',
    YELLOW: 'shadow-[0_0_35px_rgba(251,191,36,0.4)] border-amber-400/50 ring-8 ring-amber-400/10',
    BLUE: 'shadow-[0_0_35px_rgba(59,130,246,0.4)] border-blue-500/50 ring-8 ring-blue-500/10',
    RED: 'shadow-[0_0_35px_rgba(239,68,68,0.4)] border-red-500/50 ring-8 ring-red-500/10'
  };

  return (
    <div className={`relative w-full max-w-[500px] aspect-square bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-3 border-2 transition-all duration-500 ${turnGlowClasses[currentTurn]}`}>
      
      {/* Golden bezel inlay */}
      <div className="absolute inset-1.5 border-2 border-amber-500/15 rounded-[22px] pointer-events-none z-10" />

      {/* 15x15 Grid Board */}
      <div className="grid grid-cols-15 grid-rows-15 gap-[1px] w-full h-full bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80">
        {Array.from({ length: 15 }).map((_, row) => {
          return Array.from({ length: 15 }).map((_, col) => {
            const cell = getCellType(row, col);
            const cellTokens = getTokensAtCell(row, col);

            // Determine background colors for board cells
            let bgClass = 'bg-slate-900';
            let cellContent = null;

            if (cell.type === 'YARD') {
              if (cell.color === 'GREEN') bgClass = 'bg-emerald-950/20';
              if (cell.color === 'YELLOW') bgClass = 'bg-amber-950/20';
              if (cell.color === 'BLUE') bgClass = 'bg-blue-950/20';
              if (cell.color === 'RED') bgClass = 'bg-red-950/20';
            } else if (cell.type === 'HOME_PATH') {
              if (cell.color === 'GREEN') bgClass = 'bg-emerald-600 border border-emerald-500/40';
              if (cell.color === 'YELLOW') bgClass = 'bg-amber-500 border border-amber-400/40';
              if (cell.color === 'BLUE') bgClass = 'bg-blue-600 border border-blue-500/40';
              if (cell.color === 'RED') bgClass = 'bg-red-600 border border-red-500/40';
            } else if (cell.type === 'SAFE_START') {
              if (cell.color === 'GREEN') bgClass = 'bg-emerald-500/30 border border-emerald-400/50';
              if (cell.color === 'YELLOW') bgClass = 'bg-amber-400/30 border border-amber-300/50';
              if (cell.color === 'BLUE') bgClass = 'bg-blue-500/30 border border-blue-400/50';
              if (cell.color === 'RED') bgClass = 'bg-red-500/30 border border-red-400/50';
              cellContent = <Shield className="w-4 h-4 text-white opacity-40" />;
            } else if (cell.type === 'SAFE_STAR') {
              bgClass = 'bg-slate-800 border border-slate-700';
              cellContent = <Star className="w-4 h-4 fill-amber-400 text-amber-300 opacity-90 animate-pulse" />;
            } else if (cell.type === 'CENTER') {
              bgClass = 'bg-slate-950';
            } else {
              bgClass = 'bg-slate-900 border border-slate-800/60';
            }

            // Highlighting the preview destination cell on hover
            const isPreviewTarget = previewCoord && previewCoord.row === row && previewCoord.col === col;
            const isPathCell = traversedCoords.some(c => c.row === row && c.col === col);

            return (
              <div
                key={`${row}-${col}`}
                className={`relative flex items-center justify-center w-full h-full transition-all duration-300 ${bgClass} ${
                  isPreviewTarget 
                    ? 'ring-4 ring-purple-500 ring-inset bg-purple-500/20 z-10 animate-pulse' 
                    : isPathCell 
                    ? 'bg-purple-900/40 ring-2 ring-purple-500/30 ring-inset z-10'
                    : ''
                }`}
              >
                {/* 1. Draw solid, beautiful Yard bases (6x6 spanning from (0,0), (0,9), etc.) */}
                {row === 0 && col === 0 && (
                  <div className={`absolute top-0 left-0 w-[600%] h-[600%] bg-gradient-to-br from-emerald-500/90 to-emerald-700/90 rounded-2xl flex items-center justify-center shadow-2xl border-b-4 border-emerald-800 z-10 p-4 transition-all duration-500 ${
                    currentTurn === 'GREEN' ? 'ring-4 ring-emerald-400 shadow-emerald-500/20' : 'border border-emerald-500/30'
                  }`}>
                    <div className="w-[75%] h-[75%] bg-slate-950/95 rounded-xl grid grid-cols-2 p-3 gap-3 justify-center items-center border border-emerald-500/20 shadow-inner">
                      {Array.from({ length: 4 }).map((_, i) => {
                        const token = tokens.find(t => t.color === 'GREEN' && t.position === -1 && t.id === i);
                        const movable = token ? isTokenMovable(token) : false;
                        const isHovered = token && hoveredToken?.color === token.color && hoveredToken?.id === token.id;
                        return (
                          <div key={i} className="w-full h-full rounded-full flex items-center justify-center relative bg-emerald-950/40 border border-emerald-500/10 shadow-inner">
                            {token ? (
                              <button
                                key={`${token.color}-${token.id}`}
                                disabled={!movable}
                                onMouseEnter={() => movable && setHoveredToken(token)}
                                onMouseLeave={() => setHoveredToken(null)}
                                onClick={() => {
                                  setHoveredToken(null);
                                  onTokenClick(token);
                                }}
                                className={`w-4/5 h-4/5 rounded-full shadow-lg flex items-center justify-center font-black text-xs text-white transition-all transform hover:scale-115 active:scale-95 bg-gradient-to-b from-emerald-400 to-emerald-600 border border-white hover:from-emerald-300 hover:to-emerald-500 ${
                                  movable ? 'ring-4 ring-emerald-300 ring-offset-1 animate-pulse cursor-pointer shadow-emerald-500/50' : 'cursor-default shadow-black/40'
                                } ${isHovered ? 'ring-4 ring-purple-400 scale-120 z-30' : ''}`}
                              >
                                <span className="select-none">{token.id + 1}</span>
                              </button>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-emerald-500/20 animate-ping" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {row === 0 && col === 9 && (
                  <div className={`absolute top-0 left-0 w-[600%] h-[600%] bg-gradient-to-br from-amber-400/90 to-amber-600/90 rounded-2xl flex items-center justify-center shadow-2xl border-b-4 border-amber-700 z-10 p-4 transition-all duration-500 ${
                    currentTurn === 'YELLOW' ? 'ring-4 ring-amber-400 shadow-amber-500/20' : 'border border-amber-500/30'
                  }`}>
                    <div className="w-[75%] h-[75%] bg-slate-950/95 rounded-xl grid grid-cols-2 p-3 gap-3 justify-center items-center border border-amber-500/20 shadow-inner">
                      {Array.from({ length: 4 }).map((_, i) => {
                        const token = tokens.find(t => t.color === 'YELLOW' && t.position === -1 && t.id === i);
                        const movable = token ? isTokenMovable(token) : false;
                        const isHovered = token && hoveredToken?.color === token.color && hoveredToken?.id === token.id;
                        return (
                          <div key={i} className="w-full h-full rounded-full flex items-center justify-center relative bg-amber-950/40 border border-amber-500/10 shadow-inner">
                            {token ? (
                              <button
                                key={`${token.color}-${token.id}`}
                                disabled={!movable}
                                onMouseEnter={() => movable && setHoveredToken(token)}
                                onMouseLeave={() => setHoveredToken(null)}
                                onClick={() => {
                                  setHoveredToken(null);
                                  onTokenClick(token);
                                }}
                                className={`w-4/5 h-4/5 rounded-full shadow-lg flex items-center justify-center font-black text-xs text-slate-950 transition-all transform hover:scale-115 active:scale-95 bg-gradient-to-b from-amber-300 to-amber-500 border border-white hover:from-amber-200 hover:to-amber-400 ${
                                  movable ? 'ring-4 ring-amber-300 ring-offset-1 animate-pulse cursor-pointer shadow-amber-500/50' : 'cursor-default shadow-black/40'
                                } ${isHovered ? 'ring-4 ring-purple-400 scale-120 z-30' : ''}`}
                              >
                                <span className="select-none">{token.id + 1}</span>
                              </button>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-amber-400/20 animate-ping" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {row === 9 && col === 0 && (
                  <div className={`absolute top-0 left-0 w-[600%] h-[600%] bg-gradient-to-br from-red-500/90 to-red-700/90 rounded-2xl flex items-center justify-center shadow-2xl border-b-4 border-red-800 z-10 p-4 transition-all duration-500 ${
                    currentTurn === 'RED' ? 'ring-4 ring-red-400 shadow-red-500/20' : 'border border-red-500/30'
                  }`}>
                    <div className="w-[75%] h-[75%] bg-slate-950/95 rounded-xl grid grid-cols-2 p-3 gap-3 justify-center items-center border border-red-500/20 shadow-inner">
                      {Array.from({ length: 4 }).map((_, i) => {
                        const token = tokens.find(t => t.color === 'RED' && t.position === -1 && t.id === i);
                        const movable = token ? isTokenMovable(token) : false;
                        const isHovered = token && hoveredToken?.color === token.color && hoveredToken?.id === token.id;
                        return (
                          <div key={i} className="w-full h-full rounded-full flex items-center justify-center relative bg-red-950/40 border border-red-500/10 shadow-inner">
                            {token ? (
                              <button
                                key={`${token.color}-${token.id}`}
                                disabled={!movable}
                                onMouseEnter={() => movable && setHoveredToken(token)}
                                onMouseLeave={() => setHoveredToken(null)}
                                onClick={() => {
                                  setHoveredToken(null);
                                  onTokenClick(token);
                                }}
                                className={`w-4/5 h-4/5 rounded-full shadow-lg flex items-center justify-center font-black text-xs text-white transition-all transform hover:scale-115 active:scale-95 bg-gradient-to-b from-red-400 to-red-600 border border-white hover:from-red-300 hover:to-red-500 ${
                                  movable ? 'ring-4 ring-red-300 ring-offset-1 animate-pulse cursor-pointer shadow-red-500/50' : 'cursor-default shadow-black/40'
                                } ${isHovered ? 'ring-4 ring-purple-400 scale-120 z-30' : ''}`}
                              >
                                <span className="select-none">{token.id + 1}</span>
                              </button>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-red-500/20 animate-ping" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {row === 9 && col === 9 && (
                  <div className={`absolute top-0 left-0 w-[600%] h-[600%] bg-gradient-to-br from-blue-500/90 to-blue-700/90 rounded-2xl flex items-center justify-center shadow-2xl border-b-4 border-blue-800 z-10 p-4 transition-all duration-500 ${
                    currentTurn === 'BLUE' ? 'ring-4 ring-blue-400 shadow-blue-500/20' : 'border border-blue-500/30'
                  }`}>
                    <div className="w-[75%] h-[75%] bg-slate-950/95 rounded-xl grid grid-cols-2 p-3 gap-3 justify-center items-center border border-blue-500/20 shadow-inner">
                      {Array.from({ length: 4 }).map((_, i) => {
                        const token = tokens.find(t => t.color === 'BLUE' && t.position === -1 && t.id === i);
                        const movable = token ? isTokenMovable(token) : false;
                        const isHovered = token && hoveredToken?.color === token.color && hoveredToken?.id === token.id;
                        return (
                          <div key={i} className="w-full h-full rounded-full flex items-center justify-center relative bg-blue-950/40 border border-blue-500/10 shadow-inner">
                            {token ? (
                              <button
                                key={`${token.color}-${token.id}`}
                                disabled={!movable}
                                onMouseEnter={() => movable && setHoveredToken(token)}
                                onMouseLeave={() => setHoveredToken(null)}
                                onClick={() => {
                                  setHoveredToken(null);
                                  onTokenClick(token);
                                }}
                                className={`w-4/5 h-4/5 rounded-full shadow-lg flex items-center justify-center font-black text-xs text-white transition-all transform hover:scale-115 active:scale-95 bg-gradient-to-b from-blue-400 to-blue-600 border border-white hover:from-blue-300 hover:to-blue-500 ${
                                  movable ? 'ring-4 ring-blue-300 ring-offset-1 animate-pulse cursor-pointer shadow-blue-500/50' : 'cursor-default shadow-black/40'
                                } ${isHovered ? 'ring-4 ring-purple-400 scale-120 z-30' : ''}`}
                              >
                                <span className="select-none">{token.id + 1}</span>
                              </button>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-blue-500/20 animate-ping" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Draw Center Triangles (Spanning 3x3 over rows/cols 6-8) */}
                {row === 6 && col === 6 && (
                  <div className="absolute top-0 left-0 w-[300%] h-[300%] bg-slate-950 flex items-center justify-center overflow-hidden z-10 border border-slate-800 shadow-2xl pointer-events-none rounded-lg">
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                      <defs>
                        <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#fef08a" />
                          <stop offset="60%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#78350f" />
                        </radialGradient>
                        <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#047857" />
                        </linearGradient>
                        <linearGradient id="yellowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fbbf24" />
                          <stop offset="100%" stopColor="#b45309" />
                        </linearGradient>
                        <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#1d4ed8" />
                        </linearGradient>
                        <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="100%" stopColor="#b91c1c" />
                        </linearGradient>
                      </defs>
                      {/* Green Triangle */}
                      <polygon points="0,0 50,50 0,100" fill="url(#greenGrad)" stroke="#065f46" strokeWidth="1" />
                      {/* Yellow Triangle */}
                      <polygon points="0,0 100,0 50,50" fill="url(#yellowGrad)" stroke="#92400e" strokeWidth="1" />
                      {/* Blue Triangle */}
                      <polygon points="100,0 100,100 50,50" fill="url(#blueGrad)" stroke="#1e40af" strokeWidth="1" />
                      {/* Red Triangle */}
                      <polygon points="0,100 50,50 100,100" fill="url(#redGrad)" stroke="#991b1b" strokeWidth="1" />
                      
                      {/* Golden dividers */}
                      <line x1="0" y1="0" x2="100" y2="100" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                      <line x1="100" y1="0" x2="0" y2="100" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                      
                      {/* Center Golden Crown Medallion */}
                      <circle cx="50" cy="50" r="15" fill="url(#goldGlow)" stroke="#fef08a" strokeWidth="1.5" className="animate-pulse" />
                      <path d="M44 54 L44 46 L47 49 L50 44 L53 49 L56 46 L56 54 Z" fill="#ffffff" />
                    </svg>
                  </div>
                )}

                {/* Cell static decor */}
                {cellContent}

                {/* Path Traversal Micro-Dots */}
                {isPathCell && !isPreviewTarget && (
                  <div className="absolute w-2 h-2 rounded-full bg-purple-400 animate-ping opacity-75 z-10" />
                )}

                {/* 3. Render common path tokens inside cell */}
                {cellTokens.length > 0 && (
                  <div className="absolute inset-0 flex flex-wrap items-center justify-center p-0.5 gap-[1px] z-20">
                    {cellTokens.map(token => {
                      const movable = isTokenMovable(token);
                      const isHovered = hoveredToken?.color === token.color && hoveredToken?.id === token.id;

                      const tokenColorClasses: Record<PlayerColor, { main: string; glow: string }> = {
                        GREEN: {
                          main: 'bg-gradient-to-b from-emerald-400 to-emerald-600 border-white hover:from-emerald-300 hover:to-emerald-500',
                          glow: 'ring-4 ring-emerald-300 ring-offset-1 animate-bounce shadow-emerald-500/50'
                        },
                        YELLOW: {
                          main: 'bg-gradient-to-b from-amber-300 to-amber-500 border-white hover:from-amber-200 hover:to-amber-400 text-slate-950',
                          glow: 'ring-4 ring-amber-300 ring-offset-1 animate-bounce shadow-amber-500/50'
                        },
                        BLUE: {
                          main: 'bg-gradient-to-b from-blue-400 to-blue-600 border-white hover:from-blue-300 hover:to-blue-500',
                          glow: 'ring-4 ring-blue-300 ring-offset-1 animate-bounce shadow-blue-500/50'
                        },
                        RED: {
                          main: 'bg-gradient-to-b from-red-400 to-red-600 border-white hover:from-red-300 hover:to-red-500',
                          glow: 'ring-4 ring-red-300 ring-offset-1 animate-bounce shadow-red-500/50'
                        }
                      };

                      const colorCls = tokenColorClasses[token.color];

                      // Sizing based on cell density
                      const sizeClass = cellTokens.length === 1 
                        ? 'w-6 h-6 border-2' 
                        : cellTokens.length === 2 
                        ? 'w-4.5 h-4.5 border' 
                        : 'w-3.5 h-3.5 border-[0.5px]';

                      return (
                        <button
                          key={`${token.color}-${token.id}`}
                          id={`token_${token.color.toLowerCase()}_${token.id}`}
                          disabled={!movable}
                          onMouseEnter={() => movable && setHoveredToken(token)}
                          onMouseLeave={() => setHoveredToken(null)}
                          onClick={() => {
                            setHoveredToken(null);
                            onTokenClick(token);
                          }}
                          className={`rounded-full shadow-lg flex items-center justify-center font-black text-[8px] text-white transition-all transform hover:scale-115 active:scale-95 ${
                            colorCls.main
                          } ${sizeClass} ${movable ? `${colorCls.glow} cursor-pointer` : 'cursor-default shadow-black/40'} ${
                            isHovered ? 'ring-4 ring-purple-400 scale-125 z-30' : ''
                          }`}
                        >
                          <span className="select-none scale-90">{token.id + 1}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}

