import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Gamepad2, 
  Users, 
  User, 
  Settings, 
  Info, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  Send, 
  Plus, 
  Copy, 
  Check, 
  Shield, 
  Sparkles, 
  MessageSquare, 
  Smile, 
  Award,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  PlayerColor, 
  Token, 
  Player, 
  GameState, 
  ChatMessage, 
  GameMode, 
  BASE_COORDINATES 
} from './types';
import { 
  getMovableTokens, 
  getNextPosition, 
  checkCapture, 
  calculateBestAIMove 
} from './ludoEngine';
import GameBoard from './components/GameBoard';
import Dice from './components/Dice';
import ProfileDashboard from './components/ProfileDashboard';
import AdminPanel from './components/AdminPanel';
import DocumentationTab from './components/DocumentationTab';

// Web Audio API Synthesizer for offline-resilient audio effects
const audioCtxRef = { current: null as AudioContext | null };
function getAudioContext(): AudioContext {
  if (!audioCtxRef.current) {
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtxRef.current;
}

function playSynthesizedSound(type: 'roll' | 'move' | 'capture' | 'win') {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'roll') {
      // Rapid rolling tick
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'move') {
      // Clean high chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'capture') {
      // Retro slide down sweep
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'win') {
      // Celebration Major Chord Chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(261.63, now); // C4
      osc.frequency.setValueAtTime(329.63, now + 0.1); // E4
      osc.frequency.setValueAtTime(392.00, now + 0.2); // G4
      osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.4); // C5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.65);
    }
  } catch (err) {
    console.warn('Audio synthesis skipped:', err);
  }
}

const DEFAULT_TOKENS = (): Token[] => {
  const t: Token[] = [];
  const colors: PlayerColor[] = ['GREEN', 'YELLOW', 'BLUE', 'RED'];
  colors.forEach(color => {
    for (let id = 0; id < 4; id++) {
      t.push({ id, color, position: -1, stepCount: 0 });
    }
  });
  return t;
};

