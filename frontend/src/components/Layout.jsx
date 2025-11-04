import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/register');
  };

  const navLink = 'px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800';
  const active = 'bg-slate-800';

  const toggleTheme = () => {
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    if (isDark) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500" />
            <span className="font-semibold">Nakama Arena</span>
          </div>
          <nav className="flex items-center gap-2">
            <NavLink to="/dashboard" className={({isActive}) => `${navLink} ${isActive?active:''}`}>Dashboard</NavLink>
            <NavLink to="/matchmaking" className={({isActive}) => `${navLink} ${isActive?active:''}`}>Matchmaking</NavLink>
            <NavLink to="/leaderboard" className={({isActive}) => `${navLink} ${isActive?active:''}`}>Leaderboard</NavLink>
            <NavLink to="/docs" className={({isActive}) => `${navLink} ${isActive?active:''}`}>Docs</NavLink>
            <NavLink to="/profile" className={({isActive}) => `${navLink} ${isActive?active:''}`}>Profile</NavLink>
            <button onClick={toggleTheme} aria-label="Toggle theme" className="ml-2 px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-sm">Theme</button>
            <button onClick={handleLogout} className="ml-2 px-3 py-2 rounded-md bg-primary-600 hover:bg-primary-500 text-sm">Logout</button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-400">© 2025 Nakama Arena</footer>
    </div>
  );
}
