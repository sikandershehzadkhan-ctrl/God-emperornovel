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

const validId = value => Number.isSafeInteger(Number(value)) && Number(value) > 0;
const activeAuthor = user => Boolean(user && user.role === "author" && Number(user.banned) === 0);

/** Validate a transfer request without mutating ownership. */
export function validateOwnershipTransferRequest({
  actorUserId, currentOwnerId, recipientUser, novelPublicationStatus,
  rightsReviewLocked = false, moderationLocked = false, pendingTransfer = false
} = {}) {
  if (!validId(actorUserId) || Number(actorUserId) !== Number(currentOwnerId)) {
    return { ok: false, error: "Only the current novel owner may request a transfer." };
  }
  if (!activeAuthor(recipientUser) || !validId(recipientUser.id)) {
    return { ok: false, error: "The recipient must be an active, approved author account." };
  }
  if (Number(recipientUser.id) === Number(currentOwnerId)) {
    return { ok: false, error: "A novel cannot be transferred to its current owner." };
  }
  if (String(novelPublicationStatus || "").toLowerCase() === "deleted" || rightsReviewLocked || moderationLocked) {
    return { ok: false, error: "This novel is restricted from ownership changes." };
  }
  if (pendingTransfer) return { ok: false, error: "A pending ownership transfer already exists." };
  return { ok: true, value: { fromUserId: Number(currentOwnerId), toUserId: Number(recipientUser.id) } };
}

/** Only the invited recipient can accept or reject a live pending transfer. */
export function validateOwnershipTransferDecision({
  actorUserId, recipientUserId, transferStatus, expiresAt, now = Math.floor(Date.now() / 1000),
  decision, currentOwnerId, recipientUser, rightsReviewLocked = false, moderationLocked = false
} = {}) {
  if (!validId(actorUserId) || Number(actorUserId) !== Number(recipientUserId)) {
    return { ok: false, error: "Only the invited recipient may decide this transfer." };
  }
  if (String(transferStatus || "").toLowerCase() !== "pending") {
    return { ok: false, error: "This transfer is no longer pending." };
  }
  if (!Number.isFinite(Number(expiresAt)) || Number(expiresAt) <= Number(now)) {
    return { ok: false, error: "This transfer invitation has expired." };
  }
  if (!["accept", "reject"].includes(String(decision || "").toLowerCase())) {
    return { ok: false, error: "A valid accept or reject decision is required." };
  }
  if (String(decision).toLowerCase() === "accept") {
    if (!validId(currentOwnerId) || !activeAuthor(recipientUser) || Number(recipientUser.id) !== Number(recipientUserId)) {
      return { ok: false, error: "The ownership or recipient account is no longer eligible." };
    }
    if (rightsReviewLocked || moderationLocked) {
      return { ok: false, error: "This novel is restricted from ownership changes." };
    }
  }
  return { ok: true, value: String(decision).toLowerCase() };
}
