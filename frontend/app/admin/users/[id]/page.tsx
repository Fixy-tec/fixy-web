import AdminShell from "@/src/components/admin/AdminShell";
import AdminUserDetailView from "@/src/views/admin/adminUserDetailView";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <AdminShell>
      <AdminUserDetailView userId={id} />
    </AdminShell>
  );
}
