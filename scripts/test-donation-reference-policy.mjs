import assert from "node:assert/strict";
import { parseDonationSubmission } from "../src/donation-reference-policy.mjs";

for (const amount of [0, -1, 1.5, "1.5", NaN, Infinity, 1_000_001]) {
  assert.equal(parseDonationSubmission({ amount, reference_id: "TX-1" }).ok, false, String(amount));
}
for (const reference_id of ["", "   ", "A".repeat(129), "bad\nreference", "bad\x00reference"]) {
  assert.equal(parseDonationSubmission({ amount: 100, reference_id }).ok, false);
}
assert.deepEqual(parseDonationSubmission({ amount: "100", reference_id: "  TX-ABC-123  " }), {
  ok: true, amount: 100, reference: "TX-ABC-123"
});
assert.equal(parseDonationSubmission({ amount: 1_000_000, reference_id: "MAX-1" }).ok, true);
console.log("PASS: donation amount and reference validation cases.");
