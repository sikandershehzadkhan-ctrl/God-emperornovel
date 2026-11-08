import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("public/imperial-luxury-17.23.0.css", "utf8");
const legacyCss = readFileSync("public/style-17.23.0.css", "utf8");
const runtime = readFileSync("public/app-17.23.0.js", "utf8");
const glassCss = readFileSync("public/imperial-glass.css", "utf8");
const formatsCss = readFileSync("public/imperial-formats-17.23.0.css", "utf8");
const comicCss = readFileSync("public/imperial-comic-reader-17.23.0.css", "utf8");
const appCss = readFileSync("public/app-17.23.0.css", "utf8");
const themes = ["light", "dark", "midnight", "sepia", "imperial", "cosmic"];
const required = ["--in-canvas:", "--in-panel:", "--in-panel-raised:", "--in-line:", "--in-text:", "--in-text-muted:", "--in-accent:", "--in-link:", "--in-focus:", "--in-action-bg:", "--in-action-hover:", "--in-control-bg:", "--in-surface-soft:", "--in-overlay:", "--in-good:", "--in-danger:", "--in-warning:", "--in-lime:", "--in-pink:"];
for (const theme of themes) {
  const blocks = [...css.matchAll(new RegExp('html\\[data-theme="' + theme + '"\\]\\s*\\{([^}]+)\\}', "g"))].map(match => match[1]);
  assert.ok(css.includes('html[data-theme="' + theme + '"][data-high-contrast="true"]'), "Missing global high-contrast overrides for " + theme);
  assert.ok(css.includes('html[data-high-contrast="true"] .readerPage[data-reader-theme="' + theme + '"]'), "Missing reader high-contrast overrides for " + theme);
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
const legacyThemeTokens = ["--bg:", "--bg2:", "--panel:", "--panel2:", "--panel3:", "--text:", "--muted:", "--line:", "--violet:", "--violet2:", "--violet3:", "--violet4:", "--cyan:", "--cyan2:", "--cyan3:", "--good:", "--danger:", "--shadow:", "--shadowSoft:", "--surface:", "--surface-2:", "--surface-3:", "--ink:", "--ink-2:", "--muted-2:", "--line-strong:"];
for (const theme of themes) {
  const legacyBlock = [...legacyCss.matchAll(new RegExp('html\\[data-theme="' + theme + '"\\]\\s*\\{([^}]+)\\}', "g"))].map(match => match[1]).find(block => legacyThemeTokens.every(token => block.includes(token))) || "";
  assert.ok(legacyBlock.includes("color-scheme:" + (theme === "light" || theme === "sepia" ? "light" : "dark")), "Legacy shell native controls must follow " + theme);
  for (const token of legacyThemeTokens) assert.ok(legacyBlock.includes(token), "Legacy shell token " + token + " missing for " + theme);
  assert.ok(legacyCss.includes('html[data-theme="' + theme + '"][data-high-contrast="true"]'), "Legacy shared components lack high-contrast token overrides for " + theme);
}
assert.ok(glassCss.includes("html[data-theme] .top") && glassCss.includes("html[data-theme] .mobileNav"), "Glass shell styles must support every global theme");
assert.ok(glassCss.includes("var(--in-overlay)") && glassCss.includes("var(--glass-surface-raised)") && glassCss.includes("var(--glass-border)"), "Glass surfaces must consume semantic theme tokens");
assert.ok(!glassCss.includes('html:not([data-theme="dark"])'), "Glass styling must not treat every non-dark theme as Light");
assert.ok(css.includes("@media(forced-colors:active)") && css.includes("@media(prefers-reduced-motion:reduce)"), "Theme layer must preserve forced-colors and reduced-motion fallbacks");
assert.ok(css.includes("@media(prefers-contrast:more)"), "Theme layer must honor the operating-system prefers-contrast setting");
for (const theme of themes) {
  assert.ok(css.includes('html[data-theme="' + theme + '"]{--in-text:'), "OS high-contrast mode is missing global theme " + theme);
  assert.ok(css.includes('.readerPage[data-reader-theme="' + theme + '"]{--reader-text:'), "OS high-contrast mode is missing reader theme " + theme);
}

assert.ok(css.includes('html[data-theme] :where(button,input:not([type="checkbox"]):not([type="range"]),select,textarea,[role="button"]){min-height:44px}'), "Primary form and button controls must meet the 44px touch-height baseline");
assert.ok(css.includes("html[data-theme] .readerTool{min-width:44px;min-height:44px}"), "Reader toolbar buttons must meet 44px minimum targets");
assert.ok(css.includes("html[data-theme] .readerTools{flex:1 0 100%;width:100%;justify-content:space-between;gap:5px}"), "Mobile reader toolbar must wrap to preserve 44px targets without horizontal overflow");

assert.ok(glassCss.includes("@media(max-width:760px), (prefers-reduced-motion:reduce)") && glassCss.includes("backdrop-filter:none"), "Glass blur must degrade on mobile and reduced-motion layouts");
assert.ok(formatsCss.includes("@media(forced-colors:active)") && formatsCss.includes("outline:2px solid Highlight"), "Format links must retain forced-colors keyboard focus");

assert.ok(formatsCss.includes("var(--in-focus") && !formatsCss.includes("#83a9ff"), "Format keyboard focus must use the selected theme focus token");
assert.ok(comicCss.includes("var(--in-obsidian,var(--bg,#0B1215))"), "Comic image placeholders must use semantic theme canvas tokens");
assert.ok(appCss.includes("background:var(--in-obsidian,var(--bg,#0B1215))") && !appCss.includes("background:#080a12"), "Comic creator image placeholders must not force a dark-only background");
assert.ok(formatsCss.includes("color:var(--in-good,#176B4D)") && formatsCss.includes("color:var(--in-link,#0F52BA)") && formatsCss.includes("color:var(--in-danger,#B4233C)"), "Creator publication, review and rejection states must use semantic status tokens");

for (const status of ["status-published", "status-review", "status-rejected"]) assert.ok(css.includes("html[data-theme] ." + status), "Creator status must use semantic status colors: " + status);
assert.ok(css.includes("html[data-theme] .novelReaction[aria-pressed=true]"), "Community reaction states must use semantic theme tokens");


assert.ok(runtime.includes("readerPage.dataset.readerTheme=chosen") && runtime.includes("imperial_reader_theme"), "Reader theme must remain independently scoped and persisted");
for (const readerTheme of themes) {
  const readerMap = new RegExp('\\.readerPage\\[data-reader-theme="' + readerTheme + '"\\]\\s*\\{[^}]*--reader-canvas:').test(css);
  assert.ok(readerMap, "Reader theme must define an independent semantic canvas map: " + readerTheme);
}
assert.ok(css.includes(".readerPage .chapterDrawer{background:var(--reader-panel)") && css.includes(".readerPage .readerPrefs select,.readerPage .readerTool{background:var(--reader-surface-soft)"), "Reader drawer and controls must use reader-scoped tokens rather than the global site palette");
assert.ok(css.includes(".readerPage .readerContent{color:var(--reader-text)}"), "Reader chapter text must use the independent reader text token");
assert.ok(css.includes('.readerPage[data-reader-theme="light"],.readerPage[data-reader-theme="sepia"]{color-scheme:light}') && css.includes('.readerPage[data-reader-theme="dark"],.readerPage[data-reader-theme="midnight"],.readerPage[data-reader-theme="imperial"],.readerPage[data-reader-theme="cosmic"]{color-scheme:dark}'), "Native reader controls must follow the independent reader color scheme");
const readerScope = css.match(/\.readerPage\[data-reader-theme\]\s*\{([^}]+)\}/)?.[1] || "";
for (const mapping of ["--panel:var(--reader-panel)", "--text:var(--reader-text)", "--muted:var(--reader-muted)", "--gold2:var(--reader-accent)", "--cyan:var(--reader-link)", "--surface:var(--reader-panel)", "--good:var(--reader-good)", "--danger:var(--reader-danger)", "--warning:var(--reader-warning)", "--brand-purple:var(--reader-accent)", "--imperial-ink:var(--reader-text)"]) assert.ok(readerScope.includes(mapping), "Reader scope must override global legacy alias: " + mapping);

