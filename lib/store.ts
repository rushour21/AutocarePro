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

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Db;
      if (parsed.version === DB_VERSION) {
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
        db = JSON.parse(e.newValue) as Db;
        emit();
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
