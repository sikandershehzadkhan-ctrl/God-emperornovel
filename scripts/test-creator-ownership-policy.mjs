import assert from "node:assert/strict";
import {
  canPublishChapter, validateNovelOwnerAssignment,
  validateOwnershipTransferRequest, validateOwnershipTransferDecision
} from "../src/creator-ownership-policy.mjs";

const base = { novelPublicationStatus: "published", rightsStatus: "original", rightsEvidence: "" };
assert.equal(canPublishChapter(base), true, "published original work may publish chapters");
assert.equal(canPublishChapter({ ...base, novelPublicationStatus: "draft" }), false, "draft parent blocks chapter publication");
assert.equal(canPublishChapter({ ...base, novelPublicationStatus: "review" }), false, "parent under review blocks chapter publication");
assert.equal(canPublishChapter({ ...base, novelPublicationStatus: "archived" }), false, "archived parent blocks chapter publication");
assert.equal(canPublishChapter({ ...base, rightsStatus: "unknown" }), false, "unknown rights status is rejected");
assert.equal(canPublishChapter({ ...base, rightsStatus: "licensed" }), false, "licensed work requires evidence");
assert.equal(canPublishChapter({ ...base, rightsStatus: "licensed", rightsEvidence: "License agreement #42" }), true);
assert.equal(canPublishChapter({ ...base, rightsStatus: "public_domain", rightsEvidence: "Government archive record" }), true);
assert.equal(canPublishChapter({ ...base, rightsStatus: "authorized", rightsEvidence: "Written authorization" }), true);
assert.equal(canPublishChapter({ ...base, rightsStatus: "ORIGINAL" }), true, "rights status is normalized");
assert.equal(canPublishChapter({ ...base, novelPublicationStatus: "published ", rightsStatus: "licensed", rightsEvidence: "  " }), false);

assert.deepEqual(validateNovelOwnerAssignment({ actorUserId: 7 }), { ok: true, value: 7 }, "admin defaults to self ownership");
assert.deepEqual(validateNovelOwnerAssignment({ actorUserId: 7, requestedOwnerId: "12", targetUser: { id: 12, role: "author", banned: 0 } }), { ok: true, value: 12 });
assert.equal(validateNovelOwnerAssignment({ actorUserId: 7, requestedOwnerId: 0 }).ok, false);
assert.equal(validateNovelOwnerAssignment({ actorUserId: 7, requestedOwnerId: "not-a-user" }).ok, false);
assert.equal(validateNovelOwnerAssignment({ actorUserId: 7, requestedOwnerId: 12, targetUser: null }).ok, false);
assert.equal(validateNovelOwnerAssignment({ actorUserId: 7, requestedOwnerId: 12, targetUser: { id: 12, role: "user", banned: 0 } }).ok, false);
assert.equal(validateNovelOwnerAssignment({ actorUserId: 7, requestedOwnerId: 12, targetUser: { id: 12, role: "author", banned: 1 } }).ok, false);

const recipient = { id: 12, role: "author", banned: 0 };
const transfer = { actorUserId: 7, currentOwnerId: 7, recipientUser: recipient, novelPublicationStatus: "published" };
assert.deepEqual(validateOwnershipTransferRequest(transfer), { ok: true, value: { fromUserId: 7, toUserId: 12 } });
assert.equal(validateOwnershipTransferRequest({ ...transfer, actorUserId: 8 }).ok, false, "non-owner cannot request transfer");
assert.equal(validateOwnershipTransferRequest({ ...transfer, recipientUser: { ...recipient, banned: 1 } }).ok, false, "banned recipient rejected");
assert.equal(validateOwnershipTransferRequest({ ...transfer, recipientUser: { id: 12, role: "user", banned: 0 } }).ok, false, "non-author recipient rejected");
assert.equal(validateOwnershipTransferRequest({ ...transfer, recipientUser: { id: 7, role: "author", banned: 0 } }).ok, false, "self-transfer rejected");
assert.equal(validateOwnershipTransferRequest({ ...transfer, pendingTransfer: true }).ok, false, "duplicate pending transfer rejected");
assert.equal(validateOwnershipTransferRequest({ ...transfer, rightsReviewLocked: true }).ok, false, "rights review lock blocks transfer");
assert.equal(validateOwnershipTransferRequest({ ...transfer, moderationLocked: true }).ok, false, "moderation lock blocks transfer");

const decision = { actorUserId: 12, recipientUserId: 12, transferStatus: "pending", expiresAt: 2000, now: 1000, decision: "accept", currentOwnerId: 7, expectedOwnerId: 7, recipientUser: recipient };
assert.deepEqual(validateOwnershipTransferDecision(decision), { ok: true, value: "accept" });
assert.deepEqual(validateOwnershipTransferDecision({ ...decision, decision: "reject" }), { ok: true, value: "reject" });
assert.equal(validateOwnershipTransferDecision({ ...decision, actorUserId: 7 }).ok, false, "only recipient may decide");
assert.equal(validateOwnershipTransferDecision({ ...decision, transferStatus: "accepted" }).ok, false, "replay of completed transfer rejected");
assert.equal(validateOwnershipTransferDecision({ ...decision, expiresAt: 1000 }).ok, false, "expired invitation rejected");
assert.equal(validateOwnershipTransferDecision({ ...decision, decision: "delete" }).ok, false, "unknown decision rejected");
assert.equal(validateOwnershipTransferDecision({ ...decision, recipientUser: { ...recipient, banned: 1 } }).ok, false, "inactive recipient cannot accept");
assert.equal(validateOwnershipTransferDecision({ ...decision, currentOwnerId: 99 }).ok, false, "stale ownership blocks acceptance");
assert.equal(validateOwnershipTransferDecision({ ...decision, moderationLocked: true }).ok, false, "moderation lock blocks acceptance");
console.log("Creator ownership, chapter publication, and ownership transfer policy tests passed.");
