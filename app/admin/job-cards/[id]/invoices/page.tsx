import { AdminJobBar, AdminJobTabs } from '@/components/admin/JobTabs';
import { InvoiceList } from '@/components/admin/InvoiceList';

export default function AdminJobInvoices() {
  return (
    <>
      <AdminJobBar />
      <AdminJobTabs />
      <div className="mt-6">
        <InvoiceList only="INV-1024" />
      </div>
    </>
  );
}
