import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const registry = JSON.parse(fs.readFileSync("docs/architecture/API-AUTHORIZATION-REGISTRY-01N.json", "utf8"));
const worker = fs.readFileSync("src/index.js", "utf8");
const routeManifest = JSON.parse(fs.readFileSync("docs/architecture/IMPERIAL-ROUTE-REGISTRY-01N.json", "utf8"));
const fail = message => { throw new Error("[api-authorization] " + message); };

assert.equal(registry.version, 1);
assert.equal(registry.sourceFile, "src/index.js");
assert.match(registry.sourceBlob, /^src\/index\.js@[a-f0-9]{40}$/);
assert.equal(routeManifest.apiAuthorizationRegistry, "docs/architecture/API-AUTHORIZATION-REGISTRY-01N.json");
const indexBlob = execFileSync("git", ["hash-object", "src/index.js"], { encoding:"utf8" }).trim();
const apiRegistryBlob = execFileSync("git", ["hash-object", "docs/architecture/API-AUTHORIZATION-REGISTRY-01N.json"], { encoding:"utf8" }).trim();
assert.equal(registry.sourceBlob, "src/index.js@" + indexBlob, "API inventory source blob must match the checked Worker source");
assert.equal(routeManifest.apiAuthorizationRegistrySourceBlob,
  "docs/architecture/API-AUTHORIZATION-REGISTRY-01N.json@" + apiRegistryBlob,
  "page route manifest must pin the API authorization registry blob");

