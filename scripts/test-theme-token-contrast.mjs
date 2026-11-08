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
console.log("PASS: global and independent reader theme text, status, link and action tokens meet 4.5:1 contrast.");
