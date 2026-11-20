import fs from "node:fs";
const source=fs.readFileSync("src/index.js","utf8");
const start=source.indexOf("async function communityTaxonomy(req,env,u){");
const end=source.indexOf("\nasync function adminTaxonomy",start);
if(start<0||end<0)throw new Error("Community taxonomy handler was not found");
const handler=source.slice(start,end);
const checks=[
 ["submitter identity comes from the authenticated session", "u?.id||null,String(u?.username||'').slice(0,80)"],
 ["submission endpoint uses the shared IP rate limiter", 'consumeAuthRateLimit(env,"taxonomy-submit-ip",ip,5,3600)'],
 ["rate limit is evaluated before request body parsing", 'if(limited)return limited;'],
 ["session is passed from API dispatch", 'if(p==="/api/taxonomy")return communityTaxonomy(req,env,u);']
];
for(const [label,needle] of checks){
 const haystack=label==="session is passed from API dispatch"?source:handler;
 if(!haystack.includes(needle))throw new Error("FAIL: "+label);
}
if(/b\.creator_id|b\.creator_name/.test(handler))throw new Error("FAIL: request-body creator identity is still trusted");
if(handler.indexOf('consumeAuthRateLimit(env,"taxonomy-submit-ip",ip,5,3600)')>handler.indexOf("const b=await body(req)"))throw new Error("FAIL: rate limit occurs after body parsing");
console.log("PASS: taxonomy submitter attribution is session-derived and public submissions are IP-rate-limited.");
