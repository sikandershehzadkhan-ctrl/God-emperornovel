import assert from "node:assert/strict";
import fs from "node:fs";
const source=fs.readFileSync(new URL("../src/index.js",import.meta.url),"utf8");
const adminStart=source.indexOf("let au=p.match(/^\\/api\\/admin\\/users\\/(\\d+)$/)");
assert.ok(adminStart>=0,"admin account PATCH route matcher must remain present");
const adminEnd=source.indexOf("\n\n\n if(p===",adminStart);
assert.ok(adminEnd>adminStart,"admin account PATCH handler boundary missing");
const admin=source.slice(adminStart,adminEnd);
assert.ok(admin.includes('Object.keys(b).some(k=>!allowed.has(k))'),"admin patch must reject unknown fields");
assert.ok(admin.includes('if(!keys.length)'),"admin patch must reject empty updates");
assert.ok(admin.includes('if(has("verified"))'),"verification must update only when explicitly supplied");
assert.ok(admin.includes('if(has("banned"))'),"ban state must update only when explicitly supplied");
assert.ok(admin.includes("SELECT COUNT(*) FROM users WHERE role='admin' AND banned=0"),"last active admin guard missing");
assert.ok(admin.includes('audit(env,u,"admin_user_update"'),"admin account changes must be audited");
assert.ok(!admin.includes('b.verified?1:0,b.banned?1:0'),"legacy destructive PATCH defaults must not return");
for(const method of ["GET","POST"]){
 const marker='if(p==="/api/comments"&&m==="'+method+'")';
 const start=source.indexOf(marker),end=method==="GET"?source.indexOf('if(p==="/api/comments"&&m==="POST")',start):source.indexOf('if(p==="/api/comments/like"',start);
 assert.ok(start>=0&&end>start,"comment "+method+" handler must exist");
 const handler=source.slice(start,end);
 assert.ok(handler.includes("publication_status='published' AND rights_status IN ('original','public_domain','licensed','authorized')"),"comment "+method+" must enforce published rights-eligible parent novels");
}
console.log("Admin account PATCH and comment parent eligibility static safety checks passed.");
