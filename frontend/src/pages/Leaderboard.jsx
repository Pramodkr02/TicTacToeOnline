import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Leaderboard() {
  const { nakamaClient, session } = useAuth();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let timer;
    const run = async () => {
      try {
        const res = await nakamaClient.rpc(session, 'get_leaderboard', { limit: 10 });
        let payload = res.payload;
        if (typeof payload === 'string') {
          try { payload = JSON.parse(payload); } catch {}
        }
        setRows((payload && payload.leaderboard) ? payload.leaderboard : []);
      } catch (e) {
        console.error(e);
      }
    };
    run();
    timer = setInterval(run, 5000);
    return () => { if (timer) clearInterval(timer); };
  }, [nakamaClient, session]);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-800 font-medium">Top Players</div>
      <div className="divide-y divide-slate-800">
        {rows.map((r, idx) => (
          <div key={r.user_id} className="flex items-center justify-between px-5 py-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="w-6 text-slate-400">#{idx+1}</span>
              <span className="font-medium">{r.username}</span>
            </div>
            <div className="text-slate-300">{r.score} pts</div>
          </div>
        ))}
        {rows.length === 0 && <div className="px-5 py-6 text-sm text-slate-400">No players yet.</div>}
      </div>
    </div>
  );
}
