import React, { createContext, useContext, useState, useEffect } from 'react';
import { getClient, restoreSessionFromStorage, storeSession, clearStoredSession } from '../services/nakama';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [nakamaClient, setNakamaClient] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const client = getClient();
    setNakamaClient(client);
    const restored = restoreSessionFromStorage();
    const run = async () => {
      try {
        if (restored) {
          const sessionToUse = restored.isexpired(new Date())
            ? await client.sessionRefresh(restored)
            : restored;
          setSession(sessionToUse);
          storeSession(sessionToUse);
          const account = await client.getAccount(sessionToUse);
          setCurrentUser({ id: sessionToUse.user_id, username: account.user.username, email: account.user.email });
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
        clearStoredSession();
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  // Register a new user
  const register = async (email, password, username) => {
    try {
      setError('');
      setLoading(true);
      const client = getClient();
      const newSession = await client.authenticateEmail(email, password, true, username);
      
      setSession(newSession);
      storeSession(newSession);
      
      setCurrentUser({
        id: newSession.user_id,
        username,
        email
      });
      
      // Register player in the backend
      await client.rpc(newSession, "register_player", {});
      
      return newSession;
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message || 'Failed to register');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login with email and password
  const login = async (email, password) => {
    try {
      setError('');
      setLoading(true);
      const client = getClient();
      const newSession = await client.authenticateEmail(email, password);
      
      setSession(newSession);
      localStorage.setItem('nakama_session', newSession.token);
      localStorage.setItem('nakama_refresh', newSession.refresh_token);
      localStorage.setItem('nakama_user_id', newSession.user_id);
      
      // Fetch user account info
      const account = await client.getAccount(newSession);
      setCurrentUser({
        id: newSession.user_id,
        username: account.user.username,
        email: account.user.email
      });
      
      // Register player in the backend (updates last login)
      await client.rpc(newSession, "register_player", {});
      
      return newSession;
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || 'Failed to login');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout the user
  const logout = async () => {
    try {
      setSession(null);
      setCurrentUser(null);
      clearStoredSession();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Reset password (placeholder)
  const resetPassword = async (email) => {
    try {
      setError('');
      setLoading(true);
      console.log(`Password reset requested for ${email}`);
      return true;
    } catch (error) {
      console.error("Password reset error:", error);
      setError(error.message || 'Failed to reset password');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    nakamaClient,
    session,
    loading,
    error,
    isAuthenticated: !!currentUser,
    register,
    login,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}