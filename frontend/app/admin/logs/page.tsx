import AdminShell from "@/src/components/admin/AdminShell";
import AdminLogsView from "@/src/views/admin/adminLogsView";

export default function AdminLogsPage() {
  return (
    <AdminShell>
      <AdminLogsView />
    </AdminShell>
  );
}
