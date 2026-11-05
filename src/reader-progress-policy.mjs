export function parseReaderProgressTarget(payload) {
  const novelId = Number(payload?.novel_id);
  const chapterNumber = Number(payload?.chapter_number);
  if (!Number.isSafeInteger(novelId) || novelId < 1) {
    return { ok: false, error: "A valid novel id is required." };
  }
  if (!Number.isSafeInteger(chapterNumber) || chapterNumber < 1) {
    return { ok: false, error: "A valid positive chapter number is required." };
  }
  return { ok: true, novelId, chapterNumber };
}
