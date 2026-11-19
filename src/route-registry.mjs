// Canonical runtime route contract for Worker page shells, dynamic page families,
// noindex utility routes, and static sitemap membership.
export const PAGE_SHELLS = Object.freeze(Object.fromEntries([["/","index.html"],["/catalog","catalog.html"],["/discover","catalog.html"],["/formats","index.html"],["/genres","genres.html"],["/tags","tags.html"],["/search","search.html"],["/library","library.html"],["/history","history.html"],["/following","following.html"],["/tickets","tickets.html"],["/requests","requests.html"],["/omniportal","omniportal.html"],["/community","index.html"],["/leaderboard","index.html"],["/tier-list","index.html"],["/random","index.html"],["/made-for-you","index.html"],["/settings","index.html"],["/for-you","index.html"],["/trending","index.html"],["/vote","index.html"],["/notifications","index.html"],["/trend-factory","index.html"],["/community-taxonomy","community-taxonomy.html"],["/privacy","privacy.html"],["/terms","terms.html"],["/copyright","copyright.html"],["/account","account.html"],["/login","login.html"],["/register","register.html"],["/admin","admin.html"],["/author","index.html"]]));
export const DYNAMIC_PAGE_ROUTES = Object.freeze([
  Object.freeze({ kind: "format-landing", pattern: new RegExp("^/format/[^/]+/?$"), shell: "index.html", source_expression: "/^\\/format\\/[^/]+\\/?$/.test(p)" }),
  Object.freeze({ kind: "novel-chapter-directory", pattern: new RegExp("^/novel/[0-9]+/chapters/?$"), shell: "novel.html", source_expression: "/^\\/novel\\/\\d+\\/chapters\\/?$/.test(p)" }),
  Object.freeze({ kind: "novel-detail", pattern: new RegExp("^/novel/[0-9]+/?$"), shell: "novel.html", source_expression: "/^\\/novel\\/\\d+\\/?$/.test(p)" }),
  Object.freeze({ kind: "chapter-reader", pattern: new RegExp("^/read/[0-9]+/[0-9]+/?$"), shell: "read.html", source_expression: "/^\\/read\\/\\d+\\/\\d+\\/?$/.test(p)" }),
  Object.freeze({ kind: "fandom-tag-redirect", pattern: new RegExp("^/fandom/"), shell: "fandom.html", source_expression: "/^\\/fandom\\//.test(p)" }),
  Object.freeze({ kind: "public-author-profile", pattern: new RegExp("^/author/[^/]+/?$"), shell: "author-public.html", source_expression: "/^\\/author\\/[^/]+\\/?$/.test(p)" }),
]);
export const NOINDEX_EXACT_PATHS = Object.freeze(new Set(["/admin","/account","/login","/register","/library","/history","/following","/tickets","/requests","/settings","/notifications","/author","/search","/omniportal","/trend-factory","/made-for-you","/for-you"]));
export const SITEMAP_STATIC_PATHS = Object.freeze(["/","/catalog","/formats","/genres","/tags","/community","/leaderboard","/community-taxonomy","/privacy","/terms","/copyright"]);

export function resolvePageShell(pathname) {
  if (Object.hasOwn(PAGE_SHELLS, pathname)) return PAGE_SHELLS[pathname];
  for (const route of DYNAMIC_PAGE_ROUTES) {
    if (route.pattern.test(pathname)) return route.shell;
  }
  return null;
}

export function canonicalizePagePath(pathname) {
  if (typeof pathname !== "string" || pathname === "/" || !pathname.endsWith("/")) return pathname;
  const canonical = pathname.replace(/\/+$/, "");
  return resolvePageShell(canonical) ? canonical : pathname;
}

export function resolveRouteRedirect(pathname) {
  const match = pathname.match(/^\/fandom\/(.*)$/);
  if (!match) return null;
  const rawSlug = match[1].split("/").pop();
  try {
    return Object.freeze({ path: "/catalog", tag: rawSlug ? decodeURIComponent(rawSlug) : null });
  } catch {
    return Object.freeze({ invalid: true });
  }
}
