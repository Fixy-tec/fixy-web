import NavBarComponent from "@/src/components/navBarComponent";
import HomePageClient from "@/src/views/home/homePageClient";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <NavBarComponent />
      <main className="flex-1">
        <HomePageClient />
      </main>
    </div>
  );
}