const discovered = new Map();
for (const match of worker.matchAll(/if\(p===["']([^"']+)["'](?:(&&m===|&&m!==)["']([^"']+)["'])?/g)) {
  if (!match[1].startsWith("/api/")) continue;
  // Negative method guards reject unsupported verbs; they are not handlers.
  if (match[2] === "&&m!==") continue;
  const methods = discovered.get(match[1]) || new Set();
  methods.add(match[3] || "ANY");
  discovered.set(match[1], methods);
}
const actualInventory = [...discovered.entries()]
  .map(([path, methods]) => ({ path, methods: [...methods].sort() }))
  .sort((a, b) => a.path.localeCompare(b.path));
assert.deepEqual(registry.exactInventory, actualInventory,
  "API registry must cover every exact API path and method in the Worker");

const adminPaths = actualInventory.filter(route => route.path.startsWith("/api/admin/")).map(route => route.path);
assert.deepEqual(registry.policies.adminOnly.exactPaths, adminPaths,
  "all admin namespace routes must be classified admin-only");

function escapeRegex(value) {
  return value.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
}
function handler(path, method = "ANY") {
  const escaped = escapeRegex(path);
  const expression = method === "ANY"
    ? new RegExp("if\\(p===['\"]" + escaped + "['\"]\\)")
    : new RegExp("if\\(p===['\"]" + escaped + "['\"]&&m===['\"]" + method + "['\"]\\)");
  const match = expression.exec(worker);
  assert.ok(match, "Worker handler missing: " + method + " " + path);
  return worker.slice(match.index, match.index + 4200);
}
for (const route of actualInventory.filter(item => item.path.startsWith("/api/admin/"))) {
  for (const method of route.methods) {
    const snippet = handler(route.path, method);
    if (route.path === "/api/admin/taxonomy" && method === "POST") {
      assert.ok(snippet.includes("adminTaxonomy(req,env"), "taxonomy mutation must delegate to the admin-guarded handler");
      const taxonomyHandler = worker.slice(worker.indexOf("async function adminTaxonomy"), worker.indexOf("async function adminTaxonomy") + 900);
      assert.ok(taxonomyHandler.includes("admin(u)"), "delegated taxonomy handler must enforce the admin role itself");
    } else {
      assert.ok(snippet.includes("admin(u)"), "admin route lacks server-side admin guard: " + method + " " + route.path);
    }
  }
}
for (const override of registry.policies.adminOnly.methodOverrides) {
  const snippet = handler(override.path, override.methods[0]);
  assert.ok(snippet.includes("admin(u)"), "method-specific admin override lacks admin guard: " + override.path);
}
const regexRouteMarkers = worker.split("\n").filter(line => line.includes("if(/^") && line.includes("\\/api\\/") && line.includes(".test(p)")).map(line => line.trimStart().slice(0, line.trimStart().indexOf(".test(p)") + 8));
for (const marker of regexRouteMarkers) {
  assert.ok(registry.dynamicInventory.some(route => route.sourceMarker === marker),
    "dynamic API regex route is missing from the authorization registry: " + marker);
}

for (const route of registry.dynamicInventory) {
  assert.ok(new RegExp(route.pattern).test(route.sample), "dynamic API sample does not match: " + route.pattern);
  assert.ok(worker.includes(route.sourceMarker), "dynamic API route source marker missing: " + route.sourceMarker);
  const markerIndex = worker.indexOf(route.sourceMarker);
  const snippet = worker.slice(markerIndex, markerIndex + 1800);
  if (route.accessClass === "admin-only") {
    assert.ok(snippet.includes("admin(u)"), "dynamic admin route lacks admin guard: " + route.pattern);
  } else if (route.accessClass === "author-owner") {
    assert.ok(snippet.includes("author(u)") && snippet.includes("owner_user_id") && snippet.includes("u.id"),
      "dynamic author route lacks object ownership check: " + route.pattern);
  } else if (route.accessClass === "authenticated-user") {
    assert.ok(snippet.includes("need(u)") && snippet.includes("u.id"),
      "dynamic user route lacks session-user scope: " + route.pattern);
  } else {
    const normalized = snippet.replace(/\\'/g, "'");
    assert.ok(normalized.includes("publication_status='published'") &&
      normalized.includes("rights_status IN ('original','public_domain','licensed','authorized')"),
      "dynamic public content route lacks publication/rights filtering: " + route.pattern);
  }
}

for (const route of registry.policies.userOwned.routes) {
  for (const method of route.methods) {
    const snippet = handler(route.path, method);
    assert.ok(snippet.includes("need(u)"), "user-owned route must require a session: " + method + " " + route.path);
    assert.ok(snippet.includes("u.id"), "user-owned route must derive scope from session u.id: " + method + " " + route.path);
    assert.ok(snippet.includes(".bind("), "user-owned route must bind database ownership to session u.id: " + method + " " + route.path);
    assert.ok(/(?:WHERE|AND)\s+[^\n;]*user_id\s*=\s*\?/.test(snippet) ||
      /INSERT(?: OR IGNORE)? INTO [a-z_]+\s*\([^)]*user_id/.test(snippet),
      "user-owned route must use a parameterized user_id predicate or insert column: " + method + " " + route.path);
  }
}
for (const route of registry.policies.authorOwned.routes) {
  for (const method of route.methods) {
    const snippet = handler(route.path, method);
    assert.ok(snippet.includes("author(u)"), "author route must require author/admin role: " + method + " " + route.path);
    if (route.path === "/api/author/ai/projects" || route.path === "/api/author/novels" || route.path === "/api/author/chapters") {
      assert.ok(snippet.includes("owner_user_id") && snippet.includes("u.id"),
        "author route must enforce resource ownership: " + method + " " + route.path);
      assert.ok(snippet.includes(".bind(") && snippet.includes("u.id"),
        "author-owned route must bind database queries and ownership checks using session values: " + method + " " + route.path);
    }
  }
}
for (const route of registry.policies.publicRightsFiltered.routes) {
  for (const method of route.methods) {
    const snippet = handler(route.path, method);
    assert.ok(snippet.includes("publication_status='published'") &&
      snippet.includes("rights_status IN ('original','public_domain','licensed','authorized')"),
      "public content route lacks publication/rights eligibility filter: " + method + " " + route.path);
  }
}

const omniSearch = handler("/api/omni/search", "GET");
assert.ok(omniSearch.includes("enabled=1 AND rights_status='authorized'"),
  "OmniPortal search must query only enabled, rights-authorized connectors");
const omniImport = handler("/api/omni/import", "POST");
assert.ok(omniImport.includes("need(u)") && omniImport.includes("c.enabled") &&
  omniImport.includes("c.rights_status!=='authorized'") && omniImport.includes("bind(u.id"),
  "OmniPortal imports must be authenticated, user-scoped, and rights-authorized");
const omniJobs = handler("/api/omni/jobs", "GET");
assert.ok(omniJobs.includes("WHERE j.user_id=?") && omniJobs.includes("bind(u.id"),
  "import jobs must be scoped to their requesting user");

const commentGet = handler("/api/comments", "GET");
const commentPost = handler("/api/comments", "POST");
const commentLike = handler("/api/comments/like", "POST");
const commentReport = handler("/api/comments/report", "POST");
for (const [name, snippet] of [["comment GET",commentGet],["comment POST",commentPost],["comment like",commentLike],["comment report",commentReport]]) {
  assert.ok(snippet.includes("publication_status='published'") &&
    snippet.includes("rights_status IN ('original','public_domain','licensed','authorized')"),
    name + " must not expose or mutate comments for unpublished/rights-ineligible works");
}
assert.ok(commentPost.includes("need(u)"), "comment creation must require a session");
assert.ok(commentLike.includes("need(u)") && commentReport.includes("need(u)"),
  "comment reactions and reports must require a session");

const bookmark = handler("/api/bookmark", "POST");
assert.ok(bookmark.includes("need(u)") && bookmark.includes("publication_status='published'") &&
  bookmark.includes("rights_status IN ('original','public_domain','licensed','authorized')") &&
  bookmark.includes("chapterNumber"), "bookmark writes must validate eligible novel and published chapter");

const ratingGet = handler("/api/rating", "GET");
const ratingPost = handler("/api/rating", "POST");
assert.ok(ratingGet.includes("publication_status='published'") &&
  ratingGet.includes("rights_status IN ('original','public_domain','licensed','authorized')"),
  "rating statistics must not expose unpublished/rights-ineligible works");
assert.ok(ratingPost.includes("!Number.isInteger(rating)||rating<1||rating>10"),
  "ratings must be whole numbers on the 1-10 scale");
assert.ok(worker.includes("const tier=x=>Number(x.rating||0)>=9?'S':Number(x.rating||0)>=8?'A':Number(x.rating||0)>=6?'B':'C';"),
  "tier-list thresholds must use the 1-10 rating scale");
assert.ok(ratingPost.includes("need(u)") && ratingPost.includes("u.id"),
  "rating writes must be authenticated and scoped to the session user");

assert.ok(worker.includes("WHERE id=? AND (owner_user_id=? OR ?=char(97,100,109,105,110))"), 
  "author novel update and submission writes must atomically re-check owner_user_id at mutation time");
assert.ok(worker.includes("WHERE id=? AND EXISTS (SELECT 1 FROM novels n WHERE n.id=chapters.novel_id AND (n.owner_user_id=? OR ?=char(97,100,109,105,110)))"),
  "author chapter edits and publication writes must atomically re-check parent novel ownership");

const aiProjectPatch = worker.slice(worker.indexOf('if(aip&&m==="PATCH")'), worker.indexOf('if(/^\\/api\\/author\\/ai\\/projects\\/\\d+\\/blueprint$/.test(p)'));
assert.ok(aiProjectPatch.includes("owner_user_id=? OR ?=char(97,100,109,105,110)"),
  "AI project edits must atomically re-check project ownership in the UPDATE statement");
const aiBlueprint = worker.slice(worker.indexOf('if(/^\\/api\\/author\\/ai\\/projects\\/\\d+\\/blueprint$/.test(p)'), worker.indexOf('if(/^\\/api\\/author\\/ai\\/projects\\/\\d+\\/run$/.test(p)'));
assert.ok(aiBlueprint.includes("owner_user_id=? OR ?=char(97,100,109,105,110)"),
  "AI Story Bible writes must atomically re-check project ownership");
const aiRun = worker.slice(worker.indexOf('if(/^\\/api\\/author\\/ai\\/projects\\/\\d+\\/run$/.test(p)'), worker.indexOf('if(/^\\/api\\/author\\/ai\\/projects\\/\\d+\\/jobs$/.test(p)'));
assert.ok((aiRun.match(/owner_user_id=\? OR \?=char\(97,100,109,105,110\)/g) || []).length >= 3,
  "AI generation state transitions must atomically re-check project ownership");
assert.ok(aiRun.includes("INSERT INTO chapters") && aiRun.includes("INSERT INTO chapters") &&
  aiRun.includes("n.owner_user_id=? OR ?=char(97,100,109,105,110)") &&
  aiRun.includes("n.rights_status IN ('original','public_domain','licensed','authorized')"),
  "AI-generated chapter storage must atomically enforce novel ownership and publication rights");

assert.ok(aiRun.includes("INSERT INTO ai_chapter_jobs") &&
  aiRun.includes("WHERE EXISTS (SELECT 1 FROM ai_author_projects WHERE id=? AND (owner_user_id=? OR ?=char(97,100,109,105,110)))"),
  "AI job creation must atomically verify the project owner");
assert.ok(aiRun.includes("WHERE id=? AND owner_user_id=?"),
  "AI job result writes must be scoped to the authenticated job owner");
const aiJobs = worker.slice(worker.indexOf('if(/^\\/api\\/author\\/ai\\/projects\\/\\d+\\/jobs$/.test(p)'), worker.indexOf('if(p==="/api/author/ai/benchmarks"'));
assert.ok(aiJobs.includes("WHERE project_id=? AND (owner_user_id=? OR ?=char(97,100,109,105,110))"),
  "AI job history reads must be scoped to the project owner or admin");

const webhook = handler("/api/payment/webhook", "POST");
assert.ok(webhook.includes("503") && webhook.includes("temporarily disabled"),
  "payment webhook must remain disabled until provider signature/replay protections are verified");

console.log("PASS: " + actualInventory.length + " exact API paths, " +
  registry.dynamicInventory.length + " dynamic API patterns, admin guards, user/author ownership, rights gates, Omni connector authorization and disabled payment webhook.");
