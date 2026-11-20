import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalPathForRoute } from "../src/route-canonical.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "docs/architecture/IMPERIAL-ROUTE-REGISTRY-01N.json"), "utf8"));
const worker = fs.readFileSync(path.join(root, "src/index.js"), "utf8");
const sitemap = fs.readFileSync(path.join(root, "src/sitemap.mjs"), "utf8");
const client = fs.readFileSync(path.join(root, "public/app.js"), "utf8");

assert.equal(manifest.schemaVersion, 1);
assert.equal(manifest.sourceBranch, "main");
assert.match(manifest.sourceBlob, /^src\/index\.js@[a-f0-9]{40}$/);
assert.match(manifest.sitemapSourceBlob, /^src\/sitemap\.mjs@[a-f0-9]{40}$/);
assert.ok(manifest.routes.length >= 30, "exact route inventory unexpectedly small");
assert.ok(manifest.patterns.length >= 5, "dynamic route inventory unexpectedly small");

const htmlStart = worker.indexOf("async function html(");
const htmlEnd = worker.indexOf("\nconst escapeHtml", htmlStart);
assert.ok(htmlStart >= 0 && htmlEnd > htmlStart, "Worker HTML dispatcher not found");
const htmlDispatcher = worker.slice(htmlStart, htmlEnd);
const mapMatch = htmlDispatcher.match(/const map=(\{[\s\S]*?\});if\(map\[p\]\)/);
assert.ok(mapMatch, "Worker exact page-shell map not found");
const dispatchMap = JSON.parse(mapMatch[1]);

const paths = manifest.routes.map(route => route.path);
assert.equal(new Set(paths).size, paths.length, "duplicate exact route path");
assert.deepEqual(Object.keys(dispatchMap).sort(), [...paths].sort(),
  "manifest exact paths differ from Worker dispatcher");

for (const route of manifest.routes) {
  assert.ok(route.path.startsWith("/") && route.shell && route.screen && route.renderer,
    "incomplete route metadata: " + route.path);
  assert.equal(dispatchMap[route.path], route.shell, "Worker shell mismatch: " + route.path);
  if (route.aliasOf) assert.ok(paths.includes(route.aliasOf), "missing alias target: " + route.path);
  if (route.robots === "noindex") assert.ok(manifest.noindexExact.includes(route.path),
    "noindex list mismatch: " + route.path);
  if (route.renderer !== "standalone-html") {
    const renderer = route.renderer.split(":")[0];
    assert.ok(client.includes(renderer + "("), "client renderer missing: " + renderer + " at " + route.path);
  }
}

const noindexMatch = htmlDispatcher.match(/const noindex=new Set\((\[[\s\S]*?\])\)\.has\(p\)/);
assert.ok(noindexMatch, "Worker noindex policy not found");
assert.deepEqual(JSON.parse(noindexMatch[1]).sort(), [...manifest.noindexExact].sort(),
  "manifest noindex paths differ from Worker policy");

for (const route of manifest.patterns) {
  const pattern = new RegExp(route.pattern);
  assert.ok(route.samples.length > 0, "dynamic route has no samples: " + route.pattern);
  for (const sample of route.samples) assert.ok(pattern.test(sample),
    "dynamic pattern sample mismatch: " + sample);
  assert.ok(htmlDispatcher.includes(route.shell), "dynamic shell missing from Worker: " + route.shell);
  if (route.renderer !== "redirect-to-catalog-tag") {
    assert.ok(client.includes(route.renderer + "("), "dynamic client renderer missing: " + route.renderer);
  }
}
const staticMatch = sitemap.match(/const STATIC_PATHS = (\[[\s\S]*?\]);/);
assert.ok(staticMatch, "static sitemap path list not found");
const staticPaths = JSON.parse(staticMatch[1]);
assert.deepEqual(staticPaths, manifest.staticSitemapPaths,
  "manifest static sitemap paths differ from sitemap renderer");
for (const path of manifest.noindexExact) {
  assert.ok(!staticPaths.includes(path), "noindex route leaked into static sitemap: " + path);
}
for (const endpoint of manifest.sitemaps) {
  assert.ok(worker.includes(JSON.stringify(endpoint)), "Worker sitemap endpoint missing: " + endpoint);
}
assert.ok(sitemap.includes("renderStaticSitemap"), "static sitemap renderer missing");
assert.ok(sitemap.includes("renderNovelSitemap"), "novel sitemap renderer missing");
assert.ok(sitemap.includes("renderChapterSitemap"), "chapter sitemap renderer missing");

const sitemapHandlerStart = worker.indexOf("async function sitemap(req,env){");
const sitemapHandlerEnd = worker.indexOf("\nasync function html(", sitemapHandlerStart);
assert.ok(sitemapHandlerStart >= 0 && sitemapHandlerEnd > sitemapHandlerStart,
  "Worker sitemap handler not found");
const sitemapHandler = worker.slice(sitemapHandlerStart, sitemapHandlerEnd);
const sitemapSql = sitemapHandler.split('env.DB.prepare("').slice(1)
  .map(statement => statement.split('")')[0].replaceAll("\n", " ").replaceAll("  ", " ").trim());
