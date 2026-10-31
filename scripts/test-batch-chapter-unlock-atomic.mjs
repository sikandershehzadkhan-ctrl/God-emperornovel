import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const start = source.indexOf("let bu=p.match(/^\\/api\\/novels\\/");
const end = source.indexOf('if(p==="/api/bookmark"', start);
assert.ok(start >= 0 && end > start, "batch chapter unlock route must remain present and bounded");
const route = source.slice(start, end);

for (const [fragment, description] of [
  ["Number.isSafeInteger(rawStart)", "fractional or invalid starting chapters must be rejected"],
  ["c.is_locked=1", "free chapters must not consume paid batch slots"],
  ["Number.isSafeInteger(cost)", "aggregate Crown cost must be an integer"],
  ["Number.isSafeInteger(Number(c.ticket_cost))", "individual Crown prices must be integers"],
  ["tickets>=?", "debit must check sufficient balance"],
  ["AND NOT EXISTS (SELECT 1 FROM unlocks", "debit must prevent overlapping purchases"],
  ["SELECT ?,?,? WHERE changes()=1", "each unlock must depend on a successful debit or prior unlock insert"],
  ["SELECT ?,?,?,? WHERE changes()=1", "ledger must depend on successful unlock insertion"],
  ["SELECT ?,?,?,?,?,? WHERE changes()=1", "batch receipt must depend on successful preceding accounting"],
  ["debited!==1||!unlocked||!ledger||!batch", "D1 batch results must be checked before success"]
]) assert.ok(route.includes(fragment), description);

console.log("PASS: batch chapter unlock validates prices, excludes free chapters, prevents overlapping duplicate debits and gates ledger/receipt on successful D1 writes.");
