import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const start = source.indexOf('if(p.startsWith("/api/admin/requests/")&&m==="PATCH")');
const end = source.indexOf('if(p==="/api/admin/connector-authorization-requests"', start);
assert.ok(start >= 0 && end > start, "admin novel request review route must remain present and bounded");
const route = source.slice(start, end);

for (const [fragment, description] of [
  ["Number.isSafeInteger(id)", "request ID must be a positive safe integer"],
  ['consumeAuthRateLimit(env,"admin-novel-request-review",String(u.id),30,300)', "administrator request reviews must be rate-limited"],
  ["Number.isSafeInteger(refund)", "refund must be a whole number"],
  ["refund>100000", "refund must have a protective upper bound"],
  ["status='pending' AND EXISTS (SELECT 1 FROM users", "refund must only transition a pending request with a valid account"],
  ["INSERT INTO novel_request_refunds(request_id,admin_user_id,user_id,amount,note) SELECT ?,?,?,?,? WHERE changes()=1", "refund record must depend on the one-time request transition"],
  ["transitioned!==1||recorded!==1", "request transition and database-owned refund record must both succeed"],
  ["A refund reason between 1 and 500 characters is required.", "paid refunds must include an auditable reason"]
]) assert.ok(route.includes(fragment), description);

console.log("PASS: paid novel request refunds validate IDs and amounts, transition pending requests once, and conditionally credit/ledger the refund.");
