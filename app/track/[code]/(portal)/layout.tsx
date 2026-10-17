import { CustomerMobileNav, CustomerSidebar } from '@/components/customer/Sidebar';

export default function CustomerPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-cust-page text-[#1b1d1e]">
      <CustomerSidebar />
      <main className="min-w-0 flex-1">
        <CustomerMobileNav />
        <div className="mx-auto max-w-[1080px] px-4 py-5 md:px-10 md:py-8">{children}</div>
      </main>
    </div>
  );
}
