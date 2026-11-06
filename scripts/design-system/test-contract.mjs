import fs from "node:fs";
import assert from "node:assert/strict";

const tokens = fs.readFileSync("public/imperial-design-tokens.css", "utf8");
const components = fs.readFileSync("public/imperial-ui-primitives.css", "utf8");
const releaseStylesheets = [
  "public/style-17.23.0.css",
  "public/app-17.23.0.css",
  "public/imperial-luxury-17.23.0.css",
  "public/imperial-formats-17.23.0.css",
  "public/imperial-comic-reader-17.23.0.css",
  "public/imperial-glass.css"
].map(path => fs.readFileSync(path, "utf8"));
const spec = fs.readFileSync("design-system/IMPERIAL-DESIGN-SYSTEM-18.0.0.md", "utf8");
const html = fs.readFileSync("public/index.html", "utf8");
const app = fs.readFileSync("public/app.js", "utf8");
const versionedApp = fs.readFileSync("public/app-17.23.0.js", "utf8");
const adminHtml = fs.readFileSync("public/admin.html", "utf8");
const authorHtml = fs.readFileSync("public/author.html", "utf8");
const privacyHtml = fs.readFileSync("public/privacy.html", "utf8");
const termsHtml = fs.readFileSync("public/terms.html", "utf8");
const copyrightHtml = fs.readFileSync("public/copyright.html", "utf8");
const taxonomyHtml = fs.readFileSync("public/community-taxonomy.html", "utf8");
const worker = fs.readFileSync("src/index.js", "utf8");
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const usage = fs.readFileSync("design-system/COMPONENT-USAGE-18.0.0.md", "utf8");
const routeMap = fs.readFileSync("design-system/ROUTE-TEMPLATE-MIGRATION-MAP-18.0.0.md", "utf8");

