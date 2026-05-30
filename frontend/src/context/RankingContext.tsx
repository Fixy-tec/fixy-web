"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/src/context/AuthContext";
import {
  fetchRanking,
  mapRankingEntry,
  type RankingStudent,
} from "@/src/lib/user";

interface RankingContextValue {
  /** Lista UI-ready ya ordenada por puntos DESC. */
  ranking: RankingStudent[];
  isLoading: boolean;
  error: string | null;
  /** Vuelve a pedir el top al backend. */
  refresh: () => Promise<void>;
}

const RankingContext = createContext<RankingContextValue | undefined>(undefined);

const DEFAULT_LIMIT = 100;

export function RankingProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [ranking, setRanking] = useState<RankingStudent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setRanking([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchRanking(token, { limit: DEFAULT_LIMIT });
      setRanking(data.map(mapRankingEntry));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el ranking");
      setRanking([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && token) {
      void refresh();
    } else {
      setRanking([]);
    }
  }, [isAuthenticated, token, refresh]);

  const value = useMemo<RankingContextValue>(
    () => ({ ranking, isLoading, error, refresh }),
    [ranking, isLoading, error, refresh],
  );

  return (
    <RankingContext.Provider value={value}>{children}</RankingContext.Provider>
  );
}

export function useRanking() {
  const ctx = useContext(RankingContext);
  if (!ctx) {
    throw new Error("useRanking debe usarse dentro de RankingProvider");
  }
  return ctx;
}
