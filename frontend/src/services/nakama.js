// Test comment to check write permissions.
// src/services/nakama.js
import * as nakama from "@heroiclabs/nakama-js";

const client = new nakama.Client(
  import.meta.env.VITE_NAKAMA_KEY,
  import.meta.env.VITE_NAKAMA_HOST,
  Number(import.meta.env.VITE_NAKAMA_PORT),
  import.meta.env.VITE_NAKAMA_SSL === "true"
);

let session = null;
let socket = null;

// Restore session from localStorage
const savedSession = localStorage.getItem("nakama_session");
if (savedSession) {
  try {
    const parsedSession = JSON.parse(savedSession);
    // Optional: Add a check to see if the token is expired
    if (parsedSession && parsedSession.token) {
        session = parsedSession;
    }
  } catch (e) {
    console.error("Could not parse saved session:", e);
    localStorage.removeItem("nakama_session");
  }
}

export async function authenticateEmail(email, password, create = false) {
  const result = await client.authenticateEmail({
    email,
    password,
    create,
  });
  session = result;
  localStorage.setItem("nakama_session", JSON.stringify(session));
  return session;
}

export async function rpc(name, payload = {}) {
  if (!session) throw new Error("Not authenticated");
  return client.rpc(session, name, payload);
}

export async function connectSocket(onMatchData, onNotification) {
  if (!session) throw new Error("Not authenticated");

  if (socket && socket.isConnected) return socket;
  socket = client.createSocket(import.meta.env.VITE_NAKAMA_SSL === "true");

  socket.onmatchdata = (matchdata) => {
    if (onMatchData) {
      onMatchData(matchdata);
    }
  };

  socket.onnotification = (notification) => {
    if (onNotification) onNotification(notification);
  };

  await socket.connect(session);
  return socket;
}

export function socketJoinMatch(matchId) {
  if (!socket || !socket.isConnected) throw new Error("Socket not connected");
  return socket.send({ match_join: { match_id: matchId } });
}

export function socketSendMatchState(matchId, opCode, data) {
  if (!socket || !socket.isConnected) throw new Error("Socket not connected");
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  const bytes = new TextEncoder().encode(payload);
  return socket.sendMatchData(matchId, opCode, bytes);
}

export async function logout() {
  if (session) {
    try {
      await client.sessionLogout(session);
    } catch (error) {
      console.error("Session logout failed:", error);
      // Even if logout fails, clear local state
    }
  }
  session = null;
  if(socket) {
    socket.disconnect();
    socket = null;
  }
  localStorage.removeItem("nakama_session");
}

export function getSession() {
    return session;
}
