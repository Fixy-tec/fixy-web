import AdminShell from "@/src/components/admin/AdminShell";
import AdminDashboardView from "@/src/views/admin/adminDashboardView";

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <AdminDashboardView />
    </AdminShell>
  );
}
