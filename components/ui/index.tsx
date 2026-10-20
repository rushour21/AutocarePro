'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Tone } from '@/lib/format';

export const cn = clsx;

/* ------------------------------------------------------------------ surfaces */
export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('neu', className)} {...rest}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ buttons */
type BtnProps = {
  variant?: 'coral' | 'dark' | 'soft' | 'neu' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'>;

const VARIANT = { coral: 'btn-coral', dark: 'btn-dark', soft: 'btn-soft', neu: 'btn-neu', blue: 'btn-blue-soft' } as const;
const SIZE = { sm: 'h-9 px-4 text-[13px]', md: 'h-11 px-5 text-sm', lg: 'h-12 px-6 text-[15px]' } as const;

export function Button({ variant = 'coral', size = 'md', href, className, children, ...rest }: BtnProps) {
  const cls = cn('btn', VARIANT[variant], SIZE[size], className);
  if (href && !rest.disabled) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}
export const PrimaryButton = (p: Omit<BtnProps, 'variant'>) => <Button variant="coral" {...p} />;
export const SecondaryButton = (p: Omit<BtnProps, 'variant'>) => <Button variant="neu" {...p} />;

export function IconButton({ className, children, dot, label, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { dot?: boolean; label: string }) {
  return (
    <button type="button" aria-label={label} title={label} className={cn('btn btn-neu relative h-10 w-10 !rounded-full', className)} {...rest}>
      {children}
      {dot && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-coral-500 ring-2 ring-white" />}
    </button>
  );
}

/* ------------------------------------------------------------------ badges */
const TONE: Record<Tone, string> = {
  green: 'bg-ok-soft text-ok-strong',
  amber: 'bg-warn-soft text-warn-strong',
  red: 'bg-bad-soft text-bad-strong',
  blue: 'bg-info-soft text-info-strong',
  violet: 'bg-violet-soft text-violet-strong',
  gray: 'bg-[#ece5dc] text-ink-500',
  coral: 'bg-coral-100 text-coral-600',
};
const TONE_DOT: Record<Tone, string> = {
  green: 'border-ok', amber: 'border-warn', red: 'border-bad', blue: 'border-info', violet: 'border-violet', gray: 'border-ink-300', coral: 'border-coral-500',
};

export function StatusBadge({ tone, children, dot, className, size = 'md' }: { tone: Tone; children: React.ReactNode; dot?: boolean; className?: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl font-medium shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : size === 'lg' ? 'px-3.5 py-1.5 text-sm' : 'px-2.5 py-1 text-xs',
        TONE[tone],
        className,
      )}
    >
      {dot && <span className={cn('h-2.5 w-2.5 rounded-full border-[2.5px] bg-transparent', TONE_DOT[tone])} />}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ avatar */
export function Avatar({ src, name, size = 36, className }: { src?: string; name?: string; size?: number; className?: string }) {
  if (!src) {
    const initials = (name ?? '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
    return (
      <span
        aria-label={name}
        className={cn('flex shrink-0 items-center justify-center rounded-full bg-coral-100 font-bold text-coral-600 shadow-neu-xs ring-2 ring-white', className)}
        style={{ width: size, height: size, fontSize: Math.max(10, size * 0.38) }}
      >
        {initials}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name ?? ''}
      width={size}
      height={size}
      className={cn('shrink-0 rounded-full bg-ivory-200 object-cover shadow-neu-xs ring-2 ring-white', className)}
      style={{ width: size, height: size }}
    />
  );
}

/* ------------------------------------------------------------------ toggle / progress */
export function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60',
        checked ? 'bg-gradient-to-b from-coral-400 to-coral-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]' : 'neu-in-sm !rounded-full',
      )}
    >
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
    </button>
  );
}

