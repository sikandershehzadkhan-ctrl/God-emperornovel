const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isSameOriginMutationAllowed(request, url = new URL(request.url)) {
  const method = String(request.method || "GET").toUpperCase();
  if (SAFE_METHODS.has(method)) return true;

  const origin = request.headers.get("origin");
  const fetchSite = String(request.headers.get("sec-fetch-site") || "").toLowerCase();

  if (!origin || origin !== url.origin) return false;
  if (fetchSite === "cross-site" || fetchSite === "none") return false;
  return true;
}
