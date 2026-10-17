import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { myJobs } from '@/lib/data';

export default function InspectionsPage() {
  return (
    <div className="max-w-[900px] px-8 py-6">
      <h1 className="text-[26px] font-bold tracking-tight">Inspections</h1>
      <p className="mt-1 text-sm text-gray-500">Vehicles checked in today that need a damage inspection.</p>
      <ul className="mt-6 space-y-3">
        {myJobs.map((j) => (
          <li key={j.id} className="flex items-center gap-6 rounded-xl border border-emp-line bg-white px-5 py-4 shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={j.image} alt="" className="h-12 w-24 object-contain" />
            <div className="flex-1">
              <p className="font-semibold">#{j.id}</p>
              <p className="text-sm text-gray-500">
                {j.vehicle} · {j.reg}
              </p>
            </div>
            <Link href={`/employee/jobs/${j.id}/inspection`} className="flex items-center gap-2 text-sm font-medium text-emp-blue">
              Open inspection <ArrowRight className="h-4 w-4" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
