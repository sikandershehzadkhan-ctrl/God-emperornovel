// Canonical page routing for the Worker-served Imperial Novel application.
// API routes are handled separately and are intentionally not listed here.
export const PLATFORM_PAGE_ROUTES = Object.freeze({
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

const DYNAMIC_PAGE_ROUTES = Object.freeze([
  [/^\/format\/[^/]+\/?$/, "index.html"],
  [/^\/novel\/\d+\/chapters\/?$/, "novel.html"],
  [/^\/novel\/\d+\/?$/, "novel.html"],
  [/^\/read\/\d+\/\d+\/?$/, "read.html"],
  [/^\/fandom\//, "fandom.html"],
  [/^\/author\/[^/]+$/, "author-public.html"]
]);

export function resolvePlatformPage(pathname) {
  const path = String(pathname || "/");
  if (Object.hasOwn(PLATFORM_PAGE_ROUTES, path)) return PLATFORM_PAGE_ROUTES[path];
  for (const [pattern, file] of DYNAMIC_PAGE_ROUTES) {
    if (pattern.test(path)) return file;
  }
  return "404.html";
}
