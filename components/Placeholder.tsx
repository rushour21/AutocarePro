import Link from 'next/link';

/** Lightweight page for sidebar sections that have no design yet. */
export function Placeholder({ title, back, tone = 'admin' }: { title: string; back: string; tone?: 'admin' | 'emp' }) {
  return (
    <div className="px-8 py-7">
      <h1 className="text-[26px] font-bold tracking-tight">{title}</h1>
      <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white/60 p-10 text-center">
        <p className="text-sm text-gray-500">This section is part of AutoCare Pro but has no screen design yet.</p>
        <Link href={back} className={`mt-4 inline-block text-sm font-medium ${tone === 'emp' ? 'text-emp-blue' : 'text-[#2f6fed]'}`}>
          Go back
        </Link>
      </div>
    </div>
  );
}
