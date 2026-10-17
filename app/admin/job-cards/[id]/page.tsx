'use client';

import Link from 'next/link';
import { ArrowLeft, Bike, CalendarDays, ChevronRight, Heart, Pencil, Printer, Share2, Wrench } from 'lucide-react';
import { AdminJobTabs, useJobId } from '@/components/admin/JobTabs';
import { Avatar, Card, Pill, VTimeline } from '@/components/ui';
import { adminTimeline, job } from '@/lib/data';

export default function AdminJobOverview() {
  const id = useJobId();
  return (
    <>
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/job-cards" className="flex items-center gap-2 hover:text-gray-800">
          <ArrowLeft className="h-4 w-4" /> Job Cards
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span>{id}</span>
      </nav>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[30px] font-bold tracking-tight">Job #{id}</h1>
            <Pill tone="green" className="px-3 py-1 text-sm">
              {job.status}
            </Pill>
          </div>
          <p className="mt-1 text-sm text-gray-500">Created on {job.createdOn}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="flex h-10 items-center gap-2 rounded-lg border border-admin-line bg-white px-4 text-sm font-medium shadow-card">
            <Printer className="h-4 w-4" /> Print
          </button>
          <button className="flex h-10 items-center gap-2 rounded-lg border border-admin-line bg-white px-4 text-sm font-medium shadow-card">
            <Share2 className="h-4 w-4" /> Share
          </button>
          <button className="flex h-10 items-center gap-2 rounded-lg bg-admin-btn px-5 text-sm font-medium text-white shadow-card">
            <Pencil className="h-4 w-4" /> Edit
          </button>
        </div>
      </header>

      <div className="mt-5">
        <AdminJobTabs />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="text-[15px] font-semibold">Vehicle &amp; Customer</h3>
          <div className="mt-4 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/car-silver-3.png" alt="" className="h-9 w-16 object-contain" />
            <div>
              <p className="text-base font-semibold">{job.vehicle.name}</p>
              <p className="text-xs text-gray-500">{job.vehicle.reg}</p>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={job.vehicle.image} alt={job.vehicle.name} className="mx-auto mt-3 w-[88%] object-contain" />
          <ul className="mt-4 space-y-3 text-sm text-gray-700">
            <li className="flex items-center gap-3">
              <Bike className="h-4 w-4 text-gray-500" /> {job.vehicle.odometer}
            </li>
            <li className="flex items-center gap-3">
              <Wrench className="h-4 w-4 text-gray-500" /> {job.serviceType}
            </li>
            <li className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-4 w-4 text-gray-500" />
              <span>
                Expected Delivery
                <br />
                {job.expectedDate}
              </span>
            </li>
          </ul>
          <div className="mt-5 flex items-center gap-3 border-t border-admin-line pt-4">
            <Avatar src={job.customer.avatar} size={40} />
            <div className="text-sm">
              <p className="font-semibold">{job.customer.name}</p>
              <p className="text-gray-500">{job.customer.phone}</p>
              <p className="text-gray-500">{job.customer.email}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-5 text-[15px] font-semibold">Status Timeline</h3>
          <VTimeline steps={adminTimeline} />
        </Card>

        <Card className="p-5">
          <h3 className="text-[15px] font-semibold">Assigned Team</h3>
          <ul className="mt-4 space-y-4">
            {job.team.map((m) => (
              <li key={m.name} className="flex items-center gap-3">
                <Avatar src={m.avatar} size={40} />
                <div>
                  <p className="text-sm font-semibold">{m.name}</p>
                  <p className="text-xs text-gray-500">{m.role}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-admin-line pt-5">
            <p className="text-sm text-gray-600">Priority</p>
            <span className="mt-2 inline-flex items-center gap-2 rounded-md bg-bad-bg px-3 py-1.5 text-sm font-medium text-bad-fg">
              <Heart className="h-4 w-4 fill-current" /> {job.priority}
            </span>
          </div>
          <div className="mt-6 border-t border-admin-line pt-5">
            <p className="text-sm text-gray-600">Service Type</p>
            <p className="mt-1 text-[15px] font-semibold">{job.serviceType}</p>
          </div>
          <div className="mt-6 border-t border-admin-line pt-5">
            <p className="text-sm text-gray-600">Expected Delivery</p>
            <p className="mt-1 text-[15px] font-semibold">{job.expectedDelivery}</p>
          </div>
        </Card>
      </div>
    </>
  );
}
