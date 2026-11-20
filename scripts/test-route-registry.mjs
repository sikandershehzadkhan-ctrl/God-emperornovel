import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "docs/architecture/IMPERIAL-ROUTE-REGISTRY-01N.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const worker = fs.readFileSync(path.join(root, "src/index.js"), "utf8");
const sitemap = fs.readFileSync(path.join(root, "src/sitemap.mjs"), "utf8");

assert.equal(manifest.schemaVersion, 1);
assert.equal(manifest.sourceBranch, "main");
assert.match(manifest.sourceBlob, /^src\/index\.js@[a-f0-9]{40}$/);
assert.ok(manifest.routes.length >= 30, "exact route inventory unexpectedly small");
assert.ok(manifest.patterns.length >= 5, "dynamic route inventory unexpectedly small");

const htmlStart = worker.indexOf("async function html(");
const htmlEnd = worker.indexOf("\\nconst escapeHtml", htmlStart);
assert.ok(htmlStart >= 0 && htmlEnd > htmlStart, "Worker HTML dispatcher not found");
const htmlDispatcher = worker.slice(htmlStart, htmlEnd);
const mapMatch = htmlDispatcher.match(/const map=(\\{[\\s\\S]*?\\});if\\(map\\[p\\]\\)/);
assert.ok(mapMatch, "Worker exact page-shell map not found");
const dispatchMap = JSON.parse(mapMatch[1]);

const paths = manifest.routes.map(route => route.path);
assert.equal(new Set(paths).size, paths.length, "duplicate exact route path");
assert.deepEqual(
  Object.keys(dispatchMap).sort(),
  [...paths].sort(),
  "manifest exact paths differ from Worker dispatcher"
);

for (const route of manifest.routes) {
  assert.ok(route.path.startsWith("/") && route.shell && route.screen && route.renderer,
    "incomplete route metadata: " + route.path);
  assert.equal(dispatchMap[route.path], route.shell, "Worker shell mismatch: " + route.path);
  if (route.aliasOf) assert.ok(paths.includes(route.aliasOf), "missing alias target: " + route.path);
  if (route.robots === "noindex") assert.ok(manifest.noindexExact.includes(route.path),
    "noindex list mismatch: " + route.path);
}

const noindexMatch = htmlDispatcher.match(/const noindex=new Set\\((\\[[\\s\\S]*?\\])\\)\\.has\\(p\\)/);
assert.ok(noindexMatch, "Worker noindex policy not found");
const workerNoindex = JSON.parse(noindexMatch[1]);
assert.deepEqual([...workerNoindex].sort(), [...manifest.noindexExact].sort(),
  "manifest noindex paths differ from Worker policy");

for (const route of manifest.patterns) {
  const pattern = new RegExp(route.pattern);
  assert.ok(route.samples.length > 0, "dynamic route has no samples: " + route.pattern);
  for (const sample of route.samples) assert.ok(pattern.test(sample),
    "dynamic pattern sample mismatch: " + sample);
  assert.ok(htmlDispatcher.includes(route.shell), "dynamic shell missing from Worker: " + route.shell);
}
for (const endpoint of manifest.sitemaps) {
  assert.ok(worker.includes(JSON.stringify(endpoint)), "Worker sitemap endpoint missing: " + endpoint);
}
assert.ok(sitemap.includes("renderStaticSitemap"), "static sitemap renderer missing");
assert.ok(sitemap.includes("renderNovelSitemap"), "novel sitemap renderer missing");
assert.ok(sitemap.includes("renderChapterSitemap"), "chapter sitemap renderer missing");

console.log("Worker route registry validated: " + manifest.routes.length +
  " exact routes, " + manifest.patterns.length + " dynamic patterns, " +
  manifest.sitemaps.length + " sitemap endpoints.");
