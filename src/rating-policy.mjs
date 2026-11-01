export function parseNovelRating(input) {
  if (typeof input !== "number" || !Number.isSafeInteger(input) || input < 1 || input > 10) {
    return { ok: false, error: "Rating must be a whole number from 1 to 10." };
  }
  return { ok: true, value: input };
}
