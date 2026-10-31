'use client';

import clsx from 'clsx';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Children, isValidElement, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface Opt {
  value: string;
  label: string;
  disabled: boolean;
}

const nodeText = (n: React.ReactNode): string =>
  Children.toArray(n)
    .map((c) => (isValidElement(c) ? nodeText((c.props as { children?: React.ReactNode }).children) : String(c)))
    .join('');

// Reads plain <option> children so call sites stay identical to a native select.
function readOptions(children: React.ReactNode): Opt[] {
  return Children.toArray(children).flatMap((c) => {
    if (!isValidElement(c)) return [];
    const p = c.props as React.OptionHTMLAttributes<HTMLOptionElement>;
    if (c.type !== 'option') return readOptions(p.children);
    const label = p.label ?? nodeText(p.children);
    return [{ value: String(p.value ?? label), label, disabled: !!p.disabled }];
  });
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  /** the search field shows by default; pass false to hide it */
  searchable?: boolean;
};

export function Select({ className, children, value, defaultValue, onChange, disabled, id, name, searchable = true, 'aria-label': ariaLabel }: SelectProps) {
  const options = useMemo(() => readOptions(children), [children]);
  const [internal, setInternal] = useState(String(defaultValue ?? ''));
  const current = value !== undefined ? String(value) : internal;
  const selected = options.find((o) => o.value === current) ?? options[0];

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ style: React.CSSProperties; sheet: boolean; up: boolean } | null>(null);
  const uid = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const viaKeyboard = useRef(false);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const place = useCallback(() => {
    const t = triggerRef.current;
    if (!t) return;
    const r = t.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (vw < 640) {
      // keeps the sheet above the on-screen keyboard
      const vv = window.visualViewport;
      const bottom = vv ? Math.max(vh - vv.height - vv.offsetTop, 0) : 0;
      setPos({ sheet: true, up: false, style: { bottom, maxHeight: Math.min((vv?.height ?? vh) - 48, vh * 0.72) } });
      return;
    }
    const width = Math.max(r.width, 240);
    const below = vh - r.bottom - 14;
    const above = r.top - 14;
    const up = below < 260 && above > below;
    setPos({
      sheet: false,
      up,
      style: { left: Math.min(Math.max(r.left, 8), vw - width - 8), width, maxHeight: Math.min(360, Math.max(up ? above : below, 170)), ...(up ? { bottom: vh - r.top + 6 } : { top: r.bottom + 6 }) },
    });
  }, []);

  const show = (seed = '') => {
    if (disabled) return;
    setQuery(seed);
    setActive(seed ? 0 : Math.max(options.indexOf(selected), 0));
    place();
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };
  const commit = (o: Opt) => {
    if (o.disabled) return;
    setInternal(o.value);
    if (o.value !== current) onChange?.({ target: { value: o.value }, currentTarget: { value: o.value } } as React.ChangeEvent<HTMLSelectElement>);
    close();
  };

  useEffect(() => {
    if (!open) return;
    const touch = window.matchMedia('(pointer: coarse)').matches;
    // the keyboard should not jump up on touch until the search field is tapped
    (searchable && !touch ? inputRef.current : listRef.current)?.focus({ preventScroll: true });
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'center' });
    const onDown = (e: PointerEvent) => {
      const n = e.target as Node;
      if (!panelRef.current?.contains(n) && !triggerRef.current?.contains(n)) close(false);
    };
    const onScroll = (e: Event) => {
      if (!panelRef.current?.contains(e.target as Node)) place();
    };
    const vv = window.visualViewport;
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', place);
    vv?.addEventListener('resize', place);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', place);
      vv?.removeEventListener('resize', place);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, searchable, place]);

  useEffect(() => {
    if (!open || !viaKeyboard.current) return;
    document.getElementById(`${uid}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open, uid]);

  const move = (dir: 1 | -1) => {
    if (!shown.length) return;
    viaKeyboard.current = true;
    let next = active;
    for (let i = 0; i < shown.length; i++) {
      next = (next + dir + shown.length) % shown.length;
      if (!shown[next].disabled) break;
    }
    setActive(next);
  };

  const onPanelKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); if (shown[active]) commit(shown[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === 'Tab') close(false);
  };

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (open) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); show(); }
    else if (searchable && e.key.length === 1 && e.key !== ' ' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); show(e.key); }
  };

  const panel = open && pos && (
    <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onKeyDown={onPanelKey}>
      {pos.sheet && <div className="scrim-in fixed inset-0 z-[70] bg-[#1d2129]/30" aria-hidden />}
      <div
        ref={panelRef}
        style={pos.style}
        className={clsx('glass fixed z-[71] flex flex-col overflow-hidden', pos.sheet ? 'sheet-in inset-x-0 rounded-t-[28px] pb-[env(safe-area-inset-bottom)]' : clsx('menu-in rounded-2xl', pos.up ? 'origin-bottom' : 'origin-top'))}
      >
        {pos.sheet && <span className="mx-auto mt-2 h-[5px] w-9 shrink-0 rounded-full bg-ink-300/70" aria-hidden />}
        {searchable && (
          <label className={clsx('search-field m-2 flex shrink-0 items-center gap-2 px-3', pos.sheet ? 'h-11' : 'h-9')}>
            <Search className="h-4 w-4 shrink-0 text-ink-400" strokeWidth={2} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0); viaKeyboard.current = true; }}
              placeholder="Search"
              role="combobox"
              aria-expanded
              aria-controls={`${uid}-list`}
              aria-activedescendant={shown[active] ? `${uid}-${active}` : undefined}
              aria-autocomplete="list"
              aria-label={`Search ${ariaLabel ?? 'options'}`}
              className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-400 sm:text-sm"
            />
          </label>
        )}
        <ul ref={listRef} id={`${uid}-list`} role="listbox" tabIndex={-1} aria-label={ariaLabel} className={clsx('thin-scroll flex-1 overflow-y-auto overscroll-contain px-1.5 pb-1.5 outline-none', !searchable && 'pt-1.5')}>
          {shown.map((o, i) => (
            <li
              key={`${o.value}-${i}`}
              id={`${uid}-${i}`}
              role="option"
              aria-selected={o.value === selected?.value}
              aria-disabled={o.disabled || undefined}
              onMouseMove={() => { viaKeyboard.current = false; if (!o.disabled && active !== i) setActive(i); }}
              onClick={() => commit(o)}
              className={clsx(
                'flex cursor-default select-none items-center gap-2 rounded-[10px] px-2.5 py-2 text-sm',
                pos.sheet && 'py-3 text-[15px]',
                o.disabled ? 'text-ink-300' : i === active ? 'bg-coral-500 text-white' : 'text-ink',
              )}
            >
              <Check className={clsx('h-3.5 w-3.5 shrink-0', o.value !== selected?.value && 'invisible')} strokeWidth={3} />
              <span className="min-w-0 flex-1 truncate">{o.label}</span>
            </li>
          ))}
          {shown.length === 0 && <li className="px-3 py-6 text-center text-sm text-ink-500">No results for “{query.trim()}”</li>}
        </ul>
      </div>
    </div>
  );

  return (
    <div className={clsx('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? close() : show())}
        onKeyDown={onTriggerKey}
        className="field flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={clsx('min-w-0 flex-1 truncate', !selected?.value && 'text-ink-400')}>{selected?.label}</span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-ink-400" strokeWidth={2.2} />
      </button>
      {name && <input type="hidden" name={name} value={current} />}
      {panel && createPortal(panel, document.fullscreenElement ?? document.body)}
    </div>
  );
}
