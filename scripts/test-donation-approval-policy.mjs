import assert from "node:assert/strict";
import { MAX_MANUAL_DONATION_CROWNS, parseManualDonationApproval } from "../src/donation-approval-policy.mjs";

const donation = { id: 12, user_id: 7, amount: 25, status: "pending" };
assert.deepEqual(parseManualDonationApproval({ status: "approved" }, donation), {
  ok: true, status: "approved", userId: 7, tickets: 25
});
assert.deepEqual(parseManualDonationApproval({ status: "approved", tickets: 50 }, donation), {
  ok: true, status: "approved", userId: 7, tickets: 50
});
assert.deepEqual(parseManualDonationApproval({ status: "rejected" }, donation), {
  ok: true, status: "rejected"
});
for (const tickets of [0, -1, 1.5, MAX_MANUAL_DONATION_CROWNS + 1, Number.NaN, Infinity, "invalid"]) {
  assert.equal(parseManualDonationApproval({ status: "approved", tickets }, donation).ok, false);
}
assert.equal(parseManualDonationApproval({ status: "approved" }, { ...donation, user_id: null }).ok, false);
assert.equal(parseManualDonationApproval({ status: "approved" }, { ...donation, amount: 25.5 }).ok, false);
assert.equal(parseManualDonationApproval({ status: "pending" }, donation).ok, false);
console.log("PASS: manual donation decisions validate status, linked account and bounded whole-number Crown credits.");
