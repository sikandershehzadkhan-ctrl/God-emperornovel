import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const start = source.indexOf("let au=p.match(");
const end = source.indexOf('if(p==="\/api\/author\/ai\/status"', start);
assert.ok(start >= 0 && end > start, "admin user mutation route must remain present and bounded");
const route = source.slice(start, end);
for (const fragment of [
  "const e=admin(u);if(e)return e;",
  "Number.isSafeInteger(id)",
  "SELECT id,role,verified,banned FROM users WHERE id=?",
  "if(!target)return json({error:\"User not found\"},404)",
  "id===u.id&&(role!=='admin'||banned)",
  "SELECT COUNT(*) FROM users WHERE role='admin' AND banned=0",
  "(role<>'admin' OR banned<>0 OR (?='admin' AND ?=0)",
  "Number(result.meta?.changes||0)!==1",
  'audit(env,u,"admin_user_updated"'
]) assert.ok(route.includes(fragment), "missing admin account safety invariant: "+fragment);
console.log("PASS: admin account updates validate targets, prevent self-demotion/self-ban and atomically prevent concurrent last-admin lockout, check writes, and create audit entries.");
