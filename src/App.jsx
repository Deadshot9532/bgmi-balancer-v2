import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Swords, Share2, History, Trash2,
  ChevronRight, ChevronLeft, Plus, Minus,
  Save, Copy, Check, Clock
} from 'lucide-react';
import LZString from 'lz-string';

// --- Utils ---
const balanceTeams = (players, teamCount) => {
  const sorted = [...players].sort((a, b) => b.strength - a.strength);
  const teams = Array.from({ length: teamCount }, (_, i) => ({
    id: i + 1,
    name: `Team ${i + 1}`,
    players: [],
    power: 0
  }));

  for (const p of sorted) {
    // Find team with lowest current power
    const team = teams.reduce((min, t) => t.power < min.power ? t : min, teams[0]);
    team.players.push(p);
    team.power += p.strength;
  }

  return {
    teams,
    timestamp: new Date().toLocaleString(),
    eventLog: `Team formed at ${new Date().toLocaleTimeString()} on ${new Date().toLocaleDateString()}`
  };
};

// --- Main App ---
export default function App() {
  const [teamCount, setTeamCount] = useState(2);
  const [players, setPlayers] = useState(
    Array.from({ length: 4 }).map((_, i) => ({
      id: Date.now() + i,
      name: "",
      strength: 5,
    }))
  );
  const [history, setHistory] = useState([]);
  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [userRole, setUserRole] = useState('moderator'); // 'moderator' or 'visitor'

  // Load state and history on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('g');
    const roleParam = params.get('r');

    if (roleParam === 'v') setUserRole('visitor');

    if (sharedData) {
      try {
        const decoded = JSON.parse(LZString.decompressFromEncodedURIComponent(sharedData));
        if (decoded.players) setPlayers(decoded.players);
        if (decoded.teamCount) setTeamCount(decoded.teamCount);
        if (decoded.results) setResults(decoded.results);
      } catch (e) {
        console.error("Failed to decode shared data", e);
      }
    }

    const savedHistory = localStorage.getItem('team_balancer_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const addPlayer = () => {
    setPlayers([...players, {
      id: Date.now(),
      name: "",
      strength: 5,
    }]);
  };

  const removePlayer = (id) => {
    if (players.length > teamCount) {
      setPlayers(players.filter(p => p.id !== id));
    }
  };

  const updatePlayer = (id, field, value) => {
    setPlayers(players.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleBalance = () => {
    setIsShuffling(true);
    setResults(null); // Clear previous results immediately
    setTimeout(() => {
      const res = balanceTeams(players, teamCount);
      setResults(res);
      const newHistory = [{
        log: res.eventLog,
        id: Date.now()
      }, ...history].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem('team_balancer_history', JSON.stringify(newHistory));
      setIsShuffling(false);
    }, 1200);
  };

  const generateShareLink = (targetRole = 'visitor') => {
    const data = { players, teamCount, results };
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(data));
    const roleKey = targetRole === 'visitor' ? 'v' : 'm';
    const url = `${window.location.origin}${window.location.pathname}?g=${compressed}&r=${roleKey}`;

    navigator.clipboard.writeText(url);
    setCopied(targetRole);
    setTimeout(() => setCopied(false), 2000);
  };

  const isVisitor = userRole === 'visitor';

  return (
    <div className="min-h-screen bg-bg-dark text-white p-6 md:p-12 selection:bg-blue-500/30">
      <header className="max-w-5xl mx-auto mb-16 text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-block p-1 rounded-full bg-gradient-to-r from-blue-500/20 to-orange-500/20 border border-white/10"
        >
          <div className="px-6 py-2 rounded-full bg-bg-dark/80 backdrop-blur-md">
            <span className="text-xs font-semibold text-blue-400">Team Balancer Tool</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-bold tracking-tight"
        >
          Team <span className="gradient-text">Balancer</span>
        </motion.h1>

        <p className="max-w-xl mx-auto text-white/60 text-lg">
          Create perfectly balanced teams for games, sports, or group activities.
        </p>
      </header>

      <main className="max-w-6xl mx-auto space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {players.map((p, idx) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="premium-card group"
              >
                {!isVisitor && (
                  <button
                    onClick={() => removePlayer(p.id)}
                    className="absolute top-4 right-4 p-2 text-white/10 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold text-blue-500 text-sm">
                      {idx + 1}
                    </div>
                    <span className="text-sm font-semibold text-white/50">Player</span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                    <span className="text-xs font-semibold text-blue-400">Rating: {p.strength}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative group/input">
                    <input
                      className={`w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 focus:bg-white/[0.07] outline-none transition-all font-bold placeholder:text-white/10 ${isVisitor ? 'pointer-events-none opacity-60' : ''}`}
                      value={p.name}
                      readOnly={isVisitor}
                      onChange={(e) => updatePlayer(p.id, 'name', e.target.value)}
                      placeholder="Player Name..."
                    />
                  </div>

                  <div className="pt-2">
                    <input
                      type="range" min="1" max="10" step="1"
                      className={`w-full ${isVisitor ? 'pointer-events-none opacity-30' : ''}`}
                      value={p.strength}
                      disabled={isVisitor}
                      onChange={(e) => updatePlayer(p.id, 'strength', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {!isVisitor && (
            <motion.button
              layout
              onClick={addPlayer}
              className="premium-card border-dashed border-white/10 flex flex-col items-center justify-center gap-4 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all min-h-[180px] group"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="text-white/40" />
              </div>
              <span className="text-sm font-semibold text-white/50">Add Player</span>
            </motion.button>
          )}
        </div>

        <div className="premium-card bg-white/[0.04] border-white/10 p-8 flex flex-wrap items-center justify-between gap-8">
          <div className="space-y-3">
            <span className="text-sm text-white/50 font-semibold block">Number of Teams</span>
            <div className={`flex items-center gap-6 ${isVisitor ? 'pointer-events-none opacity-50' : ''}`}>
              <button
                onClick={() => setTeamCount(Math.max(2, teamCount - 1))}
                disabled={isVisitor}
                className="w-10 h-10 border border-white/10 rounded-xl hover:bg-white/5 flex items-center justify-center transition-colors"
              >
                <Minus size={18} />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-4xl font-bold text-white leading-none">{teamCount}</span>
                <span className="text-xs text-white/40 font-medium mt-1">Teams</span>
              </div>
              <button
                onClick={() => setTeamCount(teamCount + 1)}
                disabled={isVisitor}
                className="w-10 h-10 border border-white/10 rounded-xl hover:bg-white/5 flex items-center justify-center transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => generateShareLink('visitor')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white hover:bg-white/[0.07] transition-all font-medium text-sm active:scale-95"
            >
              {copied === 'visitor' ? <Check size={16} className="text-blue-400" /> : <Users size={16} />}
              {copied === 'visitor' ? "Viewer Link Ready" : "Share as Viewer"}
            </button>
            <button
              onClick={() => generateShareLink('moderator')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white hover:bg-white/[0.07] transition-all font-medium text-sm active:scale-95"
            >
              {copied === 'moderator' ? <Check size={16} className="text-orange-400" /> : <Save size={16} />}
              {copied === 'moderator' ? "Editor Link Ready" : "Share as Editor"}
            </button>
            {!isVisitor && (
              <button
                onClick={handleBalance}
                disabled={isShuffling}
                className={`px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95 text-base ${isShuffling ? 'opacity-50' : ''}`}
              >
                <Swords size={18} className={isShuffling ? 'animate-spin' : ''} />
                {isShuffling ? 'Balancing...' : 'Balance Teams'}
              </button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isShuffling ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-80 flex flex-col items-center justify-center gap-6"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              </div>
              <span className="text-blue-400 font-semibold text-lg animate-pulse">Balancing Teams...</span>
            </motion.div>
          ) : results && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {results.teams.map((team, i) => (
                <div key={team.id} className={`premium-card team-${(i % 4) + 1}`}>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xl font-bold">Team {team.id}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/50 mb-1">Total Rating</div>
                      <div className="text-xl font-bold text-blue-400">{team.power}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {team.players.map(p => (
                      <div key={p.id} className="flex justify-between items-center bg-white/[0.03] p-3 rounded-xl border border-white/5 hover:bg-white/[0.06] transition-colors">
                        <div className="font-medium">{p.name || `Player ${p.id.toString().slice(-3)}`}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-white/60 text-sm font-semibold">Rating: {p.strength}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {history.length > 0 && (
          <div className="max-w-2xl mx-auto pt-12">
            <h3 className="text-sm font-semibold text-white/50 mb-6 flex items-center justify-center gap-2">
              <Clock size={16} /> History
            </h3>
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="premium-card p-4 flex justify-between items-center text-sm border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-white/70">{h.log}</span>
                  </div>
                </div>
              ))}
              <div className="text-center mt-6">
                <button
                  onClick={() => { setHistory([]); localStorage.removeItem('team_balancer_history'); }}
                  className="text-sm text-white/40 hover:text-red-400 transition-colors"
                >
                  Clear History
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-4xl mx-auto mt-24 pb-12 text-center space-y-4">
        {isVisitor && (
          <div className="inline-block px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <span className="text-xs font-semibold text-orange-400">Visitor Mode (Read-Only)</span>
          </div>
        )}
      </footer>
    </div>
  );
}
