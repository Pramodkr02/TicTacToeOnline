import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { nakamaService } from '../services/nakama';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [playerStats, setPlayerStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayerStats = async () => {
      try {
        setLoading(true);
        // Register/refresh player stats
        const stats = await nakamaService.registerPlayer();
        setPlayerStats(stats);
      } catch (err) {
        console.error('Error fetching player stats:', err);
        setError('Failed to load player statistics');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchPlayerStats();
    }
  }, [currentUser]);

  const stats = [
    { label: 'Total Score', value: playerStats?.score || 0, icon: '🏆', color: 'text-yellow-500' },
    { label: 'Wins', value: playerStats?.wins || 0, icon: '✅', color: 'text-green-500' },
    { label: 'Losses', value: playerStats?.losses || 0, icon: '❌', color: 'text-red-500' },
    { label: 'Draws', value: playerStats?.draws || 0, icon: '🤝', color: 'text-blue-500' },
    { label: 'Rank', value: playerStats?.rank || '-', icon: '👑', color: 'text-purple-500' },
  ];

  const quickActions = [
    { title: 'Find Match', description: 'Start playing against other players', icon: '⚔️', link: '/matchmaking', color: 'bg-blue-500 hover:bg-blue-600' },
    { title: 'Local Game', description: 'Practice against AI or friends', icon: '🎮', link: '/game/local', color: 'bg-green-500 hover:bg-green-600' },
    { title: 'Leaderboard', description: 'See how you rank globally', icon: '📊', link: '/leaderboard', color: 'bg-purple-500 hover:bg-purple-600' },
    { title: 'Game Docs', description: 'Learn rules and strategies', icon: '📚', link: '/docs', color: 'bg-orange-500 hover:bg-orange-600' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your stats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl"
      >
        <h1 className="text-4xl font-bold mb-2">
          Welcome back, {currentUser?.username}!
        </h1>
        <p className="text-blue-100 text-lg">
          Ready for your next challenge? Let's see how you're performing!
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6"
      >
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </span>
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">
              {stat.label}
            </h3>
          </div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Link
              key={action.title}
              to={action.link}
              className={`${action.color} text-white rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group`}
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">
                {action.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
              <p className="text-sm opacity-90">{action.description}</p>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Recent Activity
        </h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl">🎮</div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">Welcome to Nakama Arena!</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your journey begins here. Start playing to see your activity.
              </p>
            </div>
            <div className="text-sm text-gray-500">Just now</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}import React from 'react';
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
