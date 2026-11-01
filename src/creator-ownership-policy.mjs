const ELIGIBLE_RIGHTS = new Set(["original", "public_domain", "licensed", "authorized"]);

/** A chapter is public only after its parent work has passed publication review. */
export function canPublishChapter({ novelPublicationStatus, rightsStatus, rightsEvidence } = {}) {
  const rights = String(rightsStatus || "").trim().toLowerCase();
  if (String(novelPublicationStatus || "").trim().toLowerCase() !== "published") return false;
  if (!ELIGIBLE_RIGHTS.has(rights)) return false;
  if (rights !== "original" && !String(rightsEvidence || "").trim()) return false;
  return true;
}
