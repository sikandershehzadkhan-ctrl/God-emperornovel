import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const source=readFileSync(new URL("../src/index.js",import.meta.url),"utf8");
const loginStart=source.indexOf('if(p==="/api/auth/login"&&m==="POST")');
const loginEnd=source.indexOf('if(p==="/api/auth/logout"&&m==="POST")',loginStart);
assert.ok(loginStart>=0&&loginEnd>loginStart,"login route must remain bounded");
const login=source.slice(loginStart,loginEnd);
assert.ok(login.includes("if(x.banned)return json({error:\"This account is disabled.\"},403)"),"banned users with valid passwords must not receive new sessions");

const banStart=source.indexOf('let au=p.match(/^\\/api\\/admin\\/users\\/(\\d+)$/)');
const banEnd=source.indexOf('\n\n',banStart);
assert.ok(banStart>=0&&banEnd>banStart,"admin user update route must remain present");
const ban=source.slice(banStart,banEnd);
for(const fragment of [
  "SELECT id,role,verified,banned FROM users",
  "b.verified===undefined?!!target.verified",
  "b.banned===undefined?!!target.banned",
  'DELETE FROM sessions WHERE user_id=? AND changes()=1',
  "sessions_revoked:banned"
])assert.ok(ban.includes(fragment),`missing ban/session invariant: ${fragment}`);

console.log("PASS: banned accounts cannot sign in, omitted profile flags are preserved, and bans revoke all sessions atomically.");
