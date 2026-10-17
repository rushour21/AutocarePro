'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Wrench } from 'lucide-react';
import { Pill } from '@/components/ui';
import { serviceHistory } from '@/lib/data';

export default function ServiceHistoryPage() {
  const [vehicle, setVehicle] = useState('Honda City 2021|MH12 AB 1234');
  const [name, reg] = vehicle.split('|');
  return (
    <div className="max-w-[900px] px-8 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-bold tracking-tight">Service History</h1>
        <label className="relative flex h-14 w-[240px] items-center rounded-lg border border-emp-line bg-white px-4 shadow-card">
          <div className="pointer-events-none">
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-xs text-gray-500">{reg}</p>
          </div>
          <ChevronDown className="pointer-events-none ml-auto h-4 w-4 text-gray-500" />
          <select value={vehicle} onChange={(e) => setVehicle(e.target.value)} className="absolute inset-0 opacity-0" aria-label="Vehicle">
            <option value="Honda City 2021|MH12 AB 1234">Honda City 2021</option>
            <option value="Creta 2022|MH14 CD 5678">Creta 2022</option>
            <option value="Swift 2020|MH12 EF 9012">Swift 2020</option>
          </select>
        </label>
      </div>
      <ul className="mt-6 space-y-3">
        {serviceHistory.map((s) => (
          <li key={s.id} className="flex items-center gap-6 rounded-xl border border-emp-line bg-white px-5 py-4 shadow-card">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e7ebf0] text-gray-600">
              <Wrench className="h-5 w-5" />
            </span>
            <div className="w-36">
              <p className="text-[15px] font-semibold">#{s.id}</p>
              <p className="text-sm text-gray-500">{s.date}</p>
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-semibold">{s.title}</p>
              <p className="text-sm text-gray-500">{s.detail}</p>
            </div>
            <Pill tone="green" className="rounded-full px-3 py-1 text-sm">
              Completed
            </Pill>
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </li>
        ))}
      </ul>
    </div>
  );
}
