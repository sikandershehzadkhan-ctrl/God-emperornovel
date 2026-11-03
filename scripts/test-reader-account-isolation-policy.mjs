import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

function routeBetween(startMarker, endMarker, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, label + " route boundaries must exist");
  return source.slice(start, end);
}

const accountReadRoutes = [
  {
    start: 'if(p==="/api/history"&&m==="GET")',
    end: 'if(p==="/api/history"&&m==="POST")',
    label: "reading history",
    checks: ["WHERE h.user_id=?", ".bind(u.id)"]
  },
  {
    start: 'if(p==="/api/reading-position"&&m==="GET")',
    end: 'if(p==="/api/reading-position"&&m==="POST")',
    label: "reading position",
    checks: ["WHERE user_id=? AND novel_id=? AND chapter_number=?", ".bind(u.id,nid,chapter)"]
  },
  {
    start: 'if(p==="/api/library"&&m==="GET")',
    end: 'if(p==="/api/library"&&m==="POST")',
    label: "saved library",
    checks: ["WHERE l.user_id=?", ".bind(u.id)"]
  },
  {
    start: 'if(p==="/api/bookmarks"&&m==="GET")',
    end: 'if(p==="/api/novel-reactions"&&m==="GET")',
    label: "chapter bookmarks",
    checks: ["WHERE b.user_id=?", ".bind(u.id)"]
  }
];

for (const item of accountReadRoutes) {
  const route = routeBetween(item.start, item.end, item.label);
  assert.match(route, /need\(u\)/, item.label + " requires an authenticated session");
  for (const fragment of item.checks) {
    assert.ok(route.includes(fragment), item.label + " must scope its database read to the current account");
  }
}

const singleUnlock = routeBetween(
  'if(/^\\/api\\/chapters\\/',
  "let bu=",
  "single chapter unlock"
);
assert.match(singleUnlock, /SELECT 1 FROM unlocks WHERE user_id=\? AND chapter_id=\?/,
  "unlock status must be checked against the current account");
assert.match(singleUnlock, /UPDATE users SET tickets=tickets-\? WHERE id=\?/,
  "Crown debit must target the authenticated account");

const batchUnlock = routeBetween(
  "let bu=p.match(/^\\/api\\/novels\\/",
  'if(p==="/api/bookmark"',
  "batch chapter unlock"
);
assert.match(batchUnlock, /x.user_id=\?/,
  "batch selection must exclude only chapters already unlocked by the current account");
assert.match(batchUnlock, /UPDATE users SET tickets=tickets-\? WHERE id=\?/,
  "batch Crown debit must target the authenticated account");

console.log("PASS: reader history, progress, library, bookmarks and single/batch unlock reads and writes are scoped to the authenticated account.");
