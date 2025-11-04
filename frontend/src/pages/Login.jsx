import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

export default function Login() {
  const { login, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Signed in successfully');
      navigate('/dashboard');
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
        className="w-full max-w-sm relative rounded-2xl p-[1px] bg-gradient-to-br from-cyan-400/40 to-fuchsia-500/40"
      >
        <div className="rounded-2xl p-6 bg-slate-900/80 backdrop-blur border border-slate-800">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-cyan-300">→</div>
          <h1 className="text-2xl font-semibold mb-2">Welcome Back</h1>
          <p className="text-sm text-slate-400 mb-6">Sign in to continue your winning streak</p>
          {error && <div className="mb-3 text-sm text-red-400">{error}</div>}
          <form onSubmit={onSubmit} className="space-y-3">
            <input className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
            <input className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
            <button disabled={loading} className="w-full py-2 rounded-md bg-primary-600 hover:bg-primary-500 disabled:opacity-60 shadow-[0_0_20px_rgba(14,165,233,0.4)]">
              {loading? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="flex items-center justify-between text-sm mt-4">
            <Link className="text-slate-400 hover:text-white" to="/forgot-password">Forgot password?</Link>
            <Link className="text-primary-400 hover:text-primary-300" to="/register">Sign up</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
