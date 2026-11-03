import fs from "node:fs";
const source=fs.readFileSync("src/index.js","utf8");
const start=source.indexOf("async function communityTaxonomy(req,env,u){");
const end=source.indexOf("\nasync function adminTaxonomy",start);
if(start<0||end<0)throw new Error("Community taxonomy handler was not found");
const handler=source.slice(start,end);
const checks=[
 ["submitter identity comes from the authenticated session",/\.bind\(type,name,s,String\(b\.description\|\|'\'\)\)\.slice\(0,500\),u\?\.id\|\|null,String\(u\?\.username\|\|'\'\)\.slice\(0,80\),'pending'\)/],
 ["submission endpoint uses the shared IP rate limiter",/consumeAuthRateLimit\(env,"taxonomy-submit-ip",ip,5,3600\)/],
 ["rate limit is evaluated before reading and inserting submission data",/const limited=await consumeAuthRateLimit[\s\S]*?if\(limited\)return limited;[\s\S]*?const b=await body\(req\)/],
 ["public identity fields are not trusted",/u\?\.id\|\|null[\s\S]*?u\?\.username\|\|''/]
];
for(const [label,pattern] of checks){if(!pattern.test(handler))throw new Error("FAIL: "+label);}
if(/b\.creator_id|b\.creator_name/.test(handler))throw new Error("FAIL: request-body creator identity is still trusted");
if(!source.includes('if(p==="/api/taxonomy")return communityTaxonomy(req,env,u);'))throw new Error("FAIL: session is not passed to taxonomy handler");
console.log("PASS: taxonomy submitter attribution is session-derived and public submissions are IP-rate-limited.");