const novelSitemapSql = sitemapSql.filter(sql => /FROM novels(?: |$)/.test(sql));
const chapterSitemapSql = sitemapSql.filter(sql => /FROM chapters c JOIN novels n/.test(sql));
const rightsEligibility = "rights_status IN ('original','public_domain','licensed','authorized')";
assert.equal(novelSitemapSql.length, 2, "expected novel sitemap count and page queries");
assert.equal(chapterSitemapSql.length, 2, "expected chapter sitemap count and page queries");
for (const sql of novelSitemapSql) {
  assert.ok(sql.includes("publication_status='published'"),
    "novel sitemap query must exclude unpublished works");
  assert.ok(sql.includes(rightsEligibility),
    "novel sitemap query must exclude works without eligible rights");
}
for (const sql of chapterSitemapSql) {
  assert.ok(sql.includes("c.publication_status='published'"),
    "chapter sitemap query must exclude unpublished chapters");
  assert.ok(sql.includes("n.publication_status='published'"),
    "chapter sitemap query must exclude chapters of unpublished novels");
  assert.ok(sql.includes(rightsEligibility),
    "chapter sitemap query must exclude chapters without eligible parent-work rights");
}
assert.ok(novelSitemapSql.some(sql => sql.includes("ORDER BY id LIMIT ? OFFSET ?")),
  "novel sitemap pages must use deterministic bounded pagination");
assert.ok(chapterSitemapSql.some(sql => sql.includes("ORDER BY c.id LIMIT ? OFFSET ?")),
  "chapter sitemap pages must use deterministic bounded pagination");



assert.equal(manifest.accessPolicy?.shellAccess?.startsWith("public-shell"), true,
  "route shell access boundary must be explicit");
assert.equal(manifest.accessPolicy?.status, "source-audited-initial; not a complete authorization certification");
assert.deepEqual(Object.keys(manifest.accessPolicy.exact).sort(), [...paths].sort(),
  "every exact route must have exactly one access policy");
assert.equal(manifest.accessPolicy.patterns.length, manifest.patterns.length,
  "every dynamic route pattern must have an access policy");
for (const route of manifest.patterns) {
  assert.ok(manifest.accessPolicy.patterns.some(policy => policy.pattern === route.pattern),
    "dynamic route access policy missing: " + route.pattern);
}
assert.ok(!htmlDispatcher.includes("getUser(") && !htmlDispatcher.includes("need("),
  "Worker HTML dispatcher unexpectedly changed its public-shell boundary");

const adminHtml = fs.readFileSync(path.join(root, "public/admin.html"), "utf8");
assert.ok(adminHtml.includes("me.user?.role!=='admin'"),
  "admin client must verify the administrator role before loading its workspace");
assert.ok(worker.includes("const admin=u=>u?.role===\"admin\"?null:"),
  "Worker administrator API guard missing");
for (const endpoint of ["/api/library", "/api/history", "/api/follows", "/api/bookmarks",
  "/api/profile", "/api/tickets/ledger", "/api/notifications", "/api/requests"]) {
  const at = worker.indexOf('if(p==="' + endpoint + '"');
  assert.ok(at >= 0, "account endpoint missing: " + endpoint);
  assert.ok(worker.slice(at, at + 900).includes("need(u)"),
    "account endpoint must require an authenticated session: " + endpoint);
}
assert.ok(worker.includes("WHERE user_id=?") && worker.includes("bind(u.id)"),
  "account data endpoints must retain user-scoped query bindings");
assert.ok(client.includes("me.user.role!=='author'&&me.user.role!=='admin'"),
  "Author Studio client role branch missing");
assert.ok(worker.includes("rights_status='authorized' LIMIT 30"),
  "OmniPortal external search must filter authorized connectors");
const omniImportAt = worker.indexOf('if(p==="/api/omni/import"');
assert.ok(omniImportAt >= 0 && worker.slice(omniImportAt, omniImportAt + 1100).includes("need(u)"),
  "OmniPortal import must require an authenticated user");
assert.ok(worker.slice(omniImportAt, omniImportAt + 1100).includes("c.enabled||c.rights_status!=='authorized'"),
  "OmniPortal import must require an enabled authorized connector");


const novelDetailAt = worker.indexOf("let nm=p.match(");
const chapterContentAt = worker.indexOf("let cm=p.match(");
const chapterUnlockAt = worker.indexOf("unlock$/.test(p)");
const batchUnlockAt = worker.indexOf("let bu=p.match(");
const bookmarkAt = worker.indexOf('if(p==="/api/bookmark"');
assert.ok(novelDetailAt >= 0 && chapterContentAt > novelDetailAt &&
  chapterUnlockAt > chapterContentAt && batchUnlockAt > chapterUnlockAt &&
  bookmarkAt > batchUnlockAt, "reader detail/content/unlock handlers not found");
