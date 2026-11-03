import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const pages = readdirSync("public").filter((name) => name.endsWith(".html"));
const stylesheet = "/imperial-design-foundation.css";
const pageSources = Object.fromEntries(pages.map((name) => [name, readFileSync("public/" + name, "utf8")]));
const missing = pages.filter((name) => !pageSources[name].includes('href="' + stylesheet + '"'));
assert.deepEqual(missing, [], "Every public HTML route must load the shared design foundation");
const missingViewport = pages.filter((name) => !/<meta\s+name=["']viewport["']\s+content=/i.test(pageSources[name]));
assert.deepEqual(missingViewport, [], "Every public HTML route must declare a mobile viewport");
const missingLanguage = pages.filter((name) => !/<html\b[^>]*\blang=["'][a-z]{2}(?:-[A-Z]{2})?["']/i.test(pageSources[name]));
assert.deepEqual(missingLanguage, [], "Every public HTML route must declare a document language");

const author = readFileSync("public/author.html", "utf8");
const admin = readFileSync("public/admin.html", "utf8");
assert.match(author, /<body[^>]*class=["'][^"']*authorStudioPage/, "Author Studio needs its scoped design hook");
assert.match(admin, /<body[^>]*class=["'][^"']*adminDashboardPage/, "Admin needs its scoped design hook");

const app = readFileSync("public/app.js", "utf8");
assert.match(app, /const IMPERIAL_THEMES=\['light','dark','sepia','midnight','imperial','cosmic'\]/, "All six global themes must be selectable");
assert.match(app, /localStorage\.setItem\('imperial_theme',chosen\)/, "Selected theme must persist");
assert.match(app, /Current theme:/, "Theme control must announce its current and next theme");
assert.match(app, /id="setSiteTheme"[^>]*>[\s\S]*?<option value="cosmic">Cosmic<\/option>/, "Settings must expose all six global themes");
assert.match(app, /applyImperialTheme\(\$\('#setSiteTheme'\)\.value\)/, "Settings must apply the selected global theme");

const css = readFileSync("public/imperial-design-foundation.css", "utf8");
for (const [label, pattern] of [
  ["tablet navigation breakpoint", /@media\(max-width:760px\)/],
  ["compact-phone header breakpoint", /@media\(max-width:390px\)/],
  ["very-narrow-phone layout breakpoint", /@media\(max-width:340px\)/],
  ["safe-area-aware mobile navigation", /padding:[^;]*env\(safe-area-inset-bottom\)/],
  ["horizontal overflow containment", /html,body\{max-width:100%;overflow-x:clip\}/],
  ["RTL menu drawer positioning", /html\[dir="rtl"\] \.menuDrawer\{[\s\S]*?inset-inline-start:0;[\s\S]*?inset-inline-end:auto/],
]) assert.match(css, pattern, label + " must be present");

assert.match(app, /document\.documentElement\.dir=\(c==="ur"\|\|c==="ar"\)\?"rtl":"ltr"/,
  "Urdu and Arabic interface languages must set the document direction");

assert.match(css, /html\[dir="rtl"\] \.chapterDrawer\{[\s\S]*?inset-inline-start:0;[\s\S]*?border-right:1px solid/,
  "Chapter drawer must mirror to the correct edge in RTL");
assert.match(css, /html\[dir="rtl"\] \.catalogCover \.statusBadge\{left:auto;right:9px\}/,
  "Catalog status badges must mirror in RTL");
assert.match(css, /html\[dir="rtl"\] \.homeFormatArrow\{margin-left:0;margin-inline-start:auto\}/,
  "Format arrows must use the correct logical start edge in RTL");

function luminance(hex) {
  const channels = hex.slice(1).match(/.{2}/g).map((value) => parseInt(value, 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
const themeBlocks = {
  light: css.match(/:root\s*\{([^}]*)\}/)?.[1],
  ...Object.fromEntries(["dark", "sepia", "midnight", "imperial", "cosmic"].map((theme) => [
    theme, css.match(new RegExp('html\\[data-theme="' + theme + '"\\]\\s*\\{([^}]*)\\}'))?.[1],
  ])),
};
for (const [theme, block] of Object.entries(themeBlocks)) {
  assert.ok(block, "Missing token block for " + theme);
  const tokens = Object.fromEntries([...block.matchAll(/--in-(ink|muted|subtle|canvas|surface|surface-raised):\s*(#[0-9A-Fa-f]{6})/g)].map((match) => [match[1], match[2]]));
  for (const foreground of ["ink", "muted", "subtle"]) {
    for (const background of ["canvas", "surface", "surface-raised"]) {
      assert.ok(tokens[foreground] && tokens[background], "Missing " + foreground + "/" + background + " token for " + theme);
      assert.ok(contrast(tokens[foreground], tokens[background]) >= 4.5,
        theme + " " + foreground + " on " + background + " must meet WCAG AA normal-text contrast");
    }
  }
}

assert.match(css, /:is\(html\[data-theme="dark"\],html\[data-theme="midnight"\],html\[data-theme="imperial"\],html\[data-theme="cosmic"\]\)/, "Dark-surface component refinements must cover every dark theme");

for (const theme of ["light", "dark", "sepia", "midnight", "imperial", "cosmic"]) {
  assert.ok(css.includes(`html[data-theme="${theme}"]`), "Missing global theme: " + theme);
}

console.log("Design foundation coverage passed for " + pages.length + " public HTML routes and six global themes.");
