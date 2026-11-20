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


/**
 * Build deterministic relevance ordering for catalog searches. Exact and prefix
 * taxonomy matches rank after title/author matches but before broad text matches.
 * The taxonomy checks are correlated EXISTS clauses, so they cannot duplicate
 * novel rows or interfere with pagination.
 */
export function buildCatalogSearchOrder(searchPhrase) {
  const term = String(searchPhrase ?? "").trim().toLowerCase();
  if (!term) return { sql: "", values: [] };
  const escaped = term.replace(/[\\%_]/g, (character) => "\\" + character);
  const prefix = escaped + "%";
  const contains = "%" + escaped + "%";
  return {
    sql: `CASE
      WHEN LOWER(n.title)=? THEN 0
      WHEN LOWER(n.title) LIKE ? ESCAPE char(92) THEN 1
      WHEN LOWER(n.author)=? THEN 2
      WHEN LOWER(n.title) LIKE ? ESCAPE char(92) THEN 3
      WHEN EXISTS (SELECT 1 FROM novel_genres ng JOIN genres g ON g.id=ng.genre_id WHERE ng.novel_id=n.id AND (LOWER(g.name)=? OR LOWER(g.slug)=?)) THEN 4
      WHEN EXISTS (SELECT 1 FROM novel_tags nt JOIN tags t ON t.id=nt.tag_id WHERE nt.novel_id=n.id AND (LOWER(t.name)=? OR LOWER(t.slug)=?)) THEN 5
      WHEN EXISTS (SELECT 1 FROM novel_genres ng JOIN genres g ON g.id=ng.genre_id WHERE ng.novel_id=n.id AND (LOWER(g.name) LIKE ? ESCAPE char(92) OR LOWER(g.slug) LIKE ? ESCAPE char(92))) THEN 6
      WHEN EXISTS (SELECT 1 FROM novel_tags nt JOIN tags t ON t.id=nt.tag_id WHERE nt.novel_id=n.id AND (LOWER(t.name) LIKE ? ESCAPE char(92) OR LOWER(t.slug) LIKE ? ESCAPE char(92))) THEN 7
      ELSE 8 END`,
    values: [term, prefix, term, contains, term, term, term, term, prefix, prefix, prefix, prefix]
  };
}
