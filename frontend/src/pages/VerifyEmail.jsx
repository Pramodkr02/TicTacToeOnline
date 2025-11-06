import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { rpc } from '../services/nakama';

export default function VerifyEmail() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const onChange = (idx, val) => {
    if (val.length > 1) return;
    const next = [...otp];
    next[idx] = val.replace(/\D/g, '');
    setOtp(next);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Enter the 6-digit code');
      return;
    }
    if (!email) {
      toast.error('Email not found. Please try registering again.');
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      await rpc('verify_email', { email, otp: code });
      toast.success('Email verified successfully!');
      navigate('/lobby');
    } catch (err) {
      toast.error(err.message || 'Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.35}} className="w-full max-w-sm relative rounded-2xl p-[1px] bg-gradient-to-br from-cyan-400/40 to-fuchsia-500/40">
        <div className="rounded-2xl p-6 bg-slate-900/80 backdrop-blur border border-slate-800">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-primary-300">✉️</div>
          <h1 className="text-2xl font-semibold mb-2">Verify your email</h1>
          <p className="text-sm text-slate-400 mb-6">Enter the 6-digit code we sent to <strong>{email || 'your email'}</strong>.</p>
          <form onSubmit={onSubmit}>
            <div className="flex justify-between gap-2 mb-4">
              {otp.map((v,i)=> (
                <input key={i} value={v} onChange={e=>onChange(i,e.target.value)} inputMode="numeric" maxLength={1} className="w-10 h-12 text-center rounded-md bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              ))}
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="flex-1 py-2 rounded-md bg-primary-600 hover:bg-primary-500 disabled:opacity-60">{loading? 'Verifying...' : 'Verify'}</button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