export default function App() {
  // Navigation Screens: 'LANDING' | 'GAME' | 'PROFILE' | 'ADMIN' | 'DOCS'
  const [screen, setScreen] = useState<'LANDING' | 'GAME' | 'PROFILE' | 'ADMIN' | 'DOCS'>('LANDING');
  
  // Audio Preferences
  const [soundEnabled, setSoundEnabled] = useState(true);

  // User Stats State
  const [coins, setCoins] = useState(5000);
  const [xp, setXp] = useState(1200);
  const [level, setLevel] = useState(3);
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);
  const [customPlayerName, setCustomPlayerName] = useState('Dice Champion 🎲');
  const [customAvatarId, setCustomAvatarId] = useState('avatar_2');

  // Game Engine State
  const [gameMode, setGameMode] = useState<GameMode>('AI');
  const [aiDifficulty, setAiDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [roomId, setRoomId] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [lobbyRooms, setLobbyRooms] = useState<any[]>([]);

  // Token list
  const [tokens, setTokens] = useState<Token[]>(DEFAULT_TOKENS());
  const [players, setPlayers] = useState<Player[]>([
    { color: 'GREEN', name: 'Green Player', isAI: false, isOnline: false, avatarId: 'avatar_1', tokens: [], hasRolled: false, hasCompleted: false, coins: 5000, xp: 1200 },
    { color: 'YELLOW', name: 'AI Player (Med)', isAI: true, isOnline: false, avatarId: 'avatar_2', tokens: [], hasRolled: false, hasCompleted: false, coins: 5000, xp: 1200 },
    { color: 'BLUE', name: 'Blue Player', isAI: false, isOnline: false, avatarId: 'avatar_3', tokens: [], hasRolled: false, hasCompleted: false, coins: 5000, xp: 1200 },
    { color: 'RED', name: 'Red Player', isAI: false, isOnline: false, avatarId: 'avatar_4', tokens: [], hasRolled: false, hasCompleted: false, coins: 5000, xp: 1200 }
  ]);
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>('GREEN');
  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [consecutiveSixes, setConsecutiveSixes] = useState(0);
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [turnTimer, setTurnTimer] = useState(30);

  // Chat & Social States
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string; emoji: string; x: number; y: number; sender: string }[]>([]);

  // Networking WebSockets Ref
  const wsRef = useRef<WebSocket | null>(null);
  const [myOnlineColor, setMyOnlineColor] = useState<PlayerColor | null>(null);
  const [myClientId, setMyClientId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Turn Timer Effect
  useEffect(() => {
    let timerId: any = null;
    if (gameStarted && !isGameOver && !isRolling) {
      timerId = setInterval(() => {
        setTurnTimer(t => {
          if (t <= 1) {
            // Timer expired, auto pass turn
            passTurn();
            return 30;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [gameStarted, isGameOver, currentTurn, isRolling]);

  // Connect sound feedback
  const triggerSound = (type: 'roll' | 'move' | 'capture' | 'win') => {
    if (soundEnabled) {
      playSynthesizedSound(type);
    }
  };

  // WebSocket Connection Initializer
  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    setIsConnecting(true);

    const isSecure = window.location.protocol === 'https:';
    const wsUrl = `${isSecure ? 'wss:' : 'ws:'}//${window.location.host}`;
    
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      setIsConnecting(false);
      // Register custom profile immediately
      socket.send(JSON.stringify({
        type: 'set_profile',
        name: 'You',
        avatarId: 'avatar_2'
      }));
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'registered': {
            setMyClientId(msg.clientId);
            break;
          }
          case 'lobby_update': {
            setLobbyRooms(msg.rooms || []);
            break;
          }
          case 'room_created': {
            setRoomId(msg.roomId);
            setMyOnlineColor(msg.color);
            setGameMode('ONLINE');
            setupOnlineGame(msg.roomId, msg.color, [{ id: myClientId, name: 'You', color: msg.color, isAI: false, isOnline: true }]);
            break;
          }
          case 'room_joined': {
            setRoomId(msg.roomId);
            setMyOnlineColor(msg.color);
            setGameMode('ONLINE');
            setupOnlineGame(msg.roomId, msg.color, msg.players);
            break;
          }
          case 'match_found': {
            setRoomId(msg.roomId);
            setMyOnlineColor(msg.color);
            setGameMode('ONLINE');
            setupOnlineGame(msg.roomId, msg.color, msg.players);
            setScreen('GAME');
            break;
          }
          case 'player_joined': {
            updatePlayersFromNetwork(msg.players);
            break;
          }
          case 'player_left': {
            updatePlayersFromNetwork(msg.players);
            addSystemMessage(`${msg.clientId === myClientId ? 'You' : 'A player'} disconnected. Swapped to AI bot.`);
            break;
          }
          case 'game_synced': {
            // Apply network synchronized state
            if (msg.senderId !== myClientId) {
              applySyncedState(msg.state);
            }
            break;
          }
          case 'action_broadcast': {
            if (msg.senderId !== myClientId) {
              handleRemoteAction(msg.action);
            }
            break;
          }
          case 'chat_received': {
            setChatMessages(prev => [...prev, msg.message]);
            break;
          }
          case 'emoji_received': {
            triggerFloatingEmoji(msg.emoji, msg.senderName);
            break;
          }
          case 'error': {
            alert(msg.message);
            break;
          }
        }
      } catch (err) {
        console.error('WS read error:', err);
      }
    };

    socket.onclose = () => {
      setIsConnecting(false);
    };
  };

  const setupOnlineGame = (rId: string, assignedColor: PlayerColor, netPlayers: any[]) => {
    // Fill all 4 colors, substituting disconnected/unused with AI bots
    const colors: PlayerColor[] = ['GREEN', 'YELLOW', 'BLUE', 'RED'];
    const formattedPlayers = colors.map(color => {
      const p = netPlayers.find(np => np.color === color);
      if (p) {
        return {
          color,
          name: p.id === myClientId ? 'You' : p.name,
          isAI: false,
          isOnline: true,
          avatarId: p.avatarId,
          tokens: [],
          hasRolled: false,
          hasCompleted: false,
          coins: 5000,
          xp: 1200
        };
      } else {
        return {
          color,
          name: `${color} Bot (AI)`,
          isAI: true,
          isOnline: false,
          avatarId: 'avatar_1',
          tokens: [],
          hasRolled: false,
          hasCompleted: false,
          coins: 1000,
          xp: 100
        };
      }
    });

    setPlayers(formattedPlayers);
    setTokens(DEFAULT_TOKENS());
    setCurrentTurn('GREEN');
    setDiceValue(1);
    setWinner(null);
    setIsGameOver(false);
    setGameStarted(true);
    setScreen('GAME');
    addSystemMessage(`Online Room ${rId} initialized. Play!`);
  };

  const updatePlayersFromNetwork = (netPlayers: any[]) => {
    setPlayers(prev => prev.map(p => {
      const match = netPlayers.find(np => np.color === p.color);
      if (match) {
        return {
          ...p,
          name: match.id === myClientId ? 'You' : match.name,
          isAI: false,
          isOnline: true,
          avatarId: match.avatarId
        };
      }
      return p;
    }));
  };

  const syncStateOverNetwork = (updatedTokens: Token[], nextTurn: PlayerColor, dVal: number, over: boolean, win: PlayerColor | null) => {
    if (gameMode !== 'ONLINE' || !wsRef.current) return;
    const miniState = {
      roomId,
      tokens: updatedTokens,
      currentTurn: nextTurn,
      diceValue: dVal,
      isGameOver: over,
      winner: win
    };
    wsRef.current.send(JSON.stringify({
      type: 'sync_game',
      state: miniState
    }));
  };

  const applySyncedState = (state: any) => {
    if (state.tokens) setTokens(state.tokens);
    if (state.currentTurn) setCurrentTurn(state.currentTurn);
    if (state.diceValue) setDiceValue(state.diceValue);
    if (state.isGameOver !== undefined) setIsGameOver(state.isGameOver);
    if (state.winner !== undefined) {
      setWinner(state.winner);
      if (state.winner) {
        triggerSound('win');
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      }
    }
  };

  const handleRemoteAction = (action: any) => {
    // Sync roll/move events explicitly if needed
  };

  const startLocalGame = (mode: GameMode) => {
    setGameMode(mode);
    setTokens(DEFAULT_TOKENS());
    setWinner(null);
    setIsGameOver(false);

    let configuredPlayers: Player[] = [];
    if (mode === 'AI') {
      configuredPlayers = [
        { color: 'GREEN', name: customPlayerName || 'You', isAI: false, isOnline: false, avatarId: customAvatarId, tokens: [], hasRolled: false, hasCompleted: false, coins, xp },
        { color: 'YELLOW', name: `AI Bot (${aiDifficulty})`, isAI: true, isOnline: false, avatarId: 'avatar_5', tokens: [], hasRolled: false, hasCompleted: false, coins: 2000, xp: 500 },
        { color: 'BLUE', name: 'Blue Bot (AI)', isAI: true, isOnline: false, avatarId: 'avatar_1', tokens: [], hasRolled: false, hasCompleted: false, coins: 1500, xp: 300 },
        { color: 'RED', name: 'Red Bot (AI)', isAI: true, isOnline: false, avatarId: 'avatar_4', tokens: [], hasRolled: false, hasCompleted: false, coins: 1500, xp: 300 }
      ];
    } else {
      // Local Pass & Play
      configuredPlayers = [
        { color: 'GREEN', name: `${customPlayerName || 'P1'} (P1)`, isAI: false, isOnline: false, avatarId: customAvatarId, tokens: [], hasRolled: false, hasCompleted: false, coins, xp },
        { color: 'YELLOW', name: 'Yellow Player', isAI: false, isOnline: false, avatarId: 'avatar_2', tokens: [], hasRolled: false, hasCompleted: false, coins: 5000, xp: 1200 },
        { color: 'BLUE', name: 'Blue Player', isAI: false, isOnline: false, avatarId: 'avatar_3', tokens: [], hasRolled: false, hasCompleted: false, coins: 5000, xp: 1200 },
        { color: 'RED', name: 'Red Player', isAI: false, isOnline: false, avatarId: 'avatar_4', tokens: [], hasRolled: false, hasCompleted: false, coins: 5000, xp: 1200 }
      ];
    }

    setPlayers(configuredPlayers);
    setCurrentTurn('GREEN');
    setDiceValue(1);
    setConsecutiveSixes(0);
    setGameStarted(true);
    setScreen('GAME');
    addSystemMessage(`Match started: ${mode === 'AI' ? 'VS Intelligent AI' : 'Local Pass & Play'}`);
  };

  const createOnlineRoom = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connectWebSocket();
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'create_room' }));
        }
      }, 1000);
    } else {
      wsRef.current.send(JSON.stringify({ type: 'create_room' }));
    }
  };

  const joinOnlineRoom = (rId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connectWebSocket();
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'join_room', roomId: rId }));
        }
      }, 1000);
    } else {
      wsRef.current.send(JSON.stringify({ type: 'join_room', roomId: rId }));
    }
  };

  const findQuickMatch = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connectWebSocket();
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'join_queue' }));
        }
      }, 1000);
    } else {
      wsRef.current.send(JSON.stringify({ type: 'join_queue' }));
    }
  };

  // Turn manager logic
  const rollDice = () => {
    if (isRolling || isGameOver) return;
    
    setIsRolling(true);
    triggerSound('roll');

    let rollCount = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(1 + Math.random() * 6));
      rollCount++;
      if (rollCount >= 8) {
        clearInterval(interval);
        finalizeRoll();
      }
    }, 100);
  };

  const finalizeRoll = () => {
    const finalVal = Math.floor(1 + Math.random() * 6);
    setDiceValue(finalVal);
    setIsRolling(false);

    // Consecutive 6s rule
    let nextConsecutive = consecutiveSixes;
    if (finalVal === 6) {
      nextConsecutive++;
      if (nextConsecutive === 3) {
        addSystemMessage(`${currentTurn} rolled three 6s! Turn forfeited.`);
        setConsecutiveSixes(0);
        passTurn();
        return;
      }
      setConsecutiveSixes(nextConsecutive);
    } else {
      setConsecutiveSixes(0);
    }

    // Evaluate movable tokens
    const pTokens = tokens.filter(t => t.color === currentTurn);
    const movable = getMovableTokens(tokens, currentTurn, finalVal);

    if (movable.length === 0) {
      // No moves possible, pass turn with a friendly brief delay
      addSystemMessage(`${currentTurn} rolled ${finalVal}. No valid moves.`);
      setTimeout(() => {
        passTurn();
      }, 1500);
    } else {
      // If AI turn, trigger AI movement automatically after short delay
      const activePlayer = players.find(p => p.color === currentTurn);
      if (activePlayer?.isAI) {
        setTimeout(() => {
          triggerAIMove(movable, finalVal);
        }, 1000);
      }
    }
  };

  const triggerAIMove = (movable: Token[], roll: number) => {
    const aiChoice = calculateBestAIMove(tokens, currentTurn, roll, aiDifficulty);
    if (aiChoice) {
      moveToken(aiChoice, roll);
    } else {
      passTurn();
    }
  };

  const moveToken = (token: Token, steps: number) => {
    const nextState = getNextPosition(token, steps);
    if (!nextState) return;

    triggerSound('move');

    // Handle step by step animation paths conceptually or apply directly
    const updatedTokens = tokens.map(t => {
      if (t.color === token.color && t.id === token.id) {
        return { ...t, position: nextState.position, stepCount: nextState.stepCount };
      }
      return t;
    });

    // Check Capture
    const victim = checkCapture(tokens, token, nextState.position);
    let extraTurn = false;

    if (victim) {
      triggerSound('capture');
      addSystemMessage(`${token.color} captured ${victim.color}'s token! Extra turn granted.`);
      // Send victim back to Base
      updatedTokens.forEach(t => {
        if (t.color === victim.color && t.id === victim.id) {
          t.position = -1;
          t.stepCount = 0;
        }
      });
      extraTurn = true;
    }

    // Check Home Entry
    if (nextState.position === 57) {
      addSystemMessage(`${token.color} reached HOME! Extra turn granted.`);
      extraTurn = true;
    }

    // Check Win condition (All 4 tokens home)
    const activeColorTokens = updatedTokens.filter(t => t.color === currentTurn);
    const hasWon = activeColorTokens.every(t => t.position === 57);

    setTokens(updatedTokens);

    if (hasWon) {
      setWinner(currentTurn);
      setIsGameOver(true);
      triggerSound('win');
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      
      // Update local player stats
      if (currentTurn === 'GREEN' && gameMode === 'AI') {
        setCoins(c => c + 1500);
        setXp(x => x + 500);
        if (xp + 500 >= 3000) {
          setLevel(l => l + 1);
          setXp(0);
        }
      }
      syncStateOverNetwork(updatedTokens, currentTurn, steps, true, currentTurn);
      return;
    }

    // Turn passing rule: extra turn if rolled 6, captured, or home
    let nextTurn = currentTurn;
    if (steps === 6 || extraTurn) {
      nextTurn = currentTurn; // Keeps current turn
      // Force trigger AI roll if turn remained with AI
      const activePlayer = players.find(p => p.color === nextTurn);
      if (activePlayer?.isAI) {
        setTimeout(() => {
          rollDice();
        }, 1200);
      }
    } else {
      nextTurn = getNextTurnColor(currentTurn);
    }

    setCurrentTurn(nextTurn);
    setTurnTimer(30);

    // Sync online match state
    syncStateOverNetwork(updatedTokens, nextTurn, steps, false, null);

    // Auto trigger roll if next turn is AI
    const nextPlayer = players.find(p => p.color === nextTurn);
    if (nextPlayer?.isAI && !isGameOver) {
      setTimeout(() => {
        rollDice();
      }, 1200);
    }
  };

  const getNextTurnColor = (color: PlayerColor): PlayerColor => {
    const cycle: PlayerColor[] = ['GREEN', 'YELLOW', 'BLUE', 'RED'];
    const curIdx = cycle.indexOf(color);
    let nextIdx = (curIdx + 1) % 4;
    
    // Skip players that completed
    for (let i = 0; i < 4; i++) {
      const candidateColor = cycle[nextIdx];
      const isCompleted = tokens.filter(t => t.color === candidateColor).every(t => t.position === 57);
      if (!isCompleted) {
        return candidateColor;
      }
      nextIdx = (nextIdx + 1) % 4;
    }
    return color;
  };

  const passTurn = () => {
    const nextTurn = getNextTurnColor(currentTurn);
    setCurrentTurn(nextTurn);
    setConsecutiveSixes(0);
    setTurnTimer(30);

    syncStateOverNetwork(tokens, nextTurn, diceValue, isGameOver, null);

    // Trigger AI if new turn is AI
    const nextPlayer = players.find(p => p.color === nextTurn);
    if (nextPlayer?.isAI && !isGameOver) {
      setTimeout(() => {
        rollDice();
      }, 1000);
    }
  };

  // Helper messages logger
  const addSystemMessage = (text: string) => {
    const systemMsg: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      sender: 'SYSTEM',
      color: 'SYSTEM',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, systemMsg]);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    
    if (gameMode === 'ONLINE' && wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'send_chat',
        text: chatInput
      }));
    } else {
      // Local chat echo
      const localMsg: ChatMessage = {
        id: 'chat_' + Math.random().toString(36).substr(2, 9),
        sender: 'You',
        color: 'GREEN',
        text: chatInput,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, localMsg]);
    }
    setChatInput('');
  };

  const triggerFloatingEmoji = (emoji: string, sender: string) => {
    const id = 'emoji_' + Math.random().toString(36).substr(2, 9);
    const newEmoji = {
      id,
      emoji,
      x: 30 + Math.random() * 40, // percentage positioning
      y: 30 + Math.random() * 40,
      sender
    };
    setFloatingEmojis(prev => [...prev, newEmoji]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 2500);
  };

  const handleSendEmoji = (emoji: string) => {
    if (gameMode === 'ONLINE' && wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'send_emoji',
        emoji
      }));
    } else {
      triggerFloatingEmoji(emoji, 'You');
    }
  };

  const claimReward = (amount: number) => {
    setCoins(prev => prev + amount);
    setDailyRewardClaimed(true);
    addSystemMessage(`Claimed ${amount} daily golden coins!`);
  };

  const handleAwardCoins = (amount: number) => {
    setCoins(prev => prev + amount);
    addSystemMessage(`Admin granted ${amount} coins to your wallet!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col font-sans select-none antialiased">
      {/* Visual Navigation Bar */}
      <header className="px-6 py-4 bg-slate-950/60 backdrop-blur border-b border-slate-800/60 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setScreen('LANDING')}>
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-purple-500/20 text-white">
            L
          </div>
          <div>
            <h1 className="font-bold text-base tracking-wide bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Ludo Arena
            </h1>
            <span className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider block">Production Build</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-400 hover:text-white transition-all"
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-purple-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
          </button>

          <button
            onClick={() => setScreen('DOCS')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-all"
          >
            <BookOpen className="w-4 h-4 text-purple-400" />
            Blueprints
          </button>

          <button
            onClick={() => setScreen('ADMIN')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-all"
          >
            <Shield className="w-4 h-4 text-purple-400" />
            Admin
          </button>

          <button
            onClick={() => setScreen('PROFILE')}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 px-3.5 py-1.5 text-xs font-semibold transition-all hover:scale-102"
          >
            <User className="w-4 h-4 text-purple-400" />
            Profile ({coins.toLocaleString()} Coins)
          </button>
        </div>
      </header>

      {/* Main Container Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col justify-center items-center">
        {screen === 'LANDING' && (
          <div className="w-full max-w-5xl flex flex-col gap-8 py-4">
            
            {/* Visual Hero Header with Glow Effect */}
            <div className="relative overflow-hidden bg-slate-950/40 rounded-3xl p-8 border border-slate-800/80 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10" />
              
              <div className="text-center md:text-left space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-500/15 to-indigo-500/15 text-purple-300 rounded-full border border-purple-500/30 text-xs font-bold uppercase tracking-wider animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Version 2.4 Live Arena 🏆
                </div>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-300 bg-clip-text text-transparent">
                  LUDO ARENA
                </h2>
                <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
                  The ultimate web-native Ludo board experience. Engage offline vs smart predictive neural AI bots, share locally on one screen, or matchmake into real-time PvP lobbies.
                </p>
              </div>

              {/* Dynamic Live Activity Panel (Simulation ticker) */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 min-w-[240px] shadow-lg">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-2">Live Match Servers</span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300 bg-slate-950/40 px-2.5 py-1.5 rounded-xl border border-slate-800/40">
                    <span className="font-semibold text-purple-400">#Match-403</span>
                    <span className="font-mono text-[10px] text-emerald-400">● 4 Players</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300 bg-slate-950/40 px-2.5 py-1.5 rounded-xl border border-slate-800/40">
                    <span className="font-semibold text-purple-400">#Match-902</span>
                    <span className="font-mono text-[10px] text-amber-400">● Roll Turn 4</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300 bg-slate-950/40 px-2.5 py-1.5 rounded-xl border border-slate-800/40">
                    <span className="font-semibold text-purple-400">#Match-118</span>
                    <span className="font-mono text-[10px] text-slate-400">● Finished</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Section: Player Character Editor & Daily Loot Box */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Card 1 & 2 combined: Profile Customizer deck (2 cols wide) */}
              <div className="lg:col-span-2 bg-slate-950/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl flex flex-col justify-between gap-6">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2 text-white mb-1">
                    <User className="w-4.5 h-4.5 text-purple-400" /> Customize Your Gladiator
                  </h3>
                  <p className="text-xs text-slate-400">Setup your identity. This gets synced to your board tokens and live game chats!</p>
                  
                  {/* Nickname & Avatar Selection Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {/* Input Field */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gladiator Username</label>
                      <input 
                        type="text"
                        value={customPlayerName}
                        onChange={(e) => setCustomPlayerName(e.target.value.slice(0, 18))}
                        placeholder="Type player username..."
                        className="w-full bg-slate-900 border border-slate-800 text-sm px-4 py-3 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-semibold"
                      />
                      <span className="text-[9px] text-slate-500 block">Maximum of 18 characters allowed.</span>
                    </div>

                    {/* Avatar choice deck */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Choose Avatar Crest</label>
                      <div className="flex flex-wrap gap-2.5">
                        {[
                          { id: 'avatar_1', emoji: '🦊' },
                          { id: 'avatar_2', emoji: '🐲' },
                          { id: 'avatar_3', emoji: '🦄' },
                          { id: 'avatar_4', emoji: '🐯' },
                          { id: 'avatar_5', emoji: '🤖' },
                          { id: 'avatar_6', emoji: '🧙' },
                        ].map((av) => (
                          <button
                            key={av.id}
                            onClick={() => {
                              setCustomAvatarId(av.id);
                              triggerSound('move');
                            }}
                            className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                              customAvatarId === av.id 
                                ? 'bg-purple-600 border-2 border-purple-400 scale-110 shadow-lg shadow-purple-500/20' 
                                : 'bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:scale-105'
                            }`}
                          >
                            {av.emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inline Character Stats & Card Info */}
                <div className="bg-slate-900/60 border border-slate-800/40 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-2xl">
                      {customAvatarId === 'avatar_1' ? '🦊' :
                       customAvatarId === 'avatar_2' ? '🐲' :
                       customAvatarId === 'avatar_3' ? '🦄' :
                       customAvatarId === 'avatar_4' ? '🐯' :
                       customAvatarId === 'avatar_5' ? '🤖' : '🧙'}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{customPlayerName || 'Dice Master'}</h4>
                      <p className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider">Level {level} Arena Cadet</p>
                    </div>
                  </div>

                  {/* Level Progress Bar */}
                  <div className="flex-1 max-w-[220px] w-full space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                      <span>XP PROGRESS</span>
                      <span>{xp} / 2500 XP</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${(xp / 2500) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Daily Reward Loot Box Widget */}
              <div className="bg-gradient-to-br from-indigo-950 via-slate-950 to-indigo-950 border border-indigo-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-between text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />
                
                <div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-yellow-500/10 text-yellow-400 rounded-full border border-yellow-500/20 text-[10px] font-bold uppercase tracking-widest mb-3">
                    DAILY GIFT BOX 🎁
                  </div>
                  <h3 className="text-base font-extrabold text-white">Gladiator Loot chest</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Claim daily free gold coins to wager in virtual custom matches!
                  </p>
                </div>

                <div className="py-4 flex justify-center">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl transition-all border ${
                    dailyRewardClaimed 
                      ? 'bg-slate-900/60 border-slate-800 text-slate-600 grayscale' 
                      : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 animate-bounce shadow-lg shadow-yellow-500/10'
                  }`}>
                    {dailyRewardClaimed ? '📦' : '🎁'}
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => {
                      if (dailyRewardClaimed) return;
                      claimReward(1000);
                      confetti({ particleCount: 120, spread: 60, origin: { y: 0.8 } });
                      triggerSound('win');
                    }}
                    disabled={dailyRewardClaimed}
                    className={`w-full py-2.5 rounded-2xl font-bold text-xs tracking-wide uppercase transition-all shadow-md ${
                      dailyRewardClaimed
                        ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 cursor-pointer hover:scale-102 active:scale-95'
                    }`}
                  >
                    {dailyRewardClaimed ? 'ALREADY CLAIMED' : 'CLAIM 1,000 COINS 💰'}
                  </button>
                  <span className="text-[9px] text-slate-500 mt-1.5 block">Resets every 24 hours.</span>
                </div>
              </div>
            </div>

            {/* Bottom Grid: Ludo Game Modes & Online Rooms Matchmaking */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              
              {/* Left Grid: Ludo Game Modes */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-lg">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2 mb-4 text-white border-b border-slate-800/60 pb-2.5">
                    <Gamepad2 className="w-4.5 h-4.5 text-purple-400" /> Standard Offline Matches
                  </h3>

                  <div className="space-y-3.5">
                    {/* Solo Match VS AI Button */}
                    <button
                      id="mode_btn_ai"
                      onClick={() => startLocalGame('AI')}
                      className="w-full bg-gradient-to-r from-purple-900/40 to-indigo-900/40 hover:from-purple-900/70 hover:to-indigo-900/70 border border-purple-500/20 p-4 rounded-2xl flex items-center justify-between transition-all group cursor-pointer hover:border-purple-500/40"
                    >
                      <div className="text-left flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-lg shrink-0">
                          🤖
                        </div>
                        <div>
                          <span className="font-bold text-sm text-white group-hover:text-purple-300 block">Solo Match vs Smart AI</span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">Play against easy, medium, or hard AI bots</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold text-purple-400 bg-purple-950/80 px-2.5 py-1 rounded-full border border-purple-800/50">
                        SOLO
                      </span>
                    </button>

                    {/* Local Pass & Play Button */}
                    <button
                      id="mode_btn_local"
                      onClick={() => startLocalGame('LOCAL')}
                      className="w-full bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/60 p-4 rounded-2xl flex items-center justify-between transition-all group cursor-pointer hover:border-slate-700"
                    >
                      <div className="text-left flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg shrink-0">
                          👥
                        </div>
                        <div>
                          <span className="font-bold text-sm text-white group-hover:text-purple-300 block">Local Pass & Play</span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">2-4 players share a single device locally</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
                        LOCAL
                      </span>
                    </button>
                  </div>

                  {/* AI Difficulty Selector */}
                  <div className="mt-5 pt-4 border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-400 font-bold block mb-2.5 uppercase tracking-wider">AI Difficulty Engine</span>
                    <div className="flex gap-2">
                      {(['EASY', 'MEDIUM', 'HARD'] as const).map(diff => (
                        <button
                          key={diff}
                          onClick={() => {
                            setAiDifficulty(diff);
                            triggerSound('move');
                          }}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            aiDifficulty === diff
                              ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Grid: Online Matchmaking & Real-Time Rooms */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-lg">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2 mb-4 text-white border-b border-slate-800/60 pb-2.5">
                    <Users className="w-4.5 h-4.5 text-purple-400" /> Live WebSocket Arena
                  </h3>

                  <div className="space-y-4">
                    {/* Matchmaker button */}
                    <button
                      onClick={findQuickMatch}
                      disabled={isConnecting}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3 px-4 rounded-2xl font-bold text-xs tracking-wider uppercase shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-95"
                    >
                      {isConnecting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                          CONNECTING MATCHMAKER...
                        </span>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-yellow-300" />
                          QUICK PvP MATCHMAKING
                        </>
                      )}
                    </button>

                    {/* Room Creation and Input Actions */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        onClick={createOnlineRoom}
                        className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl font-bold text-xs hover:text-white transition-colors cursor-pointer"
                      >
                        Create Custom Lobby
                      </button>
                      <button
                        onClick={() => joinOnlineRoom(roomInput || 'R_12345')}
                        className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl font-bold text-xs hover:text-white transition-colors cursor-pointer"
                      >
                        Join Room Code
                      </button>
                    </div>

                    <div className="space-y-1 mt-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Custom Lobby Code</label>
                      <input
                        type="text"
                        placeholder="Enter Room Code (e.g. R_58231)"
                        value={roomInput}
                        onChange={(e) => setRoomInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs px-4 py-2.5 rounded-xl text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-center font-mono uppercase tracking-widest"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-center mt-4">
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold bg-slate-900/60 px-3.5 py-2 rounded-full border border-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Websocket Server: Active Ingress Port 3000
                  </span>
                </div>
              </div>
            </div>

            {/* Extra Section: Leaderboard & Rivals Showcase */}
            <div className="bg-slate-950/30 border border-slate-800/50 rounded-3xl p-6 shadow-md">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800/60 pb-4 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Trophy className="w-4.5 h-4.5 text-yellow-400" /> Leaderboard Hall of Legends
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Top performing champions on the regional Ludo Arena servers.</p>
                </div>
                <div className="bg-slate-900 px-3 py-1.5 rounded-xl text-[10px] text-slate-400 font-bold border border-slate-800 uppercase tracking-wider shrink-0">
                  Updated live ⏱️
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { rank: '1st', name: 'LudoMaster99 👑', level: 18, rate: '69%', color: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-300' },
                  { rank: '2nd', name: 'Sarah Connor 🎯', level: 10, rate: '65%', color: 'border-slate-500/30 bg-slate-500/5 text-slate-300' },
                  { rank: '3rd', name: 'Takashi M. ⚔️', level: 7, rate: '59%', color: 'border-amber-700/30 bg-amber-700/5 text-amber-500' }
                ].map((leg) => (
                  <div key={leg.rank} className={`border rounded-2xl p-4 flex items-center justify-between ${leg.color}`}>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-black uppercase shrink-0">{leg.rank}</div>
                      <div>
                        <span className="font-bold text-xs block text-white">{leg.name}</span>
                        <span className="text-[10px] opacity-70">Level {leg.level} Gladiator</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] opacity-60 block font-bold uppercase tracking-wider">Win Rate</span>
                      <span className="text-xs font-black">{leg.rate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {screen === 'GAME' && (
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 w-full max-w-5xl justify-center">
            
            {/* Left Frame: Ludo Game Board */}
            <div className="relative">
              {/* Float emojis over the board */}
              {floatingEmojis.map((e) => (
                <div
                  key={e.id}
                  className="absolute pointer-events-none z-50 text-4xl animate-bounce"
                  style={{ left: `${e.x}%`, top: `${e.y}%` }}
                >
                  <div className="bg-slate-950/80 px-2 py-1 rounded-2xl text-xs font-bold border border-slate-800 mb-1">
                    {e.sender}
                  </div>
                  {e.emoji}
                </div>
              ))}

              <GameBoard
                tokens={tokens}
                currentTurn={currentTurn}
                diceValue={diceValue}
                hasRolled={players.find(p => p.color === currentTurn)?.hasRolled || false}
                movableTokens={getMovableTokens(tokens, currentTurn, diceValue)}
                onTokenClick={(token) => moveToken(token, diceValue)}
              />
            </div>

            {/* Right Frame: Game Dashboard and controls sidebar */}
            <div className="flex flex-col gap-6 max-w-sm w-full bg-slate-950/40 border border-slate-800/60 p-5 rounded-3xl shadow-lg relative overflow-hidden">
              {/* Back button */}
              <button
                onClick={() => {
                  setScreen('LANDING');
                  setGameStarted(false);
                }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Quit Match
              </button>

              {/* Turn indicator banner */}
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Turn</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-3.5 h-3.5 rounded-full ${
                      currentTurn === 'RED' ? 'bg-red-500 animate-pulse' :
                      currentTurn === 'GREEN' ? 'bg-emerald-500 animate-pulse' :
                      currentTurn === 'YELLOW' ? 'bg-amber-400 animate-pulse' : 'bg-blue-500 animate-pulse'
                    }`} />
                    <h3 className="font-bold text-slate-200 uppercase tracking-wide">
                      {players.find(p => p.color === currentTurn)?.name}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Time Left</span>
                  <span className={`block font-mono font-bold text-base mt-1 ${turnTimer <= 5 ? 'text-red-500 animate-ping' : 'text-purple-400'}`}>
                    {turnTimer}s
                  </span>
                </div>
              </div>

              {/* Central Active Dice Component */}
              <div className="flex justify-center py-2">
                <Dice
                  value={diceValue}
                  isRolling={isRolling}
                  onRoll={rollDice}
                  disabled={players.find(p => p.color === currentTurn)?.isAI || isRolling || isGameOver}
                  activeColor={currentTurn}
                  playerName={players.find(p => p.color === currentTurn)?.name || ''}
                />
              </div>

              {/* Chat & Emoji Reacts */}
              <div className="border-t border-slate-800/60 pt-4 flex flex-col gap-3">
                {/* Micro Emoji Reaction selector */}
                <div className="flex justify-between items-center gap-2 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">React:</span>
                  <div className="flex gap-2">
                    {['👍', '🔥', '😂', '😲', '🎲', '👑'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleSendEmoji(emoji)}
                        className="hover:scale-125 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer text-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Micro Live Chat box */}
                <div className="flex flex-col gap-2">
                  <div className="h-28 overflow-y-auto bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex flex-col gap-1.5 text-xs text-slate-300">
                    {chatMessages.length === 0 && (
                      <p className="text-[10px] text-slate-500 text-center italic mt-6">Send messages or emojis to players...</p>
                    )}
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className="flex gap-1.5 flex-wrap items-baseline">
                        <span className={`font-bold ${
                          msg.color === 'RED' ? 'text-red-400' :
                          msg.color === 'GREEN' ? 'text-emerald-400' :
                          msg.color === 'YELLOW' ? 'text-amber-400' :
                          msg.color === 'BLUE' ? 'text-blue-400' : 'text-purple-400'
                        }`}>
                          {msg.sender}:
                        </span>
                        <span>{msg.text}</span>
                        <span className="text-[8px] text-slate-400 ml-auto">{msg.timestamp}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type game chat..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                      className="flex-1 bg-slate-900 border border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <button
                      onClick={handleSendChat}
                      className="p-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl transition-all cursor-pointer text-white"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {screen === 'PROFILE' && (
          <div className="flex flex-col gap-4 w-full">
            <button
              onClick={() => setScreen('LANDING')}
              className="self-start flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-semibold mb-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Lobby
            </button>
            <ProfileDashboard 
              coins={coins} 
              xp={xp} 
              level={level} 
              onClaimDailyReward={claimReward} 
              dailyRewardClaimed={dailyRewardClaimed}
            />
          </div>
        )}

        {screen === 'ADMIN' && (
          <div className="flex flex-col gap-4 w-full">
            <button
              onClick={() => setScreen('LANDING')}
              className="self-start flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-semibold mb-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Lobby
            </button>
            <AdminPanel onAwardCoins={handleAwardCoins} />
          </div>
        )}

        {screen === 'DOCS' && (
          <div className="flex flex-col gap-4 w-full">
            <button
              onClick={() => setScreen('LANDING')}
              className="self-start flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-semibold mb-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Lobby
            </button>
            <DocumentationTab />
          </div>
        )}
      </main>

      {/* Footer Area */}
      <footer className="py-6 px-6 bg-slate-950 border-t border-slate-800/40 text-center text-xs text-slate-500 mt-auto">
        <p>© 2026 Ludo Arena. Built with full-stack Node.js + WebSocket synchronization and Spring Boot blueprints.</p>
      </footer>

      {/* Win overlay celebration dialog */}
      {winner && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center max-w-sm w-full shadow-2xl relative overflow-hidden animate-bounce">
            <div className="w-20 h-20 bg-yellow-500/15 rounded-full flex items-center justify-center mx-auto text-yellow-500 mb-4 border border-yellow-500/20">
              <Trophy className="w-10 h-10 animate-pulse" />
            </div>
            
            <h3 className="text-2xl font-extrabold tracking-wide uppercase bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              VICTORY!
            </h3>
            
            <p className="text-slate-200 mt-3 font-semibold text-lg">
              {players.find(p => p.color === winner)?.name} wins the match!
            </p>
            
            <p className="text-slate-400 text-xs mt-1.5">
              All 4 tokens successfully entered Home. Win rewards have been applied!
            </p>

            <button
              onClick={() => {
                setWinner(null);
                setScreen('LANDING');
                setGameStarted(false);
              }}
              className="mt-6 w-full py-3 px-5 bg-purple-600 hover:bg-purple-500 rounded-2xl font-bold text-sm tracking-wide shadow transition-colors cursor-pointer text-white"
            >
              Continue to Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
