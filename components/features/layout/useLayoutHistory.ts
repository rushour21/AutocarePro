import { useCallback, useRef, useState } from 'react';
import { sameLayout } from '@/lib/layout';
import type { WorkshopLayout } from '@/lib/types';

/**
 * Editing state for the layout editor with undo / redo. While a drag is in flight (`commit` false) only the
 * present value changes; the pre-drag layout is remembered and becomes ONE undo step when the drag ends.
 */
export function useLayoutHistory(initial: WorkshopLayout) {
  const [s, setS] = useState<{ past: WorkshopLayout[]; present: WorkshopLayout; future: WorkshopLayout[] }>({ past: [], present: initial, future: [] });
  const present = useRef(initial);
  const anchor = useRef<WorkshopLayout | null>(null);

  const set = useCallback((next: WorkshopLayout, commit = true) => {
    if (!commit) {
      if (!anchor.current) anchor.current = present.current;
      present.current = next;
      setS((c) => ({ ...c, present: next }));
      return;
    }
    const before = anchor.current ?? present.current;
    anchor.current = null;
    present.current = next;
    setS((c) => (sameLayout(before, next) ? { ...c, present: next } : { past: [...c.past.slice(-99), before], present: next, future: [] }));
  }, []);
  const undo = useCallback(() => {
    setS((c) => {
      const prev = c.past[c.past.length - 1];
      if (!prev) return c;
      present.current = prev;
      return { past: c.past.slice(0, -1), present: prev, future: [c.present, ...c.future] };
    });
  }, []);
  const redo = useCallback(() => {
    setS((c) => {
      const next = c.future[0];
      if (!next) return c;
      present.current = next;
      return { past: [...c.past, c.present], present: next, future: c.future.slice(1) };
    });
  }, []);
  const reset = useCallback((l: WorkshopLayout) => {
    anchor.current = null;
    present.current = l;
    setS({ past: [], present: l, future: [] });
  }, []);

  return { layout: s.present, set, undo, redo, reset, canUndo: s.past.length > 0, canRedo: s.future.length > 0 };
}
