"use client";

import { AuthProvider } from "@/src/context/AuthContext";
import { MedalsProvider } from "@/src/context/MedalsContext";
import { TagProvider } from "@/src/context/TagContext";
import { UserProfileProvider } from "@/src/context/UserProfileContext";
import { RequestProvider } from "@/src/context/RequestContext";
import { RankingProvider } from "@/src/context/RankingContext";
import { NotificationProvider } from "@/src/context/NotificationContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TagProvider>
        <UserProfileProvider>
          <RequestProvider>
            <RankingProvider>
              <NotificationProvider>
                <MedalsProvider>{children}</MedalsProvider>
              </NotificationProvider>
            </RankingProvider>
          </RequestProvider>
        </UserProfileProvider>
      </TagProvider>
    </AuthProvider>
  );
}
