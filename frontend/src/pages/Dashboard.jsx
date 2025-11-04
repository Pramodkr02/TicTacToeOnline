import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { currentUser } = useAuth();
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/80 ring-1 ring-slate-700 text-cyan-300 text-xl font-semibold">
          {currentUser?.username?.slice(0,2)?.toUpperCase() || 'NA'}
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight drop-shadow-[0_0_20px_rgba(56,189,248,0.25)]">
          Welcome, {currentUser?.username}!
        </h2>
        <p className="mt-1 text-slate-400">Ready to dominate the board?</p>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm text-slate-300">
          <div className="px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800">Wins <span className="text-cyan-300 font-medium ml-2">0</span></div>
          <div className="px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800">Losses <span className="text-fuchsia-300 font-medium ml-2">0</span></div>
          <div className="px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800">Score <span className="text-primary-300 font-medium ml-2">0</span></div>
        </div>
      </div>

      {/* Modes */}
      <div className="grid gap-5 md:grid-cols-2 max-w-4xl mx-auto">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.05}} className="relative rounded-2xl p-[1px] bg-gradient-to-br from-cyan-400/40 to-fuchsia-500/40">
          <div className="rounded-2xl h-full p-6 bg-slate-900/80 backdrop-blur border border-slate-800">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-cyan-300">🤖</div>
            <h3 className="text-lg font-semibold">Play vs Bot</h3>
            <p className="text-sm text-slate-400">Challenge our AI opponent</p>
            <Link to="/matchmaking" className="inline-block mt-5 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 shadow-[0_0_20px_rgba(14,165,233,0.35)]">Start Game</Link>
          </div>
        </motion.div>
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="relative rounded-2xl p-[1px] bg-gradient-to-br from-fuchsia-500/40 to-cyan-400/40">
          <div className="rounded-2xl h-full p-6 bg-slate-900/80 backdrop-blur border border-slate-800">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-fuchsia-300">👥</div>
            <h3 className="text-lg font-semibold">Local Multiplayer</h3>
            <p className="text-sm text-slate-400">Play with a friend on this device</p>
            <Link to="/game/local" className="inline-block mt-5 px-4 py-2 rounded-lg bg-secondary-600 hover:bg-secondary-500 shadow-[0_0_20px_rgba(217,70,239,0.35)]">Start Game</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
