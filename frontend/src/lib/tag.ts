const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const FETCH_TIMEOUT_MS = 8000;

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
 * Aborta la petición si el servidor tarda más de FETCH_TIMEOUT_MS
 * en responder (servidor vivo pero lento), en vez de esperar indefinidamente.
 */
export async function fetchTags(): Promise<TagDto[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}/tags`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        (error as { message?: string }).message ?? "Error al cargar tags",
      );
    }

    const body = (await response.json()) as TagsResponse;
    return body.tags ?? [];
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error(
        "El servidor está tardando demasiado en responder. Intenta de nuevo en unos momentos.",
      );
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}