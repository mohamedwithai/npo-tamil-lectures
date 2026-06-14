import { requireAdmin } from "@/lib/session";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Authoritative authorization (reads role from DB). Middleware only does a
  // fast cookie pre-check.
  await requireAdmin();

  return (
    <div className="container flex flex-col gap-8 py-8 md:flex-row">
      <AdminSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
