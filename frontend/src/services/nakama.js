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
