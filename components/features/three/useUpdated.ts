import { useEffect, useRef, useState } from 'react';

/**
 * "Updated 12s ago" for live panels. This build keeps data in the browser, so the time is when this page last
 * saw the watched data change (jobs, bays, layout), not a server timestamp.
 */
export function useUpdated(...deps: unknown[]) {
  const at = useRef(Date.now());
  const first = useRef(true);
  const [, tick] = useState(0);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    at.current = Date.now();
    tick((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 10000);
    return () => clearInterval(t);
  }, []);
  const s = Math.max(0, Math.round((Date.now() - at.current) / 1000));
  return s < 10 ? 'Updated just now' : s < 60 ? `Updated ${s}s ago` : `Updated ${Math.floor(s / 60)} min ago`;
}