for (const readerTheme of ["light", "dark", "midnight", "sepia", "imperial", "cosmic"]) assert.ok(legacyCss.includes('.readerPage[data-reader-theme="' + readerTheme + '"]'), "Missing independently scoped reader theme: " + readerTheme);
const touchRule = 'html[data-theme] :where(button,input:not([type="checkbox"]):not([type="range"]),select,textarea,[role="button"]){min-height:44px}';
const parityLayer = css.lastIndexOf("/* Final semantic parity layer:");
assert.ok(parityLayer > css.indexOf("/* Taste Skill direction"), "Semantic parity overrides must follow legacy archive art-direction rules");
for (const selector of ["html[data-theme] body{background:var(--in-canvas)}","html[data-theme] .hero.imperialArchiveHero","html[data-theme] .heroSearch button,html[data-theme] .primary","html[data-theme] .hero.imperialArchiveHero h1 span","html[data-theme] .skipLink"]) {
  assert.ok(css.slice(parityLayer).includes(selector), "Six-theme semantic parity layer is missing " + selector);
}
assert.ok(css.slice(parityLayer).includes("background:var(--in-panel)") && css.slice(parityLayer).includes("border-color:var(--in-line)") && css.slice(parityLayer).includes("color:var(--in-text-muted)"), "Late legacy hero and shell overrides must resolve through semantic tokens");
for (const selector of ["html[data-theme] .commentItem","html[data-theme] .ratingStar","html[data-theme] .authorApplicationFormats","html[data-theme] .comicAuthorBuilder","html[data-theme] .comicPageComposerGrid input","html[data-theme] .reactReactionList .novelReaction[aria-pressed=true]","html[data-theme] .reactReactionError"]) {
for (const selector of ["html[data-theme] .side","html[data-theme] .accountMenu","html[data-theme] .tierPanel","html[data-theme] .metric","html[data-theme] .miniCard","html[data-theme] .filterChip","html[data-theme] .chapter","html[data-theme] .catalogEmpty","html[data-theme] .statusBadge","html[data-theme] .rankBadge"]) {
  assert.ok(css.slice(parityLayer).includes(selector), "Legacy catalog/account/admin primitive must use semantic theme tokens: " + selector);
}

  assert.ok(css.slice(parityLayer).includes(selector), "Cross-sheet community/creator component must use semantic tokens: " + selector);
}

