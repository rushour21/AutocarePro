'use client';

import { TopBar } from '@/components/layout/AppShell';
import { AdminCalendarView } from '@/components/features/AdminCalendar';
import { PageHeader } from '@/components/ui';

export default function CalendarPage() {
  return (
    <>
      <TopBar showUser />
      <PageHeader title="Calendar" subtitle="Technician schedule for the workshop" />
      <AdminCalendarView />
    </>
  );
}
