import assert from "node:assert/strict";
import { canPublishChapter } from "../src/creator-ownership-policy.mjs";

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
