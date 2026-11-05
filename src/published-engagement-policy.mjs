export function parsePositiveSafeInteger(value) {
  const parsed = typeof value === "number"
    ? value
    : typeof value === "string" && /^[0-9]+$/.test(value)
      ? Number(value)
      : NaN;
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}
