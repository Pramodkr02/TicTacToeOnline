import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { rpc } from '../services/nakama';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [playerStats, setPlayerStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayerStats = async () => {
      try {
        setLoading(true);
        const stats = await rpc('get_player_stats', {});
        setPlayerStats(stats.payload);
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
    { title: 'Find Match', description: 'Start playing against other players', icon: '⚔️', link: '/lobby', color: 'bg-blue-500 hover:bg-blue-600' },
    { title: 'Leaderboard', description: 'See how you rank globally', icon: '📊', link: '/leaderboard', color: 'bg-purple-500 hover:bg-purple-600' },
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
        {stats.map((stat) => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action) => (
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
    </div>
  );
}
