const ELIGIBLE_RIGHTS = new Set(["original", "public_domain", "licensed", "authorized"]);

/** A chapter is public only after its parent work has passed publication review. */
export function canPublishChapter({ novelPublicationStatus, rightsStatus, rightsEvidence } = {}) {
  const rights = String(rightsStatus || "").trim().toLowerCase();
  if (String(novelPublicationStatus || "").trim().toLowerCase() !== "published") return false;
  if (!ELIGIBLE_RIGHTS.has(rights)) return false;
  if (rights !== "original" && !String(rightsEvidence || "").trim()) return false;
  return true;
}

/** Only the acting admin or an active, approved author can own an admin-created novel. */
export function validateNovelOwnerAssignment({ actorUserId, requestedOwnerId, targetUser } = {}) {
  const actorId = Number(actorUserId);
  const ownerId = requestedOwnerId === undefined || requestedOwnerId === null || requestedOwnerId === "" ? actorId : Number(requestedOwnerId);
  if (!Number.isSafeInteger(actorId) || actorId < 1 || !Number.isSafeInteger(ownerId) || ownerId < 1) {
    return { ok: false, error: "A valid creator account is required for ownership assignment." };
  }
  if (ownerId !== actorId && (!targetUser || Number(targetUser.id) !== ownerId || targetUser.role !== "author" || Number(targetUser.banned) !== 0)) {
    return { ok: false, error: "Ownership can only be assigned to an active, approved author account." };
  }
  return { ok: true, value: ownerId };
}
