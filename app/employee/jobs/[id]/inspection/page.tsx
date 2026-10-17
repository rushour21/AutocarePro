'use client';

import { useState } from 'react';
import { EmpJobBar, EmpJobTabs } from '@/components/employee/JobNav';
import { DamageDiagram, Legend, SelectedArea } from '@/components/inspection/Diagram';
import { ASSET } from '@/lib/data';

export default function EmpInspection() {
  const [area, setArea] = useState({ type: 'Scratch', severity: 'Medium', notes: 'Front bumper scratched.\nWill need repainting.' });
  return (
    <>
      <EmpJobBar />
      <EmpJobTabs />
      <div className="mt-5 grid max-w-[1100px] grid-cols-[1fr_300px] gap-6">
        <div className="rounded-xl border border-emp-line bg-white p-5 shadow-card">
          <DamageDiagram src={ASSET('diagram-e3.png')} aspect="242 / 148" markers={[]} className="w-full" />
          <Legend className="mt-6" />
        </div>
        <SelectedArea photo={ASSET('sel-area.png')} thumbs={[ASSET('e3-thumb-1.png'), ASSET('e3-thumb-2.png')]} {...area} onChange={(p) => setArea({ ...area, ...p })} />
      </div>
    </>
  );
}
