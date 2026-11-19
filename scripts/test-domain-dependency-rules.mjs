import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const manifest = JSON.parse(fs.readFileSync("docs/architecture/DOMAIN-MODULE-OWNERSHIP.json", "utf8"));
const owned = Object.values(manifest.domains).flat();
assert.equal(new Set(owned).size, owned.length, "every source module must have exactly one domain owner");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : /\.(?:mjs|js|jsx)$/.test(entry.name) ? [full.replaceAll(path.sep, "/")] : [];
  });
}
const actual = walk("src").sort();
assert.deepEqual([...owned].sort(), actual, "every src module must be assigned to exactly one domain");

const graph = new Map();
for (const file of actual) {
  const source = fs.readFileSync(file, "utf8");
  const imports = [...source.matchAll(/\b(?:import|export)\s+(?:[^'"]*?\s+from\s+)?["']([^"']+)["']/g)].map(match => match[1]);
  const allowed = manifest.allowed_imports[file] || [];
  assert.deepEqual([...imports].sort(), [...allowed].sort(), "module imports must match the approved dependency allowlist: " + file);
  const local = [];
  for (const specifier of imports) {
    if (!specifier.startsWith(".")) {
      assert.ok(file.startsWith("src/react/") && ["react", "react-dom/client"].includes(specifier), "external dependencies are restricted to React islands: " + file + " -> " + specifier);
      continue;
    }
    let target = path.resolve(path.dirname(file), specifier);
    if (!path.extname(target)) {
      const candidate = [target + ".mjs", target + ".js", target + ".jsx", path.join(target, "index.jsx")].find(fs.existsSync);
      assert.ok(candidate, "relative dependency must resolve: " + file + " -> " + specifier);
      target = candidate;
    }
    target = path.relative(process.cwd(), target).replaceAll(path.sep, "/");
    assert.ok(fs.existsSync(target), "relative dependency must exist: " + file + " -> " + specifier);
    local.push(target);
  }
  graph.set(file, local);
}

const visiting = new Set(), visited = new Set();
function visit(file) {
  assert.ok(!visiting.has(file), "source dependency cycle detected at " + file);
  if (visited.has(file)) return;
  visiting.add(file);
  for (const next of graph.get(file) || []) visit(next);
  visiting.delete(file);
  visited.add(file);
}
for (const file of actual) visit(file);

assert.ok(!(graph.get("src/index.js") || []).some(file => file.startsWith("src/react/")), "Worker composition root must not import browser React islands");
assert.ok(!(graph.get("src/route-registry.mjs") || []).includes("src/sitemap.mjs"), "Route registry must not depend on sitemap rendering");
const publicFiles = walk("public");
for (const file of publicFiles.filter(file => /\.(?:js|jsx|mjs)$/.test(file))) {
  const source = fs.readFileSync(file, "utf8");
  assert.ok(!/from\s+["'][^"']*\bsrc\//.test(source) && !/import\(["'][^"']*\bsrc\//.test(source), "public browser code must not import Worker source modules: " + file);
}
console.log("PASS: source module ownership, import allowlists, dependency direction, and cycle checks.");
