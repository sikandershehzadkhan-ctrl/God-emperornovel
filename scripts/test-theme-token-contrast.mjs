import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("public/imperial-luxury-17.23.0.css", "utf8");
const themes = ["light", "dark", "midnight", "sepia", "imperial", "cosmic"];
const luminance = hex => {
  const channels = hex.replace("#", "").match(/../g).map(value => parseInt(value, 16) / 255);
  const linear = channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
};
const contrast = (a, b) => {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
for (const theme of themes) {
  const blocks = [...css.matchAll(new RegExp('html\\[data-theme="' + theme + '"\\]\\s*\\{([^}]+)\\}', "g"))];
  const block = blocks.map(match => match[1]).filter(value => value.includes("--in-canvas:") && value.includes("--in-white:") && value.includes("--in-muted:") && value.includes("--in-purple:") && value.includes("--in-sapphire:") && value.includes("--in-action-bg:") && value.includes("--in-action-hover:") && value.includes("--in-good:") && value.includes("--in-danger:") && value.includes("--in-warning:") && value.includes("--in-lime:") && value.includes("--in-pink:")).at(-1);
  assert.ok(block, "Missing complete semantic token map for " + theme);
  const token = name => {
    const match = block.match(new RegExp(name + ":(#[0-9A-Fa-f]{6})"));
    assert.ok(match, "Missing " + name + " in " + theme);
    return match[1];
  };
  const background = token("--in-canvas");
  for (const name of ["--in-white", "--in-muted", "--in-purple", "--in-sapphire"]) {
    const value = contrast(background, token(name));
    assert.ok(value >= 4.5, theme + " " + name + " contrast is " + value.toFixed(2) + ":1, below WCAG AA normal-text threshold");
  }
  for (const name of ["--in-action-bg", "--in-action-hover"]) {
    const value = contrast("#FFFFFF", token(name));
    assert.ok(value >= 4.5, theme + " white button text on " + name + " has " + value.toFixed(2) + ":1 contrast, below WCAG AA");
  }
  for (const name of ["--in-good", "--in-danger", "--in-warning", "--in-lime", "--in-pink"]) {
    const value = contrast(background, token(name));
    assert.ok(value >= 4.5, theme + " " + name + " status text has " + value.toFixed(2) + ":1 contrast against the theme canvas, below WCAG AA");
  }
}
for (const theme of themes) {
  const readerMatch = css.match(new RegExp('\\.readerPage\\[data-reader-theme="' + theme + '"\\]\\s*\\{([^}]+)\\}'));
  assert.ok(readerMatch, "Missing independent reader token map for " + theme);
  const readerBlock = readerMatch[1];
  const readerToken = name => {
    const match = readerBlock.match(new RegExp(name + ":(#[0-9A-Fa-f]{6})"));
    assert.ok(match, "Missing " + name + " in reader " + theme);
    return match[1];
  };
  const readerCanvas = readerToken("--reader-canvas");
  for (const name of ["--reader-text", "--reader-muted", "--reader-accent", "--reader-link"]) {
    const value = contrast(readerCanvas, readerToken(name));
    assert.ok(value >= 4.5, "Reader " + theme + " " + name + " contrast is " + value.toFixed(2) + ":1, below WCAG AA");
  }
  for (const name of ["--reader-action-bg", "--reader-action-hover"]) {
    const value = contrast("#FFFFFF", readerToken(name));
    assert.ok(value >= 4.5, "Reader " + theme + " white button text on " + name + " has " + value.toFixed(2) + ":1, below WCAG AA");
  }
}
for (const theme of themes) {
  const base = [...css.matchAll(new RegExp('html\\[data-theme="' + theme + '"\\]\\s*\\{([^}]+)\\}', "g"))].map(match => match[1]).find(value => value.includes("--in-canvas:"));
  const high = css.match(new RegExp('html\\[data-theme="' + theme + '"\\]\\[data-high-contrast="true"\\]\\s*\\{([^}]+)\\}'))?.[1];
  assert.ok(base && high, "Missing global high-contrast palette for " + theme);
  const read = name => high.match(new RegExp(name + ":(#[0-9A-Fa-f]{6})"))?.[1];
  const canvas = base.match(/--in-canvas:(#[0-9A-Fa-f]{6})/)?.[1];
  for (const name of ["--in-text", "--in-text-muted"]) {
    const value = contrast(canvas, read(name));
    assert.ok(value >= 4.5, "High-contrast global " + theme + " " + name + " is " + value.toFixed(2) + ":1");
  }
  for (const name of ["--in-line", "--in-focus"]) {
    const value = contrast(canvas, read(name));
    assert.ok(value >= 3, "High-contrast global " + theme + " " + name + " is " + value.toFixed(2) + ":1, below 3:1 UI contrast");
  }
  const readerBase = css.match(new RegExp('\\.readerPage\\[data-reader-theme="' + theme + '"\\]\\s*\\{([^}]+)\\}'))?.[1];
  const readerHigh = css.match(new RegExp('html\\[data-high-contrast="true"\\]\\s*\\.readerPage\\[data-reader-theme="' + theme + '"\\]\\s*\\{([^}]+)\\}'))?.[1];
  assert.ok(readerBase && readerHigh, "Missing high-contrast reader palette for " + theme);
  const readerRead = name => readerHigh.match(new RegExp(name + ":(#[0-9A-Fa-f]{6})"))?.[1];
  const readerCanvas = readerBase.match(/--reader-canvas:(#[0-9A-Fa-f]{6})/)?.[1];
  for (const name of ["--reader-text", "--reader-muted"]) {
    const value = contrast(readerCanvas, readerRead(name));
    assert.ok(value >= 4.5, "High-contrast reader " + theme + " " + name + " is " + value.toFixed(2) + ":1");
  }
  for (const name of ["--reader-line", "--reader-focus"]) {
    const value = contrast(readerCanvas, readerRead(name));
    assert.ok(value >= 3, "High-contrast reader " + theme + " " + name + " is " + value.toFixed(2) + ":1, below 3:1 UI contrast");
  }
}
const prefersBlock = css.slice(css.lastIndexOf("@media(prefers-contrast:more)"));
assert.ok(prefersBlock.startsWith("@media(prefers-contrast:more)"), "Missing OS contrast preference media block");
for (const theme of themes) {
  const globalBase = [...css.matchAll(new RegExp('html\\[data-theme="' + theme + '"\\]\\s*\\{([^}]+)\\}', "g"))].map(match => match[1]).find(value => value.includes("--in-canvas:"));
  const globalOS = prefersBlock.match(new RegExp('html\\[data-theme="' + theme + '"\\]\\s*\\{([^}]+)\\}'))?.[1];
  const readerBase = css.match(new RegExp('\\.readerPage\\[data-reader-theme="' + theme + '"\\]\\s*\\{([^}]+)\\}'))?.[1];
  const readerOS = prefersBlock.match(new RegExp('\\.readerPage\\[data-reader-theme="' + theme + '"\\]\\s*\\{([^}]+)\\}'))?.[1];
  assert.ok(globalBase && globalOS && readerBase && readerOS, "Missing OS high-contrast map for " + theme);
  const get = (block, name) => block.match(new RegExp(name + ":(#[0-9A-Fa-f]{6})"))?.[1];
  for (const [scope, base, os, canvasToken, textToken, mutedToken, lineToken, focusToken] of [
    ["global", globalBase, globalOS, "--in-canvas", "--in-text", "--in-text-muted", "--in-line", "--in-focus"],
    ["reader", readerBase, readerOS, "--reader-canvas", "--reader-text", "--reader-muted", "--reader-line", "--reader-focus"]
  ]) {
    const canvas = get(base, canvasToken);
    for (const token of [textToken, mutedToken]) assert.ok(contrast(canvas, get(os, token)) >= 4.5, "OS high-contrast " + scope + " " + theme + " " + token + " fails text contrast");
    for (const token of [lineToken, focusToken]) assert.ok(contrast(canvas, get(os, token)) >= 3, "OS high-contrast " + scope + " " + theme + " " + token + " fails UI contrast");
  }
}
console.log("PASS: manual and operating-system high-contrast global/reader palettes meet text and UI contrast thresholds.");
