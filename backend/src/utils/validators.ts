export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[A-Za-z]{5,15}$/;

  return usernameRegex.test(username);
}

export function containsEmoji(text: string): boolean {
  const emojiRegex =
    /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

  return emojiRegex.test(text);
}

export function isValidPassword(password: string): boolean {
  // 8-20 chars
  // at least 1 letter
  // at least 1 number

  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_\-+=\[\]{};:'",.<>/?\\|`~]{8,20}$/;

  return (
    passwordRegex.test(password) &&
    !containsEmoji(password)
  );
}