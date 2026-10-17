import { AdminJobBar, AdminJobTabs } from '@/components/admin/JobTabs';
import { PartsInventory } from '@/components/admin/PartsInventory';

export default function AdminPartsLabour() {
  return (
    <>
      <AdminJobBar />
      <AdminJobTabs />
      <div className="mt-6">
        <PartsInventory />
      </div>
    </>
  );
}
