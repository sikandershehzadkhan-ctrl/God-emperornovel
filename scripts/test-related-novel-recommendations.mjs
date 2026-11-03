import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildRelatedNovelRecommendationsQuery, relatedNovelRecommendationBindings } from "../src/related-novel-policy.mjs";

const sql = buildRelatedNovelRecommendationsQuery();
assert.ok(sql.includes("WITH seeds AS"));
assert.ok(sql.includes("SELECT novel_id FROM follows WHERE user_id=?"));
assert.ok(sql.includes("SELECT novel_id FROM history WHERE user_id=?"));
assert.ok(sql.includes("UNION"));
assert.ok(sql.includes("candidate_genre.genre_id IN"));
assert.ok(sql.includes("candidate_tag.tag_id IN"));
assert.ok(sql.includes("LOWER(seed_novel.author)=LOWER(n.author)"));
assert.ok(sql.includes("LOWER(seed_novel.kind)=LOWER(n.kind)"));
assert.ok(sql.includes("n.publication_status='published'"));
assert.ok(sql.includes("n.rights_status IN ('original','public_domain','licensed','authorized')"));
assert.ok(sql.includes("NOT EXISTS (SELECT 1 FROM seeds s WHERE s.novel_id=n.id)"));
assert.ok(sql.includes("genre_overlap*12 + tag_overlap*8 + author_overlap*4 + format_overlap*2"));
assert.ok(sql.includes("LIMIT 12"));
assert.ok(sql.includes("c.publication_status='published'"), "Related recommendations must count only published chapters.");
assert.deepEqual(relatedNovelRecommendationBindings(42), [42, 42]);
assert.deepEqual(relatedNovelRecommendationBindings("user-7"), ["user-7", "user-7"]);

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
assert.ok(worker.includes('import { buildRelatedNovelRecommendationsQuery, relatedNovelRecommendationBindings } from "./related-novel-policy.mjs";'));
assert.ok(worker.includes("buildRelatedNovelRecommendationsQuery()).bind(...relatedNovelRecommendationBindings(u.id))"));
assert.ok(worker.includes("if(rows.length)return json(rows);const related="));
assert.ok(worker.includes('SELECT id,delta,reason,reference,created_at FROM ticket_ledger WHERE user_id=? ORDER BY created_at DESC LIMIT 100'), "Ticket ledger route must remain intact before recommendations.");
assert.ok(!worker.includes("\\`SELECT n.*"), "Recommendation SQL must use valid template literal delimiters.");
assert.ok(worker.includes("AND NOT EXISTS (SELECT 1 FROM follows f WHERE f.user_id=? AND f.novel_id=n.id)"));
assert.ok(worker.includes("AND NOT EXISTS (SELECT 1 FROM history h WHERE h.user_id=? AND h.novel_id=n.id)"));
assert.ok(worker.includes("LIMIT 20\\`).bind(u.id,u.id,u.id).all()).results;"), "Stored recommendations must bind the authenticated user for both exclusion checks.");
assert.ok(worker.includes("if(related.length)return json(related);const fallback="));
assert.ok(worker.includes("LEFT JOIN chapters c ON c.novel_id=n.id AND c.publication_status='published' WHERE r.user_id=?"), "Stored recommendations must count only published chapters.");
assert.ok(worker.includes("LEFT JOIN chapters c ON c.novel_id=n.id AND c.publication_status='published' WHERE n.publication_status='published'"), "Popularity fallback must count only published chapters.");
assert.ok(worker.includes("n.id NOT IN(SELECT novel_id FROM history WHERE user_id=?)") && worker.includes(".bind(u.id,u.id).all()).results;return json(fallback.map"));

console.log("PASS: related-story recommendations use private follow/history seeds, rights-cleared published candidates, shared taxonomy/author/format signals, deterministic ranking and bounded output.");
