'use client';

import Link from 'next/link';
import { useState } from 'react';
import clsx from 'clsx';
import { Bell, Clock3, MoreVertical, Plus, Search } from 'lucide-react';
import { Pill } from '@/components/ui';
import { myJobs, myJobsTabs } from '@/lib/data';

const inTab = (tab: string, status: string) =>
  tab === 'All' ||
  (tab === 'In Progress' && (status === 'In Progress' || status === 'Diagnosis')) ||
  (tab === 'Waiting for Parts' && status === 'Waiting for Parts');

export default function MyJobsPage() {
  const [tab, setTab] = useState('All');
  return (
    <div className="px-8 py-7">
      <div className="flex items-start justify-between gap-4">
        <div className="pt-4">
          <h1 className="text-[28px] font-bold tracking-tight text-[#111827]">Good morning, Sandeep 👋</h1>
          <p className="mt-1 text-[15px] text-gray-500">You have 6 active jobs today.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-emp-line bg-white shadow-card" aria-label="Search">
            <Search className="h-5 w-5" />
          </button>
          <button className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-emp-line bg-white shadow-card" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {myJobsTabs.map((t) => (
          <button
            key={t.label}
            onClick={() => setTab(t.label)}
            className={clsx(
              'h-10 rounded-lg px-4 text-sm font-medium transition',
              tab === t.label ? 'bg-emp-blue text-white' : 'bg-[#eef1f5] text-gray-700 hover:bg-[#e5e9ef]',
            )}
          >
            {t.label} ({t.count})
          </button>
        ))}
        <Link href="/employee/jobs/new" className="ml-auto flex h-10 items-center gap-2 rounded-lg bg-emp-blue px-4 text-sm font-medium text-white">
          <Plus className="h-4 w-4" /> Create Job Card
        </Link>
      </div>

      <ul className="mt-5 max-w-[900px] space-y-3">
        {myJobs
          .filter((j) => inTab(tab, j.status))
          .map((j) => (
            <li key={j.id}>
              <Link
                href={`/employee/jobs/${j.id}`}
                className="flex items-center gap-6 rounded-xl border border-emp-line bg-white px-5 py-4 shadow-card transition hover:shadow-pop"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={j.image} alt="" className="h-[62px] w-[112px] object-contain" />
                <div className="w-44">
                  <p className="text-[17px] font-bold">#{j.id}</p>
                  <p className="text-[15px] text-gray-600">{j.vehicle}</p>
                  <p className="text-sm text-gray-500">{j.reg}</p>
                </div>
                <div className="flex-1">
                  <Pill tone={j.tone} className="px-3 py-1 text-sm">
                    {j.status}
                  </Pill>
                  <p className="mt-1.5 text-[15px] text-gray-700">{j.task}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="h-1.5 w-[190px] overflow-hidden rounded-full bg-[#e7eaee]">
                      <span className="block h-full rounded-full" style={{ width: `${j.progress}%`, background: j.bar }} />
                    </span>
                    <span className="text-xs text-gray-400">{j.progress}%</span>
                  </div>
                </div>
                <Clock3 className="h-5 w-5 text-gray-600" />
                <div className="w-24">
                  <p className="text-[15px] font-semibold">{j.day}</p>
                  <p className="text-[15px] text-gray-600">{j.time}</p>
                </div>
                <MoreVertical className="h-5 w-5 text-gray-600" />
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
}
