export const MAX_MANUAL_DONATION_CROWNS = 10000;

export function parseManualDonationApproval(input = {}, donation = {}) {
  const status = String(input.status || "");
  if (status !== "approved" && status !== "rejected") {
    return { ok: false, error: "Choose approved or rejected." };
  }
  if (status === "rejected") return { ok: true, status };
  const userId = Number(donation.user_id);
  const tickets = Number(input.tickets ?? donation.amount);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    return { ok: false, error: "This donation has no valid account to credit." };
  }
  if (!Number.isSafeInteger(tickets) || tickets < 1 || tickets > MAX_MANUAL_DONATION_CROWNS) {
    return { ok: false, error: `Approved Crown credits must be whole numbers between 1 and ${MAX_MANUAL_DONATION_CROWNS}.` };
  }
  return { ok: true, status, userId, tickets };
}
