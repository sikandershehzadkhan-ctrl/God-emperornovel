export function parseDonationSubmission(body) {
  const amount = Number(body?.amount);
  const reference = String(body?.reference_id ?? "").trim();
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1_000_000) {
    return { ok: false, error: "Donation amount must be a whole number between 1 and 1,000,000 PKR." };
  }
  if (!reference || reference.length > 128 || /[\x00-\x1f\x7f]/.test(reference)) {
    return { ok: false, error: "Enter a valid transaction reference (1-128 characters)." };
  }
  return { ok: true, amount, reference };
}
