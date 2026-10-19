'use client';

import { useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { Button, EmptyState, Field, Input, Modal, PageHeader, Select, StatusBadge, VehicleImage, useToast } from '@/components/ui';
import { addVehicle } from '@/lib/actions';
import { visibleVehicles } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { km, vehicleName } from '@/lib/format';
import { useDb } from '@/lib/store';
import type { CarKey } from '@/lib/types';

const MODELS: { key: string; make: string; model: string; variant: string; fuel: 'Petrol' | 'Diesel'; carKey: CarKey }[] = [
  { key: 'bmw3', make: 'BMW', model: '3 Series', variant: '330i M Sport', fuel: 'Petrol', carKey: 'bmw3' },
  { key: 'audiq5', make: 'Audi', model: 'Q5', variant: '2.0 TFSI', fuel: 'Petrol', carKey: 'audiq5' },
  { key: 'glc', make: 'Mercedes', model: 'GLC', variant: '300 4MATIC', fuel: 'Petrol', carKey: 'glc' },
  { key: 'fortuner', make: 'Toyota', model: 'Fortuner', variant: '2.8 Diesel', fuel: 'Diesel', carKey: 'fortuner' },
  { key: 'bmwx5', make: 'BMW', model: 'X5', variant: 'xDrive30d', fuel: 'Diesel', carKey: 'bmwx5' },
];

export default function CustomerVehicles() {
  const db = useDb();
  const { user } = useSession();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ model: 'bmw3', reg: '', year: '2022', odometer: '' });
  const [err, setErr] = useState<Record<string, string>>({});
  if (!user) return null;
  const list = visibleVehicles(db, user);

  const submit = () => {
    const e: Record<string, string> = {};
    if (!/^[A-Za-z]{2}\s?\d{1,2}\s?[A-Za-z]{1,3}\s?\d{3,4}$/.test(f.reg.trim())) e.reg = 'Use a format like KA01AB1234';
    const odo = Number(f.odometer.replace(/,/g, ''));
    if (!f.odometer || !Number.isFinite(odo) || odo < 0) e.odometer = 'Enter the odometer reading';
    if (db.vehicles.some((v) => v.reg.toUpperCase() === f.reg.replace(/\s/g, '').toUpperCase())) e.reg = 'This vehicle is already registered';
    setErr(e);
    if (Object.keys(e).length) return;
    const m = MODELS.find((x) => x.key === f.model)!;
    addVehicle({ customerId: user.customerId!, make: m.make, model: m.model, variant: m.variant, fuel: m.fuel, carKey: m.carKey, reg: f.reg.replace(/\s/g, '').toUpperCase(), year: Number(f.year), odometer: odo, serviceInDays: 90 });
    toast.show('Vehicle added');
    setF({ ...f, reg: '', odometer: '' });
    setOpen(false);
  };

  return (
    <>
      <TopBar showUser />
      <PageHeader title="My Vehicles" subtitle="Manage your vehicles and view service history." actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Vehicle</Button>} />
      {list.length === 0 ? <div className="neu"><EmptyState title="No vehicles yet" text="Add your first vehicle to book a service." /></div> : (
        <ul className="space-y-4">
          {list.map((v) => (
            <li key={v.id} className="neu flex items-center gap-5 !rounded-[22px] px-5 py-4">
              <VehicleImage carKey={v.carKey} className="h-[68px] w-[128px]" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-3 text-lg font-bold">{vehicleName(v)} {v.primary && <StatusBadge tone="green" size="sm">Primary</StatusBadge>}</p>
                <p className="text-sm text-ink-500">{v.reg}</p>
                <p className="mt-1 text-[13px] text-ink-500">{v.year} · {v.variant} · {v.fuel}</p>
                <p className="text-sm font-semibold text-ink-700">{km(v.odometer)}</p>
              </div>
              <Button variant="neu" size="sm" href={`/customer/bookings/new?vehicle=${v.id}`} className="hidden sm:inline-flex">Book service</Button>
              <ChevronRight className="h-5 w-5 text-ink-300" />
            </li>
          ))}
        </ul>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Add vehicle" size="sm" footer={<><Button variant="neu" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit}>Add vehicle</Button></>}>
        <div className="space-y-4">
          <Field label="Model"><Select value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })}>{MODELS.map((m) => <option key={m.key} value={m.key}>{m.make} {m.model}</option>)}</Select></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Registration" error={err.reg}><Input value={f.reg} onChange={(e) => setF({ ...f, reg: e.target.value })} placeholder="KA01AB1234" /></Field>
            <Field label="Year"><Select value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })}>{[2025, 2024, 2023, 2022, 2021, 2020, 2019].map((y) => <option key={y}>{y}</option>)}</Select></Field>
          </div>
          <Field label="Odometer (km)" error={err.odometer}><Input inputMode="numeric" value={f.odometer} onChange={(e) => setF({ ...f, odometer: e.target.value })} /></Field>
        </div>
      </Modal>
      {toast.node}
    </>
  );
}
