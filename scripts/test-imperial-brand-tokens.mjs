import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("public/imperial-luxury-17.23.0.css", "utf8");
const root = css.match(/:root\s*\{([^}]+)\}/)?.[1];
assert.ok(root, "Luxury stylesheet must define a root token contract");
const expected = [
  "--in-obsidian:#0B1215",
  "--in-purple:#6A0DAD",
  "--in-sapphire:#0F52BA",
  "--in-white:#FFFFFF",
  "--imperial-color-obsidian:var(--in-obsidian)",
  "--imperial-color-purple:var(--in-purple)",
  "--imperial-color-sapphire:var(--in-sapphire)",
  "--imperial-color-white:var(--in-white)"
];
for (const token of expected) assert.ok(root.includes(token), "Missing or incorrect canonical token: " + token);
assert.ok(root.includes("color-scheme:light dark"), "Root must not force a dark-only native control scheme");
console.log("PASS: Imperial brand root tokens, semantic aliases, and non-forcing root color scheme.");
