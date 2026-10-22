'use client';

import { useSyncExternalStore } from 'react';
import { createSeed, DB_VERSION } from './seed';
import type { Db } from './types';

const KEY = 'autohub.db';
const SERVER_SNAPSHOT: Db = createSeed();

let db: Db = SERVER_SNAPSHOT;
let loaded = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

/** Stored data (this tab's earlier session, or another tab's write) is only trusted when it matches the current schema. */
function isDb(x: unknown): x is Db {
  const d = x as Partial<Db> | null;
  return !!d && d.version === DB_VERSION && Object.keys(SERVER_SNAPSHOT).every((k) => Array.isArray((SERVER_SNAPSHOT as unknown as Record<string, unknown>)[k]) ? Array.isArray((d as Record<string, unknown>)[k]) : true);
}

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isDb(parsed)) {
        db = parsed;
        emit();
      }
    }
  } catch {
    /* storage unavailable or corrupted: fall back to seed */
  }
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* ignore quota / private mode */
  }
}

function subscribe(l: () => void) {
  listeners.add(l);
  load();
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY && e.newValue) {
      try {
        const next: unknown = JSON.parse(e.newValue);
        if (isDb(next)) {
          db = next;
          emit();
        }
      } catch {
        /* ignore */
      }
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener('storage', onStorage);
  };
}

/** Subscribe to the whole database. Pages should read through role-scoped selectors in lib/access.ts. */
export function useDb(): Db {
  return useSyncExternalStore(subscribe, () => db, () => SERVER_SNAPSHOT);
}

export function getDb(): Db {
  return db;
}

/** Apply a mutation on a copy of the database, then persist and notify subscribers. */
export function mutate(fn: (draft: Db) => void) {
  const next = structuredClone(db);
  fn(next);
  db = next;
  persist();
  emit();
}

export function resetDb() {
  db = createSeed();
  persist();
  emit();
}
