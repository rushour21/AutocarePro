import { EmployeeSidebar } from '@/components/employee/Sidebar';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-emp-page">
      <EmployeeSidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
