import { Client } from '@heroiclabs/nakama-js';

const host = import.meta.env.VITE_NAKAMA_HOST || 'localhost';
const port = import.meta.env.VITE_NAKAMA_PORT || '7350';
const serverKey = import.meta.env.VITE_NAKAMA_KEY || 'defaultkey';
const useSSL = (import.meta.env.VITE_NAKAMA_SSL || 'false') === 'true';

let client;

export function getClient() {
  if (!client) {
    client = new Client(serverKey, host, port);
    client.ssl = useSSL;
  }
  return client;
}

export function restoreSessionFromStorage() {
  const token = localStorage.getItem('nakama_session');
  const refresh = localStorage.getItem('nakama_refresh');
  if (!token || !refresh) return null;
  try {
    const c = getClient();
    return c.session(token, refresh);
  } catch {
    return null;
  }
}

export function storeSession(session) {
  localStorage.setItem('nakama_session', session.token);
  localStorage.setItem('nakama_refresh', session.refresh_token);
  localStorage.setItem('nakama_user_id', session.user_id);
}

export function clearStoredSession() {
  localStorage.removeItem('nakama_session');
  localStorage.removeItem('nakama_refresh');
  localStorage.removeItem('nakama_user_id');
}

export async function createSocket(session) {
  const c = getClient();
  const s = c.createSocket();
  await s.connect(session, useSSL);
  return s;
}

// API Service Layer
export class NakamaService {
  constructor() {
    this.client = getClient();
    this.session = null;
    this.socket = null;
  }

  setSession(session) {
    this.session = session;
  }

  async authenticateEmail(email, password, create = false, username = '') {
    try {
      const session = await this.client.authenticateEmail(email, password, create, username);
      this.setSession(session);
      storeSession(session);
      return session;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  async registerPlayer() {
    if (!this.session) throw new Error('No active session');
    try {
      const result = await this.client.rpc(this.session, 'register_player', {});
      return JSON.parse(result.payload);
    } catch (error) {
      console.error('Register player error:', error);
      throw error;
    }
  }

  async updatePlayerStats(userId, win = false, draw = false, score = 0) {
    if (!this.session) throw new Error('No active session');
    try {
      const payload = { user_id: userId, win, draw, score };
      const result = await this.client.rpc(this.session, 'update_player_stats', payload);
      return JSON.parse(result.payload);
    } catch (error) {
      console.error('Update player stats error:', error);
      throw error;
    }
  }

  async getLeaderboard(limit = 10) {
    if (!this.session) throw new Error('No active session');
    try {
      const payload = { limit };
      const result = await this.client.rpc(this.session, 'get_leaderboard', payload);
      return JSON.parse(result.payload);
    } catch (error) {
      console.error('Get leaderboard error:', error);
      throw error;
    }
  }

  async getAccount() {
    if (!this.session) throw new Error('No active session');
    try {
      const account = await this.client.getAccount(this.session);
      return account;
    } catch (error) {
      console.error('Get account error:', error);
      throw error;
    }
  }

  async createMatch(name, properties = {}) {
    if (!this.session) throw new Error('No active session');
    try {
      const match = await this.client.createMatch(this.session, name, properties);
      return match;
    } catch (error) {
      console.error('Create match error:', error);
      throw error;
    }
  }

  async joinMatch(matchId) {
    if (!this.session) throw new Error('No active session');
    try {
      const match = await this.client.joinMatch(this.session, matchId);
      return match;
    } catch (error) {
      console.error('Join match error:', error);
      throw error;
    }
  }

  async leaveMatch(matchId) {
    if (!this.session) throw new Error('No active session');
    try {
      await this.client.leaveMatch(this.session, matchId);
    } catch (error) {
      console.error('Leave match error:', error);
      throw error;
    }
  }

  async connectSocket() {
    if (!this.session) throw new Error('No active session');
    try {
      this.socket = await createSocket(this.session);
      return this.socket;
    } catch (error) {
      console.error('Connect socket error:', error);
      throw error;
    }
  }

  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Socket event handlers
  onMatchPresence(callback) {
    if (this.socket) {
      this.socket.onmatchpresence = callback;
    }
  }

  onMatchData(callback) {
    if (this.socket) {
      this.socket.onmatchdata = callback;
    }
  }

  sendMatchData(matchId, opCode, data, presences = []) {
    if (!this.socket) throw new Error('Socket not connected');
    try {
      this.socket.sendMatchData(matchId, opCode, JSON.stringify(data), presences);
    } catch (error) {
      console.error('Send match data error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const nakamaService = new NakamaService();
