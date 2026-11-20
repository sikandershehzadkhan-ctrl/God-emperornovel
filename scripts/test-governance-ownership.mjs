import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const fail = message => { throw new Error("[governance:ownership] " + message); };
const ownerMatches = (owner, file) => owner.paths.some(rule =>
  rule.endsWith("/") ? file.startsWith(rule) : file === rule
);
function ownerForPath(registry, file) {
  const matches = registry.owners.filter(owner => ownerMatches(owner, file));
  if (matches.length !== 1) fail((matches.length ? "multiple owners" : "no registered owner") + " for dependency path: " + file);
  return matches[0];
}
export function validateOwnership(registry, changedPaths = [], trackedPaths = []) {
  if (registry.version !== 2 || !Array.isArray(registry.owners)) fail("unsupported or malformed ownership registry");
  for (const policy of ["unregisteredTrackedPaths","unregisteredChangedPaths","multipleOwners","staleExactEntries","emptyDirectoryRoots","missingOwnerMetadata","unauthorizedCrossDomainImports","unresolvedRelativeImports"]) {
    if (registry.pathPolicy?.[policy] !== "fail") fail("path policy must fail closed: " + policy);
  }
  const roots = [];
  const ids = new Set();
  const requiredText = ["accountableRole","changeOwner","integrationOwner","pathClass","dependencyDirection","sharedSurfacePolicy"];
  for (const owner of registry.owners) {
    if (!owner.id || ids.has(owner.id)) fail("missing or duplicate owner id: " + owner.id);
    ids.add(owner.id);
    if (typeof owner.requiresAdr !== "boolean") fail("owner must explicitly declare requiresAdr: " + owner.id);
    if (!Array.isArray(owner.paths) || owner.paths.length === 0) fail("owner has no paths: " + owner.id);
    for (const field of requiredText) if (typeof owner[field] !== "string" || !owner[field].trim()) {
      fail("owner metadata missing " + field + ": " + owner.id);
    }
    if (!Array.isArray(owner.allowedContents) || owner.allowedContents.length === 0 ||
      owner.allowedContents.some(value => typeof value !== "string" || !value.trim())) {
      fail("owner must declare allowedContents: " + owner.id);
    }
    for (const field of ["allowedDependencies","invokes","runtimeContracts"]) {
      if (!Array.isArray(owner[field])) fail("owner must declare " + field + ": " + owner.id);
    }
    for (const dependency of owner.allowedDependencies) {
      if (!ids.has(dependency) && !registry.owners.some(candidate => candidate.id === dependency)) {
        fail("unknown allowed dependency " + dependency + " for owner " + owner.id);
      }
      if (dependency === owner.id) fail("self dependency must be represented as same-owner import: " + owner.id);
    }
    for (const pathRule of owner.paths) {
      if (typeof pathRule !== "string" || !pathRule || pathRule.startsWith("/") || pathRule.includes("..") || pathRule.includes(String.fromCharCode(92)) || pathRule.includes("//")) {
        fail("invalid ownership path: " + pathRule);
      }
      roots.push({ path: pathRule, owner: owner.id, requiresAdr: owner.requiresAdr });
    }
  }
  for (let i = 0; i < roots.length; i++) for (let j = i + 1; j < roots.length; j++) {
    const a = roots[i], b = roots[j];
    const aPrefix = a.path.endsWith("/") ? a.path : a.path + "/";
    const bPrefix = b.path.endsWith("/") ? b.path : b.path + "/";
    if (a.path === b.path || aPrefix.startsWith(bPrefix) || bPrefix.startsWith(aPrefix)) {
      fail("overlapping ownership roots: " + a.path + " (" + a.owner + ") and " + b.path + " (" + b.owner + ")");
    }
  }
  const ownerFor = file => roots.filter(root => root.path.endsWith("/") ? file.startsWith(root.path) : file === root.path);
  for (const file of new Set(trackedPaths)) {
    const owners = ownerFor(file);
    if (owners.length === 0) fail("tracked repository path has no registered owner: " + file + "; register an owner before integration");
    if (owners.length > 1) fail("tracked repository path has multiple owners: " + file);
  }
  if (trackedPaths.length > 0) {
    for (const root of roots) {
      if (root.path.endsWith("/")) {
        if (!trackedPaths.some(file => file.startsWith(root.path))) fail("directory ownership root contains no tracked repository paths: " + root.path);
      } else if (!trackedPaths.includes(root.path)) {
        fail("exact ownership entry is not a tracked repository path: " + root.path);
      }
    }
  }
  const ownedChanges = [];
  const decisionChanges = [];
  for (const file of new Set(changedPaths)) {
    const owners = ownerFor(file);
    if (owners.length === 0) fail("changed path has no registered owner: " + file + "; register an owner before integration");
    if (owners.length > 1) fail("changed path has multiple owners: " + file);
    ownedChanges.push(file);
    if (owners[0].requiresAdr) decisionChanges.push(file);
  }
  if (decisionChanges.length) {
    const hasAdr = changedPaths.some(file => file.startsWith("docs/architecture/decisions/") && file.endsWith(".md"));
    const hasContract = changedPaths.some(file => file.startsWith("docs/architecture/feature-contracts/") && file.endsWith(".json"));
    if (!hasAdr && !hasContract) fail("decision-required shared-surface changes require an ADR or feature contract in the same PR: " + decisionChanges.join(", "));
  }
  return { ownerRoots: roots.length, trackedPaths: new Set(trackedPaths).size, ownedChanges, decisionChanges };
}
export function validateDependencyDirection(registry, edges) {
  let crossDomainImports = 0;
  for (const edge of edges) {
    const sourceOwner = ownerForPath(registry, edge.from);
    const targetOwner = ownerForPath(registry, edge.to);
    if (sourceOwner.id === targetOwner.id) continue;
    if (!sourceOwner.allowedDependencies.includes(targetOwner.id)) {
      fail("unauthorized cross-domain import: " + edge.from + " (" + sourceOwner.id + ") -> " + edge.to + " (" + targetOwner.id + ")");
    }
    crossDomainImports++;
  }
  return { checkedImports: edges.length, crossDomainImports };
}
export function collectRelativeImports(trackedPaths, readFile = file => fs.readFileSync(file, "utf8")) {
  const tracked = new Set(trackedPaths);
  const edges = [];
  const sourceExtensions = /\.(?:[cm]?js|jsx|ts|tsx)$/i;
  const patterns = [
    /\b(?:import|export)\s+(?:[\s\S]*?\s+from\s*)?["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g
  ];
  ];
  for (const file of trackedPaths) {
    if (!sourceExtensions.test(file)) continue;
    const source = readFile(file);
    const specifiers = new Set();
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      for (const match of source.matchAll(pattern)) {
        const specifier = match[1];
        if (specifier && (specifier.startsWith("./") || specifier.startsWith("../"))) specifiers.add(specifier);
      }
    }
    for (const specifier of specifiers) {
      const clean = specifier.split(/[?#]/, 1)[0];
      const base = path.posix.normalize(path.posix.join(path.posix.dirname(file), clean));
      const candidates = [base, base + ".js", base + ".mjs", base + ".cjs", base + ".json", base + "/index.js", base + "/index.mjs"];
      const target = candidates.find(candidate => tracked.has(candidate));
      if (!target) fail("unresolved relative import: " + file + " -> " + specifier);
      edges.push({ from: file, to: target, specifier });
    }
  }
  return edges;
}
function selfTest() {
  const metadata = (allowedDependencies = []) => ({
    accountableRole:"Fixture owner",
    changeOwner:"Fixture change owner",
    integrationOwner:"Fixture integration owner",
    pathClass:"fixture",
    allowedContents:["Fixture source and test files"],
    dependencyDirection:"Fixture dependencies are explicitly directed.",
    allowedDependencies,
    invokes:[],
    runtimeContracts:[],
    sharedSurfacePolicy:"Fixture-only shared surface policy."
  });
  const owner = (id, paths, requiresAdr, allowedDependencies = []) => ({
    id, paths, requiresAdr, ...metadata(allowedDependencies)
  });
  const registry = { version:2, pathPolicy:{
    unregisteredTrackedPaths:"fail",unregisteredChangedPaths:"fail",multipleOwners:"fail",
    staleExactEntries:"fail",emptyDirectoryRoots:"fail",missingOwnerMetadata:"fail",
    unauthorizedCrossDomainImports:"fail",unresolvedRelativeImports:"fail"
  }, owners:[
    owner("worker",["src/"],true),
    owner("migrations",["migrations/"],true),
    owner("ci",[".github/workflows/"],true,["worker"]),
    owner("architecture",["docs/architecture/"],true),
    owner("archive",["DEPLOY-1.txt"],false)
  ]};
  const trackedFixture=["src/index.js","migrations/0001_init.sql",".github/workflows/test.yml","docs/architecture/README.md","DEPLOY-1.txt"];
  assert.equal(validateOwnership(registry,["src/index.js","docs/architecture/decisions/ADR-0001.md"],trackedFixture).ownedChanges.length,2);
  assert.throws(()=>validateOwnership(registry,["src/index.js"]),/require an ADR or feature contract/);
  assert.throws(()=>validateOwnership(registry,["scripts/new-unguarded-file.mjs"]),/no registered owner/);
  assert.throws(()=>validateOwnership(registry,[],["scripts/existing-unowned-file.mjs"]),/tracked repository path has no registered owner/);
  assert.throws(()=>validateOwnership({...registry,owners:[...registry.owners,owner("stale-exact",["DOES-NOT-EXIST.md"],false)]},[],trackedFixture),/exact ownership entry is not a tracked repository path/);
  assert.throws(()=>validateOwnership({...registry,owners:[...registry.owners,owner("empty-directory",["empty-domain/"],false)]},[],trackedFixture),/directory ownership root contains no tracked repository paths/);
  assert.throws(()=>validateOwnership({...registry,owners:[...registry.owners,owner("overlap",["src/"],true)]}),/overlapping ownership roots/);
  assert.throws(()=>validateOwnership({...registry,owners:[owner("bad-separator",["src"+String.fromCharCode(92)+"escape"],false)]}),/invalid ownership path/);
  assert.throws(()=>validateOwnership(registry,["migrations/0009_new.sql"]),/require an ADR or feature contract/);
  assert.equal(validateOwnership(registry,["DEPLOY-1.txt"]).decisionChanges.length,0);
  assert.equal(validateDependencyDirection(registry,[{from:".github/workflows/test.yml",to:"src/index.js"}]).crossDomainImports,1);
  assert.throws(()=>validateDependencyDirection(registry,[{from:"src/index.js",to:".github/workflows/test.yml"}]),/unauthorized cross-domain import/);
  assert.throws(()=>validateDependencyDirection(registry,[{from:"src/index.js",to:"scripts/missing.mjs"}]),/no registered owner/);
  assert.throws(()=>validateOwnership({...registry,owners:[{...registry.owners[0],allowedDependencies:["unknown-owner"]},...registry.owners.slice(1)]}),/unknown allowed dependency/);
  console.log("PASS: ownership governance self-tests (complete path coverage, owner contracts, ADR requirements, and cross-domain import direction).");
}
if (process.argv.includes("--self-test")) selfTest();
else {
  const baseSha = process.env.GOVERNANCE_BASE_SHA;
  if (!baseSha) fail("GOVERNANCE_BASE_SHA is required.");
  const registry = JSON.parse(fs.readFileSync("docs/architecture/SHARED-SURFACE-OWNERSHIP.json", "utf8"));
  const changedPaths = execFileSync("git", ["diff", "--name-only", baseSha + "...HEAD"], { encoding:"utf8" }).split("\n").filter(Boolean);
  const trackedPaths = execFileSync("git", ["ls-files", "-z"], { encoding:"utf8" }).split("\0").filter(Boolean);
  const result = validateOwnership(registry, changedPaths, trackedPaths);
  const importEdges = collectRelativeImports(trackedPaths);
  const dependencyResult = validateDependencyDirection(registry, importEdges);
  console.log("PASS: " + result.ownerRoots + " ownership roots validated; all " + result.trackedPaths + " tracked paths and " + result.ownedChanges.length + " changed paths have exactly one owner.");
  console.log("PASS: " + dependencyResult.checkedImports + " relative imports checked; " + dependencyResult.crossDomainImports + " authorized cross-domain imports.");
  if (result.decisionChanges.length) console.log("ADR/feature-contract coverage: " + result.decisionChanges.length + " decision-required shared-surface change(s).");
}
