import fs from "node:fs";
import assert from "node:assert/strict";

const tokens = fs.readFileSync("public/imperial-design-tokens.css", "utf8");
const components = fs.readFileSync("public/imperial-ui-primitives.css", "utf8");
const spec = fs.readFileSync("design-system/IMPERIAL-DESIGN-SYSTEM-18.0.0.md", "utf8");
const html = fs.readFileSync("public/index.html", "utf8");
const app = fs.readFileSync("public/app.js", "utf8");
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
  const primary = readHex(match[1], "--in-action-primary", theme);
  const primaryActionText = readHex(match[1], "--in-action-primary-text", theme);
  const secondary = readHex(match[1], "--in-action-secondary", theme);
  const secondaryActionText = readHex(match[1], "--in-action-secondary-text", theme);
  const link = readHex(match[1], "--in-link", theme);
  const focus = readHex(match[1], "--in-focus-ring", theme);
  assert.ok(contrastRatio(primaryText, canvas) >= 4.5, theme + " body text fails WCAG AA contrast");
  assert.ok(contrastRatio(primaryActionText, primary) >= 4.5, theme + " primary action text fails WCAG AA contrast");
  assert.ok(contrastRatio(secondaryActionText, secondary) >= 4.5, theme + " secondary action text fails WCAG AA contrast");
  assert.ok(contrastRatio(link, canvas) >= 4.5, theme + " link color fails WCAG AA contrast");
  assert.ok(contrastRatio(focus, canvas) >= 3, theme + " focus indicator fails non-text contrast");
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
assert.match(tokens, /prefers-reduced-motion:reduce/, "token motion fallback is required");
assert.ok(spec.includes("WCAG 2.2 AA"), "accessibility target missing from specification");
assert.ok(spec.includes("RTL"), "RTL guidance missing from specification");
assert.ok(usage.includes("Dialog behavior must be implemented") && usage.includes("server must enforce"), "component usage guide must document behavior and security boundaries");
assert.ok(routeMap.includes("33 explicit static route entries") && routeMap.includes("/read/:id/:chapter") && routeMap.includes("No route family is declared fully migrated"), "route migration map must inventory templates and preserve honest migration status");
assert.ok(spec.includes("primitives are opt-in") || spec.includes("Do not bulk-replace legacy selectors"), "rollout boundary must be documented");
assert.ok(html.includes('href="/imperial-design-tokens.css"'), "semantic tokens must be loaded by the application shell");
assert.ok(html.includes('href="/imperial-ui-primitives.css"'), "component primitives must be loaded by the application shell");
assert.ok(worker.includes("'/imperial-design-tokens.css'") && worker.includes("'/imperial-ui-primitives.css'"), "Worker must register both stylesheets for every HTML template");
assert.ok(app.includes("const IMPERIAL_THEMES=['light','dark','midnight','sepia','imperial','cosmic']"), "shared shell must expose all six supported themes");
assert.ok(app.includes('id="imperialThemeSelect"') && app.includes("applyImperialTheme(event.target.value)"), "shared theme selector must be operable and update the root theme");
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
console.log("Imperial Novel design-system contract passed: six complete themes, semantic roles, contrast, component primitives, 44px targets, focus, reduced motion, forced colors, WCAG, RTL and runtime asset registration.");

assert.ok(components.includes("html[data-theme] .novelHero") && components.includes("html[data-theme] .novelInfo h1"), "novel detail surfaces must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] .chapter:hover") && components.includes("html[data-theme] .tabs a.active"), "chapter navigation and novel tabs must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] .readerPage .readerTool:focus-visible") && components.includes("html[data-theme] .readerPage .readerChapterItem:focus-visible"), "reader controls and chapter drawer must preserve visible keyboard focus");
assert.ok(components.includes("html[data-theme] .readerPage .readerTool{") && components.includes("min-width:var(--in-touch-target)"), "reader tool controls must preserve 44px touch targets");
assert.ok(components.includes("html[data-theme] .readerPage .readerPrefs select") && components.includes("prefers-reduced-motion:reduce"), "reader preferences must retain semantic focus and reduced-motion support");
