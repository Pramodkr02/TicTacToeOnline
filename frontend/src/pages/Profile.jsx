import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { nakamaService } from '../services/nakama';

export default function Profile() {
  const { currentUser, session } = useAuth();
  const [username, setUsername] = useState(currentUser?.username || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    score: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    rank: 0,
    totalGames: 0,
    winRate: 0
  });

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!session) return;
      
      try {
        setLoading(true);
        
        // Get user account info
        const account = await nakamaService.getAccount(session);
        setUsername(account.user.username);
        setEmail(account.user.email);
        
        // Get user statistics
        const stats = await nakamaService.getUserStats(session);
        setUserStats({
          score: stats.score || 0,
          wins: stats.wins || 0,
          losses: stats.losses || 0,
          draws: stats.draws || 0,
          rank: stats.rank || 0,
          totalGames: (stats.wins || 0) + (stats.losses || 0) + (stats.draws || 0),
          winRate: ((stats.wins || 0) / Math.max(1, (stats.wins || 0) + (stats.losses || 0) + (stats.draws || 0))) * 100
        });
        
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [session]);

  const onSave = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Username cannot be empty');
      return;
    }
    
    if (username.length < 3) {
      toast.error('Username must be at least 3 characters long');
      return;
    }
    
    setSaving(true);
    try {
      await nakamaService.updateAccount(session, { username: username.trim() });
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
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
          👤 Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Manage your account and view your gaming statistics
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Account Information
            </h2>
            
            <form onSubmit={onSave} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 focus:bg-white dark:focus:bg-gray-600"
                    placeholder="Enter your username"
                    minLength="3"
                    maxLength="20"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Email cannot be changed
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={saving}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              📊 Statistics
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Current Score</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                  {userStats.score.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Global Rank</span>
                <span className="font-bold text-purple-600 dark:text-purple-400 text-lg">
                  #{userStats.rank || 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total Games</span>
                <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                  {userStats.totalGames}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Win Rate</span>
                <span className="font-bold text-orange-600 dark:text-orange-400 text-lg">
                  {userStats.winRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              🏆 Record
            </h3>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {userStats.wins}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Wins</div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {userStats.losses}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Losses</div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {userStats.draws}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Draws</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
