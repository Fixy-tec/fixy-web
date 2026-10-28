import AdminShell from "@/src/components/admin/AdminShell";
import AdminPaymentsView from "@/src/views/admin/adminPaymentsView";

export default function AdminPaymentsPage() {
  return (
    <AdminShell>
      <AdminPaymentsView />
    </AdminShell>
  );
}
