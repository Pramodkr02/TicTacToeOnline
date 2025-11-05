// src/clients/nakamaClient.js
import * as nakama from "@heroiclabs/nakama-js";

const NAKAMA_HOST = process.env.REACT_APP_NAKAMA_HOST || "127.0.0.1";
const NAKAMA_PORT = process.env.REACT_APP_NAKAMA_PORT || "7350";
const NAKAMA_USE_SSL = (process.env.REACT_APP_NAKAMA_SSL || "false") === "true";
const NAKAMA_KEY = process.env.REACT_APP_NAKAMA_KEY || "defaultkey";

const client = new nakama.Client(
  NAKAMA_KEY,
  NAKAMA_HOST,
  NAKAMA_PORT,
  NAKAMA_USE_SSL
);
let session = null;
let socket = null;

export async function authenticateEmail(email, password, create = false) {
  const result = await client.authenticateEmail({
    email,
    password,
    create,
  });
  session = result;
  return session;
}

export async function authenticateDevice(deviceId) {
  const result = await client.authenticateDevice({
    id: deviceId,
    create: true,
  });
  session = result;
  return session;
}

export function getSession() {
  return session;
}

export async function rpc(name, payload = null) {
  if (!session) throw new Error("Not authenticated");
  const resp = await client.rpc(
    session.token,
    name,
    payload ? JSON.stringify(payload) : null
  );
  if (!resp || !resp.payload) return null;
  return JSON.parse(resp.payload);
}

// Email verification helpers
export async function requestEmailVerification(email) {
  const payload = email ? { email } : {};
  return rpc('request_verification', payload);
}

export async function verifyEmailCode(code) {
  return rpc('verify_code', { code });
}

export async function getVerificationStatus() {
  return rpc('get_verification_status', {});
}

export async function connectSocket(onMatchData = null, onNotification = null) {
  if (!session) throw new Error("Not authenticated");

  if (socket && socket.isConnected()) return socket;
  socket = client.createSocket();

  socket.onmatchdata = (matchId, opCode, data, presences) => {
    if (onMatchData) {
      const parsed = tryParse(data);
      onMatchData({ matchId, opCode, data: parsed, presences });
    }
  };

  socket.onnotification = (notification) => {
    if (onNotification) onNotification(notification);
  };

  await socket.connect(session.token);
  return socket;
}

export function socketJoinMatch(matchId) {
  if (!socket || !socket.isConnected()) throw new Error("Socket not connected");
  return socket.joinMatch(matchId);
}

export function socketLeaveMatch(matchId) {
  if (!socket || !socket.isConnected()) return;
  return socket.leaveMatch(matchId);
}

export function socketSendMatchState(matchId, opCode, data) {
  if (!socket || !socket.isConnected()) throw new Error("Socket not connected");
  const buf = typeof data === "string" ? data : JSON.stringify(data);
  return socket.sendMatchState(matchId, opCode, buf);
}

function tryParse(data) {
  try {
    return JSON.parse(data);
  } catch (e) {
    return data;
  }
}
