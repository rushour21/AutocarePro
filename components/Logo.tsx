import clsx from 'clsx';

/** AutoCare shield mark used in the admin and employee portals. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={clsx('h-6 w-6', className)} aria-hidden>
      <path
        d="M12 2.5 4.5 5.4v6.1c0 4.6 3.2 8.6 7.5 10 4.3-1.4 7.5-5.4 7.5-10V5.4L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M8.6 14.6 12 7.6l3.4 7M9.8 12.3h4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={clsx('flex items-center gap-2.5 text-white', className)}>
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-tight">AutoCare</span>
    </div>
  );
}

/** Serif wordmark with the garage badge, used on the customer tracking pages. */
export function CustomerLogo({ className, size = 'md' }: { className?: string; size?: 'md' | 'lg' }) {
  return (
    <div className={clsx('flex items-center gap-2.5', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/logo-garage.png" alt="" className={clsx('rounded-full', size === 'lg' ? 'h-8 w-8' : 'h-7 w-7')} />
      <span className={clsx('font-serif font-semibold tracking-tight text-[#1b1d1e]', size === 'lg' ? 'text-[26px]' : 'text-[22px]')}>
        AutoCare
      </span>
    </div>
  );
}
