function parsePositiveSafeInteger(value) {
  if (typeof value === "number") return Number.isSafeInteger(value) && value > 0 ? value : null;
  if (typeof value !== "string" || !/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value.trim());
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function parseNovelRatingInput(input) {
  const novelId = parsePositiveSafeInteger(input?.novel_id);
  if (novelId === null) return { ok: false, error: "A valid novel id is required." };

  const rating = parsePositiveSafeInteger(input?.rating);
  if (rating === null || rating > 5) {
    return { ok: false, error: "Rating must be a whole number from 1 to 5." };
  }

  return { ok: true, novelId, rating };
}
