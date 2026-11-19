import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import {
  PAGE_SHELLS,
  DYNAMIC_PAGE_ROUTES,
  NOINDEX_EXACT_PATHS,
  resolvePageShell,
  isNoindexPath
} from "../src/route-registry.mjs";
import { SITEMAP_STATIC_PATHS } from "../src/sitemap.mjs";

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const robots = await readFile(new URL("../public/robots.txt", import.meta.url), "utf8");
const sitemapFallback = await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8");
const wrangler = await readFile(new URL("../wrangler.toml", import.meta.url), "utf8");

assert.ok(worker.startsWith('import { resolvePageShell, isNoindexPath } from "./route-registry.mjs";'),
  "Worker must import the canonical route registry");
assert.ok(worker.includes('const file=resolvePageShell(p)||"404.html";'),
  "HTML shell selection must come from the route registry");
assert.ok(worker.includes("const noindex=isNoindexPath(p);"),
  "noindex policy must come from the route registry");
assert.ok(worker.includes("else if(resolvePageShell(p)||!p.includes(\".\"))r=await html(req,env);"),
  "Worker page dispatch must use the canonical route registry");

for (const [path, shell] of Object.entries(PAGE_SHELLS)) {
  assert.equal(resolvePageShell(path), shell, "Exact route resolves to its declared shell: " + path);
  assert.ok(existsSync(new URL("../public/" + shell, import.meta.url)),
    "Every page shell must exist: " + path + " -> " + shell);
}
for (const route of DYNAMIC_PAGE_ROUTES) {
  assert.ok(route.kind && route.pattern instanceof RegExp && route.shell,
    "Dynamic route declaration must be complete");
}
const samples = [
  ["/format/manga", "index.html"],
  ["/novel/42", "novel.html"],
  ["/novel/42/chapters", "novel.html"],
  ["/read/42/7", "read.html"],
  ["/fandom/dragon", "fandom.html"],
  ["/author/example", "author-public.html"]
];
for (const [path, shell] of samples) assert.equal(resolvePageShell(path), shell, "Dynamic route sample: " + path);
assert.equal(resolvePageShell("/novel/not-a-number"), null);
assert.equal(resolvePageShell("/read/42"), null);
assert.equal(resolvePageShell("/author/example/extra"), null);

for (const path of ["/admin", "/account", "/login", "/register", "/library", "/history", "/following", "/tickets", "/requests", "/settings", "/notifications", "/author"]) {
  assert.equal(isNoindexPath(path), true, "Private/account utility path must be noindex: " + path);
}
assert.equal(isNoindexPath("/author/example"), false, "Public author profiles must not inherit the author-studio noindex rule");
assert.equal(isNoindexPath("/catalog"), false, "Public catalog must remain indexable");
assert.deepEqual(SITEMAP_STATIC_PATHS, [
  "/", "/catalog", "/formats", "/genres", "/tags", "/search",
  "/community", "/leaderboard", "/omniportal", "/trend-factory",
  "/community-taxonomy", "/privacy", "/terms", "/copyright"
]);
for (const path of SITEMAP_STATIC_PATHS) {
  assert.ok(sitemapFallback.includes("god-emperornovel.sikandershehzadkhan.workers.dev" + path),
    "Static fallback sitemap must contain the runtime static path: " + path);
  assert.ok(wrangler.includes('"/sitemap.xml"') && wrangler.includes('"/sitemap-static.xml"') &&
    wrangler.includes('"/sitemap-novels.xml"') && wrangler.includes('"/sitemap-chapters.xml"'),
    "All dynamic sitemap routes must run through the Worker");
}
assert.ok(robots.includes("/sitemap.xml"), "robots.txt must advertise the canonical sitemap");
console.log("Canonical route registry passed: " + Object.keys(PAGE_SHELLS).length +
  " exact page routes, " + DYNAMIC_PAGE_ROUTES.length + " dynamic route families, " +
  SITEMAP_STATIC_PATHS.length + " static sitemap routes.");
