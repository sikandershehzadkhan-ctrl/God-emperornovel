import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("public/imperial-luxury-17.23.0.css", "utf8");
const themes = ["light", "dark", "midnight", "sepia", "imperial", "cosmic"];
const required = ["--in-canvas:", "--in-panel:", "--in-panel-raised:", "--in-line:", "--in-text:", "--in-text-muted:", "--in-accent:", "--in-link:", "--in-focus:", "--in-control-bg:", "--in-surface-soft:", "--in-overlay:"];
for (const theme of themes) {
  const blocks = [...css.matchAll(new RegExp('html\\[data-theme="' + theme + '"\\]\\s*\\{([^}]+)\\}', "g"))].map(match => match[1]);
  const block = blocks.find(value => required.every(token => value.includes(token)));
  assert.ok(block, theme + " must define the complete semantic component token contract");
  assert.ok(block.includes("color-scheme:" + (theme === "light" || theme === "sepia" ? "light" : "dark")), theme + " must declare its native control color scheme");
}
assert.ok(css.includes(":root{\n  color-scheme:light dark;"), "Root must not force dark native controls");
const sharedSelectors = [
  "html[data-theme] .top", "html[data-theme] .footer", "html[data-theme] .mobileNav",
  "html[data-theme] .card", "html[data-theme] .catalogCard", "html[data-theme] .panel",
  "html[data-theme] .settingsPanel", "html[data-theme] .menuDrawer",
  "html[data-theme] input", "html[data-theme] select", "html[data-theme] textarea",
  "html[data-theme] :focus-visible", "html[data-theme] .heroKicker", "html[data-theme] .heroTags a", "html[data-theme] .heroSideTop b", "html[data-theme] .ghost", "html[data-theme] .secondary", "html[data-theme] .portalLink:hover", "html[data-theme] .mark"
];
for (const selector of sharedSelectors) assert.ok(css.includes(selector), "Missing semantic shared-component rule: " + selector);
for (const token of ["var(--in-canvas)", "var(--in-text)", "var(--in-panel)", "var(--in-control-bg)", "var(--in-focus)"]) {
  assert.ok(css.includes(token), "Missing semantic token consumption: " + token);
}
console.log("PASS: six themes provide complete semantic tokens and shared shell, surface, form, and focus selectors consume them.");
