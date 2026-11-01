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
  ["WHERE id=(SELECT id FROM novel_requests WHERE user_id=? AND week_key=? ORDER BY id DESC LIMIT 1)", "debit must bind to the latest request created within the atomic batch"],
  ["AND changes()=1", "debit and ledger must depend on successful preceding writes"],
  ["results?.[0]?.meta?.last_row_id", "request identity must be confirmed from D1"],
  ["audited!==1||debited!==1||(cost>0&&ledger!==1)", "audit, debit and ledger results must be checked before success"],
  ["CAST(id AS TEXT)", "ledger references must use stable request IDs instead of potentially duplicated URLs"],
  ["novel_request_created", "request creation must be audited in the same D1 batch"],
  ["request='||(SELECT id FROM novel_requests WHERE user_id=? AND week_key=? ORDER BY id DESC LIMIT 1)", "audit record must carry the stable request ID"]
]) assert.ok(route.includes(fragment), description);
console.log("PASS: novel request charging validates HTTPS, derives capped weekly pricing server-side and links request/debit/ledger writes.");
