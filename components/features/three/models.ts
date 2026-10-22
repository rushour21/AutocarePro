import { useEffect, useState } from 'react';

export interface ModelEntry {
  url: string;
  /** degrees; the model's front must point along +Z after this rotation */
  rotY?: number;
  /** multiplier on top of the automatic fit-to-length */
  scale?: number;
}

let manifest: Promise<Record<string, ModelEntry>> | null = null;

/** public/models/manifest.json maps a vehicle picture key to an optional .glb. Missing or invalid: no overrides. */
export function loadModelManifest(): Promise<Record<string, ModelEntry>> {
  manifest ??= fetch('/models/manifest.json')
    .then((r) => (r.ok ? r.json() : {}))
    .then((j: { cars?: Record<string, string | ModelEntry> }) => {
      const out: Record<string, ModelEntry> = {};
      Object.entries(j.cars ?? {}).forEach(([k, v]) => {
        const e = typeof v === 'string' ? { url: v } : v;
        if (e && typeof e.url === 'string' && e.url.endsWith('.glb')) out[k] = e;
      });
      return out;
    })
    .catch(() => ({}));
  return manifest;
}

export function useCarModel(carKey: string): ModelEntry | undefined {
  const [entry, setEntry] = useState<ModelEntry | undefined>();
  useEffect(() => {
    let live = true;
    loadModelManifest().then((m) => live && setEntry(m[carKey]));
    return () => {
      live = false;
    };
  }, [carKey]);
  return entry;
}
