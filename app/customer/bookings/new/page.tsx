'use client';

import { BookingForm } from '@/components/features/BookingForm';
import { TopBar } from '@/components/layout/AppShell';

export default function NewBookingPage() {
  return (
    <>
      <TopBar showUser />
      <BookingForm doneHref="/customer/bookings" />
    </>
  );
}
