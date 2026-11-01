import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const worker = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const app = readFileSync(new URL("../public/app-17.23.0.js", import.meta.url), "utf8");

for (const route of ['if(p==="/api/bookmark"&&m==="POST")','if(p==="/api/history"&&m==="POST")']) {
  const start = worker.indexOf(route);
  assert.ok(start >= 0, route + " must exist");
  const end = worker.indexOf("\n if(", start + route.length);
  const block = worker.slice(start, end > start ? end : start + 1800);
  assert.ok(block.includes("Number.isSafeInteger(nid)") && block.includes("nid<1"), "novel IDs must be positive safe integers");
  assert.ok(block.includes("Number.isSafeInteger(chapter)") && block.includes("chapter<1"), "chapter numbers must be positive safe integers");
  assert.ok(block.includes("c.publication_status='published'") && block.includes("n.publication_status='published'"), "only published novel chapters may be saved");
  assert.ok(block.includes("ON CONFLICT(user_id,novel_id) DO UPDATE"), "per-user novel progress must update idempotently");
}
assert.ok(worker.includes('if(p==="/api/history"&&m==="GET")'), "reading history must be retrievable");
assert.ok(worker.includes('if(p==="/api/library"&&m==="GET")'), "saved library must be retrievable");
assert.ok(worker.includes('if(p==="/api/bookmarks"&&m==="GET")'), "chapter bookmarks must be retrievable");
assert.ok(app.includes("api('/api/library')") && app.includes("api('/api/history')") && app.includes("api('/api/bookmarks')"), "Library UI must load saved stories, history and bookmarks from the authenticated API");
assert.ok(app.includes("api('/api/history',{method:'POST'"), "reader must sync chapter visits to account history");
assert.ok(app.includes("api('/api/bookmark',{method:'POST'"), "reader must sync chapter bookmarks to account storage");

console.log("PASS: Library data flow uses authenticated account APIs and validates saved history/bookmark references against published chapters.");
