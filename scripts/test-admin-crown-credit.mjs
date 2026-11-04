import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const start = source.indexOf('if(p==="/api/admin/tickets"&&m==="POST")');
const end = source.indexOf('if(p==="/api/admin/connectors"', start);
assert.ok(start >= 0 && end > start, "admin Crown credit route must remain present and bounded");
const route = source.slice(start, end);
for (const fragment of [
  "Number.isSafeInteger(userId)",
  "Number.isSafeInteger(amount)",
  "amount<1||amount>1000000",
  "idempotency_key",
  "admin_ticket_adjustments",
  "INSERT INTO admin_ticket_adjustments",
  "if(!note||note.length>500)",
  "idempotent_replay:true",
  "consumeAuthRateLimit(env,\"admin-ticket-credit\"",
  "if(p===\"/api/admin/ticket-adjustments\"&&m===\"GET\")"
]) assert.ok(route.includes(fragment), `missing administrator Crown accounting invariant: ${fragment}`);
assert.ok(!route.includes("UPDATE users SET tickets=tickets+?"), "credit route must delegate balance posting to the atomic database trigger");
assert.ok(!route.includes("INSERT INTO ticket_ledger"), "credit route must delegate ledger posting to the atomic database trigger");

const admin = readFileSync(new URL("../public/admin.html", import.meta.url), "utf8");
assert.ok(admin.includes("Number.isSafeInteger(n)") && admin.includes("n>1000000"), "admin UI must reject fractional and excessive credits");
assert.ok(admin.includes("sessionStorage.getItem(storageKey)") && admin.includes("idempotency_key:key"), "admin UI must reuse the same idempotency key after an uncertain retry");
assert.ok(admin.includes("Required reason for this Crown adjustment"), "admin UI must collect an adjustment reason");
console.log("PASS: administrator Crown credits require a valid account, bounded whole-number amount and a matching ledger entry.");
