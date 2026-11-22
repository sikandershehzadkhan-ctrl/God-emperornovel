import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const registry = JSON.parse(await readFile(
  new URL("../docs/architecture/SHARED-SURFACE-OWNERSHIP.json", import.meta.url),
  "utf8"
));
const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0").filter(Boolean).sort();

assert.ok(tracked.length > 0, "tracked repository inventory must not be empty");
assert.ok(Array.isArray(registry.owners) && registry.owners.length > 0,
  "canonical ownership registry must contain owners");

const ownerIds = new Set();
const declarations = new Map();
for (const owner of registry.owners) {
  assert.ok(owner.id && typeof owner.id === "string", "every owner needs a stable id");
  assert.ok(!ownerIds.has(owner.id), "duplicate owner id: " + owner.id);
  ownerIds.add(owner.id);
  assert.ok(Array.isArray(owner.paths) && owner.paths.length > 0,
    "owner must declare at least one path: " + owner.id);
  for (const field of ["accountableRole", "changeOwner", "integrationOwner",
    "pathClass", "dependencyDirection", "sharedSurfacePolicy"]) {
    assert.ok(typeof owner[field] === "string" && owner[field].trim(),
      owner.id + " must define " + field);
  }
  for (const declaredPath of owner.paths) {
    assert.ok(typeof declaredPath === "string" && declaredPath.length > 0,
      owner.id + " contains an invalid path declaration");
    const list = declarations.get(declaredPath) || [];
    list.push(owner.id);
    declarations.set(declaredPath, list);
  }
}

for (const [declaredPath, owners] of declarations) {
  assert.equal(owners.length, 1,
    "ownership declaration must have one owner: " + declaredPath + " (" + owners.join(", ") + ")");
  const exists = tracked.some(file => declaredPath.endsWith("/")
    ? file.startsWith(declaredPath)
    : file === declaredPath);
  assert.ok(exists, "stale ownership declaration has no tracked file: " + declaredPath);
}

const uncovered = [];
const multiplyOwned = [];
for (const file of tracked) {
  const matches = [];
  for (const owner of registry.owners) {
    if (owner.paths.some(declaredPath => declaredPath.endsWith("/")
      ? file.startsWith(declaredPath)
      : file === declaredPath)) matches.push(owner.id);
  }
  if (matches.length === 0) uncovered.push(file);
  if (matches.length > 1) multiplyOwned.push({ file, owners: matches });
}

assert.deepEqual(uncovered, [],
  "every tracked file must have a canonical owner; unowned: " + uncovered.join(", "));
assert.deepEqual(multiplyOwned, [],
  "every tracked file must have exactly one canonical owner: " + JSON.stringify(multiplyOwned));

console.log("Repository path ownership passed: " + tracked.length +
  " tracked files, " + registry.owners.length +
  " owner domains, zero unowned paths, zero multiply-owned paths.");
