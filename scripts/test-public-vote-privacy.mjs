import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const start = source.indexOf('if(p==="/api/vote-novels"&&m==="GET"){');
const end = source.indexOf('if(p==="/api/vote-novels"&&m==="POST"){', start + 1);
assert.ok(start >= 0 && end > start, "public vote-board GET handler must exist");
const handler = source.slice(start, end);
assert.ok(handler.includes("SELECT r.id,r.url,r.source_host,r.status,r.created_at"), "public board should expose request details");
assert.ok(handler.includes("COALESCE(v.votes,0) votes"), "public board should expose aggregate vote counts");
assert.ok(!handler.includes("u.username"), "public board must not expose requester usernames");
assert.ok(!handler.includes("JOIN users"), "public board must not join private account records");
console.log("PASS: public vote board returns request details and aggregate counts without requester account identity.");
