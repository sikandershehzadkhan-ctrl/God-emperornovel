import { CANONICAL_ALIASES, DYNAMIC_ROUTE_REGISTRY } from "./route-registry.mjs";

export function canonicalPathForRoute(pathname) {
  const raw = String(pathname ?? "/").split(/[?#]/, 1)[0] || "/";
  const absolute = raw.startsWith("/") ? raw : "/" + raw;
  const normalized = absolute.length > 1
    ? absolute.replace(/\/+$/, "") || "/"
    : "/";
  if (DYNAMIC_ROUTE_REGISTRY.some(route =>
    route.canonicalPathPolicy === "omitted-compatibility-redirect" && route.regex.test(normalized)
  )) return null;
  return CANONICAL_ALIASES[normalized] || normalized;
}
