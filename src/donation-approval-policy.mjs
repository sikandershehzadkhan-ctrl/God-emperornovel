export const MAX_MANUAL_DONATION_CROWNS = 10000;

export function parseManualDonationApproval(input = {}, donation = {}, reviewerUserId) {
  const status = String(input.status || "");
  if (status !== "approved" && status !== "rejected") {
    return { ok: false, error: "Choose approved or rejected." };
  }

  const reviewerId = Number(reviewerUserId);
  if (!Number.isSafeInteger(reviewerId) || reviewerId < 1) {
    return { ok: false, error: "A valid administrator review identity is required." };
  }

  const donorId = Number(donation.user_id);
  if (Number.isSafeInteger(donorId) && donorId > 0 && donorId === reviewerId) {
    return { ok: false, error: "You cannot review your own donation." };
  }

  const note = String(input.note ?? "").trim();
  if (note.length < 1 || note.length > 1000) {
    return { ok: false, error: "A review note between 1 and 1000 characters is required." };
  }

  if (status === "rejected") return { ok: true, status, note };

  const userId = Number(donation.user_id);
  const tickets = Number(input.tickets ?? donation.amount);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    return { ok: false, error: "This donation has no valid account to credit." };
  }
  if (!Number.isSafeInteger(tickets) || tickets < 1 || tickets > MAX_MANUAL_DONATION_CROWNS) {
    return { ok: false, error: `Approved Crown credits must be whole numbers between 1 and ${MAX_MANUAL_DONATION_CROWNS}.` };
  }
  return { ok: true, status, userId, tickets, note };
}
