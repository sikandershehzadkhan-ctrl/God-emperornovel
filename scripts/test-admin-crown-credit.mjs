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
  "UPDATE users SET tickets=tickets+? WHERE id=?",
  "INSERT INTO ticket_ledger(user_id,delta,reason,reference) SELECT ?,?,?,? WHERE changes()=1",
  "changed(results?.[0])!==1",
  "changed(results?.[1])!==1"
]) assert.ok(route.includes(fragment), `missing administrator Crown accounting invariant: ${fragment}`);

const admin = readFileSync(new URL("../public/admin.html", import.meta.url), "utf8");
assert.ok(admin.includes("Number.isSafeInteger(n)") && admin.includes("n>1000000"), "admin UI must reject fractional and excessive credits");
console.log("PASS: administrator Crown credits require a valid account, bounded whole-number amount and a matching ledger entry.");
