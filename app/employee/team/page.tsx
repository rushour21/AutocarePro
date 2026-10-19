'use client';

import { TopBar } from '@/components/layout/AppShell';
import { Avatar, PageHeader, StatusBadge } from '@/components/ui';
import { useDb } from '@/lib/store';

export default function EmployeeTeamPage() {
  const db = useDb();
  const team = db.users.filter((u) => u.role !== 'customer');
  return (
    <>
      <TopBar />
      <PageHeader title="Team" subtitle="Everyone working in the workshop today" />
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {team.map((u) => (
          <li key={u.id} className="neu flex items-center gap-4 p-4">
            <Avatar src={u.avatar} size={52} />
            <div className="min-w-0 flex-1"><p className="font-bold">{u.name}</p><p className="text-sm text-ink-500">{u.title}</p><p className="truncate text-xs text-ink-400">{u.email}</p></div>
            <StatusBadge tone={u.online ? 'green' : 'red'} size="sm">{u.online ? 'Online' : 'Offline'}</StatusBadge>
          </li>
        ))}
      </ul>
    </>
  );
}
