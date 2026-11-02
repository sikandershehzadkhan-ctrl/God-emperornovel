import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("public/app.js", "utf8");
const shipped = fs.readFileSync("public/app-17.24.0.js", "utf8");

for (const [label, app] of [["source", source], ["served asset", shipped]]) {
  assert.ok(app.includes("imperial_author_unsent_v1:"), label + " must use a namespaced local draft key.");
  assert.ok(app.includes("Unsent work is saved privately in this browser on this device."), label + " must disclose local-device storage.");
  assert.ok(app.includes("Recovered an unsent draft from this browser."), label + " must explain when a draft is restored.");
  assert.ok(app.includes("localStorage.removeItem(storageKey)"), label + " must clear local data after successful save.");
  assert.ok(app.includes("attachLocalDraft(f,'chapter:'+Number(f.dataset.id),()=>({comicContent:"), label + " must recover chapter drafts by story.");
  assert.ok(app.includes("$$('.authorChapterForm',list).forEach"), label + " must initialize every chapter form with a collection query.");
  assert.ok(app.includes("restoreExtra(saved.extra)"), label + " must restore structured draft data through an explicit callback.");
  assert.ok(app.includes("saved.comicContent==='string'"), label + " must restore comic chapter payloads before initializing the page composer.");
  assert.ok(app.includes("content.dispatchEvent(new Event('input',{bubbles:true}))"), label + " must persist page-composer changes to local recovery.");
  assert.ok(app.includes("isSafeComicImageUrl(String(page.src||''))"), label + " must revalidate recovered comic image URLs.");
}
assert.equal(source, shipped, "Source and served app assets must stay identical.");
console.log("Author local draft recovery checks passed.");
