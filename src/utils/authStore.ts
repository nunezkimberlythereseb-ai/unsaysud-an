import type { AuthUser, StallOwnerAccount } from '../types';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  owner: StallOwnerAccount | null;
}

let state: AuthState = {
  token: null,
  user: null,
  owner: null
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

export function setAuthSession(params: {
  token: string;
  user?: AuthUser | null;
  owner?: StallOwnerAccount | null;
}) {
  state = {
    token: params.token,
    user: params.user || state.user,
    owner: params.owner || null
  };
  notify();
}

export function clearAuthSession() {
  state = {
    token: null,
    user: null,
    owner: null
  };
  notify();
}

export function getAuthToken(): string | null {
  return state.token;
}

export function getAuthUser(): AuthUser | null {
  return state.user;
}

export function getAuthOwner(): StallOwnerAccount | null {
  return state.owner;
}

export function getAuthHeaders(): Record<string, string> {
  if (!state.token) return {};
  return { Authorization: `Bearer ${state.token}` };
}

export function subscribeAuth(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
