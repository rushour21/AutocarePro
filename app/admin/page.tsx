import Link from 'next/link';
import { CalendarDays, ChevronDown, ChevronRight, ClipboardList, AlarmClock, FileCheck2, BadgeIndianRupee } from 'lucide-react';
import { Card, Pill } from '@/components/ui';
import { ASSET, bays, dashboardStats, todaysJobs } from '@/lib/data';

const statIcon = {
  jobs: { Icon: ClipboardList, bg: 'bg-[#e8effd]', fg: 'text-[#2f6fed]' },
  clock: { Icon: AlarmClock, bg: 'bg-[#fdeae7]', fg: 'text-[#e5484d]' },
  ready: { Icon: FileCheck2, bg: 'bg-[#e3f4ea]', fg: 'text-[#1f9d63]' },
  revenue: { Icon: BadgeIndianRupee, bg: 'bg-[#e3f4ea]', fg: 'text-[#1f9d63]' },
} as const;

export default function AdminDashboard() {
  return (
    <div className="px-8 py-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Good morning, Rajesh 👋</h1>
          <p className="mt-1 text-sm text-gray-500">Here&apos;s what&apos;s happening in your garage today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex h-10 items-center gap-2 rounded-lg border border-admin-line bg-white px-4 text-sm text-gray-600 shadow-card">
            <CalendarDays className="h-4 w-4" />
            Today, 15 Dec 2024
          </button>
          <button className="flex h-10 min-w-[160px] items-center justify-between gap-6 rounded-lg border border-admin-line bg-white px-4 text-sm text-gray-600 shadow-card">
            All Branches
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {dashboardStats.map((s) => {
          const { Icon, bg, fg } = statIcon[s.icon as keyof typeof statIcon];
          return (
            <Card key={s.label} className="flex items-center gap-4 px-5 py-5">
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-6 w-6 ${fg}`} strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-2xl font-bold leading-tight">{s.value}</p>
                <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
                  {s.label}
                  {s.link && <ChevronRight className="h-4 w-4" />}
                </p>
              </div>
            </Card>
          );
        })}
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <div>
          <h2 className="mb-3 text-base font-semibold">Workshop Overview</h2>
          <div className="relative overflow-hidden rounded-xl shadow-card" style={{ aspectRatio: '266 / 201' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ASSET('workshop.jpg')} alt="Workshop floor" className="absolute inset-0 h-full w-full object-cover" />
            {bays.map((b, i) => (
              <div
                key={i}
                className="absolute flex w-[25.5%] flex-col justify-center rounded-lg bg-white px-[3.5%] shadow-pop"
                style={{ left: `${b.left - 0.6}%`, top: `${b.top - 0.8}%`, height: '24.5%' }}
              >
                <p className="text-[15px] font-semibold leading-5">{b.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-gray-700">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.dot }} />
                  {b.status}
                </p>
                <p className="ml-4 text-xs text-gray-400">{b.vehicle}</p>
                <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-white" />
              </div>
            ))}
          </div>
        </div>

        <Card className="self-start px-5 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Today&apos;s Jobs</h2>
            <Link href="/admin/job-cards" className="text-sm font-medium text-[#2f6fed]">
              View All
            </Link>
          </div>
          <ul className="mt-2 divide-y divide-admin-line">
            {todaysJobs.map((j) => (
              <li key={j.id}>
                <Link href={`/admin/job-cards/${j.id}`} className="flex items-center gap-4 py-3.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={j.image} alt="" className="h-9 w-16 object-contain" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{j.id}</p>
                    <p className="text-sm text-gray-500">{j.vehicle}</p>
                  </div>
                  <Pill tone={j.tone}>{j.status}</Pill>
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
