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

const app = readFileSync("public/app.js", "utf8");
assert.match(app, /const IMPERIAL_THEMES=\['light','dark','sepia','midnight','imperial','cosmic'\]/, "All six global themes must be selectable");
assert.match(app, /localStorage\.setItem\('imperial_theme',chosen\)/, "Selected theme must persist");
assert.match(app, /Current theme:/, "Theme control must announce its current and next theme");
assert.match(app, /id="setSiteTheme"[^>]*>[\s\S]*?<option value="cosmic">Cosmic<\/option>/, "Settings must expose all six global themes");
assert.match(app, /applyImperialTheme\('\$\('#setSiteTheme'\)\.value\)/, "Settings must apply the selected global theme");

const css = readFileSync("public/imperial-design-foundation.css", "utf8");
for (const [label, pattern] of [
  ["Imperial purple brand token", /--in-brand:#6A0DAD/i],
  ["Sapphire discovery token", /--in-discovery:#0F52BA/i],
  ["visible keyboard focus", /:focus-visible/],
  ["reduced-motion support", /prefers-reduced-motion/],
  ["44px touch target baseline", /min-height:44px/],
]) assert.match(css, pattern, label + " must be present");

for (const theme of ["light", "dark", "sepia", "midnight", "imperial", "cosmic"]) {
  assert.ok(css.includes(`html[data-theme="${theme}"]`), "Missing global theme: " + theme);
}

console.log("Design foundation coverage passed for " + pages.length + " public HTML routes and six global themes.");
