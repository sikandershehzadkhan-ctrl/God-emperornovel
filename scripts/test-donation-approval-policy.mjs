import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const start = source.indexOf("let ad=p.match(/^\\/api\\/admin\\/donations\\/");
const end = source.indexOf('if(p==="/api/admin/reports"', start);
assert.ok(start >= 0 && end > start, "admin donation decision route must remain present");
const route = source.slice(start, end);
for (const fragment of [
  "status='pending' AND user_id IS NOT NULL",
  "AND changes()=1",
  "SELECT ?,?,?,? WHERE changes()=1",
  "transitioned!==1||credited!==1||ledger!==1",
  "status='rejected' WHERE id=? AND status='pending'"
]) assert.ok(route.includes(fragment), `missing one-time donation accounting invariant: ${fragment}`);

console.log("PASS: donation policy validates decisions and bounded credits; approval/rejection transitions and Crown ledger writes are one-time and conditional.");
