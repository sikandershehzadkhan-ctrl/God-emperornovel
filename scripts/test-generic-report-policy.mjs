import fs from "node:fs";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const start = source.indexOf('if(p==="/api/report"&&m==="POST"){');
const end = source.indexOf('if(p==="/api/tickets/ledger"', start);
assert.notEqual(start, -1, "generic report POST handler exists");
assert.notEqual(end, -1, "generic report handler has a following route boundary");
const handler = source.slice(start, end);

assert.match(handler, /need\(u\)/, "report submission requires authentication");
assert.match(handler, /novelId===null&&chapterId===null/, "at least one report target is required");
assert.match(handler, /Number\.isSafeInteger\(novelId\)/, "novel IDs must be positive safe integers");
assert.match(handler, /Number\.isSafeInteger\(chapterId\)/, "chapter IDs must be positive safe integers");
assert.match(handler, /publication_status='published'/, "report targets must be published");
assert.match(handler, /Number\(chapter\.novel_id\)!==novelId/, "chapter must belong to supplied novel when both targets are supplied");
assert.match(handler, /details\.length>2000/, "details length is bounded");
assert.match(handler, /reason\.length>300/, "reason length is bounded");
assert.match(handler, /COUNT\(\*\) FROM reports WHERE user_id=\? AND created_at>=datetime\('now','-1 hour'\)/, "per-user hourly report limit is enforced in insert predicate");
assert.match(handler, /meta\?\.changes\|\|0\) !== 1|meta\?\.changes\|\|0\)!==1/, "insert result is checked");
assert.match(handler, /return json\(\{error:"You have reached the report limit/, "rate limit returns HTTP 429");
console.log("Generic report policy source checks passed.");
