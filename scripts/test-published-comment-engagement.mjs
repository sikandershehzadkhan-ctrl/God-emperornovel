import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parsePositiveSafeInteger } from "../src/published-engagement-policy.mjs";

for (const value of [1, "1", 7, "25"]) assert.equal(parsePositiveSafeInteger(value), Number(value));
for (const value of [0, -1, 1.2, "1.2", " 1 ", "1e2", "0x10", "abc", null, undefined, true, false, Number.MAX_SAFE_INTEGER + 1]) assert.equal(parsePositiveSafeInteger(value), null);

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const route = marker => source.split("\n").find(line => line.includes(marker));
const commentsGet = route('if(p==="/api/comments"&&m==="GET")');
const comment = route('if(p==="/api/comments"&&m==="POST")');
const like = route('if(p==="/api/comments/like"&&m==="POST")');
const follow = route('if(p==="/api/follow"&&m==="POST")');
const report = route('if(p==="/api/comments/report"&&m==="POST")');

assert.ok(commentsGet && commentsGet.includes("publication_status='published'") && commentsGet.includes("rights_status IN"), "comment reads must remain limited to published rights-eligible novels");
assert.ok(comment && comment.includes("parsePositiveSafeInteger") && comment.includes("publication_status='published'") && comment.includes("rights_status IN"), "comment creation must reject invalid or ineligible novels");
assert.ok(like && like.includes("parsePositiveSafeInteger") && like.includes("JOIN novels") && like.includes("n.publication_status='published'") && like.includes("n.rights_status IN"), "likes must target visible comments on published rights-eligible novels");
assert.ok(follow && follow.includes("parsePositiveSafeInteger") && follow.includes("publication_status='published'") && follow.includes("rights_status IN"), "follow writes must validate the novel id and publication rights");
assert.ok(report && report.includes("JOIN novels") && report.includes("n.publication_status='published'") && report.includes("n.rights_status IN"), "reports must target visible comments on published rights-eligible novels");
console.log("PASS: published comment, like, report, and follow boundaries.");
