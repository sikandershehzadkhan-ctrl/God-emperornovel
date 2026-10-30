import assert from "node:assert/strict";
import { MAX_ADMIN_CROWN_ADJUSTMENT, parseAdminCrownAdjustment } from "../src/admin-crown-policy.mjs";

assert.equal(MAX_ADMIN_CROWN_ADJUSTMENT, 10000);
assert.deepEqual(parseAdminCrownAdjustment({ user_id: 7, amount: 25, reason: "support correction" }), {
  ok: true, userId: 7, amount: 25, note: "support correction"
});
for (const amount of [0, -1, 1.5, 10001, Number.NaN, Number.POSITIVE_INFINITY, "not-a-number"]) {
  assert.equal(parseAdminCrownAdjustment({ user_id: 7, amount }).ok, false, `amount rejected: ${amount}`);
}
for (const user_id of [0, -1, 1.5, Number.NaN, "invalid", null]) {
  assert.equal(parseAdminCrownAdjustment({ user_id, amount: 10 }).ok, false, `user id rejected: ${user_id}`);
}
assert.equal(parseAdminCrownAdjustment({ user_id: "7", amount: "10", reason: "x".repeat(200) }).note.length, 160);
console.log("PASS: administrator Crown adjustment input policy rejects invalid IDs, negative/fractional/zero/oversized amounts and bounds audit notes.");
