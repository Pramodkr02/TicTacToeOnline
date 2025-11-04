import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

export default function Register() {
  const { register, error } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, username);
      toast.success('Account created');
      navigate('/verify-email');
    } catch (e) {
      toast.error(e?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm relative rounded-2xl p-[1px] bg-gradient-to-br from-fuchsia-500/40 to-cyan-400/40"
      >
        <div className="rounded-2xl p-6 bg-slate-900/80 backdrop-blur border border-slate-800">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-fuchsia-300">◎</div>
          <h1 className="text-2xl font-semibold mb-2">Create Account</h1>
          <p className="text-sm text-slate-400 mb-6">Join the competition and climb the leaderboard</p>
          {error && <div className="mb-3 text-sm text-red-400">{error}</div>}
          <form onSubmit={onSubmit} className="space-y-3">
            <input className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary-500" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
            <input className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary-500" placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} required />
            <input className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary-500" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
            <button disabled={loading} className="w-full py-2 rounded-md bg-secondary-600 hover:bg-secondary-500 disabled:opacity-60 shadow-[0_0_20px_rgba(217,70,239,0.35)]">
              {loading? 'Creating...' : 'Create Account'}
            </button>
          </form>
          <div className="flex items-center justify-between text-sm mt-4">
            <span className="text-slate-400">Already have an account?</span>
            <Link className="text-primary-400 hover:text-primary-300" to="/login">Sign in</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
