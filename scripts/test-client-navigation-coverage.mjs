import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const appPath = "public/app.js";
const releaseAppPath = path.join("public", `app-${packageJson.version}.js`);
const workerPath = "src/index.js";

for (const file of [appPath, releaseAppPath, workerPath]) {
  assert.ok(fs.existsSync(file), `Required navigation source is missing: ${file}`);
}

const app = fs.readFileSync(appPath, "utf8");
const releaseApp = fs.readFileSync(releaseAppPath, "utf8");
const worker = fs.readFileSync(workerPath, "utf8");

// The Worker serves the versioned application bundle, so navigation evidence
// must come from the same bytes that are shipped to readers.
assert.equal(releaseApp, app, "Versioned application bundle is out of sync with public/app.js");

const mapMatch = worker.match(/const map=\{([\s\S]*?)\};if\(map\[p\]\)/);
assert.ok(mapMatch, "Could not locate the Worker HTML page map");
const exactRoutes = new Set([
  "/",
  ...[...mapMatch[1].matchAll(/["'](\/[^"']+)["']\s*:/g)].map(match => match[1])
]);

const dynamicPatterns = [
  /^\/format\/[^/]+\/?$/,
  /^\/novel\/[^/]+\/chapters\/?$/,
  /^\/novel\/[^/]+\/?$/,
  /^\/read\/[^/]+\/[^/]+\/?$/,
  /^\/fandom\/.+$/,
  /^\/author\/[^/]+$/
];

function servedByWorker(route) {
  if (exactRoutes.has(route)) return true;
  return dynamicPatterns.some(pattern => pattern.test(route));
}

const rawLinks = [...app.matchAll(/href=["'`]([^"'\`]+)["'`]/g)]
  .map(match => match[1])
  .filter(value => value.startsWith("/"));

const destinations = new Set();
const unresolved = [];

for (const raw of rawLinks) {
  const route = raw.split(/[?#]/, 1)[0].replace(/\$\{[^}]+\}/g, "route-param");
  if (!route || route === "/") {
    destinations.add("/");
    continue;
  }

  // These are deliberate concatenation prefixes in the client, not complete
  // destinations. Their corresponding parameterized Worker route is checked.
  if (route === "/novel/" || route === "/read/") {
    destinations.add(route);
    if (!dynamicPatterns.some(pattern => pattern.test(route + "route-param"))) {
      unresolved.push({ source: raw, normalized: route, reason: "unmatched dynamic route prefix" });
    }
    continue;
  }

  destinations.add(route);
  if (!servedByWorker(route)) {
    unresolved.push({ source: raw, normalized: route, reason: "no exact or dynamic Worker HTML route" });
  }
}

assert.ok(destinations.size > 0, "No same-origin client navigation destinations were discovered");
assert.deepEqual(unresolved, [], `Client navigation destinations missing Worker routes:\n${JSON.stringify(unresolved, null, 2)}`);

console.log(`Client navigation coverage passed: ${destinations.size} distinct destinations/prefixes resolve to Worker HTML routes; shipped bundle matches source.`);
