import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("public/app.js", "utf8");
const shipped = fs.readFileSync("public/app-17.23.0.js", "utf8");

for (const [label, app] of [["source", source], ["served asset", shipped]]) {
  assert.ok(feature.includes("imperial_author_unsent_v1:") && feature.includes("Number(me.user.id)+':'+key"), label + " must use a namespaced local draft key.");
  assert.ok(feature.includes("Unsent work is saved privately in this browser on this device."), label + " must disclose local-device storage.");
  assert.ok(feature.includes("Recovered an unsent draft from this browser."), label + " must explain when a draft is restored.");
  assert.ok(feature.includes("localStorage.removeItem(storageKey)"), label + " must clear local data after successful save.");
  assert.ok(feature.includes("attachLocalDraft(f,'chapter:'+Number(f.dataset.id),()=>({comicContent:"), label + " must recover chapter drafts by story.");
  assert.ok(feature.includes("$$('.authorChapterForm',list).forEach"), label + " must initialize every chapter form with a collection query.");
  assert.ok(feature.includes("restoreExtra(saved.extra)"), label + " must restore structured draft data through an explicit callback.");
  assert.ok(feature.includes("saved.comicContent==='string'"), label + " must restore comic chapter payloads before initializing the page composer.");
  assert.ok(feature.includes("content.dispatchEvent(new Event('input',{bubbles:true}))"), label + " must persist page-composer changes to local recovery.");
  assert.ok(feature.includes("isSafeComicImageUrl(String(page.src||''))"), label + " must revalidate recovered comic image URLs.");
}
assert.equal(source, shipped, "Source and served app assets must stay identical.");
console.log("Author local draft recovery checks passed.");
