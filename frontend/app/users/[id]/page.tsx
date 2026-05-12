import UserProfileView, { UserProfile } from "@/src/views/userProfileView";
import NavBarComponent from "@/src/components/navBarComponent";

// Hardcoded por ahora — después reemplaza con fetch real
const MOCK_USER: UserProfile = {
  id: 1,
  name: "Valeria Ríos",
  carrera: "DDS",
  avatar: "/avatars/fixoArte.png",
  points: 9800,
  medal: "Maestro",
  ranking: 1,
  rating: 4.9,
  completadas: 42,
  bio: "Estudiante de DDS apasionada por el backend y las APIs.",
  whatsapp: "999 999 999",
  tags: ["React", "Next.js", "Python", "Docker"],
  github: "https://github.com/valeria",
  linkedin: "https://linkedin.com/in/valeria",
};

// ID del usuario logueado — después viene de tu auth (session/cookie/context)
const LOGGED_IN_ID = 1;

export default async function UserPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const userId = parseInt(id);
  const isOwner = userId === LOGGED_IN_ID;

  return (
    <>
      <NavBarComponent />
      <UserProfileView user={MOCK_USER} isOwner={isOwner} />
    </>
  );
}
