import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("public/imperial-luxury-17.23.0.css", "utf8");
const legacyCss = readFileSync("public/style-17.23.0.css", "utf8");
const runtime = readFileSync("public/app-17.23.0.js", "utf8");
const themes = ["light", "dark", "midnight", "sepia", "imperial", "cosmic"];
const required = ["--in-canvas:", "--in-panel:", "--in-panel-raised:", "--in-line:", "--in-text:", "--in-text-muted:", "--in-accent:", "--in-link:", "--in-focus:", "--in-action-bg:", "--in-action-hover:", "--in-control-bg:", "--in-surface-soft:", "--in-overlay:"];
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
const legacyAliases = ["--bg:", "--bg2:", "--panel:", "--panel2:", "--panel3:", "--text:", "--muted:", "--line:", "--violet:", "--violet2:", "--violet3:", "--violet4:", "--violet-strong:", "--cosmic:", "--electric:", "--cyan2:", "--cyan3:", "--gold3:", "--platinum:", "--imperial-black:", "--imperial-ink:", "--imperial-muted:", "--imperial-line:", "--imperial-violet:", "--imperial-navy:", "--surface:", "--surface-2:", "--surface-3:", "--ink:", "--ink-2:", "--muted-2:", "--line-strong:", "--brand-purple:", "--brand-cyan:", "--shadow:", "--shadowSoft:"];
for (const alias of legacyAliases) assert.ok(css.includes(alias), "Missing legacy variable bridge: " + alias);
assert.ok(legacyCss.includes("var(--panel)") && legacyCss.includes("var(--text)"), "Legacy application stylesheet must remain covered by the token bridge");
assert.ok(runtime.includes("readerPage.dataset.readerTheme=chosen") && runtime.includes("imperial_reader_theme"), "Reader theme must remain independently scoped and persisted");
for (const readerTheme of ["light", "dark", "midnight", "sepia", "imperial", "cosmic"]) assert.ok(legacyCss.includes('.readerPage[data-reader-theme="' + readerTheme + '"]'), "Missing independently scoped reader theme: " + readerTheme);
for (const token of ["var(--in-canvas)", "var(--in-text)", "var(--in-panel)", "var(--in-control-bg)", "var(--in-focus)"]) {
  assert.ok(css.includes(token), "Missing semantic token consumption: " + token);
}
console.log("PASS: six themes provide complete semantic tokens and shared shell, surface, form, and focus selectors consume them.");
