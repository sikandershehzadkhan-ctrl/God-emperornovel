const ALIASES = Object.freeze({
  "/discover": "/catalog",
  "/for-you": "/made-for-you"
});

export function canonicalPathForRoute(pathname) {
  const raw = String(pathname ?? "/").split(/[?#]/, 1)[0] || "/";
  const absolute = raw.startsWith("/") ? raw : "/" + raw;
  const normalized = absolute.length > 1
    ? absolute.replace(/\\/+$/, "") || "/"
    : "/";
  if (normalized.startsWith("/fandom/")) return null;
  return ALIASES[normalized] || normalized;
}