function readHex(block, token, theme) {
  const match = block.match(new RegExp(token + ":\\s*(#[0-9A-Fa-f]{6})"));
  assert.ok(match, theme + " is missing a valid hex value for " + token);
  return match[1];
}
function luminance(hex) {
  const channels = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
  const linear = channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
function contrastRatio(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

const themes = ["light", "dark", "midnight", "sepia", "imperial", "cosmic"];
const themeRoles = [
  "--in-bg-canvas", "--in-bg-subtle", "--in-bg-surface", "--in-bg-elevated", "--in-bg-inverse",
  "--in-text-primary", "--in-text-secondary", "--in-text-muted", "--in-text-inverse",
  "--in-border-default", "--in-border-strong",
  "--in-action-primary", "--in-action-primary-hover", "--in-action-primary-active", "--in-action-primary-text",
  "--in-action-secondary", "--in-action-secondary-hover", "--in-action-secondary-text", "--in-focus-ring", "--in-link",
  "--in-status-success", "--in-status-success-bg", "--in-status-warning", "--in-status-warning-bg",
  "--in-status-danger", "--in-status-danger-bg", "--in-status-info", "--in-status-info-bg",
  "--in-reader-paper", "--in-reader-ink"
];
for (const theme of themes) {
  const match = tokens.match(new RegExp('(?:^|,)\\s*\\[data-theme="' + theme + '"\\]\\s*\\{([^}]*)\\}', "m"));
  assert.ok(match, "missing theme: " + theme);
  for (const role of themeRoles) {
    assert.ok(match[1].includes(role + ":"), theme + " theme is missing semantic role: " + role);
  }
  const canvas = readHex(match[1], "--in-bg-canvas", theme);
  const primaryText = readHex(match[1], "--in-text-primary", theme);
  const secondaryText = readHex(match[1], "--in-text-secondary", theme);
  const mutedText = readHex(match[1], "--in-text-muted", theme);
  const readerInk = readHex(match[1], "--in-reader-ink", theme);
  const readerPaper = readHex(match[1], "--in-reader-paper", theme);
  const primary = readHex(match[1], "--in-action-primary", theme);
  const primaryActionText = readHex(match[1], "--in-action-primary-text", theme);
  const secondary = readHex(match[1], "--in-action-secondary", theme);
  const secondaryActionText = readHex(match[1], "--in-action-secondary-text", theme);
  const link = readHex(match[1], "--in-link", theme);
  const focus = readHex(match[1], "--in-focus-ring", theme);
  assert.ok(contrastRatio(primaryText, canvas) >= 4.5, theme + " body text fails WCAG AA contrast");
  assert.ok(contrastRatio(secondaryText, canvas) >= 4.5, theme + " secondary text fails WCAG AA contrast");
  assert.ok(contrastRatio(mutedText, canvas) >= 4.5, theme + " muted text fails WCAG AA contrast");
  assert.ok(contrastRatio(primaryText, readHex(match[1], "--in-bg-surface", theme)) >= 4.5, theme + " primary text fails on surface backgrounds");
  assert.ok(contrastRatio(readerInk, readerPaper) >= 4.5, theme + " reader ink/paper pair fails WCAG AA contrast");
  assert.ok(contrastRatio(primaryActionText, primary) >= 4.5, theme + " primary action text fails WCAG AA contrast");
  assert.ok(contrastRatio(secondaryActionText, secondary) >= 4.5, theme + " secondary action text fails WCAG AA contrast");
  assert.ok(contrastRatio(link, canvas) >= 4.5, theme + " link color fails WCAG AA contrast");
  assert.ok(contrastRatio(focus, canvas) >= 3, theme + " focus indicator fails non-text contrast");
  const strongBorder = readHex(match[1], "--in-border-strong", theme);
  assert.ok(contrastRatio(strongBorder, canvas) >= 3, theme + " strong control border fails non-text contrast");
  for (const status of ["success", "warning", "danger", "info"]) {
    const foreground = readHex(match[1], "--in-status-" + status, theme);
    const background = readHex(match[1], "--in-status-" + status + "-bg", theme);
    assert.ok(contrastRatio(foreground, background) >= 4.5, theme + " " + status + " status fails WCAG AA contrast");
  }
}

const requiredFoundationTokens = [
  "--in-brand-white", "--in-brand-obsidian", "--in-brand-purple", "--in-brand-sapphire",
  "--in-font-sans", "--in-font-serif", "--in-font-mono", "--in-space-4", "--in-radius-md",
  "--in-touch-target", "--in-content-max", "--in-reading-max", "--in-z-dialog", "--in-motion-normal"
];
for (const token of requiredFoundationTokens) {
  assert.ok(tokens.includes(token), "missing foundation token: " + token);
}
const requiredComponents = [
  ".in-button--primary", ".in-button--secondary", ".in-button--danger",
  ".in-field", ".in-select", ".in-textarea", ".in-checkbox", ".in-radio", ".in-switch",
  ".in-check-row", ".in-card", ".in-badge", ".in-avatar", ".in-tabs", ".in-table",
  ".in-dialog", ".in-toast", ".in-tooltip", ".in-empty-state", ".in-skeleton",
  ".in-alert", ".in-progress", ".in-divider", ".in-nav-link", ".in-pagination"
];
for (const component of requiredComponents) {
  assert.ok(components.includes(component), "missing component primitive: " + component);
}
assert.match(components, /:focus-visible/, "visible keyboard focus is required");
assert.match(components, /\.in-textarea:focus-visible/, "textarea keyboard focus must be visible");
assert.match(components, /\.in-radio:focus-visible/, "radio keyboard focus must be visible");
assert.match(components, /\.in-button--danger\{background:var\(--in-status-danger-bg\);color:var\(--in-status-danger\)/, "danger button text must use the theme-verified status contrast pair");
assert.match(components, /in-nav-link:focus-visible/, "navigation focus must be visible");
assert.match(components, /aria-busy="true"/, "button loading state must be styled");
assert.match(components, /in-dialog::backdrop/, "dialog backdrop primitive is required");
assert.match(components, /prefers-reduced-motion:reduce/, "reduced-motion support is required");
assert.match(components, /forced-colors:active/, "forced-colors support is required");
assert.ok(components.includes(".in-button--sm{min-height:var(--in-touch-target)"), "small button variant must preserve the 44px target");
const checkRow = components.slice(components.indexOf(".in-check-row{"), components.indexOf(".in-check-row{") + 220);
assert.ok(checkRow.includes("min-height:var(--in-touch-target)"), "checkbox/radio row must preserve the 44px target");
const primitiveTokenReferences = [...components.matchAll(/var\((--in-[a-z0-9-]+)/g)].map(match => match[1]);
const definedTokenNames = new Set([...tokens.matchAll(/(--in-[a-z0-9-]+)\s*:/g)].map(match => match[1]));
for (const token of new Set(primitiveTokenReferences)) {
  assert.ok(definedTokenNames.has(token), "component stylesheet references an undefined design token: " + token);
}
const releaseCss = releaseStylesheets.join("\n") + "\n" + components;
const releaseTokenReferences = [...releaseCss.matchAll(/var\((--in-[a-z0-9-]+)/g)].map(match => match[1]);
const releaseDefinedTokenNames = new Set([
  ...definedTokenNames,
  ...[...releaseCss.matchAll(/(--in-[a-z0-9-]+)\s*:/g)].map(match => match[1])
]);
for (const token of new Set(releaseTokenReferences)) {
  assert.ok(releaseDefinedTokenNames.has(token), "loaded release stylesheet references an undefined semantic token: " + token);
}
assert.match(tokens, /prefers-reduced-motion:reduce/, "token motion fallback is required");
assert.ok(spec.includes("WCAG 2.2 AA"), "accessibility target missing from specification");
assert.ok(spec.includes("RTL"), "RTL guidance missing from specification");
assert.ok(usage.includes("Dialog behavior must be implemented") && usage.includes("server must enforce"), "component usage guide must document behavior and security boundaries");
assert.ok(routeMap.includes("33 explicit static route entries") && routeMap.includes("/read/:id/:chapter") && routeMap.includes("No route family is declared fully migrated"), "route migration map must inventory templates and preserve honest migration status");
assert.ok(spec.includes("primitives are opt-in") || spec.includes("Do not bulk-replace legacy selectors"), "rollout boundary must be documented");
assert.ok(html.includes('href="/imperial-design-tokens.css"'), "semantic tokens must be loaded by the application shell");
assert.ok(html.includes('href="/imperial-ui-primitives.css"'), "component primitives must be loaded by the application shell");
assert.ok(html.includes('href="/imperial-glass.css"'), "glass foundation stylesheet must be loaded by the application shell");
assert.ok(worker.includes("'/imperial-design-tokens.css'") && worker.includes("'/imperial-ui-primitives.css'") && worker.includes("'/imperial-glass.css'"), "Worker must register semantic tokens, component primitives and glass foundation for every HTML template");
assert.ok(app.includes("const IMPERIAL_THEMES=['light','dark','midnight','sepia','imperial','cosmic']"), "shared shell must expose all six supported themes");
assert.ok(app.includes('document.documentElement.dir=(c==="ur"||c==="ar"||c==="fa")?"rtl":"ltr"'), "Urdu, Arabic and Persian interface locales must set RTL document direction");
assert.ok(components.includes('[dir="rtl"] .in-switch:checked::after{transform:translateX(-1.25rem)}'), "shared switch thumb must mirror its checked position in RTL layouts");
assert.ok(app.includes('id="imperialThemeSelect"') && app.includes("applyImperialTheme(event.target.value)"), "shared theme selector must be operable and update the root theme");
assert.ok(app.includes("</footer>`);applyImperialTheme(document.documentElement.dataset.theme)}"), "shared shell must synchronize the saved theme into the selector after it mounts");
assert.ok(app.includes('id="setSiteTheme"><option value="light">Light</option><option value="dark">Dark</option><option value="midnight">Midnight</option><option value="sepia">Sepia</option><option value="imperial">Imperial</option><option value="cosmic">Cosmic</option>'), "Settings must expose the complete six-theme global palette");
assert.ok(app.includes("IMPERIAL_THEMES.includes(document.documentElement.dataset.theme)") && app.includes("applyImperialTheme($('#setSiteTheme').value)"), "Settings must initialize and persist the validated global theme through the shared theme controller");
assert.ok(app.includes("function initImperialAccessibilityPreferences()") && app.includes("values.reduced==='true'") && app.includes("values.contrast==='true'") && app.includes("values.compact==='true'") && app.includes("initImperialAccessibilityPreferences();"), "Saved motion, contrast and compact-card preferences must be restored globally on every route");
assert.ok(worker.includes('["light","dark","midnight","sepia","imperial","cosmic"].includes(t)?t:"light"'), "Worker theme bootstrap must preserve all six themes before hydration");
assert.ok(components.includes(".themePicker:focus-visible") && components.includes(".themePicker{"), "theme selector must have a visible keyboard focus state and shared styling");
assert.ok(tokens.includes("--bg:var(--in-bg-canvas)") && tokens.includes("--panel:var(--in-bg-surface)") && tokens.includes("--text:var(--in-text-primary)"), "legacy page tokens must bridge to semantic theme roles");
assert.ok(components.includes("html[data-theme] .top") && components.includes("html[data-theme] .menuDrawer") && components.includes("html[data-theme] .nextHero"), "shared shell and homepage must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] .homeFormatShelf") && components.includes("html[data-theme] .nextFeatureTile"), "homepage discovery and feature surfaces must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] .catalogTop") && components.includes("html[data-theme] .catalogCard"), "catalog filters and story cards must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] .genreCard") && components.includes("html[data-theme] .tagTile"), "genre and tag discovery surfaces must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] .formatLink") && components.includes("html[data-theme] #sf input"), "format directory and search controls must consume semantic theme roles");
assert.ok(components.includes("prefers-reduced-motion:reduce") && components.includes("html[data-theme] .catalogGrid a:focus-visible"), "discovery interactions must preserve reduced motion and visible focus");
assert.ok(packageJson.scripts.build.startsWith("node scripts/design-system/test-contract.mjs && "), "design-system contract must run before the platform build");


assert.ok(components.includes("html[data-theme] .novelHero") && components.includes("html[data-theme] .novelInfo h1"), "novel detail surfaces must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] .chapter:hover") && components.includes("html[data-theme] .tabs a.active"), "chapter navigation and novel tabs must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] .readerPage .readerTool:focus-visible") && components.includes("html[data-theme] .readerPage .readerChapterItem:focus-visible"), "reader controls and chapter drawer must preserve visible keyboard focus");
assert.ok(components.includes("html[data-theme] .readerPage .readerTool{") && components.includes("min-width:var(--in-touch-target)"), "reader tool controls must preserve 44px touch targets");
assert.ok(components.includes("html[data-theme] .readerPage .readerPrefs select") && components.includes("prefers-reduced-motion:reduce"), "reader preferences must retain semantic focus and reduced-motion support");

