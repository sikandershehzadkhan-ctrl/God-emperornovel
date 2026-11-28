import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const registry = JSON.parse(await readFile(new URL("../docs/architecture/SHARED-SURFACE-OWNERSHIP.json", import.meta.url), "utf8"));
const publicFiles = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(file => file.startsWith("public/"));
const roots = registry.owners.flatMap(owner => owner.paths.map(path => ({ owner: owner.id, path, requiresAdr: owner.requiresAdr })));
const publicRoots = roots.filter(root => root.path === "public/" || root.path.startsWith("public/"));
assert.ok(publicFiles.length > 0, "tracked public asset inventory must not be empty");
assert.ok(!publicRoots.some(root => root.path === "public/"), "the broad public/ catch-all owner must be retired");

const expected = {
  "public-page-shells": [],
  "public-release-notes": [],
  "public-versioned-release-artifacts": [],
  "frontend-runtime-and-assets": [],
  "public-brand-assets": [],
  "public-crawl-and-sitemap": []
};
for (const file of publicFiles) {
  const name = file.slice("public/".length);
  let owner;
  if (name.startsWith("covers/")) owner = "public-cover-library";
  else if (/^RELEASE_NOTES_/.test(name)) owner = "public-release-notes";
  else if (/\.html$/.test(name)) owner = "public-page-shells";
  else if (name === "robots.txt" || name === "sitemap.xml") owner = "public-crawl-and-sitemap";
  else if (/^(app|style|sw)\.(js|css)$/.test(name) || name === "manifest.webmanifest" || name === "imperial-glass.css") owner = "frontend-runtime-and-assets";
  else if (/^(app|style|sw)-[0-9.]+\.(js|css)$/.test(name) || /^manifest-[0-9.]+\.webmanifest$/.test(name) || /^imperial-[a-z-]+-[0-9.]+\.css$/.test(name) || /^author-editor-[0-9.]+\.css$/.test(name)) owner = "public-versioned-release-artifacts";
  else if (/\.(svg|png|jpg|jpeg|webp|ico)$/.test(name)) owner = "public-brand-assets";
  else assert.fail("Unclassified public file requires an explicit owner: " + file);
  if (owner !== "public-cover-library") expected[owner].push(file);
  const matches = publicRoots.filter(root => root.path.endsWith("/") ? file.startsWith(root.path) : file === root.path);
  assert.equal(matches.length, 1, file + " must have exactly one public domain owner");
  assert.equal(matches[0].requiresAdr, true, file + " changes must require an ADR or feature contract");
}
for (const [id, paths] of Object.entries(expected)) {
  const owner = registry.owners.find(item => item.id === id);
  assert.ok(owner, "missing public domain owner: " + id);
  assert.deepEqual(owner.paths, paths.sort(), "public ownership inventory drift: " + id);
}
const covers = registry.owners.find(item => item.id === "public-cover-library");
assert.ok(covers, "cover library must have a dedicated owner");
assert.deepEqual(covers.paths, ["public/covers/"]);
console.log("Public domain ownership passed: " + publicFiles.length + " tracked public files covered by seven explicit owner groups.");
