import AdminNavbar from "@/src/components/admin/AdminNavbar";
import AdminPageClient from "@/src/views/admin/adminPageClient";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminPageClient>
      <div className="min-h-screen bg-[#f6f8fb]">
        <AdminNavbar />
        {children}
      </div>
    </AdminPageClient>
  );
}
