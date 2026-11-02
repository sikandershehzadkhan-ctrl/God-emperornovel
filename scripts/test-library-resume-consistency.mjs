import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const start = source.indexOf('if(p==="/api/bookmark"&&m==="POST")');
const end = source.indexOf('if(p==="/api/history"&&m==="GET")', start);
assert.ok(start >= 0 && end > start, "bookmark write route must remain present and bounded");
const route = source.slice(start, end);

for (const [fragment, description] of [
  ["need(u)", "bookmark writes must require authentication"],
  ["Number.isSafeInteger(nid)||nid<1||!Number.isSafeInteger(chapter)||chapter<1", "bookmark writes must reject invalid identifiers"],
  ["n.publication_status='published' AND c.publication_status='published'", "bookmark writes must target a published chapter"],
  ["chapter_number=MAX(bookmarks.chapter_number,excluded.chapter_number)", "late requests must not move bookmarks backwards"],
  ["updated_at=CASE WHEN excluded.chapter_number>=bookmarks.chapter_number THEN CURRENT_TIMESTAMP ELSE bookmarks.updated_at END", "stale bookmark writes must not make old activity appear recent"],
  ["SELECT chapter_number,updated_at FROM bookmarks WHERE user_id=? AND novel_id=?", "bookmark writes must return canonical saved position"],
  ["Number(saved.chapter_number)", "bookmark response must expose a numeric canonical position"]
]) assert.ok(route.includes(fragment), description);

assert.ok(source.includes("(SELECT chapter_number FROM history h WHERE h.user_id=l.user_id AND h.novel_id=l.novel_id) last_chapter"), "library listing must expose canonical reading history.");
assert.ok(app.includes('href="/read/${x.novel_id}/${Math.max(1,Math.min(Number(x.last_chapter)||1,Number(x.latest_chapter)))}"'), "saved library cards must link to the bounded resume chapter.");
assert.ok(app.includes("Continue · Ch. ${Math.max(1,Math.min(Number(x.last_chapter)||1,Number(x.latest_chapter)))}"), "saved library cards must display their resume chapter.");
console.log("PASS: bookmark progress is authenticated, validated, monotonic and consistent with bounded library resume links.");
