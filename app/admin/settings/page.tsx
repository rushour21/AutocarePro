'use client';

import { useEffect, useState } from 'react';
import { Button, Input, Select, useToast } from '@/components/ui';
import { SettingsFrame } from '@/components/features/SettingsShell';
import { saveGarage } from '@/lib/actions';
import { useDb } from '@/lib/store';

export default function GeneralSettings() {
  const db = useDb();
  const toast = useToast();
  const g = db.garage;
  const [f, setF] = useState({ name: g.name, address: g.address, phone: g.phone, email: g.email, currency: g.currency, dateFormat: g.dateFormat, timeZone: g.timeZone });
  const [err, setErr] = useState<Record<string, string>>({});
  useEffect(() => setF({ name: g.name, address: g.address, phone: g.phone, email: g.email, currency: g.currency, dateFormat: g.dateFormat, timeZone: g.timeZone }), [g.name, g.address, g.phone, g.email, g.currency, g.dateFormat, g.timeZone]);

  const save = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Required';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email';
    setErr(e);
    if (Object.keys(e).length) return;
    saveGarage(f);
    toast.show('Settings saved');
  };

  const Row = ({ label, k, children }: { label: string; k?: string; children: React.ReactNode }) => (
    <div className="grid items-start gap-2 sm:grid-cols-[170px_1fr] sm:gap-6">
      <label className="pt-3 text-sm text-ink-500">{label}</label>
      <div>{children}{k && err[k] && <p className="mt-1 text-xs text-bad">{err[k]}</p>}</div>
    </div>
  );
  return (
    <SettingsFrame title="General Settings">
      <div className="space-y-4">
        <Row label="Garage Name" k="name"><Input aria-label="Garage Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Row>
        <Row label="Address"><Input aria-label="Address" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Row>
        <Row label="Phone"><Input aria-label="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Row>
        <Row label="Email" k="email"><Input aria-label="Email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Row>
        <Row label="Currency"><Select aria-label="Currency" value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })}><option>INR (₹)</option><option>USD ($)</option><option>EUR (€)</option></Select></Row>
        <Row label="Date Format"><Select aria-label="Date Format" value={f.dateFormat} onChange={(e) => setF({ ...f, dateFormat: e.target.value })}><option>DD MMM YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option></Select></Row>
        <Row label="Time Zone"><Select aria-label="Time Zone" value={f.timeZone} onChange={(e) => setF({ ...f, timeZone: e.target.value })}><option>Asia/Kolkata</option><option>Asia/Dubai</option><option>Europe/London</option><option>America/New_York</option></Select></Row>
        <div className="flex justify-end pt-2"><Button size="lg" onClick={save} className="min-w-[200px]">Save Changes</Button></div>
      </div>
      {toast.node}
    </SettingsFrame>
  );
}
