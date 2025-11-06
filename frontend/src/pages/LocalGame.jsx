import { useMemo, useState } from 'react';

const emptyBoard = () => Array(3).fill(null).map(()=>Array(3).fill(0));

export default function LocalGame() {
  const [board, setBoard] = useState(emptyBoard());
  const [currentTurn, setCurrentTurn] = useState(1); // 1 = X, 2 = O
  const [winner, setWinner] = useState(0); // 0 none, 1 X, 2 O, 3 draw

  const status = useMemo(() => {
    if (winner === 1) return 'X wins!';
    if (winner === 2) return 'O wins!';
    if (winner === 3) return 'Draw';
    return currentTurn === 1 ? "X's turn" : "O's turn";
  }, [winner, currentTurn]);

  const checkWin = (b, r, c) => {
    const mark = b[r][c];
    // row
    if (b[r][0] === mark && b[r][1] === mark && b[r][2] === mark) return true;
    // col
    if (b[0][c] === mark && b[1][c] === mark && b[2][c] === mark) return true;
    // diag
    if (r === c && b[0][0] === mark && b[1][1] === mark && b[2][2] === mark) return true;
    if (r + c === 2 && b[0][2] === mark && b[1][1] === mark && b[2][0] === mark) return true;
    return false;
  };

  const checkDraw = (b) => b.flat().every(v => v !== 0);

  const handleCell = (i, j) => {
    if (winner) return;
    if (board[i][j] !== 0) return;
    const b = board.map(row => row.slice());
    b[i][j] = currentTurn;
    setBoard(b);
    if (checkWin(b, i, j)) {
      setWinner(currentTurn);
      return;
    }
    if (checkDraw(b)) {
      setWinner(3);
      return;
    }
    setCurrentTurn(currentTurn === 1 ? 2 : 1);
  };

  const reset = () => {
    setBoard(emptyBoard());
    setCurrentTurn(1);
    setWinner(0);
  };

  return (
    <div className="max-w-md mx-auto w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 border border-slate-800 px-4 py-2 text-sm">
          <span className="text-slate-300">{status}</span>
        </div>
        <button onClick={reset} className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-sm">Reset</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {board.map((r, i) => r.map((c, j) => (
          <motion.button
            key={`${i}-${j}`}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCell(i,j)}
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
