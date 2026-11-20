import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const getStart = worker.indexOf('if(p==="/api/comments"&&m==="GET")');
const postStart = worker.indexOf('if(p==="/api/comments"&&m==="POST")');
const likeStart = worker.indexOf('if(p==="/api/comments/like"&&m==="POST")');

assert.ok(getStart >= 0 && postStart > getStart && likeStart > postStart, "comment GET, POST and like handlers must exist in order");
const getHandler = worker.slice(getStart, postStart);
const postHandler = worker.slice(postStart, likeStart);

assert.ok(getHandler.includes("JOIN novels n ON n.id=c.novel_id"), "comment reads must join the target novel");
assert.ok(getHandler.includes("n.publication_status='published'"), "comment reads must exclude unpublished novels");
assert.ok(getHandler.includes("n.rights_status IN ('original','public_domain','licensed','authorized')"), "comment reads must enforce rights eligibility");

assert.ok(postHandler.includes("need(u)"), "comment creation must require an authenticated user");
assert.ok(postHandler.includes("!Number.isSafeInteger(nid)||nid<1"), "comment creation must validate a positive safe-integer novel ID");
assert.ok(postHandler.includes("!Number.isSafeInteger(parent)||parent<0"), "comment creation must validate the optional parent comment ID");
const eligibility = postHandler.indexOf("const eligible=await env.DB.prepare");
const insert = postHandler.indexOf("INSERT INTO comments(user_id,novel_id,body,parent_id)");
assert.ok(eligibility >= 0 && insert > eligibility, "comment creation must verify novel eligibility before inserting");
assert.ok(postHandler.includes("publication_status='published'"), "comment creation must reject unpublished novels");
assert.ok(postHandler.includes("rights_status IN ('original','public_domain','licensed','authorized')"), "comment creation must reject rights-ineligible novels");
assert.ok(postHandler.includes("WHERE id=? AND novel_id=? AND status='visible'"), "replies must remain attached to a visible parent in the same novel");

console.log("PASS: comment reads and writes are restricted to published, rights-eligible novels.");
