import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const runtime = readFileSync(new URL("../public/app-17.23.0.js", import.meta.url), "utf8");

const start = source.indexOf('if(p==="/api/library"&&m==="GET")');
const end = source.indexOf('if(p==="/api/bookmarks"&&m==="GET")', start);
assert.ok(start >= 0 && end > start, "library routes must remain present and bounded");
const routes = source.slice(start, end);
for (const [fragment, message] of [
  ['need(u)', "library operations must require authentication"],
  ['Number.isSafeInteger(nid)||nid<1', "library writes must validate positive safe integer novel IDs"],
  ['["add","remove","toggle"]', "library writes must reject unknown actions"],
  ['if(action==="add")', "library add must have an explicit action"],
  ['INSERT OR IGNORE INTO user_library(user_id,novel_id)', "repeated adds must not create duplicate membership rows"],
  ['if(action==="remove")', "library removal must have an explicit action"],
  ['DELETE FROM user_library WHERE user_id=? AND novel_id=?', "removal must be scoped to the authenticated user and novel"],
  ['NOT EXISTS (SELECT 1 FROM novels n WHERE n.id=user_library.novel_id)', "GET must clean orphaned membership rows"],
  ["n.publication_status='published'", "only published novels may be newly saved"],
]) assert.ok(routes.includes(fragment), message);

assert.ok(source.includes("user_library (user_id INTEGER NOT NULL,novel_id INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,novel_id))"), "database must enforce one library row per user and novel");
assert.ok(!routes.includes("DELETE FROM history") && !routes.includes("DELETE FROM bookmarks"), "library removal must never erase reading history or bookmarks");
assert.ok(app.includes("action:n.in_library?'remove':'add'"), "novel detail must use explicit idempotent membership actions");
assert.ok(app.includes("n.in_library=Boolean(d.in_library)"), "novel detail must update its local membership state after each successful action");
assert.ok(app.includes("action:'remove'"), "saved-library removal must use an explicit remove action");
assert.ok(runtime === app, "served versioned app runtime must stay synchronized with editable app source");
console.log("PASS: library membership is authenticated, duplicate-safe, idempotent, orphan-cleaned and independent of reading history/bookmarks.");
