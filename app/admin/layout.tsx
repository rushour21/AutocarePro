import { AdminSidebar } from '@/components/admin/Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-admin-page">
      <AdminSidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
