import React, { useState } from 'react';
import { Award, Trophy, User, Calendar, Coins, Zap, Users, Gift, Search, Sparkles } from 'lucide-react';
import { MatchHistoryEntry } from '../types';

interface ProfileDashboardProps {
  coins: number;
  xp: number;
  level: number;
  onClaimDailyReward: (amount: number) => void;
  dailyRewardClaimed: boolean;
}

export default function ProfileDashboard({ 
  coins, 
  xp, 
  level, 
  onClaimDailyReward, 
  dailyRewardClaimed 
}: ProfileDashboardProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'friends' | 'rewards' | 'history'>('stats');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar_2');
  const [newFriendName, setNewFriendName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [friendsList, setFriendsList] = useState([
    { name: 'Sarah Connor', status: 'Online' as 'Online' | 'Offline' | 'In Game', level: 10, winRate: '65%' },
    { name: 'Takashi M.', status: 'Offline' as 'Online' | 'Offline' | 'In Game', level: 7, winRate: '59%' },
    { name: 'LudoMaster99', status: 'In Game' as 'Online' | 'Offline' | 'In Game', level: 18, winRate: '58%' },
    { name: 'AlphaBot', status: 'Online' as 'Online' | 'Offline' | 'In Game', level: 5, winRate: '42%' }
  ]);

  const avatars = [
    { id: 'avatar_1', emoji: '🦊', label: 'Swift Fox', bg: 'bg-orange-100' },
    { id: 'avatar_2', emoji: '🐯', label: 'Royal Tiger', bg: 'bg-yellow-100' },
    { id: 'avatar_3', emoji: '🐼', label: 'Zen Panda', bg: 'bg-slate-100' },
    { id: 'avatar_4', emoji: '🦁', label: 'Gold Lion', bg: 'bg-amber-100' },
    { id: 'avatar_5', emoji: '🤖', label: 'Cyber Bot', bg: 'bg-indigo-100' },
    { id: 'avatar_6', emoji: '🦄', label: 'Magic Unicorn', bg: 'bg-purple-100' }
  ];

  const matchHistory: MatchHistoryEntry[] = [
    { id: 'm_102', date: '2026-06-30', mode: 'ONLINE', players: [{ name: 'You', color: 'RED', winner: true }, { name: 'Sarah', color: 'BLUE', winner: false }, { name: 'Takashi', color: 'GREEN', winner: false }], winnerName: 'You', duration: '22 min' },
    { id: 'm_101', date: '2026-06-29', mode: 'AI', players: [{ name: 'You', color: 'GREEN', winner: false }, { name: 'AI (Medium)', color: 'YELLOW', winner: true }], winnerName: 'AI (Medium)', duration: '14 min' },
    { id: 'm_100', date: '2026-06-28', mode: 'LOCAL', players: [{ name: 'Player 1', color: 'RED', winner: true }, { name: 'Player 2', color: 'BLUE', winner: false }], winnerName: 'Player 1', duration: '18 min' }
  ];

  const achievements = [
    { id: 'first_win', name: 'First Victory', description: 'Win your first match', unlocked: true, unlockedDate: '2026-06-28' },
    { id: 'double_capture', name: 'Double Strike', description: 'Capture two tokens in a single turn', unlocked: true, unlockedDate: '2026-06-30' },
    { id: 'six_parade', name: 'Roll Master', description: 'Roll three 6s in a row', unlocked: false, progress: 66 },
    { id: 'ludo_king', name: 'Base Master', description: 'Unlock all 4 tokens in a game', unlocked: false, progress: 100 }
  ];

  const currentAvatar = avatars.find(a => a.id === selectedAvatar) || avatars[1];

  const handleClaim = () => {
    if (!dailyRewardClaimed) {
      const reward = Math.floor(100 + Math.random() * 400);
      onClaimDailyReward(reward);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 max-w-4xl w-full mx-auto">
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-slate-100">
        <div className={`relative w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-md border-4 border-white ring-4 ring-purple-100 ${currentAvatar.bg}`}>
          {currentAvatar.emoji}
          <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white font-bold text-xs px-2 py-0.5 rounded-full shadow-sm">
            Lv.{level}
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-center md:justify-start gap-2">
            LudoPlayer
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
              PRO ACCOUNT
            </span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">Ready to dominate the Ludo Arena</p>
          
          {/* XP Progress Bar */}
          <div className="mt-4 max-w-sm mx-auto md:mx-0">
            <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
              <span>XP: {xp} / 3000</span>
              <span>{Math.round((xp / 3000) * 100)}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500" 
                style={{ width: `${(xp / 3000) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Currency Widgets */}
        <div className="flex gap-4">
          <div className="bg-amber-50 border border-amber-200/50 rounded-2xl px-4 py-3 text-center shadow-sm min-w-[100px]">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Coins className="w-5 h-5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Coins</span>
            </div>
            <span className="text-lg font-bold text-amber-900">{coins.toLocaleString()}</span>
          </div>

          <div className="bg-indigo-50 border border-indigo-200/50 rounded-2xl px-4 py-3 text-center shadow-sm min-w-[100px]">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Zap className="w-5 h-5 text-indigo-500" />
              <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">Multiplier</span>
            </div>
            <span className="text-lg font-bold text-indigo-900">1.2x</span>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-100 mb-6 mt-6 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'stats'
              ? 'border-purple-600 text-purple-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Stats & Achievements
        </button>

        <button
          onClick={() => setActiveTab('friends')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'friends'
              ? 'border-purple-600 text-purple-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Friends List
        </button>

        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'rewards'
              ? 'border-purple-600 text-purple-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Gift className="w-4 h-4" />
          Daily Rewards
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-purple-600 text-purple-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Match History
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Avatar customizer */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Customize Avatar
            </h3>
            <div className="flex flex-wrap gap-3">
              {avatars.map(avatar => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 transition-all ${
                    selectedAvatar === avatar.id
                      ? 'border-purple-600 ring-4 ring-purple-100 scale-105'
                      : 'border-slate-200 hover:border-slate-400'
                  } ${avatar.bg}`}
                >
                  {avatar.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Achievement Grid */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
              Achievements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map(ach => (
                <div 
                  key={ach.id} 
                  className={`p-4 rounded-2xl border transition-all ${
                    ach.unlocked 
                      ? 'bg-purple-50/50 border-purple-100' 
                      : 'bg-slate-50/50 border-slate-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl ${ach.unlocked ? 'bg-purple-500 text-white shadow-sm' : 'bg-slate-200 text-slate-500'}`}>
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-slate-800 text-sm">{ach.name}</h4>
                        {ach.unlocked ? (
                          <span className="text-[10px] font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            Unlocked
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                            Locked
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{ach.description}</p>
                      
                      {/* Achievement Progress */}
                      {!ach.unlocked && ach.progress !== undefined && (
                        <div className="mt-3">
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500" style={{ width: `${ach.progress}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 block">Progress: {ach.progress}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'friends' && (() => {
        const filteredFriends = friendsList.filter(friend =>
          friend.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return (
          <div className="space-y-6">
            {/* FEATURE BOX - Premium Arena Board & Challenger Spotlight Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Highlight Box 1: Featured Competitor Spotlight */}
              <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-2xl p-4 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
                <div className="absolute -top-3 -right-3 opacity-15">
                  <Trophy className="w-24 h-24 text-white" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-bold text-purple-100 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-yellow-300" /> Spotlight Pro 🏆
                  </div>
                  <h4 className="text-base font-bold mt-2.5">Sarah Connor</h4>
                  <p className="text-xs text-purple-100/80 mt-1">
                    Level 10 • 65% Win Rate
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <button 
                    onClick={() => alert("Challenged Sarah Connor to a live Ludo duel! Code sent via in-game socket.")}
                    className="bg-white hover:bg-purple-50 text-purple-700 font-bold text-xs py-1.5 px-3 rounded-xl transition-all shadow active:scale-95 cursor-pointer"
                  >
                    Challenge Duel ⚔️
                  </button>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/30 text-emerald-100 px-2 py-0.5 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Active
                  </span>
                </div>
              </div>

              {/* Highlight Box 2: Quick Arena Stats */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-200 rounded-full text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    Lobby Insights 📊
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3.5">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Total Players</span>
                      <span className="text-sm font-extrabold text-slate-700">{friendsList.length} Directory</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Online Now</span>
                      <span className="text-sm font-extrabold text-slate-700">
                        {friendsList.filter(f => f.status !== 'Offline').length} Active
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-3 leading-relaxed">
                  Join lobby matches to earn gold. High level players grant multiplier bonuses.
                </p>
              </div>

              {/* Highlight Box 3: Quick Add Challenger Form */}
              <div className="bg-purple-50/40 border border-purple-100 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-purple-100 rounded-full text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                    Add Challenger 👤
                  </div>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newFriendName.trim()) return;
                      const exists = friendsList.some(f => f.name.toLowerCase() === newFriendName.trim().toLowerCase());
                      if (exists) {
                        alert("This player is already in your list!");
                        return;
                      }
                      const newFriend = {
                        name: newFriendName.trim(),
                        status: 'Online' as const,
                        level: Math.floor(3 + Math.random() * 15),
                        winRate: `${Math.floor(45 + Math.random() * 25)}%`
                      };
                      setFriendsList(prev => [...prev, newFriend]);
                      setNewFriendName('');
                    }}
                    className="mt-2.5"
                  >
                    <div className="flex gap-1.5">
                      <input 
                        type="text" 
                        placeholder="Player username..." 
                        value={newFriendName}
                        onChange={(e) => setNewFriendName(e.target.value)}
                        className="bg-white border border-slate-200 text-xs px-2.5 py-1.5 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 flex-1 min-w-0"
                      />
                      <button 
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                      >
                        Add
                      </button>
                    </div>
                  </form>
                </div>
                <span className="text-[9px] text-purple-400 mt-2 block leading-relaxed font-medium">
                  Add custom rival usernames to monitor level progression and win rates.
                </span>
              </div>

            </div>

            {/* Filter / Search Bar */}
            <div className="flex items-center bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <input 
                type="text" 
                placeholder="Search players by name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-slate-700 focus:outline-none w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 text-sm font-semibold px-1">×</button>
              )}
            </div>

            {/* Table */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Player</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Level</th>
                    <th className="px-6 py-4 text-right">Win Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFriends.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-xs font-medium">
                        No players matching "{searchQuery}" found.
                      </td>
                    </tr>
                  ) : (
                    filteredFriends.map((friend, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-800 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-bold border border-purple-100">
                            {friend.name.charAt(0)}
                          </div>
                          {friend.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            friend.status === 'Online' ? 'bg-emerald-50 text-emerald-700' :
                            friend.status === 'In Game' ? 'bg-purple-50 text-purple-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              friend.status === 'Online' ? 'bg-emerald-500' :
                              friend.status === 'In Game' ? 'bg-purple-500' :
                              'bg-slate-400'
                            }`} />
                            {friend.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">Lv.{friend.level}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-800">{friend.winRate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {activeTab === 'rewards' && (
        <div className="flex flex-col items-center justify-center py-8 text-center max-w-md mx-auto">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center text-4xl shadow-sm mb-4 animate-bounce">
            🎁
          </div>
          <h3 className="text-xl font-bold text-slate-800">Daily Chest Reward</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-xs">
            Open the daily chest to claim free golden coins to use in online arena matches!
          </p>

          <button
            onClick={handleClaim}
            disabled={dailyRewardClaimed}
            className={`mt-6 w-full py-3.5 px-6 rounded-2xl font-bold text-sm tracking-wide shadow transition-all ${
              dailyRewardClaimed 
                ? 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none cursor-not-allowed' 
                : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white hover:scale-[1.02] active:scale-95'
            }`}
          >
            {dailyRewardClaimed ? 'Claimed Today (Come back tomorrow!)' : 'Claim Daily Chest Reward'}
          </button>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {matchHistory.map((match) => (
            <div key={match.id} className="p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    match.mode === 'ONLINE' ? 'bg-indigo-50 text-indigo-700' :
                    match.mode === 'AI' ? 'bg-purple-50 text-purple-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {match.mode} MATCH
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{match.date}</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {match.players.map((p, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                      <span className={`w-2 h-2 rounded-full ${
                        p.color === 'RED' ? 'bg-red-500' :
                        p.color === 'GREEN' ? 'bg-emerald-500' :
                        p.color === 'YELLOW' ? 'bg-amber-400' : 'bg-blue-500'
                      }`} />
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-right flex md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-none pt-3 md:pt-0 border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Winner</span>
                  <span className="font-bold text-slate-800 text-sm flex items-center gap-1 mt-0.5">
                    <Trophy className="w-4 h-4 text-yellow-500 fill-yellow-100" />
                    {match.winnerName}
                  </span>
                </div>
                <span className="text-xs text-slate-400 md:mt-1.5 block font-mono">{match.duration}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
