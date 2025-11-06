import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars

export default function Docs() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-semibold mb-2">How to Play</h1>
        <p className="text-slate-400 text-sm">Tic-Tac-Toe (X/O) quick rules and tips.</p>
        <ol className="mt-4 space-y-2 text-sm list-decimal pl-5">
          <li>Game is played on a 3x3 grid.</li>
          <li>Two marks: X and O. Players take turns placing their mark in an empty cell.</li>
          <li>First to get 3 in a row horizontally, vertically, or diagonally wins.</li>
          <li>If all 9 cells are filled and no one has 3 in a row, it’s a draw.</li>
          <li>In online mode, your turn is highlighted; in local mode, turns alternate.</li>
        </ol>
        <h2 className="text-lg font-semibold mt-6">Game Modes</h2>
        <ul className="mt-2 space-y-1 text-sm list-disc pl-5">
          <li>Play vs Bot: Instant match against AI.</li>
          <li>Play vs Player: Creates a match room for another player to join.</li>
          <li>Local Multiplayer: Two players on one device; take turns tapping cells.</li>
        </ul>
        <h2 className="text-lg font-semibold mt-6">Scoring & Leaderboard</h2>
        <ul className="mt-2 space-y-1 text-sm list-disc pl-5">
          <li>Wins grant points; losses deduct or grant fewer points.</li>
          <li>Leaderboard updates regularly to show top players.</li>
        </ul>
        <h2 className="text-lg font-semibold mt-6">Tips</h2>
        <ul className="mt-2 space-y-1 text-sm list-disc pl-5">
          <li>Try to control the center.</li>
          <li>Force forks and block opponent forks.</li>
          <li>Don’t miss immediate winning opportunities.</li>
        </ul>
      </motion.div>
    </div>
  );
}
