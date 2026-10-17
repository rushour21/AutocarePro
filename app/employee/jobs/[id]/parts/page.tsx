'use client';

import { EmpJobBar, EmpJobTabs } from '@/components/employee/JobNav';
import { PartsRequests } from '@/components/employee/PartsRequests';

export default function EmpJobParts() {
  return (
    <>
      <EmpJobBar />
      <EmpJobTabs />
      <div className="mt-5">
        <PartsRequests header={<h2 className="text-lg font-semibold">Parts Request</h2>} />
      </div>
    </>
  );
}
