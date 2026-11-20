import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const createStart = worker.indexOf('if(p==="/api/admin/connectors"&&m==="POST")');
const createEnd = worker.indexOf('if(p==="/api/admin/requests"&&m==="GET")', createStart);
assert.ok(createStart >= 0 && createEnd > createStart, "Admin connector registration route must exist");
const createRoute = worker.slice(createStart, createEnd);
assert.ok(createRoute.includes("VALUES(?,?,?,0,'pending')"), "New connectors must start pending and disabled");
assert.ok(createRoute.includes('rights_status:"pending"'), "Registration response must expose pending review state");
assert.ok(!createRoute.includes("'authorized'"), "Connector registration must not grant rights authorization");

const updateStart = worker.indexOf('if(p==="/api/admin/connectors"&&m==="PATCH")');
const updateEnd = worker.indexOf('if(p==="/api/admin/omni/health"', updateStart);
assert.ok(updateStart >= 0 && updateEnd > updateStart, "Admin connector update route must exist");
const updateRoute = worker.slice(updateStart, updateEnd);
assert.ok(updateRoute.includes("rights==='authorized'&&!evidence&&!terms"), "Direct authorization requires evidence or terms");

const reviewStart = worker.indexOf("let car=p.match");
const reviewEnd = worker.indexOf('return json({error:"Not found"},404);', reviewStart);
assert.ok(reviewStart >= 0 && reviewEnd > reviewStart, "Connector authorization review route must exist");
const reviewRoute = worker.slice(reviewStart, reviewEnd);
assert.ok(reviewRoute.includes("decision==='approved'&&!r.evidence_url&&!r.terms_url&&!r.notes"), "Approval requires submitted rights evidence");
assert.ok(reviewRoute.includes("decision==='approved'?'authorized':'rejected'"), "Only an approved review may set authorized rights state");

console.log("PASS: connector registration remains pending until explicit rights review.");
