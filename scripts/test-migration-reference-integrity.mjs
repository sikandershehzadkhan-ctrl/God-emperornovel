import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const scriptsRoot = join(root, "scripts");
const sourceExtensions = new Set([".js", ".mjs", ".cjs", ".ts", ".py"]);
const files = [];
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (sourceExtensions.has(path.slice(path.lastIndexOf(".")))) files.push(path);
  }
}
walk(scriptsRoot);

const referencePattern = /(?:\.\.\/)?migrations\/([0-9]{4}_[A-Za-z0-9_-]+\.sql)/g;
const missing = [];
let references = 0;
for (const file of files) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(referencePattern)) {
    references += 1;
    const migration = join(root, "migrations", match[1]);
    if (!existsSync(migration)) missing.push({ file: relative(root, file), migration: match[1] });
  }
}
for (const item of missing) {
  console.error("FAIL: " + item.file + " references missing migration " + item.migration);
}
assert.equal(missing.length, 0, "Migration test references must resolve to canonical migration files");
console.log("PASS: " + references + " migration-file references across " + files.length + " scripts resolve to existing canonical files.");
