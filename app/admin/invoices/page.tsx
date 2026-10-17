import { InvoiceList } from '@/components/admin/InvoiceList';

export default function InvoicesPage() {
  return (
    <div className="px-8 py-7">
      <h1 className="mb-5 text-[26px] font-bold tracking-tight">Invoices &amp; Payments</h1>
      <InvoiceList />
    </div>
  );
}
