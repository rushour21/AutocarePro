'use client';

import { CalendarDays, Car, Gauge, MessageCircle, Phone } from 'lucide-react';
import { EmpJobHeader } from '@/components/employee/JobNav';
import { Avatar, VTimeline } from '@/components/ui';
import { employeeTimeline, job } from '@/lib/data';

export default function EmpJobOverview() {
  return (
    <>
      <EmpJobHeader />
      <div className="mt-5 grid max-w-[1100px] gap-5 lg:grid-cols-[1.15fr_1fr]">
        <div className="rounded-xl border border-emp-line bg-white p-6 shadow-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={job.vehicle.image} alt={job.vehicle.name} className="w-[78%] object-contain" />
          <p className="mt-4 text-lg font-bold">{job.vehicle.name}</p>
          <p className="text-[15px] text-gray-700">{job.vehicle.reg}</p>
          <ul className="mt-3 space-y-3 text-sm text-gray-600">
            <li className="flex items-center gap-3">
              <Gauge className="h-4 w-4" /> {job.vehicle.odometer}
            </li>
            <li className="flex items-center gap-3">
              <Car className="h-4 w-4" /> {job.serviceType}
            </li>
            <li className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-4 w-4" />
              <span>
                Expected Delivery
                <br />
                {job.expectedDelivery}
              </span>
            </li>
          </ul>
          <div className="mt-6 border-t border-emp-line pt-5">
            <p className="text-sm font-medium">Customer</p>
            <div className="mt-3 flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8fb6f2] text-base font-semibold text-white">R</span>
              <div className="flex-1 text-sm">
                <p className="font-semibold">{job.customer.name}</p>
                <p className="text-gray-500">{job.customer.phone}</p>
              </div>
              <a href={`tel:${job.customer.phone.replace(/\s/g, '')}`} className="rounded-full p-2 text-gray-700 hover:bg-gray-100" aria-label="Call customer">
                <Phone className="h-5 w-5" />
              </a>
              <a href="https://wa.me/919876543210" className="rounded-full p-2 text-[#25a244] hover:bg-gray-100" aria-label="WhatsApp customer">
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-emp-line bg-white p-6 shadow-card">
          <h3 className="mb-5 text-base font-semibold">Status Timeline</h3>
          <VTimeline steps={employeeTimeline} />
          <div className="mt-6 border-t border-emp-line pt-5">
            <h3 className="text-base font-semibold">Assigned Team</h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {job.team.map((m) => (
                <div key={m.name} className="flex items-center gap-3">
                  <Avatar src={m.avatar} size={40} />
                  <div>
                    <p className="text-sm font-semibold">{m.name}</p>
                    <p className="text-xs text-gray-500">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
