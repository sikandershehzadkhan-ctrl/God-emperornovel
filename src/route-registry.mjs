// Canonical page-route policy derived from the source-audited 2026-11-18 baseline.
// "Observed" means the Worker previously dispatched this route; it does not certify
// authorization, screen completeness, or deployed behavior.
export const PAGE_ROUTE_REGISTRY_VERSION = "1.0.0";

export const PAGE_ROUTE_SHELLS = Object.freeze({
  "/": "index.html",
  "/catalog": "catalog.html",
  "/discover": "catalog.html",
  "/formats": "index.html",
  "/genres": "genres.html",
  "/tags": "tags.html",
  "/search": "search.html",
  "/library": "library.html",
  "/history": "history.html",
  "/following": "following.html",
  "/tickets": "tickets.html",
  "/requests": "requests.html",
  "/omniportal": "omniportal.html",
  "/community": "index.html",
  "/leaderboard": "index.html",
  "/tier-list": "index.html",
  "/random": "index.html",
  "/made-for-you": "index.html",
  "/settings": "index.html",
  "/for-you": "index.html",
  "/trending": "index.html",
  "/vote": "index.html",
  "/notifications": "index.html",
  "/trend-factory": "index.html",
  "/community-taxonomy": "community-taxonomy.html",
  "/privacy": "privacy.html",
  "/terms": "terms.html",
  "/copyright": "copyright.html",
  "/account": "account.html",
  "/login": "login.html",
  "/register": "register.html",
  "/admin": "admin.html",
  "/author": "index.html"
});

// Keep the more specific chapter-directory matcher before the broader novel-detail matcher.
export const DYNAMIC_PAGE_ROUTES = Object.freeze([
  {
    "pattern": "^/format/[^/]+/?$",
    "shell": "index.html",
    "kind": "format-landing"
  },
  {
    "pattern": "^/novel/[0-9]+/chapters/?$",
    "shell": "novel.html",
    "kind": "novel-chapter-directory"
  },
  {
    "pattern": "^/novel/[0-9]+/?$",
    "shell": "novel.html",
    "kind": "novel-detail"
  },
  {
    "pattern": "^/read/[0-9]+/[0-9]+/?$",
    "shell": "read.html",
    "kind": "chapter-reader"
  },
  {
    "pattern": "^/fandom/",
    "shell": "fandom.html",
    "kind": "fandom-tag-redirect"
  },
  {
    "pattern": "^/author/[^/]+$",
    "shell": "author-public.html",
    "kind": "public-author-profile"
  }
].map(route => Object.freeze({ ...route, matcher: new RegExp(route.pattern) })));

export const NOINDEX_EXACT_PATHS = Object.freeze([
  "/admin",
  "/account",
  "/login",
  "/register",
  "/library",
  "/history",
  "/following",
  "/tickets",
  "/requests",
  "/settings",
  "/notifications",
  "/author",
  "/search",
  "/omniportal",
  "/trend-factory",
  "/made-for-you",
  "/for-you"
]);
const noindexSet = new Set(NOINDEX_EXACT_PATHS);

export const SITEMAP_ENDPOINTS = Object.freeze([
  "/sitemap.xml",
  "/sitemap-static.xml",
  "/sitemap-novels.xml",
  "/sitemap-chapters.xml"
]);
const sitemapEndpointSet = new Set(SITEMAP_ENDPOINTS);

// Match URL pathnames only; pagination query parameters are validated by the sitemap handler.
export function isSitemapEndpoint(path) {
  return sitemapEndpointSet.has(path);
}

export const SITEMAP_STATIC_PATHS = Object.freeze([
  "/",
  "/catalog",
  "/formats",
  "/genres",
  "/tags",
  "/community",
  "/leaderboard",
  "/community-taxonomy",
  "/privacy",
  "/terms",
  "/copyright"
]);

export function resolvePageShell(path) {
  if (Object.hasOwn(PAGE_ROUTE_SHELLS, path)) return PAGE_ROUTE_SHELLS[path];
  return DYNAMIC_PAGE_ROUTES.find(route => route.matcher.test(path))?.shell ?? "404.html";
}

export function isNoindexPath(path) {
  return noindexSet.has(path);
}
