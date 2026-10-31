import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const route = source.match(/if\(\/^\\/api\\/chapters\\/\\d\\+\\/unlock\$\/\.test\(p\)&&m==="POST"\)\{([^]*?)\}\s*let bu=/);

assert.ok(route, "single chapter unlock route must remain present and bounded");
assert.match(route[1], /Number\.isSafeInteger\(cost\)/, "fractional Crown prices must be rejected");
assert.match(route[1], /cost<0\|\|cost>1000000/, "negative and excessive prices must be rejected");
assert.match(route[1], /tickets>=\? AND NOT EXISTS \(SELECT 1 FROM unlocks/, "debit must be conditional and idempotent");
assert.match(route[1], /INSERT INTO unlocks\(user_id,chapter_id,cost\) SELECT \?,\?,\? WHERE changes\(\)=1/, "unlock record must depend on successful debit");
assert.match(route[1], /INSERT INTO ticket_ledger\(user_id,delta,reason,reference\) SELECT \?,\?,\?,\? WHERE changes\(\)=1/, "ledger entry must depend on successful unlock");
assert.match(route[1], /changed\(results\?\.\[0\]\)!==1/, "route must verify D1 debit result");
assert.match(route[1], /changed\(results\?\.\[1\]\)!==1/, "route must verify D1 unlock result");
assert.match(route[1], /u\.role==="admin"/, "administrator access must not be charged");

console.log("PASS: single chapter Crown unlock enforces integer pricing, conditional debit, idempotency, dependent unlock/ledger writes and D1 result checks.");