assert.ok(components.includes("html[data-theme] .accountGrid .accountMenu") && components.includes("html[data-theme] .accountGrid .metric"), "account navigation and profile metrics must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] .page .grid > .card") && components.includes("html[data-theme] .page .statline"), "library cards and bookmark/history rows must consume semantic theme roles outside the account dashboard grid");
assert.ok(components.includes("html[data-theme] .accountGrid a:focus-visible") && components.includes("html[data-theme] .accountGrid button:focus-visible"), "account and library actions must preserve visible keyboard focus");
assert.ok(components.includes("html[data-theme] .accountGrid .accountMenu a{") && components.includes("min-height:var(--in-touch-target)"), "account navigation targets must meet the 44px touch target");
assert.ok(components.includes("@media(max-width:760px)") && components.includes("html[data-theme] .accountGrid .metricGrid"), "account navigation and profile metrics must adapt to mobile widths");

assert.ok(components.includes("html[data-theme] .settingsGridPro .settingsPanel") && components.includes("html[data-theme] .settingsGridPro .settingRow"), "settings panels and preference rows must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] .settingsGridPro select:focus-visible") || components.includes("html[data-theme] .settingsGridPro input:focus-visible"), "settings controls must preserve visible keyboard focus");
assert.ok(components.includes("html[data-theme] .page .chapterList .chapter.unreadNotice"), "unread notification rows must use semantic theme roles");
assert.ok(components.includes("html[data-theme] .page #markRead") && components.includes("min-height:var(--in-touch-target)"), "notification actions must preserve touch targets");

