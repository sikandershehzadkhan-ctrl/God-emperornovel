const PUBLIC_NOVEL_FIELDS = new Set([
  "id", "title", "alt_titles", "author", "description", "status", "kind",
  "language", "cover_url", "rights_status", "views", "rating", "created_at",
  "updated_at", "publication_status", "genres", "tags", "chapter_count",
  "latest_chapter"
]);

/**
 * Explicit allowlist for unauthenticated catalog and novel-detail responses.
 * New database columns stay private until deliberately reviewed and added.
 */
export function toPublicNovel(novel) {
  if (!novel || typeof novel !== "object" || Array.isArray(novel)) return {};
  return Object.fromEntries(
    Object.entries(novel).filter(([key]) => PUBLIC_NOVEL_FIELDS.has(key))
  );
}
