import { canApproveDeletionDisposition } from "./account-deletion-review-policy.mjs";

export const DISPOSITION_APPROVAL_POLICY_VERSION = "2026-11-approval-v1";

export function canApproveCurrentDisposition({
  actorId,
  subjectId,
  proposerId,
  reviewerRoles,
  activeAssignment = true,
  reviewState,
  reviewVersion,
  planBaseReviewVersion,
  planId,
  latestPlanId,
  planDigest,
  currentPlanDigest,
}) {
  if (!activeAssignment) return false;
  if (reviewState !== "review_in_progress") return false;
  if (!Number.isSafeInteger(reviewVersion) ||
      !Number.isSafeInteger(planBaseReviewVersion) ||
      reviewVersion !== planBaseReviewVersion + 1) return false;
  if (!Number.isSafeInteger(planId) || !Number.isSafeInteger(latestPlanId) ||
      planId !== latestPlanId) return false;
  return canApproveDeletionDisposition({
    proposerId,
    approverId: actorId,
    subjectId,
    roles: reviewerRoles,
    planDigest,
    currentPlanDigest,
  });
}
