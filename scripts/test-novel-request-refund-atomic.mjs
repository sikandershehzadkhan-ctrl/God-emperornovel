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
  ['`novel_request:${id}`', "refund ledger reference must identify the exact request, not reuse an unstructured URL"],
  ["Number.isSafeInteger(refund)", "refund must be a whole number"],
  ["refund>100000", "refund must have a protective upper bound"],
  ["status='pending' AND EXISTS (SELECT 1 FROM users", "refund must only transition a pending request with a valid account"],
  ["tickets=tickets+? WHERE id=? AND changes()=1", "account credit must depend on the one-time status transition"],
  ["SELECT ?,?,?,? WHERE changes()=1", "refund ledger entry must depend on successful credit"],
  ["transitioned!==1", "duplicate rejection must be rejected"],
  ["credited!==1||ledger!==1", "partial accounting must not report success"]
]) assert.ok(route.includes(fragment), description);

console.log("PASS: paid novel request refunds validate IDs and amounts, transition pending requests once, and conditionally credit/ledger the refund.");
