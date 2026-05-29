"use client";

import { AuthProvider } from "@/src/context/AuthContext";
import { MedalsProvider } from "@/src/context/MedalsContext";
import { TagProvider } from "@/src/context/TagContext";
import { UserProfileProvider } from "@/src/context/UserProfileContext";
import { RequestProvider } from "@/src/context/RequestContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TagProvider>
        <UserProfileProvider>
          <RequestProvider>
            <MedalsProvider>{children}</MedalsProvider>
          </RequestProvider>
        </UserProfileProvider>
      </TagProvider>
    </AuthProvider>
  );
}
