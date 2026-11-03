import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const worker = readFileSync("src/index.js", "utf8");
const routeBlock = worker.match(/const noindex\s*=\s*new Set\(\[([^\]]+)\]\)/);
assert.ok(routeBlock, "Worker must define an explicit private-route noindex policy");

const configured = new Set([...routeBlock[1].matchAll(/["']([^"']+)["']/g)].map(match => match[1]));
const requiredPrivateRoutes = [
  "/admin", "/account", "/login", "/register", "/library", "/history",
  "/following", "/tickets", "/requests", "/settings", "/notifications", "/author"
];
for (const route of requiredPrivateRoutes) {
  assert.ok(configured.has(route), route + " must be excluded from search indexing");
}

assert.ok(worker.includes("if(noindex)text=text.replace("), "Private-route policy must be applied while rendering HTML");
assert.ok(worker.includes("noindex,nofollow"), "Private-route responses must emit noindex,nofollow");
assert.ok(worker.includes("name=") && worker.includes("robots"), "Worker must replace the HTML robots directive");

console.log("Private-route robots policy regression passed for " + requiredPrivateRoutes.length + " routes.");
