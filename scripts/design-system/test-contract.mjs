import fs from "node:fs";
import assert from "node:assert/strict";

const tokens = fs.readFileSync("public/imperial-design-tokens.css", "utf8");
const components = fs.readFileSync("public/imperial-ui-primitives.css", "utf8");
const spec = fs.readFileSync("design-system/IMPERIAL-DESIGN-SYSTEM-18.0.0.md", "utf8");
const html = fs.readFileSync("public/index.html", "utf8");

const themes = ["light", "dark", "midnight", "sepia", "imperial", "cosmic"];
const themeRoles = [
  "--in-bg-canvas", "--in-bg-subtle", "--in-bg-surface", "--in-bg-elevated", "--in-bg-inverse",
  "--in-text-primary", "--in-text-secondary", "--in-text-muted", "--in-text-inverse",
  "--in-border-default", "--in-border-strong",
  "--in-action-primary", "--in-action-primary-hover", "--in-action-primary-active", "--in-action-primary-text",
  "--in-action-secondary", "--in-action-secondary-hover", "--in-focus-ring", "--in-link",
  "--in-status-success", "--in-status-success-bg", "--in-status-warning", "--in-status-warning-bg",
  "--in-status-danger", "--in-status-danger-bg", "--in-status-info", "--in-status-info-bg",
  "--in-reader-paper", "--in-reader-ink"
];
for (const theme of themes) {
  const escaped = theme.replace(/[.*+?^\\{}()|[\]\\]/g, "\\$&");
  const match = tokens.match(new RegExp('(?:^|,)\\s*\\[data-theme="' + escaped + '"\\]\\s*\\{([^}]*)\\}', "m"));
  assert.ok(match, "missing theme: " + theme);
  for (const role of themeRoles) {
    assert.ok(match[1].includes(role + ":"), theme + " theme is missing semantic role: " + role);
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
assert.match(components, /prefers-reduced-motion:reduce/, "reduced-motion support is required");
assert.match(components, /forced-colors:active/, "forced-colors support is required");
assert.match(components, /in-button--sm\\{min-height:var\\(--in-touch-target\\)/, "small button variant must preserve the 44px target");
assert.match(components, /in-check-row\\{[^}]*min-height:var\\(--in-touch-target\\)/, "checkbox/radio row must preserve the 44px target");
assert.match(tokens, /prefers-reduced-motion:reduce/, "token motion fallback is required");
assert.match(spec, /WCAG 2\\.2 AA/, "accessibility target missing from specification");
assert.match(spec, /RTL/, "RTL guidance missing from specification");
assert.match(spec, /primitives are opt-in|Do not bulk-replace legacy selectors/i, "rollout boundary must be documented");
assert.match(html, /href="\\/imperial-design-tokens\\.css"/, "semantic tokens must be loaded by the application shell");
assert.match(html, /href="\\/imperial-ui-primitives\\.css"/, "component primitives must be loaded by the application shell");
console.log("Imperial Novel design-system contract passed: six complete themes, semantic roles, component primitives, 44px targets, focus, reduced motion, forced colors, WCAG, RTL and runtime asset registration.");
