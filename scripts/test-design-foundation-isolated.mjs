import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const pages = readdirSync("public").filter((name) => name.endsWith(".html"));
const stylesheet = "/imperial-design-foundation.css";
const missing = pages.filter((name) => !readFileSync("public/" + name, "utf8").includes('href="' + stylesheet + '"'));
assert.deepEqual(missing, [], "Every public HTML route must load the shared design foundation");

const author = readFileSync("public/author.html", "utf8");
const admin = readFileSync("public/admin.html", "utf8");
assert.match(author, /<body[^>]*class=["'][^"']*authorStudioPage/, "Author Studio needs its scoped design hook");
assert.match(admin, /<body[^>]*class=["'][^"']*adminDashboardPage/, "Admin needs its scoped design hook");

const css = readFileSync("public/imperial-design-foundation.css", "utf8");
for (const [label, pattern] of [
  ["Imperial purple brand token", /--in-brand:#6A0DAD/i],
  ["Sapphire discovery token", /--in-discovery:#0F52BA/i],
  ["visible keyboard focus", /:focus-visible/],
  ["reduced-motion support", /prefers-reduced-motion/],
  ["44px touch target baseline", /min-height:44px/],
]) assert.match(css, pattern, label + " must be present");

console.log("Design foundation coverage passed for " + pages.length + " public HTML routes.");
