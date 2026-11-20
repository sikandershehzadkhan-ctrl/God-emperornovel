function positiveSafeInteger(value) {
  if (typeof value !== "number" && !(typeof value === "string" && /^\d+$/.test(value))) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function parseReaderProgressTarget(payload) {
  const novelId = positiveSafeInteger(payload?.novel_id);
  const chapterNumber = positiveSafeInteger(payload?.chapter_number);
  if (novelId === null) {
    return { ok: false, error: "A valid novel id is required." };
  }
  if (chapterNumber === null) {
    return { ok: false, error: "A valid positive chapter number is required." };
  }
  return { ok: true, novelId, chapterNumber };
}
