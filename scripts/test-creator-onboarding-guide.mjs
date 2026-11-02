import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("public/app.js", "utf8");
const shipped = fs.readFileSync("public/app-17.24.0.js", "utf8");
const css = fs.readFileSync("public/app-17.24.0.css", "utf8");

for (const [label, app] of [["source", source], ["served asset", shipped]]) {
  assert.ok(app.includes('class="creatorPathGuide"'), label + " must expose the creator journey guide.");
  assert.ok(app.includes("World Forge"), label + " must explain the planning workspace.");
  assert.ok(app.includes("configured provider"), label + " must disclose the AI provider dependency.");
  assert.ok(app.includes("Create a private story draft"), label + " must explain private draft creation.");
  assert.ok(app.includes("Editorial review"), label + " must explain the publication review gate.");
  assert.ok(app.includes("Rights first."), label + " must state the rights requirement.");
}
assert.ok(source === shipped, "The source and versioned browser entry must remain identical.");
assert.ok(css.includes(".creatorPathGrid"), "Creator journey cards need responsive layout styling.");
assert.ok(css.includes("@media(max-width:640px){.creatorPathGrid{grid-template-columns:1fr}"), "Creator journey must collapse to one column on small screens.");

console.log("Creator onboarding guide checks passed.");
