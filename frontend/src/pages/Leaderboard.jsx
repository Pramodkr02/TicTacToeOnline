import { useEffect, useState } from 'react';
import { rpc } from '../services/nakama';
import { motion } from 'framer-motion';

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let timer;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await rpc('get_leaderboard', {});
        setRows(response.payload.leaderboard || []);
        
      } catch (e) {
        console.error('Failed to fetch leaderboard:', e);
        setError('Failed to load leaderboard. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    run();
    timer = setInterval(run, 30000); // Refresh every 30 seconds
    return () => { if (timer) clearInterval(timer); };
  }, []);

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-600';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading && rows.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          🏆 Leaderboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Compete with players worldwide and climb to the top!
        </p>
      </motion.div>

      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {/* Leaderboard Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🏆</span>
              <h2 className="text-xl font-bold">Top Players</h2>
            </div>
            <div className="text-sm opacity-90">
              {rows.length} players online
            </div>
          </div>
        </div>

        {/* Player List */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {rows.map((player, index) => (
            <motion.div
              key={player.user_id || player.username}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                index < 3 ? 'bg-gradient-to-r from-yellow-50/50 to-orange-50/50 dark:from-yellow-900/10 dark:to-orange-900/10' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Rank */}
                  <div className={`text-2xl font-bold w-8 text-center ${getRankColor(index + 1)}`}>
                    {getRankIcon(index + 1)}
                  </div>

                  {/* Player Info */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {player.username}
                      </h3>
                      {index < 3 && (
                        <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2 py-1 rounded-full font-bold">
                          TOP {index + 1}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Level {player.level || 1} • {player.wins || 0} wins
                    </p>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {player.score?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    points
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {index < 10 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{Math.min(100, Math.round((player.score / Math.max(...rows.map(r => r.score))) * 100))}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, Math.round((player.score / Math.max(...rows.map(r => r.score))) * 100))}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {rows.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No players yet!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Be the first to join the competition and claim the top spot!
            </p>
          </div>
        )}
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2">🎯</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Total Players
          </h3>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {rows.length}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2">⚡</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Highest Score
          </h3>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {rows.length > 0 ? Math.max(...rows.map(r => r.score)).toLocaleString() : '0'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2">🔥</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Competition
          </h3>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            Active
          </p>
        </div>
      </motion.div>
    </div>
  );
}
