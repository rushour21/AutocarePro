'use client';

import { TopBar } from '@/components/layout/AppShell';
import { Card } from '@/components/ui';

export function SettingsFrame({ title, children, wide }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <>
      <TopBar showUser />
      <Card className={`mx-auto p-6 sm:p-8 ${wide ? 'max-w-[980px]' : 'max-w-[760px]'}`}>
        <h1 className="mb-6 text-[22px] font-bold">{title}</h1>
        {children}
      </Card>
    </>
  );
}
