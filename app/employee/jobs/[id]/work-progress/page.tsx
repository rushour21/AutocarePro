'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { EmpJobBar, EmpJobTabs } from '@/components/employee/JobNav';
import { HStepper } from '@/components/ui';
import { ASSET, workDone } from '@/lib/data';

const STAGES = ['Diagnosis', 'Repair', 'Quality Check', 'Complete'];
const STATUS = ['Diagnosis in progress', 'Repair in progress', 'Quality check in progress', 'Completed'];

export default function EmpWorkProgress() {
  const [stage, setStage] = useState(1);
  const [items, setItems] = useState(workDone);
  const [notes, setNotes] = useState('Dent removed and front bumper painting started. Will complete by by tomorrow.');
  const [saved, setSaved] = useState(false);

  return (
    <>
      <EmpJobBar />
      <EmpJobTabs />
      <div className="mt-6 max-w-[1000px] rounded-xl border border-emp-line bg-white p-6 shadow-card">
        <HStepper
          labelTone="plain"
          accent="#1fa25f"
          current="#1d63ed"
          steps={STAGES.map((s, i) => ({ label: s, state: i < stage ? 'done' : i === stage ? 'current' : 'pending' }))}
        />
        <div className="mt-8 grid grid-cols-2 gap-10">
          <div>
            <h3 className="text-[15px] font-semibold">Update Current Status</h3>
            <div className="relative mt-3">
              <select
                value={STATUS[stage]}
                onChange={(e) => {
                  setStage(STATUS.indexOf(e.target.value));
                  setSaved(false);
                }}
                className="h-11 w-full appearance-none rounded-lg border border-[#e3e5e8] bg-white px-3 text-sm outline-none"
              >
                {STATUS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            </div>
            <h3 className="mt-6 text-[15px] font-semibold">Work Done</h3>
            <ul className="mt-3 space-y-3">
              {items.map((it, i) => (
                <li key={it.label}>
                  <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-700">
                    <button
                      type="button"
                      onClick={() => setItems(items.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))}
                      className={clsx('flex h-5 w-5 items-center justify-center rounded', it.done ? 'bg-emp-blue' : 'border border-gray-300 bg-white')}
                      aria-label={it.label}
                    >
                      {it.done && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                    </button>
                    {it.label}
                  </label>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-[15px] font-semibold">Add Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-3 w-full resize-none rounded-lg border border-[#e3e5e8] px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#9db7f5]"
            />
            <h3 className="mt-5 text-[15px] font-semibold">Add Photos</h3>
            <div className="mt-3 flex gap-3">
              {['ep-photo-1', 'ep-photo-2'].map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p} src={ASSET(`${p}.png`)} alt="" className="h-[84px] w-[96px] rounded-lg object-cover" />
              ))}
              <button className="flex h-[84px] w-[96px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[#b9cdf5] bg-[#f6f9ff] text-xs text-emp-blue">
                <Plus className="h-4 w-4" /> Add Photos
              </button>
            </div>
            <div className="mt-8 flex justify-end">
              <button onClick={() => setSaved(true)} className="h-11 rounded-lg bg-emp-blue px-7 text-sm font-medium text-white shadow-card">
                {saved ? 'Progress Saved ✓' : 'Save Progress'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
