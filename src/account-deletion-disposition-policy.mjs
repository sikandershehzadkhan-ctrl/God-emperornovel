export const DISPOSITION_POLICY_VERSION = "2026-11-v1";

export const DISPOSITION_DEPENDENCIES = Object.freeze({
  creator_content: "case:disposition:creator",
  creator_rights: "case:disposition:creator",
  ownership_transfers: "case:disposition:creator",
  financial_ledger: "case:disposition:finance",
  donations_refunds_disputes: "case:disposition:finance",
  moderation_legal_holds: "case:prepare_disposition",
  ai_projects: "case:prepare_disposition",
  omniportal_jobs: "case:prepare_disposition",
  sessions_notifications: "case:prepare_disposition",
  provider_records: "case:prepare_disposition",
  backups: "case:prepare_disposition",
});

const OUTCOMES = new Set([
  "retain", "anonymize", "delete", "transfer_with_consent",
  "await_user_action", "block",
]);

const boundedText = (value, max) =>
  typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;

export function validateDispositionItems(items, permissions, { requireComplete = false } = {}) {
  if (!Array.isArray(items) || items.length < 1 || items.length > Object.keys(DISPOSITION_DEPENDENCIES).length) {
    return { ok: false, error: "A bounded, non-empty dependency submission is required." };
  }
  if (!Array.isArray(permissions)) return { ok: false, error: "Reviewer permissions are required." };
  const seen = new Set();
  const normalized = [];
  for (const item of items) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return { ok: false, error: "Invalid dependency item." };
    }
    const key = item.dependency_key;
    const required = DISPOSITION_DEPENDENCIES[key];
    if (!required || seen.has(key) || !permissions.includes(required)) {
      return { ok: false, error: "Dependency is unknown, duplicated, or outside reviewer authority." };
    }
    if (!OUTCOMES.has(item.outcome) || !boundedText(item.reason, 500) ||
        !boundedText(item.policy_reference, 100) ||
        (item.evidence_ref != null && !boundedText(item.evidence_ref, 160))) {
      return { ok: false, error: "Dependency outcome or supporting reference is invalid." };
    }
    if (item.outcome === "transfer_with_consent" && !item.evidence_ref) {
      return { ok: false, error: "A consent reference is required for a transfer." };
    }
    normalized.push({
      dependency_key: key,
      outcome: item.outcome,
      reason: item.reason.trim(),
      evidence_ref: item.evidence_ref == null ? null : item.evidence_ref.trim(),
      policy_reference: item.policy_reference.trim(),
    });
    seen.add(key);
  }
  if (requireComplete && seen.size !== Object.keys(DISPOSITION_DEPENDENCIES).length) {
    return { ok: false, error: "The dependency inventory is incomplete." };
  }
  normalized.sort((a,b) => a.dependency_key.localeCompare(b.dependency_key));
  return { ok: true, items: normalized };
}

export async function digestDispositionPlan({ requestId, reviewId, baseReviewVersion, proposerId, policyVersion = DISPOSITION_POLICY_VERSION, items }) {
  if (![requestId, reviewId, baseReviewVersion, proposerId].every(Number.isSafeInteger) ||
      [requestId, reviewId, baseReviewVersion, proposerId].some(value => value <= 0) ||
      !boundedText(policyVersion, 64) || !Array.isArray(items)) {
    throw new TypeError("Invalid disposition plan identity or contents.");
  }
  const canonical = JSON.stringify({
    request_id: requestId,
    review_id: reviewId,
    base_review_version: baseReviewVersion,
    proposer_id: proposerId,
    policy_version: policyVersion,
    items: [...items].map(item => ({
      dependency_key: item.dependency_key,
      outcome: item.outcome,
      reason: item.reason,
      evidence_ref: item.evidence_ref ?? null,
      policy_reference: item.policy_reference,
    })).sort((a,b) => a.dependency_key.localeCompare(b.dependency_key)),
  });
  const bytes = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}