export function ProgressBar({ value, tone = 'green', className, label }: { value: number; tone?: 'green' | 'coral' | 'gray'; className?: string; label?: React.ReactNode }) {
  const fill = tone === 'green' ? 'from-[#2fcf8a] to-[#18a56a]' : tone === 'coral' ? 'from-[#ff9a5e] to-[#f25a1f]' : 'from-[#bdb6ab] to-[#a29a8d]';
  return (
    <div className={cn('relative h-2.5 w-full overflow-hidden rounded-full neu-in-sm !rounded-full', className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full bg-gradient-to-b', fill)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      {label && <span className="absolute inset-0 flex items-center pl-2 text-[8px] font-semibold leading-none text-white">{label}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ tabs */
export interface TabDef<T extends string = string> {
  value: T;
  label: string;
  count?: number;
  /** keeps the dark pill look even when not selected (the "All" chip in My Jobs) */
  emphasis?: boolean;
}

export function FilterTabs<T extends string>({
  tabs, value, onChange, variant = 'dark', className, size = 'md',
}: {
  tabs: TabDef<T>[]; value: T; onChange: (v: T) => void; variant?: 'dark' | 'coral' | 'soft' | 'underline'; className?: string; size?: 'sm' | 'md';
}) {
  if (variant === 'soft') {
    return (
      <div role="tablist" className={cn('thin-scroll inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl p-1.5 neu-in-sm', className)}>
        {tabs.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={value === t.value}
            onClick={() => onChange(t.value)}
            className={cn('relative whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition sm:px-5', value === t.value ? 'tab-soft-active' : 'text-ink-500 hover:text-ink')}
          >
            {t.label}
            {t.count !== undefined && ` (${t.count})`}
            {value === t.value && <span className="absolute bottom-1 left-1/2 h-[2px] w-7 -translate-x-1/2 rounded-full bg-coral-500" />}
          </button>
        ))}
      </div>
    );
  }
  if (variant === 'underline') {
    return (
      <div role="tablist" className={cn('flex items-center gap-1 overflow-x-auto scrollbar-none', className)}>
        {tabs.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={value === t.value}
            onClick={() => onChange(t.value)}
            className={cn('relative whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-medium transition', value === t.value ? 'tab-soft-active text-ink' : 'text-ink-500 hover:text-ink')}
          >
            {t.label}
            {value === t.value && <span className="absolute bottom-1 left-5 right-5 h-[2px] rounded-full bg-coral-500" />}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div role="tablist" className={cn('flex flex-wrap items-center gap-2.5', className)}>
      {tabs.map((t) => {
        const selected = value === t.value;
        const style = t.emphasis ? 'tab-dark' : selected ? (variant === 'coral' ? 'tab-coral' : 'tab-dark') : 'tab-idle';
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(t.value)}
            className={cn('whitespace-nowrap rounded-xl font-medium transition', size === 'sm' ? 'px-4 py-2 text-[13px]' : 'px-5 py-2.5 text-sm', style)}
          >
            {t.label}
            {t.count !== undefined && ` (${t.count})`}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ inputs */
export function SearchInput({ value, onChange, placeholder = 'Search…', className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <label className={cn('neu-in flex h-12 items-center gap-3 !rounded-2xl px-4 text-ink-400', className)}>
      <Search className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-300"
      />
      {value && (
        <button type="button" aria-label="Clear search" onClick={() => onChange('')} className="rounded-full p-0.5 text-ink-400 hover:text-ink">
          <X className="h-4 w-4" />
        </button>
      )}
    </label>
  );
}

export function Field({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-xs font-medium text-ink-500">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-bad">{error}</span>}
    </label>
  );
}

export const Input = ({ className, ...p }: React.InputHTMLAttributes<HTMLInputElement>) => <input className={cn('field', className)} {...p} />;

export const Textarea = ({ className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cn('field h-auto min-h-[88px] resize-none py-3', className)} {...p} />
);

export function Select({ className, children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn('relative', className)}>
      <select className="field appearance-none pr-10" {...p}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
    </div>
  );
}

export function Checkbox({ checked, onChange, label, disabled }: { checked: boolean; onChange?: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-60',
        checked ? 'bg-gradient-to-b from-[#2fcf8a] to-[#17a368] text-white shadow-[0_3px_8px_rgba(29,157,101,0.35)]' : 'neu-in-sm !rounded-lg',
      )}
    >
      {checked && <Check className="h-4 w-4" strokeWidth={3} />}
    </button>
  );
}

/* ------------------------------------------------------------------ modal */
export function Modal({ open, onClose, title, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open || !mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#2a2118]/35 p-0 backdrop-blur-[3px] sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
        className={cn('neu slide-up flex max-h-[92vh] w-full flex-col outline-none !rounded-b-none sm:!rounded-b-[22px]', size === 'sm' ? 'sm:max-w-md' : size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-xl')}
      >
        <div className="flex items-center justify-between px-6 pb-3 pt-5">
          <h2 id={id} className="text-lg font-bold">
            {title}
          </h2>
          <button type="button" aria-label="Close" onClick={onClose} className="btn btn-neu h-9 w-9 !rounded-full">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="thin-scroll overflow-y-auto px-6 pb-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-ivory-300/70 px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel?: string; danger?: boolean }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="neu" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={danger ? 'dark' : 'coral'} onClick={() => { onConfirm(); onClose(); }}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-6 text-ink-600">{message}</p>
    </Modal>
  );
}

/* ------------------------------------------------------------------ states */
export function EmptyState({ icon, title, text, action }: { icon?: React.ReactNode; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon && <span className="neu-in mb-4 flex h-16 w-16 items-center justify-center !rounded-full text-coral-500">{icon}</span>}
      <p className="text-base font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-ink-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingState({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-16 w-full" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ stat cards */
export function StatCard({
  icon, tone = 'coral', label, value, sub, subTone, variant = 'inline', href, className,
}: {
  icon: React.ReactNode; tone?: 'coral' | 'blue' | 'green' | 'amber' | 'red' | 'violet'; label: string; value: React.ReactNode; sub?: React.ReactNode; subTone?: 'green' | 'red' | 'amber' | 'gray'; variant?: 'inline' | 'stacked'; href?: string; className?: string;
}) {
  const ring = { coral: 'bg-coral-100 text-coral-500', blue: 'bg-info-soft text-info', green: 'bg-ok-soft text-ok', amber: 'bg-warn-soft text-warn', red: 'bg-bad-soft text-bad', violet: 'bg-violet-soft text-violet' }[tone];
  const subCls = { green: 'text-ok', red: 'text-bad', amber: 'text-coral-500', gray: 'text-ink-400' }[subTone ?? 'gray'];
  const inner =
    variant === 'inline' ? (
      <>
        <div className="flex items-center gap-2.5">
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-white/70', ring)}>{icon}</span>
          <span className="text-sm text-ink-600">{label}</span>
          {href && <ChevronRight className="ml-auto h-4 w-4 text-ink-300" />}
        </div>
        <p className="mt-3 pl-1 text-[32px] font-bold leading-none tracking-tight">{value}</p>
        {sub && <p className={cn('mt-2 pl-1 text-xs font-medium', subCls)}>{sub}</p>}
      </>
    ) : (
      <>
        <span className={cn('flex h-12 w-12 items-center justify-center rounded-full ring-[6px] ring-white/70', ring)}>{icon}</span>
        <p className="mt-4 text-[28px] font-bold leading-none tracking-tight">{value}</p>
        <p className="mt-1.5 flex items-center gap-1 text-sm text-ink-500">
          {label}
          {href && <ChevronRight className="h-3.5 w-3.5" />}
        </p>
      </>
    );
  const cls = cn('neu block p-5', href && 'transition hover:-translate-y-0.5', className);
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/* ------------------------------------------------------------------ page header */
export function PageHeader({ title, subtitle, actions, back, className }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; back?: { href: string; label: string }; className?: string }) {
  return (
    <div className={cn('mb-5', className)}>
      {back && (
        <Link href={back.href} className="btn btn-neu mb-3 h-10 gap-2 px-4 text-sm">
          <ChevronLeft className="h-4 w-4" /> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ vehicle image */
export function VehicleImage({ carKey, className, alt = '' }: { carKey: string; className?: string; alt?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/assets/cars/${carKey}.png`} alt={alt} className={cn('blend-multiply select-none object-contain', className)} draggable={false} />
  );
}

/* ------------------------------------------------------------------ data table */
export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  headClassName?: string;
}

export function DataTable<T>({
  columns, rows, rowKey, onRowClick, pageSize, empty, className, dense,
}: {
  columns: Column<T>[]; rows: T[]; rowKey: (r: T) => string; onRowClick?: (r: T) => void; pageSize?: number; empty?: React.ReactNode; className?: string; dense?: boolean;
}) {
  const [page, setPage] = useState(0);
  const pages = pageSize ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;
  const cur = Math.min(page, pages - 1);
  const shown = pageSize ? rows.slice(cur * pageSize, cur * pageSize + pageSize) : rows;
  if (rows.length === 0) return <>{empty ?? <EmptyState title="Nothing here yet" />}</>;
  return (
    <div className={className}>
      <div className="thin-scroll overflow-x-auto">
        <table className="w-full min-w-[560px] border-separate border-spacing-y-1.5 text-left text-sm">
          <thead>
            <tr className="text-[12px] font-medium text-ink-400">
              {columns.map((c) => (
                <th key={c.key} className={cn('px-4 pb-1.5 pt-1 font-medium', c.headClassName)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr
                key={rowKey(r)}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={cn('group bg-white/45 transition', onRowClick && 'cursor-pointer hover:bg-white/80')}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(r) : undefined}
              >
                {columns.map((c, i) => (
                  <td key={c.key} className={cn(dense ? 'py-2' : 'py-3', 'px-4 text-ink-700', i === 0 && 'rounded-l-2xl', i === columns.length - 1 && 'rounded-r-2xl', c.className)}>
                    {c.cell(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pageSize && pages > 1 && (
        <div className="mt-3 flex items-center justify-between px-2 text-xs text-ink-500">
          <span>
            {cur * pageSize + 1}–{Math.min(rows.length, cur * pageSize + pageSize)} of {rows.length}
          </span>
          <div className="flex gap-2">
            <button aria-label="Previous page" disabled={cur === 0} onClick={() => setPage(cur - 1)} className="btn btn-neu h-8 w-8 !rounded-full">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button aria-label="Next page" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} className="btn btn-neu h-8 w-8 !rounded-full">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ toast */
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = (m: string) => {
    setMsg(m);
    clearTimeout(t.current);
    t.current = setTimeout(() => setMsg(null), 2600);
  };
  const node = msg ? (
    <div role="status" className="slide-up fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-2xl bg-ink px-5 py-3 text-sm font-medium text-white shadow-dark">
      {msg}
    </div>
  ) : null;
  return { show, node };
}
