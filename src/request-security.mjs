const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Browser mutations to the Worker API must carry the exact site origin.
// Sec-Fetch-Site is an additional signal, not a replacement for Origin.
export function isSameOriginMutationAllowed(request, url = new URL(request.url)) {
  const method = String(request.method || "GET").toUpperCase();
  if (SAFE_METHODS.has(method)) return true;
  const origin = request.headers.get("origin");
  const fetchSite = String(request.headers.get("sec-fetch-site") || "").toLowerCase();
  return Boolean(origin && origin === url.origin && fetchSite !== "cross-site" && fetchSite !== "none");
}
