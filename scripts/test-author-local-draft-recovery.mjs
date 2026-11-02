import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("public/app.js", "utf8");
const shipped = fs.readFileSync("public/app-17.24.0.js", "utf8");

for (const [label, app] of [["source", source], ["served asset", shipped]]) {
  assert.ok(app.includes("imperial_author_unsent_v1:"), label + " must use a namespaced local draft key.");
  assert.ok(app.includes("Unsent work is saved privately in this browser on this device."), label + " must disclose local-device storage.");
  assert.ok(app.includes("Recovered an unsent draft from this browser."), label + " must explain when a draft is restored.");
  assert.ok(app.includes("localStorage.removeItem(storageKey)"), label + " must clear local data after successful save.");
  assert.ok(app.includes("attachLocalDraft(f,'chapter:'+Number(f.dataset.id))"), label + " must recover text chapter drafts by story.");
  assert.ok(app.includes("COMIC_FORMATS.has(String(f.dataset.kind||'').toLowerCase())?{clear(){}}"), label + " must not claim comic page recovery when the page composer cannot be restored.");
}
assert.equal(source, shipped, "Source and served app assets must stay identical.");
console.log("Author local draft recovery checks passed.");
