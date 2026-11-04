const PERMISSIONS = Object.freeze({
  support_reviewer: Object.freeze(["queue:read", "case:read:minimal", "case:claim", "case:request_user_action"]),
  creator_rights_reviewer: Object.freeze(["queue:read", "case:read:minimal", "creator:read:ownership", "case:claim", "case:disposition:creator"]),
  finance_compliance_reviewer: Object.freeze(["queue:read", "case:read:minimal", "finance:read:retention_metadata", "case:claim", "case:disposition:finance"]),
  privacy_administrator: Object.freeze(["queue:read", "case:read:minimal", "case:claim", "case:prepare_disposition"]),
  deletion_second_approver: Object.freeze(["queue:read", "case:read:minimal", "case:approve"]),
});

const TRANSITIONS = Object.freeze({
  pending_deletion: Object.freeze(["review_required", "review_in_progress", "cancelled", "blocked_retention"]),
  review_required: Object.freeze(["review_in_progress", "awaiting_user_action", "blocked_retention", "cancelled"]),
  review_in_progress: Object.freeze(["review_required", "awaiting_user_action", "blocked_retention", "review_approved", "cancelled"]),
  awaiting_user_action: Object.freeze(["review_required", "review_in_progress", "blocked_retention", "cancelled"]),
  blocked_retention: Object.freeze(["review_required", "awaiting_user_action", "cancelled"]),
  review_approved: Object.freeze(["finalization_eligible", "blocked_retention"]),
  finalization_eligible: Object.freeze(["blocked_retention"]),
  cancelled: Object.freeze([]),
  rejected: Object.freeze([]),
  finalized: Object.freeze([]),
});

const has = (list, permission) => Array.isArray(list) && list.includes(permission);

export function permissionsForRoles(roles) {
  const result = new Set();
  for (const role of Array.isArray(roles) ? roles : []) {
    for (const permission of PERMISSIONS[role] || []) result.add(permission);
  }
  return [...result].sort();
}

export function canReviewCase({ actorId, subjectId, roles, permission }) {
  if (actorId == null || subjectId == null || String(actorId) === String(subjectId)) return false;
  return has(permissionsForRoles(roles), permission);
}

export function canTransitionDeletionReview({ from, to, actorId, subjectId, roles }) {
  if (!canReviewCase({ actorId, subjectId, roles, permission: "case:claim" })) return false;
  return Boolean(TRANSITIONS[from]?.includes(to));
}

export function canApproveDeletionDisposition({ proposerId, approverId, subjectId, roles, planDigest, currentPlanDigest }) {
  if (proposerId == null || approverId == null || subjectId == null) return false;
  if (String(proposerId) === String(approverId) || String(approverId) === String(subjectId)) return false;
  if (!has(permissionsForRoles(roles), "case:approve")) return false;
  if (typeof planDigest !== "string" || !/^[a-f0-9]{64}$/i.test(planDigest)) return false;
  return planDigest === currentPlanDigest;
}

export function canExecuteDeletionFinalization() {
  return false;
}

export const ACCOUNT_DELETION_REVIEW_STATES = Object.freeze(Object.keys(TRANSITIONS));
