import React, { useState } from 'react';
import { Shield, Activity, Users, FileText, Ban, CheckCircle, Plus, Sparkles, RefreshCw } from 'lucide-react';

interface AdminPanelProps {
  onAwardCoins: (amount: number) => void;
}

export default function AdminPanel({ onAwardCoins }: AdminPanelProps) {
  const [users, setUsers] = useState([
    { id: 'u_1', name: 'Ravi Kumar', email: 'ravi@ludo.in', coins: 45000, status: 'Active', joins: 145 },
    { id: 'u_2', name: 'Sarah Connor', email: 'sarah@skynet.com', coins: 38200, status: 'Active', joins: 210 },
    { id: 'u_3', name: 'Takashi M.', email: 'takashi@tokyo.jp', coins: 21400, status: 'Active', joins: 98 },
    { id: 'u_4', name: 'SpammyGamer', email: 'spam@bot.com', coins: 500, status: 'Blocked', joins: 14 }
  ]);

  const [liveRooms, setLiveRooms] = useState([
    { id: 'ARENA_501', mode: 'ONLINE', players: 'Ravi, Sarah, Takashi', status: 'In Game', duration: '12m' },
    { id: 'R_9031', mode: 'PRIVATE', players: 'LudoMaster, Guest_23', status: 'Waiting', duration: '1m' }
  ]);

  const [systemStats, setSystemStats] = useState({
    cpu: 18,
    memory: '242 MB',
    sockets: 4,
    uptime: '14h 32m',
    status: 'Healthy'
  });

  const toggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'Active' ? 'Blocked' : 'Active';
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const handleGrantCoins = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        onAwardCoins(5000); // Also update the main local user
        return { ...u, coins: u.coins + 5000 };
      }
      return u;
    }));
  };

  const triggerSimulateLoad = () => {
    setSystemStats(prev => ({
      ...prev,
      cpu: Math.floor(30 + Math.random() * 40)
    }));
    setTimeout(() => {
      setSystemStats(prev => ({
        ...prev,
        cpu: 18
      }));
    }, 1500);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 max-w-5xl w-full mx-auto">
      {/* Admin Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600" />
            Ludo Server Admin Center
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Monitor real-time engine state, user actions, and service health metrics.
          </p>
        </div>
        <button
          onClick={triggerSimulateLoad}
          className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Test System Payload
        </button>
      </div>

      {/* Health Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">Engine Status</span>
          <div className="flex items-center gap-1.5 mt-1">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-base font-bold text-slate-700">{systemStats.status}</span>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">CPU Payload</span>
          <span className="text-base font-bold text-slate-700 block mt-1">{systemStats.cpu}%</span>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-purple-600 h-full transition-all duration-300" style={{ width: `${systemStats.cpu}%` }} />
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">Container Memory</span>
          <span className="text-base font-bold text-slate-700 block mt-1">{systemStats.memory}</span>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">Live Sockets</span>
          <span className="text-base font-bold text-slate-700 block mt-1">{systemStats.sockets} Sockets</span>
        </div>
      </div>

      {/* Main Panel Sections split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Mgmt Table */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* FEATURE BOX - Admin Highlights & Broadcaster */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Box 1: Spotlight player */}
            <div className="bg-gradient-to-r from-purple-500/5 to-indigo-500/5 border border-purple-500/10 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-purple-100">
                  <Sparkles className="w-3 h-3 text-purple-500" /> Spotlight Player 🌟
                </div>
                <h4 className="font-bold text-slate-800 mt-2.5 text-sm">Sarah Connor</h4>
                <p className="text-xs text-slate-500 mt-0.5">Most active player on Skynet Ludo servers.</p>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleGrantCoins('u_2')}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] py-1.5 px-3.5 rounded-lg transition-colors cursor-pointer"
                >
                  Grant 5K Gold 💰
                </button>
              </div>
            </div>

            {/* Box 2: Global alert console */}
            <div className="bg-amber-50/40 border border-amber-200/50 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Global Server Broadcast 📢
                </span>
                <div className="mt-2.5 flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Type global alert..."
                    id="admin_broadcast_input"
                    className="bg-white border border-slate-200 text-xs px-2.5 py-1.5 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 flex-1 min-w-0"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('admin_broadcast_input') as HTMLInputElement;
                      if (input?.value.trim()) {
                        alert(`Broadcasting live alert: "${input.value}"`);
                        input.value = '';
                      }
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-sm"
                  >
                    Send Alert
                  </button>
                </div>
              </div>
              <span className="text-[9px] text-amber-600 font-medium mt-2">
                Sends live system notification banner to all active Ludo lobbies.
              </span>
            </div>
          </div>

          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">User Directory Control</h3>
            </div>
            
            <table className="w-full text-left text-xs text-slate-500">
              <thead className="text-[10px] text-slate-700 uppercase bg-slate-50 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">User info</th>
                  <th className="px-5 py-3">Total Joins</th>
                  <th className="px-5 py-3">Coins Bal</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800">{user.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{user.email}</div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-600">{user.joins}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-700">{user.coins.toLocaleString()}</td>
                    <td className="px-5 py-3.5 flex gap-1.5">
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          user.status === 'Active'
                            ? 'text-red-600 bg-red-50 border-red-100 hover:bg-red-100'
                            : 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100'
                        }`}
                        title={user.status === 'Active' ? 'Block User' : 'Activate User'}
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleGrantCoins(user.id)}
                        className="p-1.5 rounded-lg border text-purple-600 bg-purple-50 border-purple-100 hover:bg-purple-100"
                        title="Grant 5,000 Coins"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column - Active Matches */}
        <div className="space-y-6">
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">Active Game Lobbies</h3>
            </div>

            <div className="p-4 space-y-3.5">
              {liveRooms.map((room) => (
                <div key={room.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100/80">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-purple-600">{room.id}</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                      {room.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 truncate">
                    Players: <span className="font-medium text-slate-700">{room.players}</span>
                  </p>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                    <span>Mode: {room.mode}</span>
                    <span>Duration: {room.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
