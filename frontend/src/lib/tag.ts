const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export interface TagDto {
  id: string;
  name: string;
  isCustom: boolean;
  createdAt: string;
}

export interface TagsResponse {
  tags: TagDto[];
}

/**
 * Lista pública de tags (catálogo en BD).
 */
export async function fetchTags(): Promise<TagDto[]> {
  const response = await fetch(`${API_BASE}/tags`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { message?: string }).message ?? "Error al cargar tags",
    );
  }

  const body = (await response.json()) as TagsResponse;
  return body.tags ?? [];
}
