import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync("public/app.js", "utf8");
const runtime = readFileSync("public/app-17.23.0.js", "utf8");
const css = readFileSync("public/imperial-luxury-17.23.0.css", "utf8");
const themes = ["light", "dark", "midnight", "sepia", "imperial", "cosmic"];
for (const [name, source] of [["source app", app], ["versioned runtime", runtime]]) {
  assert.ok(source.includes("const allowed=['light','dark','midnight','sepia','imperial','cosmic']"), name + " must preserve all six supported site themes");
  for (const theme of themes) assert.ok(source.includes('<option value="' + theme + '">'), name + " settings selector is missing " + theme);
  assert.ok(source.includes("allowed.includes(chosen)?chosen:'light'"), name + " must safely fall back for invalid stored theme values");
}
for (const theme of themes) assert.ok(css.includes('html[data-theme="' + theme + '"]'), "Missing CSS token map for " + theme);
assert.ok(css.includes('html:is([data-theme="dark"],[data-theme="midnight"],[data-theme="imperial"],[data-theme="cosmic"])'), "Dark-family component styles must cover all dark themes");
console.log("PASS: six global theme identifiers, settings options, persistence validation, and CSS token maps.");
