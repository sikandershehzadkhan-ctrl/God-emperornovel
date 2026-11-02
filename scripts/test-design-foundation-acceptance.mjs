import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync("public/imperial-design-system-17.25.0.css", "utf8");
const foundation = fs.readFileSync("public/imperial-design-foundation.css", "utf8");
const html = fs.readFileSync("public/index.html", "utf8");

function block(selector) {
  const start = css.indexOf(selector);
  assert.notEqual(start, -1, "Missing theme rule: " + selector);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  assert.ok(open > start && close > open, "Malformed theme rule: " + selector);
  return css.slice(open + 1, close);
}
function declarations(source) {
  return Object.fromEntries([...source.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)]
    .map((match) => [match[1], match[2].trim()]));
}
function color(value) {
  const match = String(value || "").match(/^#([0-9a-f]{6})$/i);
  if (!match) return null;
  const number = Number.parseInt(match[1], 16);
  return [number >> 16 & 255, number >> 8 & 255, number & 255].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
}
function luminance(rgb) {
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
function contrast(first, second) {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const root = declarations(block(":root"));
const dark = declarations(block('html[data-theme="dark"]'));
const midnight = declarations(block('html[data-theme="midnight"]'));
const imperial = declarations(block('html[data-theme="imperial"]'));
const cosmic = declarations(block('html[data-theme="cosmic"]'));
const sepia = declarations(block('html[data-theme="sepia"]'));
const themes = {
  light: root,
  dark: { ...root, ...dark },
  midnight: { ...root, ...dark, ...midnight },
  sepia: { ...root, ...sepia },
  imperial: { ...root, ...dark, ...imperial },
  cosmic: { ...root, ...dark, ...cosmic }
};

for (const [name, tokens] of Object.entries(themes)) {
  for (const token of ["--in-surface-canvas", "--in-text-primary", "--in-text-secondary", "--in-action-secondary", "--in-focus"]) {
    assert.ok(tokens[token], name + " theme is missing " + token);
  }
  const background = color(tokens["--in-surface-canvas"]);
  assert.ok(background, name + " canvas must resolve to a six-digit hex color");
  for (const token of ["--in-text-primary", "--in-text-secondary", "--in-action-secondary"]) {
    const foreground = color(tokens[token]);
    assert.ok(foreground, name + " " + token + " must resolve to a six-digit hex color");
    const value = contrast(foreground, background);
    assert.ok(value >= 4.5, name + " " + token + " contrast is " + value.toFixed(2) + ":1; expected WCAG AA 4.5:1");
  }
  const focus = color(tokens["--in-focus"]);
  assert.ok(focus && contrast(focus, background) >= 3, name + " focus indicator must reach 3:1 contrast");
}

assert.ok(css.includes("min-height:var(--in-control-height)"), "Shared controls must retain a minimum interaction height");
assert.ok(css.includes("@media(prefers-reduced-motion:reduce)"), "The design system must respect reduced-motion preferences");
assert.ok(css.includes(":focus-visible"), "Keyboard focus must remain visible");
assert.ok(css.includes(".in-btn-primary") && css.includes(".in-btn-secondary") && css.includes(".in-control"), "Core action and form primitives must exist");
assert.ok(foundation.includes('html[dir="rtl"] .menuDrawer'), "RTL drawer behavior must be defined");
assert.ok(foundation.includes("env(safe-area-inset-bottom)"), "Mobile shell must respect device safe areas");
assert.ok(html.indexOf("/imperial-design-foundation.css") < html.indexOf("/imperial-design-system-17.25.0.css"), "Foundation stylesheet must load before the versioned primitives");

console.log("Imperial design foundation acceptance passed: six theme token maps, WCAG AA text/link contrast, focus contrast, reduced motion, RTL, safe areas and stylesheet order.");
