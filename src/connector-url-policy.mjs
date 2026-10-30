export function isAllowedConnectorSearchUrl(value, allowlist = "") {
  const raw = String(value || "").trim();
  if (!raw) return true;
  let target;
  try {
    target = new URL(raw.replaceAll("{q}", "imperial-novel-test-query"));
  } catch {
    return false;
  }
  if (target.protocol !== "https:" || target.username || target.password) return false;
  if (target.port && target.port !== "443") return false;
  if (target.hash) return false;
  const host = target.hostname.toLowerCase().replace(/\.$/, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") ||
      host.endsWith(".local") || host.endsWith(".internal") ||
      /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[") || host.includes(":")) return false;
  const allowed = String(allowlist).split(",").map(x => x.trim().toLowerCase().replace(/\.$/, "")).filter(Boolean);
  return allowed.some(domain => host === domain || host.endsWith("." + domain));
}
