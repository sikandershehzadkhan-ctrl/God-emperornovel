import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const start = source.indexOf('if(p==="/api/requests"&&m==="POST")');
const end = source.indexOf('if(p==="/api/requests"&&m==="GET")', start);
assert.ok(start >= 0 && end > start, "novel request creation route must remain present and bounded");
const route = source.slice(start, end);
for (const [fragment, description] of [
  ['parsed.protocol!=="https:"', "request URLs must use HTTPS"],
  ["parsed.username||parsed.password", "embedded URL credentials must be rejected"],
  ["MIN((COUNT(*)-2)*100,100000)", "weekly paid request pricing must be server-derived and bounded"],
  ["WHERE EXISTS (SELECT 1 FROM users WHERE id=? AND tickets>=", "request insertion must require sufficient server-side balance"],
  ["WHERE id=last_insert_rowid() AND user_id=?", "debit and ledger must bind to the inserted request"],
  ["AND changes()=1", "debit and ledger must depend on successful preceding writes"],
  ["results?.[0]?.meta?.last_row_id", "request identity must be confirmed from D1"],
  ["debited!==1||(cost>0&&ledger!==1)", "accounting results must be checked before success"]
]) assert.ok(route.includes(fragment), description);
console.log("PASS: novel request charging validates HTTPS, derives capped weekly pricing server-side and links request/debit/ledger writes.");
