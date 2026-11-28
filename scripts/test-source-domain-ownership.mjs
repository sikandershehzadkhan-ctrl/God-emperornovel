import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const registry = JSON.parse(await readFile(new URL("../docs/architecture/SHARED-SURFACE-OWNERSHIP.json", import.meta.url), "utf8"));
const sourceFiles = execFileSync("git", ["ls-files", "-z", "--", "src"], { encoding: "utf8" }).split("\0").filter(Boolean);
const roots = registry.owners.flatMap(owner => owner.paths.map(path => ({ owner: owner.id, path, requiresAdr: owner.requiresAdr })));
const sourceRoots = roots.filter(root => root.path === "src/" || root.path.startsWith("src/"));

assert.ok(sourceFiles.length > 0, "tracked Worker source inventory must not be empty");
assert.ok(!sourceRoots.some(root => root.path === "src/"), "the broad src/ catch-all owner must be retired");
for (const file of sourceFiles) {
  const matches = sourceRoots.filter(root => root.path.endsWith("/") ? file.startsWith(root.path) : file === root.path);
  assert.equal(matches.length, 1, file + " must have exactly one domain owner");
  assert.equal(matches[0].requiresAdr, true, file + " changes must require an architecture decision or feature contract");
}
const expectedGroups = {
  "worker-runtime": ["src/index.js"],
  "route-and-sitemap": ["src/route-canonical.mjs", "src/route-registry.mjs", "src/sitemap.mjs"],
  "authentication-security": ["src/auth-password.mjs"],
  "connector-security": ["src/connector-url-policy.mjs"],
  "content-policy": ["src/comic-chapter-policy.mjs", "src/content-formats.mjs", "src/rich-text-chapter-policy.mjs"],
  "author-application-policy": ["src/author-application-policy.mjs"],
  "donation-domain": ["src/donation-approval-policy.mjs", "src/donation-reference-index.mjs", "src/donation-reference-policy.mjs"],
  "public-novel-projection": ["src/public-novel.mjs"],
  "runtime-schema": ["src/runtime-feature-schema.mjs"],
  "reader-community-components": ["src/react/"]
};
for (const [id, expectedPaths] of Object.entries(expectedGroups)) {
  const owner = registry.owners.find(item => item.id === id);
  assert.ok(owner, "missing source domain owner: " + id);
  assert.deepEqual(owner.paths, expectedPaths, "source domain ownership drift: " + id);
}
console.log("Source domain ownership passed: " + sourceFiles.length + " tracked source files covered by " + Object.keys(expectedGroups).length + " explicit domain owners.");
