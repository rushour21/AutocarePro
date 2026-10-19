'use client';

import { useSyncExternalStore } from 'react';
import { getDb, useDb } from './store';
import type { Role, User } from './types';

const KEY = 'autohub.session';
const listeners = new Set<() => void>();
let current: string | null = null;
let loaded = false;

const emit = () => listeners.forEach((l) => l());

let started = false;

function load() {
  if (started || typeof window === 'undefined') return;
  started = true;
  try {
    const id = window.localStorage.getItem(KEY);
    if (id) current = id;
  } catch {
    /* ignore */
  }
  loaded = true;
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  load();
  return () => {
    listeners.delete(l);
  };
}

function setCookie(role: Role | null, uid: string | null) {
  // Read by middleware.ts for coarse route protection. Demo-grade only: the cookie is not signed.
  const attrs = 'path=/; SameSite=Lax';
  if (role && uid) {
    document.cookie = `ah_role=${role}; ${attrs}; max-age=${60 * 60 * 24 * 7}`;
    document.cookie = `ah_uid=${uid}; ${attrs}; max-age=${60 * 60 * 24 * 7}`;
  } else {
    document.cookie = `ah_role=; ${attrs}; max-age=0`;
    document.cookie = `ah_uid=; ${attrs}; max-age=0`;
  }
}

export const homeFor = (role: Role) => (role === 'admin' ? '/admin' : role === 'technician' ? '/employee' : '/customer');

export function login(email: string, password: string): { ok: true; user: User } | { ok: false; error: string } {
  const user = getDb().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.password !== password) return { ok: false, error: 'Incorrect email or password.' };
  current = user.id;
  try {
    window.localStorage.setItem(KEY, user.id);
  } catch {
    /* ignore */
  }
  setCookie(user.role, user.id);
  emit();
  return { ok: true, user };
}

export function logout() {
  current = null;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  setCookie(null, null);
  emit();
}

/** Current signed-in user (null when signed out) plus whether the stored session has been read yet. */
export function useSession(): { user: User | null; ready: boolean } {
  const db = useDb();
  const id = useSyncExternalStore(subscribe, () => current, () => null);
  const ready = useSyncExternalStore(subscribe, () => loaded, () => false);
  const user = id ? db.users.find((u) => u.id === id) ?? null : null;
  return { user, ready };
}
