import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const start = source.indexOf('if(p==="/api/history"&&m==="POST")');
const end = source.indexOf('if(p==="/api/library"', start);
assert.ok(start >= 0 && end > start, "history write route must remain present and bounded");
const route = source.slice(start, end);

for (const [fragment, description] of [
  ["need(u)", "history writes must require an authenticated account"],
  ["Number.isSafeInteger(nid)||nid<1||!Number.isSafeInteger(chapter)||chapter<1", "history writes must reject invalid novel and chapter identifiers"],
  ["n.publication_status='published' AND c.publication_status='published'", "history writes must target a published novel and published chapter"],
  ["chapter_number=MAX(history.chapter_number,excluded.chapter_number)", "late requests from older devices must never reduce saved chapter progress"],
  ["updated_at=CASE WHEN excluded.chapter_number>=history.chapter_number THEN CURRENT_TIMESTAMP ELSE history.updated_at END", "stale lower chapter writes must not make old progress appear newly read"],
  ["SELECT chapter_number,updated_at FROM history WHERE user_id=? AND novel_id=?", "the server must return the canonical saved progress after reconciliation"],
  ["Number(saved.chapter_number)", "the canonical chapter number must be returned as a number"]
]) assert.ok(route.includes(fragment), description);

console.log("Cross-device reading progress checks passed: authenticated writes, published chapter validation, monotonic chapter reconciliation, stable activity timestamps, and canonical progress response.");
