import AdminShell from "@/src/components/admin/AdminShell";
import AdminUsersView from "@/src/views/admin/adminUsersView";

export default function AdminUsersPage() {
  return (
    <AdminShell>
      <AdminUsersView />
    </AdminShell>
  );
}
