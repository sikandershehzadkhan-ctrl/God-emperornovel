/**
 * Build a parameterized catalog search predicate across story metadata and taxonomy.
 * Every search term must match at least one searchable field; terms may match
 * different fields, so "fantasy system" can match a genre and a tag together.
 */
export function buildCatalogSearchPredicate(searchTerms) {
  const terms = (Array.isArray(searchTerms) ? searchTerms : [])
    .map((value) => String(value ?? "").trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);
  const clauses = [];
  const values = [];

  for (const word of terms) {
    const escaped = word.replace(/[\\%_]/g, (character) => "\\" + character);
    const pattern = "%" + escaped + "%";
    clauses.push(`(
      LOWER(n.title) LIKE ? ESCAPE char(92)
      OR LOWER(n.author) LIKE ? ESCAPE char(92)
      OR LOWER(n.description) LIKE ? ESCAPE char(92)
      OR LOWER(n.alt_titles) LIKE ? ESCAPE char(92)
      OR EXISTS (
        SELECT 1 FROM novel_genres ng
        JOIN genres g ON g.id = ng.genre_id
        WHERE ng.novel_id = n.id
          AND (LOWER(g.name) LIKE ? ESCAPE char(92) OR LOWER(g.slug) LIKE ? ESCAPE char(92))
      )
      OR EXISTS (
        SELECT 1 FROM novel_tags nt
        JOIN tags t ON t.id = nt.tag_id
        WHERE nt.novel_id = n.id
          AND (LOWER(t.name) LIKE ? ESCAPE char(92) OR LOWER(t.slug) LIKE ? ESCAPE char(92))
      )
    )`);
    values.push(pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern);
  }

  return { sql: clauses.join(" AND "), values };
}