const novelDetailHandler = worker.slice(novelDetailAt, chapterContentAt);
const chapterContentHandler = worker.slice(chapterContentAt, chapterUnlockAt);
const chapterUnlockHandler = worker.slice(chapterUnlockAt, batchUnlockAt);
const batchUnlockHandler = worker.slice(batchUnlockAt, bookmarkAt);
assert.ok(novelDetailHandler.includes("publication_status=") &&
  novelDetailHandler.includes("published") && novelDetailHandler.includes("rights_status IN"),
  "novel detail API must require published and rights-eligible work");
assert.ok(chapterContentHandler.includes("n.publication_status='published'") &&
  chapterContentHandler.includes("c.publication_status='published'") &&
  chapterContentHandler.includes("rights_status IN"),
  "reader content API must require published chapter and eligible parent work");
assert.ok(chapterContentHandler.includes("open=!c.is_locked") &&
  chapterContentHandler.includes("unlocks WHERE user_id=? AND chapter_id=?") &&
  chapterContentHandler.includes("content:open?c.content:null"),
  "locked chapter body must be withheld unless unlocked or administrator");
assert.ok(chapterUnlockHandler.includes("need(u)") &&
  chapterUnlockHandler.includes("u.id") && chapterUnlockHandler.includes("unlocks") &&
  chapterUnlockHandler.includes("ticket_ledger"),
  "single chapter unlock must authenticate, debit, and record user-scoped entitlement");
assert.ok(batchUnlockHandler.includes("need(u)") &&
  batchUnlockHandler.includes("rights_status IN") &&
  batchUnlockHandler.includes("publication_status='published'") &&
  batchUnlockHandler.includes("is_locked=1") &&
  batchUnlockHandler.includes("unlocks") && batchUnlockHandler.includes("ticket_ledger"),
  "batch unlock must authenticate and restrict purchases to eligible published chapters");


assert.deepEqual(manifest.canonicalPolicy.aliases, {
  "/discover": "/catalog",
  "/for-you": "/made-for-you"
}, "canonical alias policy mismatch");
assert.deepEqual(manifest.noindexPatterns, ["^/fandom/"],
  "dynamic noindex patterns mismatch");
for (const route of manifest.routes) {
  assert.equal(route.canonicalPath, route.aliasOf || route.path,
    "exact route canonical target mismatch: " + route.path);
}
for (const route of manifest.patterns) {
  assert.ok(route.canonicalPathPolicy,
    "dynamic route canonical policy missing: " + route.pattern);
}
assert.equal(canonicalPathForRoute("/"), "/");
assert.equal(canonicalPathForRoute("/discover"), "/catalog");
assert.equal(canonicalPathForRoute("/for-you/"), "/made-for-you");
assert.equal(canonicalPathForRoute("/novel/42/"), "/novel/42");
assert.equal(canonicalPathForRoute("/read/42/7?utm_source=test"), "/read/42/7");
assert.equal(canonicalPathForRoute("/fandom/example"), null,
  "compatibility redirect must not emit a canonical URL");
assert.ok(worker.includes('canonicalPathForRoute(p)'),
  "Worker must use the canonical path resolver");
assert.ok(worker.includes('rel="canonical"') && worker.includes('property="og:url"'),
  "Worker must emit canonical and Open Graph URL metadata");
assert.ok(worker.includes('const noindexPattern=/^\\/fandom\\//.test(p)'),
  "fandom compatibility routes must be noindex");

const languageMatch = client.match(/const IN_LANG=(\{[\s\S]*?\});function isRtlLanguage/);
assert.ok(languageMatch, "UI language dictionary not found");
const uiLanguages = Object.keys(JSON.parse(languageMatch[1]));
assert.deepEqual(uiLanguages, manifest.localePolicy.uiLanguages, "UI language choices differ from the route locale registry");
assert.equal(uiLanguages.length, 14, "expected 14 supported UI language choices");

const languageSelectStart = client.indexOf('<select id="imperialLanguageSelect"');
const languageSelectEnd = client.indexOf("</select>", languageSelectStart);
assert.ok(languageSelectStart >= 0 && languageSelectEnd > languageSelectStart,
  "language selector not found");
const languageSelectMarkup = client.slice(languageSelectStart, languageSelectEnd);
const optionCodes = [...languageSelectMarkup.matchAll(/<option value="([^"]+)"/g)].map(match => match[1]);
assert.equal(optionCodes.length, 14, "language selector must expose 14 choices");
assert.deepEqual([...optionCodes].sort(), [...manifest.localePolicy.uiLanguages].sort(),
  "language selector choices differ from the locale registry");

assert.deepEqual(manifest.localePolicy.rtlLanguageCodes, ["ar", "fa", "ur"]);
assert.ok(client.includes("function isRtlLanguage(language)"), "RTL language resolver missing");
assert.ok(client.includes('document.documentElement.dir=isRtlLanguage(c)?"rtl":"ltr"'), "UI direction must follow the selected interface language");
assert.ok(client.includes("isRtlLanguage(n.language)") && client.includes('id="readerContent"'), "reader content direction must follow the work language independently");
console.log("Worker route registry validated: " + manifest.routes.length +
  " exact routes, " + manifest.patterns.length + " dynamic patterns, " +
  manifest.sitemaps.length + " sitemap endpoints, " +
  manifest.staticSitemapPaths.length + " static sitemap paths.");
