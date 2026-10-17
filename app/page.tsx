import Link from 'next/link';
import { ArrowRight, Building2, Smartphone, Wrench } from 'lucide-react';
import { LogoMark } from '@/components/Logo';
import { TRACK_CODE } from '@/lib/data';

const PORTALS = [
  { href: '/admin', title: 'Admin Portal', who: 'Garage Owner / Manager', icon: Building2, tone: 'bg-admin-btn' },
  { href: '/employee', title: 'Employee Portal', who: 'Mechanic / Service Advisor', icon: Wrench, tone: 'bg-emp-blue' },
  { href: `/track/${TRACK_CODE}`, title: 'Customer Tracking', who: 'Vehicle owner (desktop & mobile)', icon: Smartphone, tone: 'bg-cust-teal' },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-admin-page px-6 py-16">
      <div className="flex items-center gap-3 text-admin-ink">
        <LogoMark className="h-8 w-8" />
        <span className="text-3xl font-bold tracking-tight">AutoCare Pro</span>
      </div>
      <p className="mt-3 text-gray-500">Every repair. Under control.</p>
      <div className="mt-10 grid w-full max-w-4xl gap-5 md:grid-cols-3">
        {PORTALS.map(({ href, title, who, icon: Icon, tone }) => (
          <Link key={href} href={href} className="group rounded-2xl border border-admin-line bg-white p-6 shadow-card transition hover:shadow-pop">
            <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-white ${tone}`}>
              <Icon className="h-6 w-6" />
            </span>
            <p className="mt-6 text-lg font-semibold">{title}</p>
            <p className="mt-1 text-sm text-gray-500">{who}</p>
            <span className="mt-6 flex items-center gap-2 text-sm font-medium text-gray-700 group-hover:text-black">
              Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
