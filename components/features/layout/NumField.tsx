'use client';

import { useState } from 'react';
import { Field, Input } from '@/components/ui';
import { r2 } from '@/lib/layout';

/** Number input that commits on blur / Enter and reverts on junk, so half-typed values never reach the layout. */
export function NumField({ label, value, onCommit, suffix = 'm', min, max, disabled }: { label: string; value: number; onCommit: (v: number) => void; suffix?: string; min?: number; max?: number; disabled?: boolean }) {
  const [text, setText] = useState(String(value));
  const [focus, setFocus] = useState(false);
  // while editing show what is being typed; otherwise always mirror the layout value (no effect, so undo/redo is instant)
  const shown = focus ? text : String(value);
  const commit = () => {
    const n = Number(text.replace(',', '.'));
    if (!Number.isFinite(n) || text.trim() === '') return;
    const c = r2(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n)));
    if (c !== value) onCommit(c);
  };
  return (
    <Field label={label}>
      <div className="relative">
        <Input
          inputMode="decimal"
          aria-label={label}
          value={shown}
          disabled={disabled}
          onFocus={() => { setText(String(value)); setFocus(true); }}
          onBlur={() => { setFocus(false); commit(); }}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          className="!h-10 pr-8 text-sm"
        />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-400">{suffix}</span>}
      </div>
    </Field>
  );
}
