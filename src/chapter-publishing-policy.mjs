const RIGHTS = new Set(["original", "public_domain", "licensed", "authorized"]);
const MAX_CHAPTER_NUMBER = 100000;
const MAX_CHAPTER_CHARACTERS = 100000;
const MAX_TICKET_COST = 100000;

export function validateChapterDraft(input = {}) {
  const chapterNumber = Number(input.chapter_number);
  const title = String(input.title ?? "").trim();
  const content = String(input.content ?? "");
  const ticketCost = Number(input.ticket_cost ?? 0);
  const lockedValue = input.is_locked;
  const isLocked = lockedValue === undefined ? false
    : lockedValue === true || lockedValue === 1 || lockedValue === "1" || lockedValue === "on";

  if (!Number.isSafeInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > MAX_CHAPTER_NUMBER) {
    return { ok: false, error: "Chapter number must be a whole number between 1 and 100,000." };
  }
  if (!title || title.length > 180) {
    return { ok: false, error: "Chapter title must be between 1 and 180 characters." };
  }
  if (!content.trim() || content.length > MAX_CHAPTER_CHARACTERS) {
    return { ok: false, error: "Chapter text must be between 1 and 100,000 characters." };
  }
  if (!Number.isSafeInteger(ticketCost) || ticketCost < 0 || ticketCost > MAX_TICKET_COST) {
    return { ok: false, error: "Ticket cost must be a whole number between 0 and 100,000." };
  }

  return {
    ok: true,
    value: {
      chapter_number: chapterNumber,
      title,
      content,
      is_locked: isLocked,
      ticket_cost: ticketCost,
    },
  };
}

export function validateChapterPublication(novel = {}) {
  const rights = String(novel.rights_status || "").trim().toLowerCase();
  if (String(novel.publication_status || "").toLowerCase() !== "published") {
    return { ok: false, error: "Publish the parent novel only after its own publication review." };
  }
  if (!RIGHTS.has(rights)) {
    return { ok: false, error: "Novel rights are not eligible for chapter publication." };
  }
  if (rights !== "original" && !String(novel.rights_evidence || "").trim()) {
    return { ok: false, error: "Rights evidence is required before publishing chapters of non-original works." };
  }
  return { ok: true };
}
