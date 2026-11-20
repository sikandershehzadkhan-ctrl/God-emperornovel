import assert from "node:assert/strict";
import {
  permissionsForRoles,
  canReviewCase,
  canTransitionDeletionReview,
  canApproveDeletionDisposition,
  canExecuteDeletionFinalization,
} from "../src/account-deletion-review-policy.mjs";

assert.deepEqual(permissionsForRoles(["support_reviewer"]), [
  "case:claim", "case:read:minimal", "case:request_user_action", "queue:read",
]);
assert.equal(permissionsForRoles(["admin"]).includes("case:approve"), false, "ordinary admin role must not imply deletion-review approval");
assert.equal(permissionsForRoles(["privacy_administrator"]).includes("finance:read:retention_metadata"), false);
assert.equal(canReviewCase({actorId:1,subjectId:2,roles:["support_reviewer"],permission:"case:read:minimal"}), true);
assert.equal(canReviewCase({actorId:2,subjectId:2,roles:["support_reviewer"],permission:"case:read:minimal"}), false, "requester cannot review own case");
assert.equal(canReviewCase({actorId:1,subjectId:2,roles:["support_reviewer"],permission:"finance:read:retention_metadata"}), false, "support reviewer cannot inspect finance metadata");
assert.equal(canTransitionDeletionReview({from:"review_in_progress",to:"review_approved",actorId:3,subjectId:2,roles:["privacy_administrator"]}), true);
assert.equal(canTransitionDeletionReview({from:"cancelled",to:"review_in_progress",actorId:3,subjectId:2,roles:["privacy_administrator"]}), false, "terminal cancelled state cannot reopen");
assert.equal(canTransitionDeletionReview({from:"review_in_progress",to:"finalized",actorId:3,subjectId:2,roles:["privacy_administrator"]}), false, "review transition cannot finalize account");
const digest = "a".repeat(64);
assert.equal(canApproveDeletionDisposition({proposerId:3,approverId:4,subjectId:2,roles:["deletion_second_approver"],planDigest:digest,currentPlanDigest:digest}), true);
assert.equal(canApproveDeletionDisposition({proposerId:3,approverId:3,subjectId:2,roles:["deletion_second_approver"],planDigest:digest,currentPlanDigest:digest}), false, "proposer cannot approve own disposition");
assert.equal(canApproveDeletionDisposition({proposerId:3,approverId:2,subjectId:2,roles:["deletion_second_approver"],planDigest:digest,currentPlanDigest:digest}), false, "requester cannot approve own deletion");
assert.equal(canApproveDeletionDisposition({proposerId:3,approverId:4,subjectId:2,roles:["deletion_second_approver"],planDigest:digest,currentPlanDigest:"b".repeat(64)}), false, "changed plan invalidates approval");
assert.equal(canApproveDeletionDisposition({proposerId:3,approverId:4,subjectId:2,roles:["support_reviewer"],planDigest:digest,currentPlanDigest:digest}), false, "support role cannot approve");
assert.equal(canExecuteDeletionFinalization(), false, "finalization remains disabled until separately implemented and reviewed");
console.log("PASS: account deletion review role separation, self-review denial, transition allowlist, two-person approval, stale-plan rejection, and disabled finalization.");
