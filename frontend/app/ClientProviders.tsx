"use client";

import { AuthProvider } from "@/src/context/AuthContext";
import { MedalsProvider } from "@/src/context/MedalsContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <MedalsProvider>{children}</MedalsProvider>
    </AuthProvider>
  );
}
