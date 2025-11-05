import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { rpc, logout as nakamaLogout } from '../services/nakama';

export default function Lobby() {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await rpc('list_rooms', {});
      setRooms(response.payload.rooms || []);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Failed to fetch rooms. Please try again later.');
      toast.error('Could not fetch rooms.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [fetchRooms]);

  const handleCreateRoom = async () => {
    try {
      const response = await rpc('create_room', {});
      const matchId = response.payload.match_id;
      toast.success('Room created successfully!');
      navigate(`/game/${matchId}`);
    } catch (err) {
      console.error('Error creating room:', err);
      toast.error('Failed to create room.');
    }
  };

  const handleJoinRoom = async (matchId) => {
    try {
      await rpc('join_room', { match_id: matchId });
      toast.success('Joined room successfully!');
      navigate(`/game/${matchId}`);
    } catch (err) {
      console.error('Error joining room:', err);
      toast.error(err.message || 'Failed to join room.');
    }
  };

  const handleLogout = async () => {
    try {
      await nakamaLogout();
      setUser(null);
      setToken(null);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed. Please try again.');
    }
  };

  if (loading && rooms.length === 0) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading rooms...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        <p>⚠️ {error}</p>
        <button onClick={fetchRooms} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Open Rooms</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleCreateRoom}
            className="px-6 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition-colors"
          >
            Create Room
          </button>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {rooms.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {rooms.map((room) => (
            <motion.div
              key={room.match_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold truncate">{room.label || 'Tic-Tac-Toe Room'}</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {room.size}/2 players
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Match ID: <span className="font-mono text-xs">{room.match_id}</span>
              </p>
              <button
                onClick={() => handleJoinRoom(room.match_id)}
                disabled={room.size >= 2}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {room.size >= 2 ? 'Full' : 'Join'}
              </button>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No open rooms available. Why not create one?</p>
        </div>
      )}
    </div>
  );
}
