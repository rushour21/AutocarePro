'use client';

import { useState } from 'react';
import { Bell, Briefcase, Moon, MessageSquare, Package } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { Avatar, Button, Card, Input, Select, Toggle, useToast } from '@/components/ui';
import { changePassword, setPref, updateUser } from '@/lib/actions';
import { useSession } from '@/lib/auth';
import { useDb } from '@/lib/store';

export default function EmployeeProfilePage() {
  const db = useDb();
  const { user } = useSession();
  const toast = useToast();
  const [pw, setPw] = useState({ cur: '', next: '', confirm: '' });
  const [err, setErr] = useState('');
  if (!user) return null;
  const prefs = db.prefs[user.id] ?? {};

  const rows: [string, string][] = [['Full Name', user.name], ['Phone', user.phone], ['Email', user.email], ['Employee ID', user.empId ?? '—'], ['Role', user.title], ['Joined Date', user.joined ?? '—']];
  const toggles: [string, string, React.ElementType][] = [['notifications', 'Notifications', Bell], ['jobAlerts', 'Job Alerts', Briefcase], ['partsUpdates', 'Parts Updates', Package], ['teamMessages', 'Team Messages', MessageSquare]];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) return setErr('New password and confirmation do not match.');
    const r = changePassword(user.id, pw.cur, pw.next);
    if (!r.ok) return setErr(r.error ?? 'Could not change the password.');
    setErr('');
    setPw({ cur: '', next: '', confirm: '' });
    toast.show('Password updated');
  };

  return (
    <>
      <TopBar />
      <h1 className="mb-5 text-[24px] font-bold lg:hidden">Profile &amp; Settings</h1>
      <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-[0.8fr_1.1fr_1fr_1fr]">
        <Card className="flex items-center gap-5 p-6">
          <Avatar src={user.avatar.replace('amit-gupta', 'amit-gupta-lg')} name={user.name} size={96} />
          <div>
            <p className="text-xl font-bold leading-tight">{user.name}</p>
            <p className="mb-2 text-sm text-ink-500">{user.title}</p>
            <label className="sr-only" htmlFor="avail">Availability</label>
            <Select id="avail" value={user.online ? 'active' : 'away'} onChange={(e) => updateUser(user.id, { online: e.target.value === 'active' })} className="w-[120px] [&_select]:!h-9 [&_select]:!bg-ok-soft [&_select]:text-sm [&_select]:font-semibold [&_select]:text-ok-strong">
              <option value="active">Active</option>
              <option value="away">Away</option>
            </Select>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-bold">Personal Information</h2>
          <dl className="space-y-3 text-sm">{rows.map(([k, v]) => <div key={k} className="grid grid-cols-[110px_1fr] gap-3"><dt className="text-ink-400">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl>
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-bold">Preferences</h2>
          <ul className="space-y-3.5">
            {toggles.map(([k, label, Icon]) => (
              <li key={k} className="flex items-center gap-3 text-sm"><Icon className="h-4 w-4 text-ink-400" /><span className="flex-1">{label}</span><Toggle label={label} checked={prefs[k] !== false} onChange={(v) => setPref(user.id, k, v)} /></li>
            ))}
            <li className="flex items-center gap-3 text-sm" title="Dark mode is not available yet"><Moon className="h-4 w-4 text-ink-400" /><span className="flex-1">Dark Mode <span className="text-xs text-ink-400">(coming soon)</span></span><Toggle label="Dark Mode" checked={false} disabled /></li>
            <li className="flex items-center gap-3 text-sm"><span className="flex-1 pl-7">Language</span><Select aria-label="Language" value={(prefs.language as string) ?? 'English'} onChange={(e) => setPref(user.id, 'language', e.target.value)} className="w-[130px] [&_select]:!h-9"><option>English</option><option>Hindi</option><option>Marathi</option></Select></li>
          </ul>
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-bold">Change Password</h2>
          <form onSubmit={submit} className="space-y-3">
            <Input type="password" autoComplete="current-password" placeholder="Current Password" aria-label="Current Password" value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} required />
            <Input type="password" autoComplete="new-password" placeholder="New Password" aria-label="New Password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required />
            <Input type="password" autoComplete="new-password" placeholder="Confirm Password" aria-label="Confirm Password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required />
            {err && <p role="alert" className="text-sm text-bad">{err}</p>}
            <Button type="submit" size="lg" className="w-full">Update Password</Button>
          </form>
        </Card>
      </div>
      {toast.node}
    </>
  );
}
