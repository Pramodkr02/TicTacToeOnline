import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    await resetPassword(email);
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <h1 className="text-xl font-semibold mb-2">Reset password</h1>
        <p className="text-sm text-slate-400 mb-6">Enter your email to receive reset instructions.</p>
        {sent ? (
          <div className="text-sm text-green-400">If an account exists, a reset email has been sent.</div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <input className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
            <button className="w-full py-2 rounded-md bg-primary-600 hover:bg-primary-500">Send reset link</button>
          </form>
        )}
        <div className="text-sm mt-4">
          <Link className="text-primary-400 hover:text-primary-300" to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
