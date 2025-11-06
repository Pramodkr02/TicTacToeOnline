import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { connectSocket, socketJoinMatch, rpc } from '../services/nakama';

export default function Game() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [board, setBoard] = useState(Array(9).fill(null));
  const [player, setPlayer] = useState(0);
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    const onMatchData = (result) => {
      const opCode = result.op_code;
      const data = JSON.parse(new TextDecoder().decode(result.data));

      if (opCode === 1) { // Game state update
        setBoard(data.board);
        setStatus(data.message);
      } else if (opCode === 2) { // Player assignment
        setPlayer(data.player);
      } else if (opCode === 3) { // Game over
        setStatus(data.message);
        toast.info(data.message);
        setTimeout(() => navigate('/lobby'), 5000);
      }
    };

    connectSocket(onMatchData)
      .then(() => socketJoinMatch(matchId))
      .then(() => setStatus('Waiting for opponent...'))
      .catch(error => {
        console.error('Failed to connect to game', error);
        toast.error('Failed to connect to game');
        navigate('/lobby');
      });

  }, [matchId, navigate, session]);

  const sendMove = async (index) => {
    if (board[index] !== null) return;
    try {
      await rpc('make_move', { match_id: matchId, cell_index: index });
    } catch (error) {
      toast.error(error.message || 'Failed to make move.');
      console.error(error);
    }
  };

  const getSymbol = (value) => {
    if (value === 1) return 'X';
    if (value === 2) return 'O';
    return '';
  };

  return (
    <div className="max-w-md mx-auto w-full">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 border border-slate-800 px-4 py-2 text-sm">
          <span className="text-slate-300">{status}</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 border border-slate-800 px-4 py-2 text-sm ml-2">
            <span className="text-slate-300">You are Player {player}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {board.map((cell, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.98 }}
            onClick={() => sendMove(i)}
            className="aspect-square rounded-2xl p-[1px] bg-gradient-to-br from-slate-700/50 to-slate-600/30 hover:from-cyan-500/30 hover:to-fuchsia-500/30 transition-colors"
          >
            <div className="w-full h-full rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-center text-4xl font-extrabold">
              <span className={cell===1 ? 'text-cyan-300 drop-shadow-[0_0_18px_rgba(56,189,248,0.35)]' : cell===2 ? 'text-fuchsia-300 drop-shadow-[0_0_18px_rgba(217,70,239,0.35)]' : 'text-slate-600'}>
                {getSymbol(cell)}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
