import { Check, ArrowUp } from 'lucide-react';
import { CustomerHeader } from '@/components/customer/Sidebar';
import { customerProgress } from '@/lib/data';

export default function CustomerProgress() {
  return (
    <>
      <CustomerHeader />
      <ol className="mt-6 max-w-[760px]">
        {customerProgress.map((s, i) => {
          const last = i === customerProgress.length - 1;
          return (
            <li key={s.title} className="relative flex gap-5 border-b border-cust-line py-5 last:border-0">
              {!last && <span className="absolute left-[13px] top-12 h-full w-[3px]" style={{ background: s.state === 'current' ? 'linear-gradient(#1d63ed, #28a464)' : '#28a464' }} />}
              <span className="relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: s.state === 'current' ? '#1d63ed' : '#28a464' }}>
                {s.state === 'current' ? <ArrowUp className="h-4 w-4 text-white" strokeWidth={3} /> : <Check className="h-4 w-4 text-white" strokeWidth={3} />}
              </span>
              <div className="flex-1">
                <p className="text-[17px] font-medium">{s.title}</p>
                <p className="mt-1 text-sm text-gray-500">{s.time}</p>
                <p className="mt-1.5 max-w-[340px] text-sm text-gray-600">{s.text}</p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.photo} alt="" className="h-[104px] w-[124px] rounded-xl object-cover" />
            </li>
          );
        })}
      </ol>
    </>
  );
}
