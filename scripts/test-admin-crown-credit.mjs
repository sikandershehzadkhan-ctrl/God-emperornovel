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
  "A valid credit operation key is required.",
  "AND NOT EXISTS (SELECT 1 FROM ticket_ledger WHERE reason='admin_adjustment' AND reference=?)",
  "INSERT INTO ticket_ledger(user_id,delta,reason,reference) SELECT ?,?,?,? WHERE changes()=1",
  "credited=changed(results?.[0])",
  "ledger=changed(results?.[1])",
  "already_applied:true",
  "prior&&Number(prior.user_id)===userId&&Number(prior.delta)===amount",
  'admin_ticket_credit',
  'reference=${reference}'
]) assert.ok(route.includes(fragment), `missing administrator Crown accounting invariant: ${fragment}`);

const admin = readFileSync(new URL("../public/admin.html", import.meta.url), "utf8");
assert.ok(admin.includes("Number.isSafeInteger(n)") && admin.includes("n>1000000"), "admin UI must reject fractional and excessive credits");
assert.ok(admin.includes("localStorage.getItem(storageKey)") && admin.includes("localStorage.setItem(storageKey,idempotencyKey)") && admin.includes("localStorage.removeItem(storageKey)"), "admin UI must retain pending operation keys across network retries");
assert.ok(admin.includes("idempotency_key:idempotencyKey"), "admin UI must send the operation key to the server");
console.log("PASS: administrator Crown credits are bounded, idempotent across retries and paired with one ledger entry.");
