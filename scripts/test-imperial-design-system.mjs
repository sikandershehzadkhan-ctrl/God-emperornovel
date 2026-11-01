import assert from "node:assert/strict";
import fs from "node:fs";

const cssPath = "public/imperial-design-system-17.25.0.css";
const htmlPath = "public/index.html";
const css = fs.readFileSync(cssPath, "utf8");
const html = fs.readFileSync(htmlPath, "utf8");

const requiredTokens = [
  "--in-color-obsidian-950:",
  "--in-color-white:",
  "--in-color-purple-500:",
  "--in-color-sapphire-500:",
  "--in-font-ui:",
  "--in-font-editorial:",
  "--in-space-4:",
  "--in-radius-lg:",
  "--in-surface-canvas:",
  "--in-text-primary:",
  "--in-action-primary:",
  "--in-focus:"
];

for (const token of requiredTokens) {
  assert.ok(css.includes(token), `Missing design token: ${token}`);
}

for (const theme of ["light", "dark", "midnight", "sepia", "imperial", "cosmic"]) {
  if (theme === "light") {
    assert.match(css, /:root\s*\{/);
  } else {
    assert.ok(css.includes(`data-theme="${theme}"`), `Missing theme mapping: ${theme}`);
  }
}

for (const component of [
  ".in-btn-primary",
  ".in-btn-secondary",
  ".in-control",
  ".in-card",
  ".in-badge",
  ".in-reading-column",
  ".in-focus-ring"
]) {
  assert.ok(css.includes(component), `Missing component primitive: ${component}`);
}

assert.match(css, /prefers-reduced-motion\s*:\s*reduce/);
assert.match(css, /:focus-visible/);
assert.ok(html.includes('/imperial-design-system-17.25.0.css'),
  "Design-system stylesheet must be linked from the application entry");

console.log("Imperial design-system contract passed.");


const foundationPath = "public/imperial-design-foundation.css";
const foundation = fs.readFileSync(foundationPath, "utf8");
assert.ok(foundation.includes('html[dir="rtl"] .menuDrawer'),
  "RTL layouts must mirror the navigation drawer");
assert.match(foundation, /html\[dir="rtl"\] \.menuDrawer\s*\{[^}]*inset-inline-start:\s*0/s,
  "RTL drawer must anchor to the inline-start edge");
assert.match(foundation, /html\[dir="rtl"\] \.menuDrawer\s*\{[^}]*transform:\s*translateX\(105%\)/s,
  "RTL drawer must slide out toward the inline end");
assert.match(foundation, /html\[dir="rtl"\] \.menuDrawer\.is-open\s*\{[^}]*transform:\s*translateX\(0\)/s,
  "RTL drawer must return to view when opened");
assert.ok(foundation.includes("env(safe-area-inset-bottom)"),
  "Mobile navigation must respect the device safe area");
