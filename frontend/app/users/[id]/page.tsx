import NavBarComponent from "@/src/components/navBarComponent";
import UserProfilePageClient from "@/src/views/users/userProfilePageClient";

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <NavBarComponent />
      <UserProfilePageClient userId={id} />
    </>
  );
}
