export function containsEmoji(text: string): boolean {
  const emojiRegex =
    /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

  return emojiRegex.test(text);
}

export function countEmojis(text: string): number {
  const matches = text.match(
    /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu
  );

  return matches ? matches.length : 0;
}

export function normalizeUsername(
  username: string
): string {
  return username
    .trim()
    .toLowerCase();
}

export function normalizeText(
  text: string
): string {
  return text
    .trim()
    .replace(/\s+/g, " ");
}

export function countSpecialCharacters(
  text: string
): number {

  const matches = text.match(
    /[*\/.\-#!?]/g
  );

  return matches ? matches.length : 0;
}