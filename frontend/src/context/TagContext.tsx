"use client";

/**
 * Catálogo de tags (GET /api/tags).
 * `TagProvider` está en ClientProviders; las vistas usan el hook `useTags()` (o alias `useTagList`).
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { fetchTags, type TagDto } from "@/src/lib/tag";

export type { TagDto } from "@/src/lib/tag";

interface TagContextValue {
  tags: TagDto[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const TagContext = createContext<TagContextValue | undefined>(undefined);

export function TagProvider({ children }: { children: React.ReactNode }) {
  const [tags, setTags] = useState<TagDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await fetchTags();
      setTags(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar tags");
      setTags([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const value: TagContextValue = {
    tags,
    isLoading,
    error,
    refetch,
  };

  return <TagContext.Provider value={value}>{children}</TagContext.Provider>;
}

/** Lista de tags del backend: `{ tags, isLoading, error, refetch }`. */
export function useTags() {
  const ctx = useContext(TagContext);
  if (!ctx) {
    throw new Error("useTags debe usarse dentro de TagProvider (p. ej. ClientProviders)");
  }
  return ctx;
}

/** Mismo comportamiento que `useTags` (nombre alternativo si buscas “lista”). */
export const useTagList = useTags;
