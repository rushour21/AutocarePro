import { CalendarDays, Download, Gauge } from 'lucide-react';
import { CustomerLogo } from '@/components/Logo';
import { Avatar } from '@/components/ui';
import { ASSET, job } from '@/lib/data';
import Link from 'next/link';

export default async function ServiceSummary({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <div className="flex min-h-screen items-start justify-center px-4 py-10">
      <div className="w-full max-w-[600px] rounded-2xl bg-cust-card p-7 shadow-pop">
        <div className="flex items-center justify-between">
          <Link href={`/track/${code}`}>
            <CustomerLogo />
          </Link>
          <span className="text-[15px] text-gray-700">Job #{job.id}</span>
          <span className="rounded-md bg-ok-bg px-3 py-1 text-sm font-medium text-ok-fg">Completed</span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={job.vehicle.image} alt={job.vehicle.name} className="mx-auto mt-6 w-[86%] object-contain" />
        <div className="mt-6 flex items-center justify-between">
          <p className="text-2xl font-semibold">{job.vehicle.name}</p>
          <span className="rounded-md bg-[#efede8] px-3 py-1 text-sm text-gray-600">{job.serviceType}</span>
        </div>
        <p className="mt-1 text-[15px] text-gray-600">{job.vehicle.reg}</p>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <Gauge className="h-6 w-6" strokeWidth={1.6} />
            <div>
              <p className="text-sm font-semibold">{job.vehicle.odometer}</p>
              <p className="text-xs text-gray-500">Odometer</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CalendarDays className="h-6 w-6" strokeWidth={1.6} />
            <div>
              <p className="text-sm font-semibold">{job.expectedDate}</p>
              <p className="text-xs text-gray-500">Completion Date</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Avatar src={ASSET('avatar-rajesh.png')} size={30} />
            <div>
              <p className="text-sm font-semibold">Rajesh Sharma</p>
              <p className="text-xs text-gray-500">Service Advisor</p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-[#efede8] px-5 py-4">
          <p className="text-sm font-semibold">Work Completed</p>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Front bumper repair and painting, right rear door dent repair.
            <br />
            Vehicle quality checked and ready for pickup.
          </p>
        </div>
        <button className="mt-5 flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#26353a] text-[17px] font-medium text-white">
          <Download className="h-5 w-5" /> Download Service Report
        </button>
      </div>
    </div>
  );
}
