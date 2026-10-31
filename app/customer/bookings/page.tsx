'use client';

import { CalendarCheck, Plus } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { Button, EmptyState, PageHeader, StatusBadge, VehicleImage } from '@/components/ui';
import { visibleBookings } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { BOOKING_TONE, vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';

export default function BookingsPage() {
  const db = useDb();
  const { user } = useSession();
  if (!user) return null;
  const list = visibleBookings(db, user);
  return (
    <>
      <TopBar showUser />
      <PageHeader title="Bookings" subtitle="Your upcoming and requested services." actions={<Button href="/customer/bookings/new"><Plus className="h-4 w-4" /> Book a Service</Button>} />
      {list.length === 0 ? <div className="neu"><EmptyState icon={<CalendarCheck className="h-7 w-7" />} title="No bookings yet" text="Schedule a service at your convenience." action={<Button href="/customer/bookings/new">Book a Service</Button>} /></div> : (
        <ul className="space-y-4">
          {list.map((b) => {
            const v = vehicleOf(db, b.vehicleId);
            return (
              <li key={b.id} className="neu flex items-center gap-5 !rounded-[22px] px-5 py-4">
                {v && <VehicleImage carKey={v.carKey} className="h-14 w-28" />}
                <div className="flex-1"><p className="font-bold">{vehicleName(v)}</p><p className="text-sm text-ink-500">{b.service}</p><p className="text-sm text-ink-500">{b.date} · {b.time}</p>{b.declineReason && <p className="text-sm text-bad">{b.declineReason}</p>}</div>
                <StatusBadge tone={BOOKING_TONE[b.status]}>{b.status}</StatusBadge>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
