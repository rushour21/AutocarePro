'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PartsRequests } from '@/components/employee/PartsRequests';

export default function PartsRequestPage() {
  return (
    <div className="px-8 py-6">
      <PartsRequests
        header={
          <Link href="/employee/jobs/G-1024" className="flex items-center gap-3 text-[15px] text-gray-600 hover:text-black">
            <ArrowLeft className="h-4 w-4" /> Job #G-1024
          </Link>
        }
      />
    </div>
  );
}
