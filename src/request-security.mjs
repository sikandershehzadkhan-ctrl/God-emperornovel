const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isSameOriginMutationAllowed(request, url = new URL(request.url)) {
  if (SAFE_METHODS.has(String(request.method || "GET").toUpperCase())) return true;
  const origin = request.headers.get("origin");
  const fetchSite = String(request.headers.get("sec-fetch-site") || "").toLowerCase();
  return Boolean(origin && origin === url.origin && fetchSite !== "cross-site" && fetchSite !== "none");
}