assert.ok(app.includes("authorStudioLayout") && app.includes("authorCreateForm") && app.includes("authorWorksPanel"), "Author Studio source must retain its real creation and works regions");
assert.ok(components.includes("html[data-theme] .page .authorStudioLayout") && components.includes("html[data-theme] .page .authorCreateForm"), "Author Studio layout and creation form must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] .page .authorWork") && components.includes("html[data-theme] .page .authorChapterForm"), "author work cards and chapter composer must be theme-aware");
assert.ok(components.includes("html[data-theme] .page .comicAuthorBuilder") && components.includes("html[data-theme] .page .authorStudioLayout input:focus-visible"), "comic composer and keyboard focus must be styled");
assert.ok(components.includes("html[data-theme] .page .authorWorkActions > *") && components.includes("min-height:var(--in-touch-target)"), "author actions must preserve touch targets");

assert.ok(app.includes("communityDiscussions") && app.includes("communityGrid") && app.includes("quickGrid"), "Community renderer must retain its real discovery and discussion regions");
assert.ok(components.includes("html[data-theme] .quickCard") && components.includes("html[data-theme] #communityDiscussions"), "Community discovery links and discussion feed must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] #communityGrid .card") && components.includes("html[data-theme] .unlockBanner"), "Community story cards and discovery banner must be theme-aware");
assert.ok(components.includes("html[data-theme] #communityDiscussions a:focus-visible") && components.includes("min-height:var(--in-touch-target)"), "Community navigation must preserve visible focus and touch targets");
assert.ok(components.includes("@media(max-width:760px)") && components.includes("html[data-theme] .quickGrid{grid-template-columns:repeat(2"), "Community quick links must adapt to mobile widths");

