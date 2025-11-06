/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { getSession, authenticateEmail as nakamaAuthEmail, logout as nakamaLogout, rpc } from '../services/nakama';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getSession());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setSession(getSession());
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setError('');
      setLoading(true);
      const newSession = await nakamaAuthEmail(email, password);
      setSession(newSession);
      return newSession;
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || 'Failed to login');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password) => {
    try {
        setError('');
        setLoading(true);
        const newSession = await nakamaAuthEmail(email, password, true);
        await rpc("register", { email: email });
        setSession(newSession);
        return newSession;
    } catch (error) {
        console.error("Registration error:", error);
        setError(error.message || 'Failed to register');
        throw error;
    } finally {
        setLoading(false);
    }
  };

  const logout = () => {
    nakamaLogout();
    setSession(null);
  };

  const value = {
    session,
    loading,
    error,
    isAuthenticated: !!session,
    currentUser: session?.user,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}