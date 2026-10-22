'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { CreditCard, Download, MessageCircle, RotateCcw, Wallet } from 'lucide-react';
import { SettingsFrame } from '@/components/features/SettingsShell';
import { NoAccess } from '@/components/features/NoAccess';
import { LayoutStudio } from '@/components/features/layout/LayoutStudio';
import { Workshop3DPreview } from '@/components/features/layout/Workshop3DPreview';
import { Button, ConfirmDialog, StatusBadge, Toggle, useToast } from '@/components/ui';
import { resetDemo, setPref } from '@/lib/actions';
import { useSession } from '@/lib/auth';
import { getDb, useDb } from '@/lib/store';

function Workshop() {
  return <LayoutStudio preview={(layout, selectedId, onSelect) => <Workshop3DPreview layout={layout} selectedId={selectedId} onSelect={onSelect} />} />;
}

function Notifications() {
  const db = useDb();
  const { user } = useSession();
  if (!user) return null;
  const prefs = db.prefs[user.id] ?? {};
  const rows: [string, string, string][] = [
    ['notifications', 'Push notifications', 'Alerts about jobs and approvals in the app.'],
    ['jobAlerts', 'Job alerts', 'When a job is overdue or at risk.'],
    ['partsUpdates', 'Parts updates', 'Low stock and parts request decisions.'],
    ['teamMessages', 'Team messages', 'New messages in team channels.'],
  ];
  return (
    <SettingsFrame title="Notifications">
      <ul className="space-y-3">
        {rows.map(([k, t, d]) => (
          <li key={k} className="neu-row flex items-center gap-4 px-5 py-4">
            <div className="flex-1"><p className="text-sm font-semibold">{t}</p><p className="text-xs text-ink-500">{d}</p></div>
            <Toggle label={t} checked={prefs[k] !== false} onChange={(v) => setPref(user.id, k, v)} />
          </li>
        ))}
      </ul>
    </SettingsFrame>
  );
}

function Integrations() {
  const items = [
    { icon: MessageCircle, name: 'WhatsApp Business', text: 'Send job updates and estimate links to customers.' },
    { icon: Wallet, name: 'Payments', text: 'Collect invoice payments online via UPI and cards.' },
    { icon: CreditCard, name: 'Accounting', text: 'Sync invoices and expenses to your accounting tool.' },
  ];
  return (
    <SettingsFrame title="Integrations">
      <ul className="space-y-3">
        {items.map(({ icon: Icon, name, text }) => (
          <li key={name} className="neu-row flex items-center gap-4 px-5 py-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-coral-100 text-coral-500"><Icon className="h-5 w-5" /></span>
            <div className="flex-1"><p className="text-sm font-semibold">{name}</p><p className="text-xs text-ink-500">{text}</p></div>
            <StatusBadge tone="gray">Not connected</StatusBadge>
            <Button size="sm" variant="neu" disabled title="Not available in this build">Connect</Button>
          </li>
        ))}
      </ul>
    </SettingsFrame>
  );
}

function Subscription() {
  return (
    <SettingsFrame title="Subscription">
      <div className="neu-row px-6 py-6">
        <StatusBadge tone="coral">Demo plan</StatusBadge>
        <p className="mt-3 text-xl font-bold">AutoHub Pro</p>
        <p className="mt-1 text-sm text-ink-500">This build runs on demo data stored in your browser. Billing is not connected.</p>
      </div>
    </SettingsFrame>
  );
}

function Security() {
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  return (
    <SettingsFrame title="Data & Security">
      <ul className="space-y-3">
        <li className="neu-row flex items-center gap-4 px-5 py-4">
          <div className="flex-1"><p className="text-sm font-semibold">Export data</p><p className="text-xs text-ink-500">Download everything in this demo as a JSON file.</p></div>
          <Button size="sm" variant="neu" onClick={() => { const blob = new Blob([JSON.stringify(getDb(), null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'autohub-data.json'; a.click(); URL.revokeObjectURL(a.href); }}><Download className="h-4 w-4" /> Export</Button>
        </li>
        <li className="neu-row flex items-center gap-4 px-5 py-4">
          <div className="flex-1"><p className="text-sm font-semibold">Reset demo data</p><p className="text-xs text-ink-500">Restore jobs, customers and estimates to their starting state.</p></div>
          <Button size="sm" variant="neu" onClick={() => setConfirm(true)}><RotateCcw className="h-4 w-4" /> Reset</Button>
        </li>
      </ul>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} title="Reset demo data?" message="All changes made in this browser will be lost." confirmLabel="Reset" danger onConfirm={() => { resetDemo(); toast.show('Demo data reset'); }} />
      {toast.node}
    </SettingsFrame>
  );
}

export default function SettingsSection() {
  const { section } = useParams<{ section: string }>();
  switch (section) {
    case 'workshop': return <Workshop />;
    case 'notifications': return <Notifications />;
    case 'integrations': return <Integrations />;
    case 'subscription': return <Subscription />;
    case 'security': return <Security />;
    default: return <NoAccess what="settings page" backHref="/admin/settings" />;
  }
}
