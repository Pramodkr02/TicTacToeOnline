import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Matchmaking() {
  const { nakamaClient, session } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const playVsBot = async () => {
    setLoading(true);
    try {
      const s = nakamaClient.createSocket();
      await s.connect(session, false);
      const match = await s.createMatch('tic_tac_toe', { bot_match: true, bot_difficulty: 'medium' });
      navigate(`/game/${match.match_id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const playVsPlayer = async () => {
    setLoading(true);
    try {
      const s = nakamaClient.createSocket();
      await s.connect(session, false);
      const match = await s.createMatch('tic_tac_toe', {});
      navigate(`/game/${match.match_id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-center">
        <h2 className="text-lg font-semibold mb-2">Choose your mode</h2>
        <p className="text-slate-400 text-sm mb-6">Find an opponent or play against our AI bot.</p>
        <div className="space-y-3">
          <button onClick={playVsPlayer} disabled={loading} className="w-full py-3 rounded-lg bg-secondary-600 hover:bg-secondary-500 disabled:opacity-60">Play vs Player</button>
          <button onClick={playVsBot} disabled={loading} className="w-full py-3 rounded-lg bg-primary-600 hover:bg-primary-500 disabled:opacity-60">Play vs Bot</button>
        </div>
        {loading && (
          <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <div className="h-4 w-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
            Matchmaking...
          </div>
        )}
      </div>
    </div>
  );
}
