import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SITEMAP_STATIC_PATHS as sitemapPaths } from "../src/sitemap.mjs";
import { PAGE_ROUTE_SHELLS, DYNAMIC_PAGE_ROUTES, NOINDEX_EXACT_PATHS, SITEMAP_STATIC_PATHS, resolvePageShell, isNoindexPath } from "../src/route-registry.mjs";

const manifest = JSON.parse(await readFile(new URL("../docs/architecture/IMPERIAL-ROUTE-INVENTORY-BASELINE-2026-11-18.json", import.meta.url), "utf8"));
const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const client = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
const sitemapSource = await readFile(new URL("../src/sitemap.mjs", import.meta.url), "utf8");
const wrangler = await readFile(new URL("../wrangler.toml", import.meta.url), "utf8");

assert.equal(manifest.status, "source-inventory-baseline-not-release-certified");
assert.equal(manifest.source_evidence.worker_file, "src/index.js");
assert.equal(manifest.source_evidence.sitemap_file, "src/sitemap.mjs");
assert.equal(manifest.source_evidence.client_file, "public/app.js");
assert.ok(worker.includes("resolvePageShell(p)"), "Worker must resolve page shells through the canonical route registry");
assert.ok(worker.includes("isNoindexPath(p)"), "Worker must resolve noindex policy through the canonical route registry");

const expectedMap = Object.fromEntries(manifest.page_routes.map(route => [route.path, route.shell]));
assert.deepEqual(PAGE_ROUTE_SHELLS, expectedMap, "canonical exact page route map must match the audited baseline");
assert.equal(Object.keys(PAGE_ROUTE_SHELLS).length, 33, "expected 33 exact page routes");
assert.equal(new Set(Object.keys(PAGE_ROUTE_SHELLS)).size, Object.keys(PAGE_ROUTE_SHELLS).length, "exact page routes must be unique");
for (const route of manifest.page_routes) assert.equal(resolvePageShell(route.path), route.shell, "exact route shell mismatch: " + route.path);
assert.equal(resolvePageShell("/not-a-real-page"), "404.html", "unknown paths must resolve to the 404 shell");

assert.equal(DYNAMIC_PAGE_ROUTES.length, manifest.dynamic_page_patterns.length, "dynamic route registry count must match the audited baseline");
assert.equal(DYNAMIC_PAGE_ROUTES.length, 6, "expected six dynamic HTML route families");
for (const route of manifest.dynamic_page_patterns) {
  const registered = DYNAMIC_PAGE_ROUTES.find(candidate => candidate.pattern === route.pattern && candidate.shell === route.shell && candidate.kind === route.kind);
  assert.ok(registered, "dynamic route missing from canonical registry: " + route.kind);
  assert.ok(route.samples?.length, "dynamic route must include representative samples: " + route.kind);
  for (const sample of route.samples) {
    assert.ok(registered.matcher.test(sample), "dynamic route sample mismatch: " + sample);
    assert.equal(resolvePageShell(sample), route.shell, "dynamic route shell mismatch: " + sample);
  }
  if (route.client_source_expression) assert.ok(client.includes(route.client_source_expression), "Client route behavior expression missing: " + route.kind);
}

assert.deepEqual([...NOINDEX_EXACT_PATHS], manifest.noindex_exact_paths, "noindex paths must match audited source baseline");
for (const path of NOINDEX_EXACT_PATHS) assert.equal(isNoindexPath(path), true, "noindex policy missing: " + path);
assert.equal(isNoindexPath("/catalog"), false, "public catalog must remain indexable by default");
assert.deepEqual([...SITEMAP_STATIC_PATHS], manifest.sitemap_static_paths, "canonical sitemap paths must match audited baseline");
assert.deepEqual([...sitemapPaths], [...SITEMAP_STATIC_PATHS], "sitemap renderer must consume canonical static paths");
assert.ok(sitemapSource.includes("route-registry.mjs"), "sitemap source must import the canonical route registry");

const apiStart = worker.indexOf("async function api(");
const sitemapStart = worker.indexOf("async function sitemap(");
assert.ok(apiStart >= 0 && sitemapStart > apiStart, "API handler boundaries must be discoverable");
const apiSource = worker.slice(apiStart, sitemapStart);
assert.equal(new Set(manifest.api_route_literals.map(route => route.path)).size, manifest.api_route_literals.length, "API path literals must be unique");
for (const route of manifest.api_route_literals) {
  assert.ok(apiSource.includes(JSON.stringify(route.path)) || apiSource.includes("'" + route.path + "'"), "API path literal missing from handler: " + route.path);
  assert.equal(route.methods, "not-yet-normalized", "unverified API methods must remain explicitly unresolved");
  assert.equal(route.authentication, "not-yet-normalized", "unverified API auth must remain explicitly unresolved");
}

for (const endpoint of manifest.sitemap_endpoints) {
  assert.ok(worker.includes('path === "' + endpoint + '"') || worker.includes('path !== "' + endpoint + '"') || worker.includes('path==="' + endpoint + '"') || worker.includes('path!=="' + endpoint + '"'), "Worker sitemap endpoint missing: " + endpoint);
  assert.ok(wrangler.includes('"' + endpoint + '"'), "Cloudflare route missing for " + endpoint);
}
assert.ok(manifest.known_gaps.some(gap => gap.includes("A noindex directive is not authorization")));
console.log("Canonical route registry passed: " + Object.keys(PAGE_ROUTE_SHELLS).length + " exact HTML routes, " + DYNAMIC_PAGE_ROUTES.length + " dynamic patterns, " + manifest.api_route_literals.length + " API path literals, " + SITEMAP_STATIC_PATHS.length + " static sitemap paths.");
