'use client';

import clsx from 'clsx';
import { estimateTotals, inr } from '@/lib/format';
import type { EstimateItem } from '@/lib/types';

/** Line-item table with the Items / Category / Type / Amount columns shown in the references. */
export function EstimateTable({ items, columns = ['category', 'type'], className }: { items: EstimateItem[]; columns?: ('category' | 'type')[]; className?: string }) {
  return (
    <div className={clsx('neu-in-sm !rounded-[20px] p-3', className)}>
      <div className={clsx('grid items-center gap-3 px-4 pb-2 text-[12px] font-medium text-ink-400')} style={{ gridTemplateColumns: `1fr ${columns.map(() => '0.7fr').join(' ')} 0.6fr` }}>
        <span>Items</span>
        {columns.includes('category') && <span>Category</span>}
        {columns.includes('type') && <span>Type</span>}
        <span className="text-right">Amount</span>
      </div>
      <ul className="space-y-1.5">
        {items.map((i) => (
          <li key={i.id} className="grid items-center gap-3 rounded-xl bg-white/55 px-4 py-3 text-sm" style={{ gridTemplateColumns: `1fr ${columns.map(() => '0.7fr').join(' ')} 0.6fr` }}>
            <span className="font-medium text-ink-700">{i.name}</span>
            {columns.includes('category') && <span className="text-ink-500">{i.category}</span>}
            {columns.includes('type') && <span className="text-ink-500">{i.type}</span>}
            <span className="text-right font-semibold">{inr(i.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EstimateTotals({ items, className }: { items: { amount: number }[]; className?: string }) {
  const t = estimateTotals(items);
  return (
    <dl className={clsx('neu-sm space-y-2 !rounded-[18px] px-5 py-4 text-sm', className)}>
      <div className="flex justify-between"><dt className="font-medium">Subtotal</dt><dd className="font-semibold">{inr(t.subtotal)}</dd></div>
      <div className="flex justify-between"><dt className="font-medium">GST (18%)</dt><dd className="font-semibold">{inr(t.gst)}</dd></div>
      <div className="flex justify-between text-[15px]"><dt className="font-bold">Total</dt><dd className="font-bold">{inr(t.total)}</dd></div>
    </dl>
  );
}
