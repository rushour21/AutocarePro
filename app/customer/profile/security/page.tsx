'use client';

import { useState } from 'react';
import { TopBar } from '@/components/layout/AppShell';
import { Button, Card, Input, useToast } from '@/components/ui';
import { changePassword } from '@/lib/actions';
import { useSession } from '@/lib/auth';

export default function Security() {
  const { user } = useSession();
  const toast = useToast();
  const [pw, setPw] = useState({ cur: '', next: '', confirm: '' });
  const [err, setErr] = useState('');
  if (!user) return null;
  return (
    <>
      <TopBar showUser />
      <h1 className="mb-5 text-[26px] font-bold">Security</h1>
      <Card className="mx-auto max-w-[520px] p-6">
        <h2 className="mb-4 text-lg font-bold">Change Password</h2>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (pw.next !== pw.confirm) return setErr('New password and confirmation do not match.'); const r = changePassword(user.id, pw.cur, pw.next); if (!r.ok) return setErr(r.error ?? 'Could not change the password.'); setErr(''); setPw({ cur: '', next: '', confirm: '' }); toast.show('Password updated'); }}>
          <Input type="password" autoComplete="current-password" placeholder="Current Password" aria-label="Current Password" value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} required />
          <Input type="password" autoComplete="new-password" placeholder="New Password" aria-label="New Password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required />
          <Input type="password" autoComplete="new-password" placeholder="Confirm Password" aria-label="Confirm Password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required />
          {err && <p role="alert" className="text-sm text-bad">{err}</p>}
          <Button type="submit" size="lg" className="w-full">Update Password</Button>
        </form>
      </Card>
      {toast.node}
    </>
  );
}
