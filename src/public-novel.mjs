const PRIVATE_NOVEL_FIELDS = new Set([
  "owner_user_id",
  "source_url",
  "rights_evidence",
  "rights_notes",
  "rights_verified_by",
  "rights_verified_at",
  "review_feedback",
  "reviewed_by",
  "reviewed_at"
]);

/**
 * Return only catalog-safe novel fields to public readers.
 * Keep the source row untouched for internal author and review workflows.
 */
export function toPublicNovel(novel) {
  if (!novel || typeof novel !== "object" || Array.isArray(novel)) return {};
  return Object.fromEntries(
    Object.entries(novel).filter(([key]) => !PRIVATE_NOVEL_FIELDS.has(key))
  );
}
