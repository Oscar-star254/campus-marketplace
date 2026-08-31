const PHONE_LIKE_THRESHOLD = 7;

export function containsPhoneNumberLike(text: string): boolean {
  const candidates = text.match(/[\d][\d\-.\s]{5,}[\d]/g) || [];
  return candidates.some((c) => c.replace(/\D/g, "").length >= PHONE_LIKE_THRESHOLD);
}

export const PHONE_BLOCK_MESSAGE =
  "That looks like it might contain a phone number — numbers aren't allowed here. Agree on a price, then start the deal to move things forward safely.";