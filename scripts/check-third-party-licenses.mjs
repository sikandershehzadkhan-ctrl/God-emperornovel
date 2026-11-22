import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("package.json", "utf8"));
const lock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
const allowedLicenses = new Set([
  "0BSD",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "CC0-1.0",
  "ISC",
  "MIT",
  "Unlicense",
  "Zlib"
]);

if (lock.lockfileVersion !== 3) {
  throw new Error(`Expected npm lockfile v3; received ${lock.lockfileVersion}.`);
}

const root = lock.packages?.[""];
if (!root) throw new Error("package-lock.json is missing its root package entry.");

for (const group of ["dependencies", "devDependencies", "optionalDependencies"]) {
  const declared = manifest[group] || {};
  const locked = root[group] || {};
  for (const [name, version] of Object.entries(declared)) {
    if (locked[name] !== version) {
      throw new Error(`Lockfile mismatch for ${group} dependency ${name}: package.json=${version}, lockfile=${locked[name] ?? "missing"}.`);
    }
  }
  for (const name of Object.keys(locked)) {
    if (!(name in declared)) {
      throw new Error(`Lockfile contains undeclared root ${group} dependency: ${name}.`);
    }
  }
}

const packages = Object.entries(lock.packages || {})
  .filter(([path, entry]) => path && entry && entry.version)
  .map(([path, entry]) => ({ path, ...entry }))
  .sort((a, b) => a.path.localeCompare(b.path));

if (!packages.length) throw new Error("No locked third-party packages were found.");

const failures = [];
for (const entry of packages) {
  const license = typeof entry.license === "string" ? entry.license.trim() : "";
  if (!license) {
    failures.push(`${entry.path}@${entry.version}: missing licence metadata`);
    continue;
  }
  if (!allowedLicenses.has(license)) {
    failures.push(`${entry.path}@${entry.version}: licence "${license}" requires explicit review`);
  }
  if (entry.resolved && !entry.resolved.startsWith("https://registry.npmjs.org/")) {
    failures.push(`${entry.path}@${entry.version}: non-registry source requires explicit provenance review`);
  }
}

if (failures.length) {
  console.error("Third-party dependency policy failed:");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}

const direct = ["dependencies", "devDependencies", "optionalDependencies"]
  .flatMap(group => Object.entries(manifest[group] || {}).map(([name, version]) => ({ group, name, version })));
console.log(`Third-party dependency policy passed: ${packages.length} locked package entries, ${direct.length} direct dependencies, all with reviewed permissive SPDX identifiers and npm-registry provenance.`);
