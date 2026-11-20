import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MAX_MANUAL_DONATION_CROWNS, parseManualDonationApproval } from "../src/donation-approval-policy.mjs";

const donation = { id: 12, user_id: 7, amount: 25, status: "pending" };
const adminId = 99;
assert.deepEqual(parseManualDonationApproval({ status: "approved", note: "Receipt verified" }, donation, adminId), {
  ok: true, status: "approved", userId: 7, tickets: 25, note: "Receipt verified"
});
assert.deepEqual(parseManualDonationApproval({ status: "approved", tickets: 50, note: "Verified bank transfer" }, donation, adminId), {
  ok: true, status: "approved", userId: 7, tickets: 50, note: "Verified bank transfer"
});
assert.deepEqual(parseManualDonationApproval({ status: "rejected", note: "Reference does not match" }, donation, adminId), {
  ok: true, status: "rejected", note: "Reference does not match"
});
for (const tickets of [0, -1, 1.5, MAX_MANUAL_DONATION_CROWNS + 1, Number.NaN, Infinity, "invalid"]) {
  assert.equal(parseManualDonationApproval({ status: "approved", tickets, note: "Verified" }, donation, adminId).ok, false);
}
assert.equal(parseManualDonationApproval({ status: "approved", note: "Verified" }, { ...donation, user_id: null }, adminId).ok, false);
assert.equal(parseManualDonationApproval({ status: "approved", note: "Verified" }, { ...donation, amount: 25.5 }, adminId).ok, false);
assert.equal(parseManualDonationApproval({ status: "pending", note: "Verified" }, donation, adminId).ok, false);
assert.equal(parseManualDonationApproval({ status: "approved" }, donation, adminId).ok, false, "review note is mandatory");
assert.equal(parseManualDonationApproval({ status: "rejected", note: "   " }, donation, adminId).ok, false, "blank review note is rejected");
assert.equal(parseManualDonationApproval({ status: "rejected", note: "x".repeat(1001) }, donation, adminId).ok, false, "oversized review note is rejected");
assert.equal(parseManualDonationApproval({ status: "approved", note: "Verified" }, donation, 7).ok, false, "self-review is rejected");
assert.equal(parseManualDonationApproval({ status: "approved", note: "Verified" }, donation, null).ok, false, "missing reviewer identity is rejected");

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const adminPage = readFileSync(new URL("../public/admin.html", import.meta.url), "utf8");
const start = source.indexOf("let ad=p.match");
const end = source.indexOf('if(p==="/api/admin/reports"', start);
assert.ok(start >= 0, "admin donation decision route must remain present");
const route = source.slice(start, source.indexOf('if(p==="/api/admin/reports"', start));
for (const fragment of [
  "parseManualDonationApproval(b,d,u.id)",
  "INSERT INTO donation_reviews",
  "reviewer_user_id",
  "UPDATE donations SET status=? WHERE id=? AND status='pending'",
  "reviewed!==1||transitioned!==1"
]) assert.ok(route.includes(fragment), `missing attributable donation-review invariant: ${fragment}`);
assert.ok(!route.includes("UPDATE users SET tickets=tickets+?"), "application code must not duplicate the database trigger's Crown credit");
assert.ok(!route.includes("INSERT INTO ticket_ledger"), "application code must not duplicate the database trigger's ledger posting");

assert.ok(adminPage.includes("Review note (required)"), "admin UI must collect a required donation review note");
assert.ok(adminPage.includes("JSON.stringify({status:statusValue,tickets,note})"), "admin UI must submit the review note to the API");

console.log("PASS: donation decisions require an independent administrator, attributable review note, and one trigger-backed credit/ledger posting.");
