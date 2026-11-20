import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const adminPage = readFileSync(new URL("../public/admin.html", import.meta.url), "utf8");
const start = source.indexOf('if(p.startsWith("/api/admin/requests/")&&m==="PATCH")');
const end = source.indexOf('if(p==="/api/admin/connector-authorization-requests"', start);
assert.ok(start >= 0 && end > start, "admin novel request review route must remain present and bounded");
const route = source.slice(start, end);

for (const [fragment, description] of [
  ["Number.isSafeInteger(id)", "request ID must be a positive safe integer"],
  ["Number.isSafeInteger(refund)", "refund must be a whole number"],
  ["refund>100000", "refund must have a protective upper bound"],
  ["note.length<1||note.length>500", "paid refund must require a bounded review note"],
  ["UPDATE novel_requests SET status='rejected' WHERE id=? AND status='pending'", "refund must transition only a pending request"],
  ["INSERT INTO novel_request_refunds(request_id,admin_user_id,user_id,amount,note)", "refund must create an attributable immutable refund record"],
  ["reviewer=\"+u.id", "audit must identify the reviewing administrator"],
  ["transitioned!==1||posted!==1", "request transition and refund record must both succeed"]
]) assert.ok(route.includes(fragment), description);

assert.ok(!route.includes("UPDATE users SET tickets=tickets+?"), "Worker must not duplicate trigger-owned refund credits");
assert.ok(!route.includes("INSERT INTO ticket_ledger"), "Worker must not duplicate trigger-owned refund ledger postings");
assert.ok(adminPage.includes("Refund review note (required for paid requests)"), "admin UI must request a refund review note");

console.log("PASS: paid novel request refunds use one database-owned, attributable, note-backed posting with pending-state and duplicate protections.");
