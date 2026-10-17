'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { AdminJobBar, AdminJobTabs } from '@/components/admin/JobTabs';
import { DamageDiagram, Legend, SelectedArea, colorFor, type Marker } from '@/components/inspection/Diagram';
import { Viewer3D } from '@/components/inspection/Viewer3D';
import { adminMarkers, ASSET } from '@/lib/data';

export default function AdminInspection() {
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [markers, setMarkers] = useState<Marker[]>(adminMarkers);
  const [sel, setSel] = useState(0);
  const [detail, setDetail] = useState({ type: 'Scratch', severity: 'Medium', notes: 'Rear bumper scratched.\nWill need repainting.' });
  const [saved, setSaved] = useState(false);

  return (
    <>
      <AdminJobBar />
      <AdminJobTabs />
      <div className="mt-5 flex gap-2">
        {(['2d', '3d'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={clsx(
              'h-10 rounded-lg px-5 text-sm font-medium',
              view === v ? 'bg-admin-btn text-white' : 'bg-[#efeeea] text-gray-700',
            )}
          >
            {v.toUpperCase().replace('D', 'D View')}
          </button>
        ))}
      </div>

      {view === '3d' ? (
        <div className="mt-5">
          <Viewer3D />
        </div>
      ) : (
        <div className="mt-4 grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="flex flex-col">
            <DamageDiagram
              src={ASSET('diagram-admin.png')}
              aspect="267 / 175"
              markers={markers}
              selected={sel}
              onSelect={setSel}
              onAdd={(x, y) => {
                setMarkers([...markers, { x, y, color: colorFor(detail.type), type: detail.type }]);
                setSel(markers.length);
                setSaved(false);
              }}
              size={16}
              className="mx-auto w-full max-w-[760px]"
            />
            <Legend className="mt-6 justify-center" />
            <p className="mt-3 text-center text-xs text-gray-400">Click anywhere on the vehicle to add a damage point.</p>
          </div>
          <SelectedArea
            photo={ASSET('sel-area-admin.png')}
            thumbs={[ASSET('ai-thumb-1.png'), ASSET('ai-thumb-2.png')]}
            {...detail}
            addTile="labelled"
            onChange={(p) => {
              const next = { ...detail, ...p };
              setDetail(next);
              setSaved(false);
              if (p.type) setMarkers(markers.map((m, i) => (i === sel ? { ...m, type: p.type, color: colorFor(p.type!) } : m)));
            }}
            footer={
              <button
                onClick={() => setSaved(true)}
                className="mt-4 h-11 w-full rounded-lg bg-admin-btn text-sm font-medium text-white shadow-card"
              >
                {saved ? 'Inspection Saved ✓' : 'Save Inspection'}
              </button>
            }
          />
        </div>
      )}
    </>
  );
}
