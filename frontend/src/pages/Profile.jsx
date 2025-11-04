import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

export default function Profile() {
  const { currentUser, nakamaClient, session } = useAuth();
  const [username, setUsername] = useState(currentUser?.username || '');
  const [saving, setSaving] = useState(false);

  const onSave = async (e) => {
    e.preventDefault();
    if (!username) return;
    setSaving(true);
    try {
      await nakamaClient.updateAccount(session, { username });
      toast.success('Profile updated');
    } catch (e) {
      console.error(e);
      toast.error(e?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-xl font-semibold mb-4">Edit Profile</h1>
        <form onSubmit={onSave} className="space-y-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Username</label>
            <input value={username} onChange={e=>setUsername(e.target.value)} className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <button disabled={saving} className="w-full py-2 rounded-md bg-primary-600 hover:bg-primary-500 disabled:opacity-60">{saving? 'Saving...' : 'Save Changes'}</button>
        </form>
      </motion.div>
    </div>
  );
}
