// Canonical Worker page-shell and indexing contract.
// API authorization and client-side screen completeness are governed separately.
export const PAGE_SHELLS = Object.freeze({
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

export const DYNAMIC_PAGE_ROUTES = Object.freeze([
  Object.freeze({ kind: "format-landing", pattern: /^\/format\/[^/]+\/?$/, shell: "index.html" }),
  Object.freeze({ kind: "novel-chapter-directory", pattern: /^\/novel\/\d+\/chapters\/?$/, shell: "novel.html" }),
  Object.freeze({ kind: "novel-detail", pattern: /^\/novel\/\d+\/?$/, shell: "novel.html" }),
  Object.freeze({ kind: "chapter-reader", pattern: /^\/read\/\d+\/\d+\/?$/, shell: "read.html" }),
  Object.freeze({ kind: "fandom-tag-landing", pattern: /^\/fandom\//, shell: "fandom.html" }),
  Object.freeze({ kind: "public-author-profile", pattern: /^\/author\/[^/]+$/, shell: "author-public.html" })
]);

// noindex is a crawler policy, never an authentication or authorization control.
export const NOINDEX_EXACT_PATHS = Object.freeze(new Set([
  "/admin", "/account", "/login", "/register", "/library", "/history",
  "/following", "/tickets", "/requests", "/settings", "/notifications", "/author"
]));

export function resolvePageShell(pathname) {
  if (Object.hasOwn(PAGE_SHELLS, pathname)) return PAGE_SHELLS[pathname];
  for (const route of DYNAMIC_PAGE_ROUTES) {
    if (route.pattern.test(pathname)) return route.shell;
  }
  return null;
}

export function isNoindexPath(pathname) {
  return NOINDEX_EXACT_PATHS.has(pathname);
}
