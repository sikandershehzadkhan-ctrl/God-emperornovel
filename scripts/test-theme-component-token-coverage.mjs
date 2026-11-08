import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("public/imperial-luxury-17.23.0.css", "utf8");
const legacyCss = readFileSync("public/style-17.23.0.css", "utf8");
const runtime = readFileSync("public/app-17.23.0.js", "utf8");
const glassCss = readFileSync("public/imperial-glass.css", "utf8");
const formatsCss = readFileSync("public/imperial-formats-17.23.0.css", "utf8");
const comicCss = readFileSync("public/imperial-comic-reader-17.23.0.css", "utf8");
const themes = ["light", "dark", "midnight", "sepia", "imperial", "cosmic"];
const required = ["--in-canvas:", "--in-panel:", "--in-panel-raised:", "--in-line:", "--in-text:", "--in-text-muted:", "--in-accent:", "--in-link:", "--in-focus:", "--in-action-bg:", "--in-action-hover:", "--in-control-bg:", "--in-surface-soft:", "--in-overlay:", "--in-good:", "--in-danger:", "--in-warning:", "--in-lime:", "--in-pink:"];
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
  "html[data-theme] .settingsPanel", "html[data-theme] .menuDrawer", "html[data-theme] .side", "html[data-theme] .tierPanel", "html[data-theme] .chapter", "html[data-theme] .quickCard", "html[data-theme] .unlockBanner", "html[data-theme] .notice", "html[data-theme] .settingRow", "html[data-theme] .accountMenu", "html[data-theme] .catalogEmpty", "html[data-theme] .ecosystemCard", "html[data-theme] .empty", "html[data-theme] .quickCard", "html[data-theme] .quickCard>span", "html[data-theme] .iconbtn:hover", "html[data-theme] .pill.gold", "html[data-theme] .bootFallback", "html[data-theme] .bootCrest", "html[data-theme] .bootSpinner",
  "html[data-theme] input", "html[data-theme] select", "html[data-theme] textarea",
  "html[data-theme] :focus-visible", "html[data-theme] .heroKicker", "html[data-theme] .heroTags a", "html[data-theme] .heroSideTop b", "html[data-theme] .ghost", "html[data-theme] .secondary", "html[data-theme] .portalLink:hover", "html[data-theme] .mark"
];
for (const selector of sharedSelectors) assert.ok(css.includes(selector), "Missing semantic shared-component rule: " + selector);
const legacyAliases = ["--bg:", "--bg2:", "--panel:", "--panel2:", "--panel3:", "--text:", "--muted:", "--line:", "--violet:", "--violet2:", "--violet3:", "--violet4:", "--good:", "--danger:", "--warning:", "--lime:", "--pink:", "--violet-strong:", "--cosmic:", "--electric:", "--cyan2:", "--cyan3:", "--gold3:", "--platinum:", "--imperial-black:", "--imperial-ink:", "--imperial-muted:", "--imperial-line:", "--imperial-violet:", "--imperial-navy:", "--surface:", "--surface-2:", "--surface-3:", "--ink:", "--ink-2:", "--muted-2:", "--line-strong:", "--brand-purple:", "--brand-cyan:", "--shadow:", "--shadowSoft:"];
for (const alias of legacyAliases) assert.ok(css.includes(alias), "Missing legacy variable bridge: " + alias);
const expectedMappings = ["--bg:var(--in-canvas)", "--bg2:var(--in-surface-soft)", "--panel:var(--in-panel)", "--panel2:var(--in-panel-raised)", "--text:var(--in-text)", "--muted:var(--in-text-muted)", "--line:var(--in-line)", "--violet:var(--in-accent)", "--violet4:var(--in-accent)", "--surface:var(--in-panel)", "--ink:var(--in-text)", "--line-strong:var(--in-focus)", "--brand-purple:var(--in-accent)", "--brand-cyan:var(--in-link)", "--good:var(--in-good)", "--danger:var(--in-danger)", "--warning:var(--in-warning)", "--lime:var(--in-lime)", "--pink:var(--in-pink)"];
for (const mapping of expectedMappings) assert.ok(css.includes(mapping), "Legacy alias must point to its semantic token: " + mapping);
const aliasBlock = css.match(/html\\[data-theme\\]\\s*\\{([^}]+)\\}/)?.[1] || "";
const intentionallyUnmapped = new Set(["--max", "--radius", "--motion-fast", "--motion-med", "--motion-slow"]);
const baseTokens = [...new Set([...legacyCss.matchAll(/(--[a-zA-Z0-9_-]+)\\s*:/g)].map(match => match[1]))];
for (const token of baseTokens) {
  if (!intentionallyUnmapped.has(token)) assert.ok(aliasBlock.includes(token + ":"), "Legacy theme token lacks a semantic bridge: " + token);
}
assert.ok(legacyCss.includes("var(--panel)") && legacyCss.includes("var(--text)"), "Legacy application stylesheet must remain covered by the token bridge");
assert.ok(glassCss.includes("html[data-theme] .top") && glassCss.includes("html[data-theme] .mobileNav"), "Glass shell styles must support every global theme");
assert.ok(glassCss.includes("var(--in-overlay)") && glassCss.includes("var(--glass-surface-raised)") && glassCss.includes("var(--glass-border)"), "Glass surfaces must consume semantic theme tokens");
assert.ok(!glassCss.includes('html:not([data-theme="dark"])'), "Glass styling must not treat every non-dark theme as Light");
assert.ok(formatsCss.includes("var(--in-focus") && !formatsCss.includes("#83a9ff"), "Format keyboard focus must use the selected theme focus token");
assert.ok(comicCss.includes("var(--in-obsidian,var(--bg,#0B1215))"), "Comic image placeholders must use semantic theme canvas tokens");
for (const status of ["status-published", "status-review", "status-rejected"]) assert.ok(css.includes("html[data-theme] ." + status), "Creator status must use semantic status colors: " + status);
assert.ok(css.includes("html[data-theme] .novelReaction[aria-pressed=true]"), "Community reaction states must use semantic theme tokens");


assert.ok(runtime.includes("readerPage.dataset.readerTheme=chosen") && runtime.includes("imperial_reader_theme"), "Reader theme must remain independently scoped and persisted");
for (const readerTheme of ["light", "dark", "midnight", "sepia", "imperial", "cosmic"]) assert.ok(legacyCss.includes('.readerPage[data-reader-theme="' + readerTheme + '"]'), "Missing independently scoped reader theme: " + readerTheme);
for (const token of ["var(--in-canvas)", "var(--in-text)", "var(--in-panel)", "var(--in-control-bg)", "var(--in-focus)"]) {
  assert.ok(css.includes(token), "Missing semantic token consumption: " + token);
}
console.log("PASS: six themes provide complete semantic tokens and shared shell, surface, form, and focus selectors consume them.");