for (const selector of ["html[data-theme] .footer{background:var(--in-panel)","html[data-theme] .navlinks a","html[data-theme] .menuToggle,html[data-theme] .menuDrawer","html[data-theme] textarea,html[data-theme] input,html[data-theme] select","html[data-theme] .catalogCover"]) {
  assert.ok(css.slice(parityLayer).includes(selector), "Legacy shell component must be semantically themed: " + selector);
}


assert.ok(css.includes(touchRule), "Interactive controls must meet the 44px minimum touch target baseline");
assert.ok(css.includes('html[data-theme] :where(.primary,.secondary,.ghost,.iconbtn,.menuToggle,.menuClose,.readerBack,.navlinks a,.mobileNav a,.menuDrawer a,.readerChapterItem,.formatLink){min-height:44px}'), "Navigation, action and chapter links must meet the 44px minimum touch target baseline");
assert.ok(css.includes('html[data-theme] .readerTool{min-width:44px;min-height:44px}'), "Reader tools must meet the 44px minimum touch target baseline");
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'), "Theme layer must preserve reduced-motion preferences");
assert.ok(css.includes('@media(forced-colors:active)'), "Theme layer must preserve operating-system forced-colors mode");
assert.ok(css.includes('html[data-theme] :focus-visible{outline:2px solid var(--in-focus);outline-offset:3px}'), "Keyboard focus must use a visible semantic focus token");

for (const token of ["var(--in-canvas)", "var(--in-text)", "var(--in-panel)", "var(--in-control-bg)", "var(--in-focus)"]) {
  assert.ok(css.includes(token), "Missing semantic token consumption: " + token);
}
console.log("PASS: six themes provide complete semantic tokens and shared shell, surface, form, and focus selectors consume them.");
