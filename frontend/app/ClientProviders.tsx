"use client";

import { AuthProvider } from "@/src/context/AuthContext";
import { AdminProvider } from "@/src/context/AdminContext";
import { ToastProvider } from "@/src/context/ToastContext";
import { MedalsProvider } from "@/src/context/MedalsContext";
import { TagProvider } from "@/src/context/TagContext";
import { UserProfileProvider } from "@/src/context/UserProfileContext";
import { RequestProvider } from "@/src/context/RequestContext";
import { RankingProvider } from "@/src/context/RankingContext";
import { NotificationProvider } from "@/src/context/NotificationContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <TagProvider>
          <UserProfileProvider>
            <RequestProvider>
              <RankingProvider>
                <NotificationProvider>
                  <AdminProvider>
                    <MedalsProvider>{children}</MedalsProvider>
                  </AdminProvider>
                </NotificationProvider>
              </RankingProvider>
            </RequestProvider>
          </UserProfileProvider>
        </TagProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
