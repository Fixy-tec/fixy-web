import AdminShell from "@/src/components/admin/AdminShell";
import AdminKpisView from "@/src/views/admin/adminKpisView";

export default function AdminIndicadoresPage() {
  return (
    <AdminShell>
      <AdminKpisView />
    </AdminShell>
  );
}
