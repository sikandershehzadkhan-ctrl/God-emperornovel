import fs from "node:fs";
import assert from "node:assert/strict";

const tokens = fs.readFileSync("public/imperial-design-tokens.css", "utf8");
const components = fs.readFileSync("public/imperial-ui-primitives.css", "utf8");
const spec = fs.readFileSync("design-system/IMPERIAL-DESIGN-SYSTEM-18.0.0.md", "utf8");

const themes = ["light", "dark", "midnight", "sepia", "imperial", "cosmic"];
for (const theme of themes) {
  assert.match(tokens, new RegExp('\\[data-theme="' + theme + '"\\]'), "missing theme: " + theme);
}
const requiredTokens = [
  "--in-bg-canvas", "--in-bg-surface", "--in-bg-elevated",
  "--in-text-primary", "--in-text-secondary", "--in-text-muted",
  "--in-border-default", "--in-border-strong",
  "--in-action-primary", "--in-action-secondary", "--in-focus-ring",
  "--in-status-success", "--in-status-warning", "--in-status-danger", "--in-status-info",
  "--in-font-sans", "--in-space-4", "--in-radius-md", "--in-touch-target",
  "--in-reader-paper", "--in-reader-ink"
];
for (const token of requiredTokens) {
  assert.ok(tokens.includes(token), "missing semantic token: " + token);
}
const requiredComponents = [
  ".in-button--primary", ".in-button--secondary", ".in-button--danger",
  ".in-field", ".in-select", ".in-textarea", ".in-checkbox",
  ".in-card", ".in-badge", ".in-avatar", ".in-tabs", ".in-table",
  ".in-dialog", ".in-toast", ".in-tooltip", ".in-empty-state", ".in-skeleton"
];
for (const component of requiredComponents) {
  assert.ok(components.includes(component), "missing component primitive: " + component);
}
assert.match(components, /:focus-visible/, "visible keyboard focus is required");
assert.match(components, /prefers-reduced-motion:reduce/, "reduced-motion support is required");
assert.match(tokens, /prefers-reduced-motion:reduce/, "token motion fallback is required");
assert.match(spec, /WCAG 2\.2 AA/, "accessibility target missing from specification");
assert.match(spec, /RTL/, "RTL guidance missing from specification");
assert.match(spec, /not linked into production|not linked into production/i, "rollout boundary must be documented");
console.log("Imperial Novel design-system contract passed: 6 themes, semantic tokens, component primitives, focus, reduced motion, WCAG and RTL documentation.");
