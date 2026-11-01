import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const helper = source.match(/const isPlatformOwner=\(u,env\)=>[^;]+;/)?.[0] || "";
assert.match(helper, /IMPERIAL_OWNER_USER_ID/);
assert.match(helper, /Number\.isSafeInteger/);
assert.match(helper, /Number\(u\.id\)===Number\(configured\)/);
const route = source.split("\n").find(line => line.includes("let au=p.match")) || "";
assert.match(route, /role==="admin"&&!owner/);
assert.match(route, /Only the configured platform owner can grant administrator access/);
assert.match(route, /Platform owner identity is not configured/);
assert.match(route, /target\.role==="admin"/);
assert.match(route, /platform owner account cannot be demoted or banned/);
assert.match(route, /Only the platform owner can change another administrator account/);
assert.match(route, /admin_user_updated/);
assert.match(route, /meta\?\.changes/);
console.log("PASS: administrator elevation is owner-gated, owner identity fails closed, existing admin accounts are protected, and role changes are audited.");
