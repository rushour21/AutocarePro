import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Vehicle Service Progress · AutoCare',
};

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-cust-page">{children}</div>;
}
