import { CheckCircle2, Download } from 'lucide-react';
import { CustomerHeader } from '@/components/customer/Sidebar';

export default function CustomerInvoice() {
  return (
    <>
      <CustomerHeader status="Completed" done />
      <div className="mt-6 max-w-[520px]">
        <div className="flex items-center gap-4">
          <h2 className="text-[22px] font-semibold">Invoice #INV-1024</h2>
          <span className="rounded-md bg-ok-bg px-3 py-1 text-sm font-medium text-ok-fg">Paid</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">Issued on 18 Dec 2024</p>

        <div className="mt-5 flex items-center justify-between rounded-xl border border-cust-line bg-white px-5 py-5">
          <span className="text-[28px] font-semibold">₹ 18,998</span>
          <a href="#" className="flex items-center gap-2 rounded-lg border border-cust-line px-4 py-2 text-sm font-medium text-cust-link">
            <Download className="h-4 w-4" /> Download PDF
          </a>
        </div>
        <div className="mt-2 divide-y divide-cust-line text-[15px]">
          <div className="flex justify-between px-1 py-3 text-gray-600">
            <span>Subtotal</span>
            <span>16,100</span>
          </div>
          <div className="flex justify-between px-1 py-3 text-gray-600">
            <span>GST (18%)</span>
            <span>2,898</span>
          </div>
          <div className="flex justify-between px-1 py-3 text-lg font-semibold">
            <span>Total Amount</span>
            <span>₹ 18,998</span>
          </div>
        </div>
        <div className="mt-4 border-t border-cust-line pt-5">
          <div className="flex items-center gap-4">
            <CheckCircle2 className="h-11 w-11 fill-[#28a464] text-white" />
            <div>
              <p className="text-[17px] font-medium">Payment Completed</p>
              <p className="text-sm text-gray-500">Paid on 18 Dec 2024, 04:15 PM</p>
            </div>
          </div>
          <div className="mt-4 flex justify-between text-sm text-gray-600">
            <span>UPI / Card</span>
            <span>•••• 4321</span>
          </div>
        </div>
        <button className="mt-5 h-14 w-full rounded-xl border border-cust-line bg-white text-[15px] font-medium">Download Receipt</button>
      </div>
    </>
  );
}
