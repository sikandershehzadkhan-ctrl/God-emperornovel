import assert from "node:assert/strict";
import { canPublishChapter, validateNovelOwnerAssignment } from "../src/creator-ownership-policy.mjs";

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
console.log("Creator ownership and chapter publication policy tests passed.");

assert.deepEqual(validateNovelOwnerAssignment({ actorUserId: 7 }), { ok: true, value: 7 }, "admin defaults to self ownership");
assert.deepEqual(validateNovelOwnerAssignment({ actorUserId: 7, requestedOwnerId: "12", targetUser: { id: 12, role: "author", banned: 0 } }), { ok: true, value: 12 });
assert.equal(validateNovelOwnerAssignment({ actorUserId: 7, requestedOwnerId: 0 }).ok, false, "zero owner id is rejected");
assert.equal(validateNovelOwnerAssignment({ actorUserId: 7, requestedOwnerId: "not-a-user" }).ok, false, "invalid owner id is rejected");
assert.equal(validateNovelOwnerAssignment({ actorUserId: 7, requestedOwnerId: 12, targetUser: null }).ok, false, "missing target account is rejected");
assert.equal(validateNovelOwnerAssignment({ actorUserId: 7, requestedOwnerId: 12, targetUser: { id: 12, role: "user", banned: 0 } }).ok, false, "non-author account cannot own admin-created work");
assert.equal(validateNovelOwnerAssignment({ actorUserId: 7, requestedOwnerId: 12, targetUser: { id: 12, role: "author", banned: 1 } }).ok, false, "banned author cannot receive ownership");
