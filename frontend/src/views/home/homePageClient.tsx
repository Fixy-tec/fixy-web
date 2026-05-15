"use client";

import { Loader2 } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import HomeView from "@/src/views/homeView";
import HomeLoggedView from "@/src/views/home/homeLoggedView";

export default function HomePageClient() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a4ca3]" />
      </div>
    );
  }

  return isAuthenticated ? <HomeLoggedView /> : <HomeView />;
}
