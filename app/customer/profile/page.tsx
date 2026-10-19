'use client';

import { useState } from 'react';
import { Avatar, Button, Card, Input, useToast } from '@/components/ui';
import { TopBar } from '@/components/layout/AppShell';
import { updateCustomerProfile } from '@/lib/actions';
import { useSession } from '@/lib/auth';

export default function CustomerProfile() {
  const { user } = useSession();
  const toast = useToast();
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ name: '', email: '', phone: '', location: '' });
  const [err, setErr] = useState<Record<string, string>>({});
  if (!user) return null;
  const start = () => { setF({ name: user.name, email: user.email, phone: user.phone, location: user.location ?? '' }); setErr({}); setEdit(true); };
  const save = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Required';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email';
    if (!/^[+\d][\d\s-]{7,}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number';
    setErr(e);
    if (Object.keys(e).length) return;
    updateCustomerProfile(user.id, { ...f, name: f.name.trim() });
    setEdit(false);
    toast.show('Profile updated');
  };
  const rows: [string, keyof typeof f][] = [['Full Name', 'name'], ['Email', 'email'], ['Phone', 'phone'], ['Preferred Location', 'location']];
  const val = (k: keyof typeof f) => (k === 'name' ? user.name : k === 'email' ? user.email : k === 'phone' ? user.phone : user.location ?? '');
  return (
    <>
      <TopBar showUser />
      <h1 className="mb-5 text-[26px] font-bold">Profile &amp; Settings</h1>
      <Card className="mx-auto max-w-[720px] p-6 sm:p-8">
        <div className="flex items-center gap-5">
          <Avatar src={user.avatar.replace('rahul-mehta', 'rahul-mehta-lg')} size={92} />
          <div><p className="text-xl font-bold">{user.name}</p><p className="text-sm text-ink-500">{user.email}</p><p className="text-sm text-ink-500">{user.phone}</p></div>
        </div>
        <h2 className="mb-3 mt-7 text-lg font-bold">Personal Information</h2>
        <div className="space-y-3">
          {rows.map(([label, k]) => (
            <div key={k} className="grid items-center gap-2 sm:grid-cols-[170px_1fr] sm:gap-4">
              <label htmlFor={k} className="text-sm text-ink-500">{label}</label>
              {edit ? <div><Input id={k} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />{err[k] && <p className="mt-1 text-xs text-bad">{err[k]}</p>}</div> : <p className="neu-in-sm px-4 py-3 text-sm font-medium">{val(k) || '—'}</p>}
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          {edit ? <><Button variant="neu" size="lg" onClick={() => setEdit(false)}>Cancel</Button><Button size="lg" onClick={save} className="min-w-[160px]">Save</Button></> : <Button size="lg" onClick={start} className="min-w-[200px]">Edit Profile</Button>}
        </div>
      </Card>
      {toast.node}
    </>
  );
}
