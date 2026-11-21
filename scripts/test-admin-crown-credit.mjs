import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const start = source.indexOf('if(p==="/api/admin/tickets"&&m==="POST")');
const end = source.indexOf('if(p==="/api/admin/connectors"&&m==="GET")', start);
assert.ok(start >= 0 && end > start, "admin Crown credit route must remain present and bounded");
const route = source.slice(start, end);
for (const fragment of [
  "admin(u)",
  "Number.isSafeInteger(userId)",
  "Number.isSafeInteger(amount)",
  "amount<1||amount>1000000",
  "userId===Number(u.id)",
  "idempotency_key",
  "note.length<1||note.length>500",
  "INSERT INTO admin_ticket_adjustments(idempotency_key,admin_user_id,target_user_id,amount,note)",
  "prior&&Number(prior.admin_user_id)===Number(u.id)",
  "prior.note)===note"
]) assert.ok(route.includes(fragment), `missing administrator Crown adjustment invariant: ${fragment}`);

assert.ok(!route.includes("UPDATE users SET tickets"), "Worker must not duplicate trigger-owned Crown credits");
assert.ok(!route.includes("INSERT INTO ticket_ledger"), "Worker must not duplicate trigger-owned ledger postings");

const admin = readFileSync(new URL("../public/admin.html", import.meta.url), "utf8");
assert.ok(admin.includes("Reason for this Crown adjustment (required)"), "admin UI must collect a reason");
assert.ok(admin.includes("idempotency_key:key"), "admin UI must submit the stable operation key");
assert.ok(admin.includes("sessionStorage.setItem(keyName,key)"), "admin UI must retain the operation key for retry");
console.log("PASS: administrator Crown credits use a note-backed idempotent database adjustment with exactly one trigger-owned ledger posting.");
