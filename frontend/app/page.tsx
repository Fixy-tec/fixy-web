import HomeView from "@/src/views/homeView";
import NavBarComponent from "@/src/components/navBarComponent";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <NavBarComponent />
      <main className="flex-1">
        <HomeView />
      </main>
    </div>
  );
}
