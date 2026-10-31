'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { Button, EmptyState, Field, FilterTabs, Input, Modal, Select, StatusBadge, VehicleImage, useToast } from '@/components/ui';
import { addVehicle } from '@/lib/actions';
import { MODELS } from '@/lib/catalog';
import { km, serviceDueLabel, vehicleName } from '@/lib/format';
import { useDb } from '@/lib/store';

export default function VehiclesPage() {
  const db = useDb();
  const toast = useToast();
  const [tab, setTab] = useState<'all' | 'due' | 'overdue'>('all');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ customerId: db.customers[0]?.id ?? '', model: 'bmw3', reg: '', year: '2022', odometer: '' });
  const [err, setErr] = useState<Record<string, string>>({});

  const due = db.vehicles.filter((v) => v.serviceInDays !== undefined && v.serviceInDays >= 0 && v.serviceInDays <= 30);
  const overdue = db.vehicles.filter((v) => v.serviceInDays !== undefined && v.serviceInDays < 0);
  const list = useMemo(() => (tab === 'all' ? db.vehicles : tab === 'due' ? due : overdue), [tab, db.vehicles]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = () => {
    const e: Record<string, string> = {};
    if (!/^[A-Za-z]{2}\s?\d{1,2}\s?[A-Za-z]{1,3}\s?\d{3,4}$/.test(f.reg.trim())) e.reg = 'Use a format like MH12AB1234';
    const odo = Number(f.odometer.replace(/,/g, ''));
    if (!Number.isFinite(odo) || odo < 0 || f.odometer === '') e.odometer = 'Enter the odometer reading';
    setErr(e);
    if (Object.keys(e).length) return;
    const m = MODELS.find((x) => x.key === f.model)!;
    addVehicle({ customerId: f.customerId, make: m.make, model: m.model, variant: m.variant, fuel: m.fuel, carKey: m.carKey, reg: f.reg.replace(/\s/g, '').toUpperCase(), year: Number(f.year), odometer: odo, serviceInDays: 90 });
    toast.show('Vehicle added');
    setF({ ...f, reg: '', odometer: '' });
    setOpen(false);
  };

  return (
    <>
      <TopBar showUser />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <FilterTabs
          variant="underline"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'all', label: `All (${db.vehicles.length})` },
            { value: 'due', label: `Service Due (${due.length})` },
            { value: 'overdue', label: `Overdue (${overdue.length})` },
          ]}
        />
        <Button className="ml-auto" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add Vehicle
        </Button>
      </div>
      {list.length === 0 ? (
        <EmptyState title="No vehicles in this view" />
      ) : (
        <ul className="space-y-3">
          {[...list]
            .sort((a, b) => (a.id === 'v-1' ? -1 : b.id === 'v-1' ? 1 : 0))
            .slice(0, 30)
            .map((v) => {
              const d = serviceDueLabel(v.serviceInDays);
              const owner = db.customers.find((c) => c.id === v.customerId);
              return (
                <li key={v.id} className="neu-row flex items-center gap-3 px-3.5 py-3 sm:gap-5 sm:px-5 sm:py-3.5">
                  <VehicleImage carKey={v.carKey} className="h-10 w-16 shrink-0 sm:h-12 sm:w-24" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{vehicleName(v)}</p>
                    <p className="truncate text-sm text-ink-400">{v.reg}<span className="block sm:hidden">{km(v.odometer)}</span></p>
                  </div>
                  <p className="hidden text-sm text-ink-500 sm:block">{owner?.name}</p>
                  <p className="hidden w-24 text-right text-sm font-medium text-ink-700 sm:block">{km(v.odometer)}</p>
                  <div className="w-[92px] shrink-0 text-right sm:w-[124px]">{d ? <StatusBadge tone={d.tone} className="w-full justify-center !whitespace-normal text-center leading-tight">{d.label}</StatusBadge> : <span className="text-xs text-ink-300">—</span>}</div>
                </li>
              );
            })}
        </ul>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Add vehicle" size="sm" footer={<><Button variant="neu" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit}>Add vehicle</Button></>}>
        <div className="space-y-4">
          <Field label="Owner"><Select value={f.customerId} onChange={(e) => setF({ ...f, customerId: e.target.value })}>{db.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          <Field label="Model"><Select value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })}>{MODELS.map((m) => <option key={m.key} value={m.key}>{m.make} {m.model}</option>)}</Select></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Registration" error={err.reg}><Input value={f.reg} onChange={(e) => setF({ ...f, reg: e.target.value })} placeholder="MH12AB1234" /></Field>
            <Field label="Year"><Select value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })}>{[2025, 2024, 2023, 2022, 2021, 2020, 2019].map((y) => <option key={y}>{y}</option>)}</Select></Field>
          </div>
          <Field label="Odometer (km)" error={err.odometer}><Input inputMode="numeric" value={f.odometer} onChange={(e) => setF({ ...f, odometer: e.target.value })} placeholder="42,500" /></Field>
        </div>
      </Modal>
      {toast.node}
    </>
  );
}
