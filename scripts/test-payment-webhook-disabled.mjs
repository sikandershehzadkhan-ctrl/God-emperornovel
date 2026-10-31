import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const route = source.match(/if\(p==="\/api\/payment\/webhook"&&m==="POST"\)\{([^]*?)\}\s*if\(p==="\/api\/requests"/);
assert.ok(route, "payment webhook route must remain present and bounded");
assert.match(route[1], /temporarily disabled until provider-specific signature, amount, currency, event identity and replay protections are verified/);
assert.doesNotMatch(route[1], /UPDATE users SET tickets=tickets\+/);
assert.doesNotMatch(route[1], /INSERT INTO ticket_ledger/);
console.log("PASS: generic payment webhook cannot approve donations or credit tickets before provider-specific verification and replay protection exist.");
