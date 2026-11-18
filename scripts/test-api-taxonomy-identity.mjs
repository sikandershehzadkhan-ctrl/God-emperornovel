import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const helperStart = worker.indexOf("function communityTaxonomy(req,env,u){");
const helperEnd = worker.indexOf("async function adminTaxonomy(", helperStart);
assert.ok(helperStart >= 0 && helperEnd > helperStart, "Taxonomy helper boundaries must exist");
const helper = worker.slice(helperStart, helperEnd);
const post = helper.slice(helper.indexOf("if(method==='POST')"));
assert.ok(post.indexOf("const e=need(u);if(e)return e;") >= 0, "Taxonomy submissions must require an authenticated account before reading the body");
assert.ok(post.includes("user.id") && post.includes("user.username"), "Submitter identity must come from the authenticated session");
assert.ok(!post.includes("b.creator_id") && !post.includes("b.creator_name"), "Clients must not choose or impersonate taxonomy submitter identity");
assert.ok(worker.includes("return communityTaxonomy(req,env,u);"), "The authenticated user must be passed to the taxonomy helper");
console.log("Taxonomy identity security tests passed: authenticated submitter required and identity derived server-side.");
