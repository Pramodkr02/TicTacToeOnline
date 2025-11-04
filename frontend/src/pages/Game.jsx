import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

export default function Game() {
  const { matchId } = useParams();
  const { nakamaClient, session } = useAuth();
  const [socket, setSocket] = useState(null);
  const [board, setBoard] = useState(Array(3).fill(null).map(()=>Array(3).fill(0)));
  const [currentTurn, setCurrentTurn] = useState(1);
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    let s;
    const connect = async () => {
      try {
        s = nakamaClient.createSocket();
        await s.connect(session, false);
        setSocket(s);

        s.onmatchdata = (result) => {
          try {
            const op = result.op_code;
            const data = JSON.parse(new TextDecoder().decode(result.data));
            if (op === 4) {
              // Move
              const b = board.map(r=>r.slice());
              b[data.row][data.col] = data.mark;
              setBoard(b);
              setCurrentTurn(data.current_turn);
            } else if (op === 3) {
              setStatus(data.message || 'Game over');
            } else if (op === 2) {
              setStatus('Game started');
            }
          } catch {}
        };

        await s.joinMatch(matchId);
        setStatus('Connected. Waiting for opponent...');
      } catch (e) {
        console.error(e);
        setStatus('Failed to connect');
        toast.error('Failed to connect to game');
      }
    };
    connect();
    return () => { if (s) s.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const sendMove = async (row, col) => {
    if (!socket) return;
    const cell = board[row][col];
    if (cell !== 0) return;
    await socket.sendMatchState(matchId, 1, JSON.stringify({ row, col }));
  };

  return (
    <div className="max-w-md mx-auto w-full">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 border border-slate-800 px-4 py-2 text-sm">
          <span className="text-slate-300">{status}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {board.map((r, i) => r.map((c, j) => (
          <motion.button
            key={`${i}-${j}`}
            whileTap={{ scale: 0.98 }}
            onClick={() => sendMove(i,j)}
            className="aspect-square rounded-2xl p-[1px] bg-gradient-to-br from-slate-700/50 to-slate-600/30 hover:from-cyan-500/30 hover:to-fuchsia-500/30 transition-colors"
          >
            <div className="w-full h-full rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-center text-4xl font-extrabold">
              <span className={c===1 ? 'text-cyan-300 drop-shadow-[0_0_18px_rgba(56,189,248,0.35)]' : c===2 ? 'text-fuchsia-300 drop-shadow-[0_0_18px_rgba(217,70,239,0.35)]' : 'text-slate-600'}>
                {c === 1 ? 'X' : c === 2 ? 'O' : ''}
              </span>
            </div>
          </motion.button>
        )))}
      </div>
    </div>
  );
}
