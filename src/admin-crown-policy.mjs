export const MAX_ADMIN_CROWN_ADJUSTMENT = 10000;

export function parseAdminCrownAdjustment(input = {}) {
  const userId = Number(input.user_id);
  const amount = Number(input.amount);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    return { ok: false, error: "A valid target account is required." };
  }
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > MAX_ADMIN_CROWN_ADJUSTMENT) {
    return { ok: false, error: `Crown adjustments must be whole numbers between 1 and ${MAX_ADMIN_CROWN_ADJUSTMENT}.` };
  }
  const note = String(input.reason || "").trim().slice(0, 160);
  return { ok: true, userId, amount, note };
}
