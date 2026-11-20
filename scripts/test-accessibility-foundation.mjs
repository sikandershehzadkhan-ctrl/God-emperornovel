import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const version = pkg.version;
const [app, versionedApp, style, versionedStyle, appCss, versionedAppCss] = await Promise.all([
  readFile(new URL("../public/app.js", import.meta.url), "utf8"),
  readFile(new URL(`../public/app-${version}.js`, import.meta.url), "utf8"),
  readFile(new URL("../public/style.css", import.meta.url), "utf8"),
  readFile(new URL(`../public/style-${version}.css`, import.meta.url), "utf8"),
  readFile(new URL("../public/app.css", import.meta.url), "utf8"),
  readFile(new URL("../public/app-17.23.0.css", import.meta.url), "utf8")
]);

assert.equal(app, versionedApp, "source and versioned browser application bundles must stay identical");
assert.ok(app.includes('<a class="skipLink" href="#app">Skip to main content</a>'), "application shell must provide a keyboard skip link");
assert.ok(app.includes("document.createElement('main')"), "application root must be a main landmark");
assert.ok(app.includes("<header class=\"top\"") && app.includes("<nav class=\"navlinks\""), "application shell must provide header and navigation landmarks");
assert.ok(app.includes('aria-controls="imperialMenuDrawer"') && app.includes('aria-expanded="false"'), "navigation toggle must expose its controlled region and expanded state");
assert.ok(app.includes('document.documentElement.dir=(c==="ur"||c==="ar"||c==="fa")?"rtl":"ltr";'), "Urdu, Arabic and Persian UI languages must select RTL direction");
assert.ok(app.includes('id="readerContent" class="readerContent" dir="auto"'), "chapter text direction must be independent of the UI language");

const languageStart = app.indexOf('<select id="imperialLanguageSelect"');
const languageEnd = app.indexOf("</select>", languageStart);
assert.ok(languageStart >= 0 && languageEnd > languageStart, "language selector must exist");
const languageOptions = [...app.slice(languageStart, languageEnd).matchAll(/<option\s+value=/g)];
assert.equal(languageOptions.length, 14, "the UI language selector must retain all 14 language choices");

for (const [name, css] of [["base stylesheet", style], ["versioned stylesheet", versionedStyle]]) {
  assert.ok(css.includes(".skipLink"), name + " must style the skip link");
  assert.ok(css.includes(":focus-visible"), name + " must provide visible keyboard focus");
  assert.ok(css.includes("prefers-reduced-motion"), name + " must respect reduced-motion preferences");
  assert.ok(css.includes("forced-colors:active"), name + " must support forced-colors focus visibility");
}
for (const [name, css] of [["component stylesheet", appCss], ["versioned component stylesheet", versionedAppCss]]) {
  assert.ok(css.includes("forced-colors:active"), name + " must support forced-colors focus visibility");
  assert.ok(css.includes(":focus-visible"), name + " must retain visible focus styles");
}
console.log("PASS: accessibility foundation contracts for skip navigation, landmarks, keyboard focus, reduced motion, forced colors, 14 languages, and independent chapter direction.");
