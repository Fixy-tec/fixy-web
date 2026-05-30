"use client";

import { useCallback, useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useUserProfile } from "@/src/context/UserProfileContext";
import {
  fetchUserById,
  mapUserDtoToProfile,
} from "@/src/lib/user";
import { isHttpError } from "@/src/lib/httpError";
import UserProfileView, { type UserProfile } from "@/src/views/userProfileView";

interface Props {
  userId: string;
}

export default function UserProfilePageClient({ userId }: Props) {
  const router = useRouter();
  const {
    user: authUser,
    token,
    isAuthenticated,
    isLoading: authLoading,
    isLoggingOut,
  } = useAuth();
  const {
    profileUser,
    isLoading: contextLoading,
    refreshProfile,
  } = useUserProfile();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isOwner = authUser?.id === userId;

  const loadProfile = useCallback(async () => {
    if (!token) return;

    if (isOwner && profileUser?.id === userId) {
      setProfile(mapUserDtoToProfile(profileUser));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const dto = await fetchUserById(token, userId);
      setProfile(mapUserDtoToProfile(dto));
    } catch (error) {
      if (isHttpError(error, 404)) {
        notFound();
        return;
      }
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [token, userId, isOwner, profileUser]);

  useEffect(() => {
    if (authLoading) return;
    // Logout en progreso: no redirigimos a /forbidden, el AuthContext ya
    // está navegando a /auth/login.
    if (isLoggingOut) return;
    if (!isAuthenticated || !token) {
      router.replace(
        `/forbidden?from=${encodeURIComponent(`/users/${userId}`)}`,
      );
      return;
    }

    if (isOwner && contextLoading) return;

    void loadProfile();
  }, [
    authLoading,
    isAuthenticated,
    isLoggingOut,
    token,
    userId,
    router,
    loadProfile,
    isOwner,
    contextLoading,
  ]);

  const handleProfileUpdated = useCallback(
    (updated: UserProfile) => {
      setProfile(updated);
      if (isOwner) {
        void refreshProfile();
      }
    },
    [isOwner, refreshProfile],
  );

  if (authLoading || isLoading || (isOwner && contextLoading && !profile)) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a4ca3]" />
      </div>
    );
  }

  if (!profile) {
    notFound();
  }

  return (
    <UserProfileView
      user={profile}
      isOwner={isOwner}
      onProfileUpdated={handleProfileUpdated}
    />
  );
}
