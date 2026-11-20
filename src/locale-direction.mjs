const RTL_LANGUAGE_CODES = new Set(["ar", "fa", "ur"]);
const RTL_LANGUAGE_NAMES = new Set(["arabic", "farsi", "persian", "urdu"]);

export function isRtlLanguage(language) {
  const normalized = String(language ?? "").trim().toLowerCase().replaceAll("_", "-");
  if (!normalized) return false;
  const primary = normalized.split("-")[0];
  return RTL_LANGUAGE_CODES.has(primary) || RTL_LANGUAGE_NAMES.has(normalized) ||
    RTL_LANGUAGE_NAMES.has(primary);
}
