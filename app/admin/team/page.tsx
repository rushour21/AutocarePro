'use client';

import { useState } from 'react';
import { Check, ChevronRight, Plus, Minus } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { Avatar, Button, DataTable, Field, FilterTabs, Input, Modal, Select, StatusBadge, Toggle, useToast, type Column } from '@/components/ui';
import { addMember, updateUser } from '@/lib/actions';
import { useSession } from '@/lib/auth';
import { can } from '@/lib/access';
import { useDb } from '@/lib/store';
import type { User } from '@/lib/types';

const PERMS: [string, boolean, boolean, boolean][] = [
  ['View all jobs and the workshop board', true, false, false],
  ['Create and assign jobs', true, false, false],
  ['Update jobs assigned to them', true, true, false],
  ['Record inspections and photos', true, true, false],
  ['Request parts', true, true, false],
  ['Approve parts and manage inventory', true, false, false],
  ['Send estimates and invoices', true, false, false],
  ['Manage team and settings', true, false, false],
  ['View their own vehicles, jobs and invoices', false, false, true],
  ['Approve or reject estimates', true, false, true],
];

export default function TeamPage() {
  const db = useDb();
  const { user } = useSession();
  const toast = useToast();
  const [tab, setTab] = useState<'team' | 'tech' | 'roles'>('team');
  const [sel, setSel] = useState<User | null>(null);
  const [add, setAdd] = useState(false);
  const [f, setF] = useState({ name: '', title: 'Technician', email: '', phone: '' });
  const [err, setErr] = useState<Record<string, string>>({});
  const members = db.users.filter((u) => u.role !== 'customer');
  const list = tab === 'tech' ? members.filter((u) => u.title === 'Technician') : members;
  const editable = user ? can.manageTeam(user) : false;

  const cols: Column<User>[] = [
    { key: 'n', header: 'Name', cell: (u) => <span className="flex items-center gap-3"><Avatar src={u.avatar} size={34} /><span className="font-semibold">{u.name}</span></span> },
    { key: 'r', header: 'Role', cell: (u) => <span className="text-ink-500">{u.title}</span> },
    { key: 's', header: 'Status', cell: (u) => <StatusBadge tone={u.online ? 'green' : 'red'}>{u.online ? 'Online' : 'Offline'}</StatusBadge> },
    { key: 'c', header: '', cell: () => <ChevronRight className="h-4 w-4 text-ink-300" />, className: 'w-10' },
  ];

  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Enter a name';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email';
    if (db.users.some((u) => u.email.toLowerCase() === f.email.toLowerCase())) e.email = 'This email is already in use';
    setErr(e);
    if (Object.keys(e).length) return;
    addMember({ name: f.name.trim(), title: f.title, email: f.email.trim(), phone: f.phone.trim() || '—' });
    toast.show(`${f.name.trim()} added to the team`);
    setF({ name: '', title: 'Technician', email: '', phone: '' });
    setAdd(false);
  };

  return (
    <>
      <TopBar showUser />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs variant="soft" value={tab} onChange={setTab} tabs={[{ value: 'team', label: 'Team' }, { value: 'tech', label: 'Technicians' }, { value: 'roles', label: 'Roles & Permissions' }]} />
        <Button onClick={() => setAdd(true)} disabled={!editable}>
          <Plus className="h-4 w-4" /> Add Member
        </Button>
      </div>
      {tab !== 'roles' ? (
        <DataTable columns={cols} rows={list} rowKey={(u) => u.id} onRowClick={setSel} />
      ) : (
        <div className="neu-sm overflow-x-auto !rounded-[20px] p-3">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-400">
                <th className="px-4 py-3 font-medium">Permission</th>
                {['Admin', 'Technician', 'Customer'].map((r) => <th key={r} className="px-4 py-3 text-center font-medium">{r}</th>)}
              </tr>
            </thead>
            <tbody>
              {PERMS.map(([label, a, t, c]) => (
                <tr key={label} className="border-t border-ivory-300/60">
                  <td className="px-4 py-3">{label}</td>
                  {[a, t, c].map((on, i) => (
                    <td key={i} className="px-4 py-3 text-center">{on ? <Check className="mx-auto h-4 w-4 text-ok" strokeWidth={3} aria-label="Allowed" /> : <Minus className="mx-auto h-4 w-4 text-ink-200" aria-label="Not allowed" />}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.name ?? ''} size="sm">
        {sel && (
          <div className="space-y-4">
            <div className="flex items-center gap-4"><Avatar src={sel.avatar} size={60} /><div><p className="font-semibold">{sel.title}</p><p className="text-sm text-ink-500">{sel.empId} · Joined {sel.joined}</p></div></div>
            <dl className="neu-in-sm space-y-2 p-4 text-sm"><div className="flex justify-between"><dt className="text-ink-500">Email</dt><dd>{sel.email}</dd></div><div className="flex justify-between"><dt className="text-ink-500">Phone</dt><dd>{sel.phone}</dd></div><div className="flex justify-between"><dt className="text-ink-500">Active jobs</dt><dd>{db.jobs.filter((j) => j.techId === sel.id && j.stage !== 'delivered').length}</dd></div></dl>
            <div className="flex items-center justify-between"><span className="text-sm font-medium">Available for jobs</span><Toggle label="Available" checked={!!sel.online} disabled={!editable} onChange={(v) => { updateUser(sel.id, { online: v }); setSel({ ...sel, online: v }); }} /></div>
          </div>
        )}
      </Modal>
      <Modal open={add} onClose={() => setAdd(false)} title="Add team member" size="sm" footer={<><Button variant="neu" onClick={() => setAdd(false)}>Cancel</Button><Button onClick={submit}>Add member</Button></>}>
        <div className="space-y-4">
          <Field label="Full name" error={err.name}><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
          <Field label="Role"><Select value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })}><option>Technician</option><option>Service Advisor</option></Select></Field>
          <Field label="Email" error={err.email}><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Phone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <p className="text-xs text-ink-400">New members sign in with the demo password “tech123”.</p>
        </div>
      </Modal>
      {toast.node}
    </>
  );
}
