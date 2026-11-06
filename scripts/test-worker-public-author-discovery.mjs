import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root=process.cwd();
const npx=process.platform==="win32"?"npx.cmd":"npx";
const persist=fs.mkdtempSync(path.join(os.tmpdir(),"imperial-public-authors-d1-"));
let server=null,serverLogs="";
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function stop(child){
 if(!child?.pid)return;
 if(process.platform!=="win32"){try{process.kill(-child.pid,"SIGTERM");return}catch{}}
 try{child.kill("SIGTERM")}catch{}
}
async function run(args,input){
 const child=spawn(npx,["--yes","wrangler@4",...args],{cwd:root,detached:process.platform!=="win32",stdio:["pipe","pipe","pipe"],env:{...process.env,CI:"1",WRANGLER_SEND_METRICS:"false"}});
 let out="",err="",timedOut=false;
 child.stdout.on("data",x=>out+=x.toString());child.stderr.on("data",x=>err+=x.toString());
 child.stdin.end(input||"");
 const timer=setTimeout(()=>{timedOut=true;stop(child)},180000);
 let code,signal;
 try{[code,signal]=await new Promise((resolve,reject)=>{child.once("error",reject);child.once("close",(c,s)=>resolve([c,s]))})}finally{clearTimeout(timer)}
 if(timedOut||code!==0)throw new Error("Wrangler failed: "+args.join(" ")+"\n"+out+"\n"+err);
 return out;
}
async function freePort(){
 const s=createServer();await new Promise((resolve,reject)=>s.listen(0,"127.0.0.1",e=>e?reject(e):resolve()));
 const p=s.address().port;await new Promise(resolve=>s.close(resolve));return p;
}
async function request(base,query="",method="GET"){
 const response=await fetch(base+"/api/public-authors"+query,{method,signal:AbortSignal.timeout(10000)});
 const raw=await response.text();let data;try{data=JSON.parse(raw)}catch{data=raw}
 return {status:response.status,data};
}
function sqlText(value){return "'"+String(value).replaceAll("'","''")+"'";}

try{
 // Isolated local D1 only. This test never uses a remote database or production credentials.
 await run(["d1","migrations","apply","god-emperornovel-db","--local","--persist-to",persist],"y\n");
 const port=await freePort(),base="http://127.0.0.1:"+port;
 server=spawn(npx,["--yes","wrangler@4","dev","--local","--ip","127.0.0.1","--port",String(port),"--persist-to",persist],{
  cwd:root,detached:process.platform!=="win32",stdio:["ignore","pipe","pipe"],env:{...process.env,CI:"1",WRANGLER_SEND_METRICS:"false"}
 });
 server.stdout.on("data",x=>serverLogs+=x.toString());server.stderr.on("data",x=>serverLogs+=x.toString());
 let ready=false,lastError="";
 for(let i=0;i<100;i++){
  if(server.exitCode!==null)throw new Error("Local Worker exited early:\n"+serverLogs);
  try{const r=await fetch(base+"/api/config",{signal:AbortSignal.timeout(1500)});if(r.status===200){ready=true;break}lastError="HTTP "+r.status}catch(e){lastError=String(e)}
  await wait(300);
 }
 assert.ok(ready,"Local Worker did not become ready: "+lastError+"\n"+serverLogs);

 const rows=[
  [990101,"Percent primary","Percent%Author","original","published",30,9],
  [990102,"Percent invalid rating","Percent%Author","licensed","published",0,0],
  [990103,"Underscore author","Under_scoreAuthor","authorized","published",12,8],
  [990104,"Backslash author","Back\\slashAuthor","public_domain","published",5,7],
  [990105,"Pending rights","RightsHiddenAuthor","pending","published",999,10],
  [990106,"Unpublished work","DraftHiddenAuthor","original","draft",999,10]
 ];
 for(let i=0;i<110;i++)rows.push([991000+i,"Bulk "+i,"BulkAuthor"+String(i).padStart(3,"0"),"original","published",i,8]);
 const values=rows.map(([id,title,author,rights,status,views,rating])=>"("+[
  id,sqlText(title),sqlText(author),sqlText(rights),sqlText(status),views,rating
 ].join(",")+")").join(",\n");
 const seed="INSERT INTO novels(id,title,author,rights_status,publication_status,views,rating) VALUES "+values+";";
 await run(["d1","execute","god-emperornovel-db","--local","--persist-to",persist,"--command",seed]);

 const all=await request(base);
 assert.equal(all.status,200,"anonymous directory GET should succeed");
 assert.ok(Array.isArray(all.data),"directory response must be an array");
 assert.ok(all.data.length<=100,"unfiltered directory must be capped at 100 authors");
 const percent=all.data.find(x=>x.author==="Percent%Author");
 assert.ok(percent,"rights-cleared published author should be listed");
 assert.equal(percent.novel_count,2);
 assert.equal(percent.views,30,"view aggregate must include zero-valued/missing-view works without becoming null");
 assert.equal(percent.rating,9,"invalid ratings outside 1..10 must not affect the whole-number average");
 assert.deepEqual(Object.keys(percent).sort(),["author","novel_count","rating","updated_at","views"].sort(),"public projection must contain only approved aggregate fields");
 for(const hidden of ["RightsHiddenAuthor","DraftHiddenAuthor"])assert.equal(all.data.some(x=>x.author===hidden),false,"ineligible author must be excluded: "+hidden);
 for(const row of all.data){
  assert.equal(typeof row.author,"string");
  assert.ok(Number.isInteger(row.novel_count)&&row.novel_count>0);
  assert.ok(Number.isInteger(row.views)&&row.views>=0);
  assert.ok(row.rating===null||(Number.isInteger(row.rating)&&row.rating>=1&&row.rating<=10));
  for(const privateField of ["id","owner_user_id","email","account_id","rights_notes","rights_evidence"])assert.equal(Object.hasOwn(row,privateField),false,"private field leaked: "+privateField);
 }
 const literalPercent=await request(base,"?q="+encodeURIComponent("%"));
 assert.deepEqual(literalPercent.data.map(x=>x.author),["Percent%Author"],"percent must be treated literally, not as a LIKE wildcard");
 const literalUnderscore=await request(base,"?q="+encodeURIComponent("_"));
 assert.deepEqual(literalUnderscore.data.map(x=>x.author),["Under_scoreAuthor"],"underscore must be treated literally, not as a LIKE wildcard");
 const literalSlash=await request(base,"?q="+encodeURIComponent("\\"));
 assert.deepEqual(literalSlash.data.map(x=>x.author),["Back\\slashAuthor"],"backslash must be escaped literally");
 const bounded=await request(base,"?q=BulkAuthor");
 assert.ok(bounded.data.length<=50,"search results must be capped at 50 authors");
 const tooLong=await request(base,"?q="+encodeURIComponent("x".repeat(500)));
 assert.ok(tooLong.data.length<=50,"long search input must remain bounded");
 const nonGet=await request(base,"","POST");
 assert.equal(nonGet.status,405,"non-GET requests must be rejected");
 console.log("PASS: public author Worker/D1 integration, rights filtering, aggregate projection, literal wildcard search, bounds and method guard.");
}catch(error){
 console.error(error);
 if(serverLogs)console.error(serverLogs);
 process.exitCode=1;
}finally{
 stop(server);
 try{fs.rmSync(persist,{recursive:true,force:true})}catch{}
}
