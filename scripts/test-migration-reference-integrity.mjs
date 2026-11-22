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

// Only inspect migration paths passed to a real file-loading call. Governance
// self-tests intentionally contain synthetic names such as 0003_reader.sql;
// treating every string literal as a dependency creates false positives.
const referencePattern = /(?:readFileSync|readFile|open)\s*\(\s*(?:new\s+URL\s*\(\s*)?["'`](?:\.\.\/)?migrations\/([0-9]{4}_[A-Za-z0-9_-]+\.sql)["'`]/g;

// Guard the scanner itself: fixture strings are not dependencies, while a
// concrete file-loading expression must still be checked.
const fixtureOnly = "const fixture = 'migrations/0003_reader.sql';";
assert.equal([...fixtureOnly.matchAll(referencePattern)].length, 0);
const actualReference = 'readFileSync(new URL("../migrations/0031_account_closure_requests.sql", import.meta.url), "utf8")';
assert.equal([...actualReference.matchAll(referencePattern)].length, 1);

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
  console.error("FAIL: " + item.file + " loads missing migration " + item.migration);
}
assert.equal(missing.length, 0, "Migration file-loading references must resolve to existing canonical migration files");
console.log("PASS: " + references + " concrete migration file-loading references across " + files.length + " scripts resolve to existing canonical files.");
