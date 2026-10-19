import { CreditCard } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { EmptyState } from '@/components/ui';

export default function PaymentMethods() {
  return (
    <>
      <TopBar showUser />
      <h1 className="mb-5 text-[26px] font-bold">Payment Methods</h1>
      <div className="neu mx-auto max-w-[720px]"><EmptyState icon={<CreditCard className="h-7 w-7" />} title="No saved payment methods" text="Pay your invoices securely when you view them. Saving cards is not available in this demo." /></div>
    </>
  );
}
