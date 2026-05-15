"use client";

import { AuthProvider } from "@/src/context/AuthContext";
import { MedalsProvider } from "@/src/context/MedalsContext";
import { TagProvider } from "@/src/context/TagContext";
import { UserProfileProvider } from "@/src/context/UserProfileContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TagProvider>
        <UserProfileProvider>
          <MedalsProvider>{children}</MedalsProvider>
        </UserProfileProvider>
      </TagProvider>
    </AuthProvider>
  );
}
