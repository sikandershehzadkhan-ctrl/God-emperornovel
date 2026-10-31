import assert from "node:assert/strict";
import { validateChapterDraft, validateChapterPublication } from "../src/chapter-publishing-policy.mjs";

const valid = {
  chapter_number: 1,
  title: "The First Oath",
  content: "A".repeat(500),
  is_locked: false,
  ticket_cost: 0,
};
const accepted = validateChapterDraft(valid);
assert.equal(accepted.ok, true);
assert.equal(accepted.value.chapter_number, 1);
assert.equal(accepted.value.is_locked, false);
assert.equal(accepted.value.ticket_cost, 0);
assert.equal(validateChapterDraft({ ...valid, chapter_number: 1.5 }).ok, false);
assert.equal(validateChapterDraft({ ...valid, chapter_number: 100001 }).ok, false);
assert.equal(validateChapterDraft({ ...valid, title: " " }).ok, false);
assert.equal(validateChapterDraft({ ...valid, title: "x".repeat(181) }).ok, false);
assert.equal(validateChapterDraft({ ...valid, content: " " }).ok, false);
assert.equal(validateChapterDraft({ ...valid, content: "x".repeat(100001) }).ok, false);
assert.equal(validateChapterDraft({ ...valid, ticket_cost: -1 }).ok, false);
assert.equal(validateChapterDraft({ ...valid, ticket_cost: 1.5 }).ok, false);
assert.equal(validateChapterDraft({ ...valid, ticket_cost: 100001 }).ok, false);
assert.equal(validateChapterDraft({ ...valid, ticket_cost: NaN }).ok, false);

assert.equal(validateChapterPublication({ publication_status: "draft", rights_status: "original" }).ok, false);
assert.equal(validateChapterPublication({ publication_status: "published", rights_status: "pending" }).ok, false);
assert.equal(validateChapterPublication({ publication_status: "published", rights_status: "licensed" }).ok, false);
assert.equal(validateChapterPublication({ publication_status: "published", rights_status: "licensed", rights_evidence: "https://license.example/record" }).ok, true);
assert.equal(validateChapterPublication({ publication_status: "published", rights_status: "original" }).ok, true);

const source = (await import("node:fs")).readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const authorPublishStart = source.indexOf('if(/^\\/api\\/author\\/chapters\\/\\d+\\/publish$/.test(p)&&m==="POST")');
assert.ok(authorPublishStart >= 0, "Legacy author chapter publication route remains explicitly blocked.");
const authorPublishEnd = source.indexOf('if(p==="\\/api\\/admin\\/publishing"', authorPublishStart);
const authorPublishRoute = source.slice(authorPublishStart, authorPublishEnd > authorPublishStart ? authorPublishEnd : authorPublishStart + 1000);
assert.ok(authorPublishRoute.includes("Only administrators can publish chapters"), "Only admin publishing workflow can change chapter visibility.");
assert.ok(source.includes("validateChapterDraft"), "Author and admin chapter writes use shared server-side validation.");
assert.ok(source.includes("validateChapterPublication"), "Admin chapter publication enforces parent novel publication and rights evidence.");
assert.ok(source.includes("published_chapter_requeued_for_review"), "Editing a published chapter forces it back to draft and records an audit event.");

console.log("Chapter publishing policy and authorization tests passed.");