assert.ok(app.includes("tfSearch") && app.includes("tfResults") && app.includes("/api/novels?sort=trending"), "Trend Factory must retain its live published-catalog search and result flow");
assert.ok(app.includes("chapter text") && app.includes("rights-first") && app.includes("trendPending"), "Trend Factory must retain its metadata-first rights boundary and disclose the unavailable admin review workspace");
assert.ok(!app.includes('<a href="/admin">Open review center'), "Trend Factory must not send users to an unimplemented admin review route");
assert.ok(components.includes("html[data-theme] .trendFactoryPage .trendFactoryHero") && components.includes("html[data-theme] .trendFactoryPage .trendControls"), "Trend Factory hero and live controls must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] .trendFactoryPage .trendResults .card") && components.includes("html[data-theme] .trendFactoryPage .trendSafetyCard"), "Trend Factory results and rights-safety cards must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] .trendFactoryPage input:focus-visible") && components.includes("html[data-theme] .trendFactoryPage .trendPending"), "Trend Factory must preserve visible focus and clearly disclose unavailable admin review");

assert.ok(worker.includes("admin.html") && worker.includes("adminDashboardPage"), "Worker must serve the dedicated noindex Admin template with its page identity");
assert.ok(worker.includes('localStorage.getItem("imperial_reduced_motion")') && worker.includes('localStorage.getItem("imperial_high_contrast")') && worker.includes('localStorage.getItem("imperial_compact_cards")') && worker.includes('dataset.reducedMotion') && worker.includes('dataset.highContrast') && worker.includes('dataset.compactCards'), "Worker must restore saved accessibility preferences before standalone pages render");
assert.ok(adminHtml.includes("me.user?.role!=='admin'") && adminHtml.includes("api('/api/me')"), "Admin template must verify the signed-in role before showing its command center");
assert.ok(worker.includes('const admin=u=>u?.role==="admin"?null:json({error:"Administrator access required"},403)'), "Admin API routes must use the server-side administrator role guard");
for (const endpoint of ['if(p==="/api/admin/stats")','if(p==="/api/admin/users"&&m==="GET")','if(p==="/api/admin/publishing"&&m==="GET")','if(p==="/api/admin/connectors"&&m==="GET")']) {
 const pos=worker.indexOf(endpoint);
 assert.ok(pos>=0 && worker.slice(pos,pos+180).includes("admin(u)"), "Admin endpoint must enforce the server-side role guard: "+endpoint);
}
assert.ok(components.includes("html[data-theme] body.adminDashboardPage .adminHero") && components.includes("html[data-theme] body.adminDashboardPage .adminTable"), "Dedicated Admin hero and tables must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] body.adminDashboardPage .adminNav button") && components.includes("html[data-theme] body.adminDashboardPage button:focus-visible"), "Admin navigation must preserve touch targets and visible keyboard focus");
assert.ok(components.includes("html[data-theme] body.adminDashboardPage .adminForm input") && components.includes("prefers-reduced-motion:reduce"), "Admin forms and motion must follow the semantic theme and accessibility contract");

