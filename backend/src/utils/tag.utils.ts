export function normalizeTag(
  tag: string
): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}