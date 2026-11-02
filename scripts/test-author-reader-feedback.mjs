import assert from "node:assert/strict";
import fs from "node:fs";
const worker=fs.readFileSync("src/index.js","utf8");
const app=fs.readFileSync("public/app.js","utf8");
const shipped=fs.readFileSync("public/app-17.24.0.js","utf8");
const at=worker.indexOf('if(p==="/api/author/feedback"&&m==="GET")');
assert.ok(at>=0,"Author feedback inbox route must exist.");
const route=worker.slice(at,worker.indexOf('if(p==="/api/author/novels"',at));
assert.ok(route.includes("const e=author(u)"),"Feedback must require an author/admin session.");
assert.ok(route.includes("n.owner_user_id=?"),"Feedback must be restricted to stories owned by the current author.");
assert.ok(route.includes("c.status='visible'"),"Hidden or removed comments must not appear in the creator inbox.");
assert.ok(route.includes("FROM ratings")&&route.includes("FROM comments"),"Inbox must use real rating and comment records.");
assert.ok(route.includes("LIMIT 100"),"Both feedback streams must be bounded.");
assert.ok(route.includes("scope:'owned_stories'"),"Response must disclose its ownership scope.");
for(const [label,browser] of [["source",app],["served",shipped]]){
 assert.ok(browser.includes("authorFeedbackPanel"),label+" app must render the reader feedback panel.");
 assert.ok(browser.includes("api('/api/author/feedback')"),label+" app must call the authenticated feedback API.");
 assert.ok(browser.includes("esc(item.body||'')"),label+" app must escape reader comment text.");
 assert.ok(browser.includes("Creator replies are not enabled"),label+" app must not imply a reply workflow exists.");
 assert.ok(browser.includes("authorFeedbackType")&&browser.includes("authorFeedbackSearch"),label+" app must provide feedback type and text filters.");
 assert.ok(browser.includes("const filtered=items.filter"),label+" app must filter only the records returned by the owner-scoped API.");
}
assert.equal(app,shipped,"Source and served app assets must remain identical.");
console.log("Author reader feedback inbox checks passed.");