assert.equal(app, versionedApp, "the versioned public browser bundle must stay synchronized with the editable application source");

assert.ok(worker.includes('if(file==="community-taxonomy.html")text=text.replace("<body>",\'<body class="taxonomyPage">\')'), "Worker must mark the standalone Community Taxonomy template for semantic theme styling");
assert.ok(taxonomyHtml.includes('id="taxonomy-form"') && taxonomyHtml.includes('fetch("/api/taxonomy"'), "Community Taxonomy form and submission API must remain intact");
assert.ok(components.includes("html[data-theme] body.taxonomyPage .tax-card") && components.includes("html[data-theme] body.taxonomyPage .tax-field input"), "Community Taxonomy panels and fields must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] body.taxonomyPage .tax-submit") && components.includes("html[data-theme] body.taxonomyPage .tax-links a:focus-visible"), "Community Taxonomy actions must preserve touch targets and visible focus");

assert.ok(authorHtml.includes('class="wrap"') && authorHtml.includes('id="createForm"') && authorHtml.includes('id="aiCreateForm"'), "Standalone Author Studio must retain its real chapter and AI project workspaces");
assert.ok(worker.includes('if(file==="author.html")text=text.replace("<body>",\'<body class="authorStudioPage">\')'), "Worker must mark the standalone Author Studio document for shared theme adoption");
assert.ok(components.includes("html[data-theme] body.authorStudioPage .card") && components.includes("html[data-theme] body.authorStudioPage input"), "Standalone Author Studio cards and form controls must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] body.authorStudioPage button:focus-visible") && components.includes("body.authorStudioPage .grid{grid-template-columns:minmax(0,1fr)}"), "Standalone Author Studio must preserve visible focus and narrow-screen layout");

for (const token of ['if(kind===\'leaderboard\')','if(kind===\'tier-list\')','if(kind===\'random\')','if(kind===\'vote\')','async function tickets()','async function requests()','async function omni()']) {
 assert.ok(app.includes(token), "Expected existing reader utility route renderer: "+token);
}
assert.ok(app.includes('class="rankBadge"') && app.includes('class="tierPanel"') && app.includes('class="randomCard"'), "Ranking, tier and random discovery must retain their actual route components");
assert.ok(app.includes("voteRow") && app.includes('id="req"') && app.includes('id="omni"'), "Voting, request and OmniPortal controls must retain their actual route components");
assert.ok(components.includes("html[data-theme] #app .rankBadge") && components.includes("html[data-theme] #app .tierPanel") && components.includes("html[data-theme] #app .randomCard"), "Ranking, tier and random discovery must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] #app .voteRow") && components.includes("html[data-theme] #app #req input") && components.includes("html[data-theme] #app #omni input"), "Voting, request and OmniPortal controls must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] #app .period:focus-visible") && components.includes("html[data-theme] #app .randomCard{grid-template-columns:minmax(0,1fr)}"), "Utility routes must retain keyboard focus and small-screen layouts");

for (const [name, page] of [["privacy", privacyHtml], ["terms", termsHtml], ["copyright", copyrightHtml]]) {
 assert.ok(page.includes('class="legalPage"') && page.includes('class="legalHero"') && page.includes('class="legalContent"'), name+" must retain its standalone legal document structure");
}
assert.ok(components.includes("html[data-theme] body.legalPage .legalHero") && components.includes("html[data-theme] body.legalPage .legalSection"), "Standalone legal documents must consume semantic theme surfaces");
assert.ok(components.includes("html[data-theme] body.legalPage a:focus-visible") && components.includes("body.legalPage .legalSection{padding:16px}"), "Legal documents must preserve visible keyboard focus and mobile reading layout");
assert.ok(worker.includes('"\/privacy":"privacy.html"') && worker.includes('"\/terms":"terms.html"') && worker.includes('"\/copyright":"copyright.html"'), "Worker must continue routing the three legal documents");

console.log("Imperial Novel design-system contract passed: six themes, body/secondary/muted and reader contrast, action/status pairs, semantic tokens, component primitives, 44px targets, focus, reduced motion, forced colors, RTL, route adoption and runtime asset registration.");
