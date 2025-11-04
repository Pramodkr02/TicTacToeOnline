import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { nakamaService } from '../services/nakama';
import { toast } from 'react-toastify';

export default function Matchmaking() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [matchmakingStatus, setMatchmakingStatus] = useState('');
  const [selectedMode, setSelectedMode] = useState(null);
  const [searchingAnimation, setSearchingAnimation] = useState(0);

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setSearchingAnimation(prev => (prev + 1) % 4);
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  const playVsBot = async () => {
    if (loading) return;
    
    setLoading(true);
    setSelectedMode('bot');
    setMatchmakingStatus('Connecting to AI opponent...');
    
    try {
      await nakamaService.connectSocket(session);
      const match = await nakamaService.createMatch(session, { 
        bot_match: true, 
        bot_difficulty: 'medium' 
      });
      
      toast.success('AI opponent found! Starting game...');
      navigate(`/game/${match.match_id}`);
      
    } catch (error) {
      console.error('Failed to create bot match:', error);
      toast.error('Failed to start game with AI. Please try again.');
      setLoading(false);
      setSelectedMode(null);
      setMatchmakingStatus('');
    }
  };

  const playVsPlayer = async () => {
    if (loading) return;
    
    setLoading(true);
    setSelectedMode('player');
    setMatchmakingStatus('Searching for opponent...');
    
    try {
      await nakamaService.connectSocket(session);
      setMatchmakingStatus('Found opponent! Starting match...');
      
      const match = await nakamaService.createMatch(session, {});
      
      toast.success('Opponent found! Game starting...');
      navigate(`/game/${match.match_id}`);
      
    } catch (error) {
      console.error('Failed to create player match:', error);
      toast.error('Failed to find opponent. Please try again.');
      setLoading(false);
      setSelectedMode(null);
      setMatchmakingStatus('');
    }
  };

  const getSearchingDots = () => {
    return '.'.repeat(searchingAnimation + 1);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
          🎮 Find Your Match
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Choose your opponent and start your gaming adventure
        </p>
      </motion.div>

      {/* Game Modes */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Player vs Player */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-1 shadow-2xl">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 h-full">
              <div className="text-center">
                <div className="text-6xl mb-6">⚔️</div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Player vs Player
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                  Challenge real players from around the world in intense strategic battles
                </p>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={playVsPlayer}
                  disabled={loading}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                >
                  {selectedMode === 'player' && loading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>Finding opponent{getSearchingDots()}</span>
                    </>
                  ) : (
                    <span>Find Opponent</span>
                  )}
                </motion.button>

                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  ⏱️ Average wait time: 15-30 seconds
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Player vs Bot */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="relative"
        >
          <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl p-1 shadow-2xl">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 h-full">
              <div className="text-center">
                <div className="text-6xl mb-6">🤖</div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Player vs AI
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                  Practice against our intelligent AI opponent with adjustable difficulty levels
                </p>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={playVsBot}
                  disabled={loading}
                  className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                >
                  {selectedMode === 'bot' && loading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>Connecting to AI{getSearchingDots()}</span>
                    </>
                  ) : (
                    <span>Play vs AI</span>
                  )}
                </motion.button>

                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  ⚡ Instant match - No waiting required
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Status Animation */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl text-center max-w-md mx-4">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-2xl">
                    {selectedMode === 'player' ? '⚔️' : '🤖'}
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {selectedMode === 'player' ? 'Finding Opponent' : 'Connecting to AI'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {matchmakingStatus}
              </p>
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="mr-2">💡</span>
          Quick Tips
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-start space-x-2">
            <span className="text-green-500 mt-1">✓</span>
            <span>Player vs Player matches count towards your leaderboard ranking</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-500 mt-1">✓</span>
            <span>AI matches are perfect for practicing new strategies</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-500 mt-1">✓</span>
            <span>Both modes contribute to your overall game statistics</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-500 mt-1">✓</span>
            <span>Win matches to climb the global leaderboard</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
