import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
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
async function wrangler(args,input){
 const child=spawn(npx,["--yes","wrangler@4",...args],{cwd:root,detached:process.platform!=="win32",stdio:["pipe","pipe","pipe"],env:{...process.env,CI:"1",WRANGLER_SEND_METRICS:"false"}});
 let out="",err="",timedOut=false;
 child.stdout.on("data",x=>out+=x.toString());child.stderr.on("data",x=>err+=x.toString());child.stdin.end(input||"");
 const timer=setTimeout(()=>{timedOut=true;stop(child)},180000);
 let code,signal;
 try{[code,signal]=await new Promise((resolve,reject)=>{child.once("error",reject);child.once("close",(c,s)=>resolve([c,s]))})}finally{clearTimeout(timer)}
 if(timedOut||code!==0)throw new Error("Wrangler failed: "+args.join(" ")+"\n"+out+"\n"+err);
 return out;
}
async function freePort(){
 const s=createServer();await new Promise((resolve,reject)=>s.listen(0,"127.0.0.1",e=>e?reject(e):resolve()));
 const port=s.address().port;await new Promise(resolve=>s.close(resolve));return port;
}
async function request(base,pathName,method="GET"){
 const r=await fetch(base+pathName,{method,signal:AbortSignal.timeout(10000)});
 const raw=await r.text();let data;
 try{data=raw?JSON.parse(raw):null}catch{data=raw}
 return {status:r.status,data};
}
async function ready(base){
 let last;
 for(let i=0;i<100;i++){
  if(server.exitCode!==null)throw new Error("Local Worker exited.\n"+serverLogs);
  try{const r=await fetch(base+"/api/config",{signal:AbortSignal.timeout(1500)});if(r.status===200)return;last=new Error("HTTP "+r.status)}catch(e){last=e}
  await wait(300);
 }
 throw new Error("Local Worker did not become ready: "+String(last)+"\n"+serverLogs);
}
try{
 // Fresh local D1 only. No remote credentials or production database are used.
 await wrangler(["d1","migrations","apply","god-emperornovel-db","--local","--persist-to",persist],"y\n");
 const port=await freePort(),origin="http://127.0.0.1:"+port;
 server=spawn(npx,["--yes","wrangler@4","dev","--local","--ip","127.0.0.1","--port",String(port),"--persist-to",persist],{cwd:root,detached:process.platform!=="win32",stdio:["ignore","pipe","pipe"],env:{...process.env,CI:"1",WRANGLER_SEND_METRICS:"false"}});
 server.stdout.on("data",x=>serverLogs+=x.toString());server.stderr.on("data",x=>serverLogs+=x.toString());
 await ready(origin);
 const values=[
  ["Eligible Author","original","published",120,9],
  ["Draft Only Author","original","draft",500,10],
  ["Pending Rights Author","pending","published",700,10],
  ["Public Domain Author","public_domain","published",0,8],
  ["Licensed Author","licensed","published",20,7],
  ["Authorized Author","authorized","published",10,6],
  ["Wildcard%Author","original","published",1,5],
  ["Wildcard_Author","original","published",1,5],
  ["Wildcard\\Author","original","published",1,5]
 ];
 for(let i=0;i<103;i++)values.push(["DirectoryAuthor"+String(i).padStart(3,"0"),"original","published",i,i%10+1]);
 const quote=s=>"'"+String(s).replaceAll("'","''")+"'";
 const sql=values.map(([author,rights,status,views,rating])=>"INSERT INTO novels(title,author,rights_status,publication_status,views,rating) VALUES("+[quote("Fixture "+author),quote(author),quote(rights),quote(status),views===null?"NULL":String(views),String(rating)].join(",")+");").join("\n");
 await wrangler(["d1","execute","god-emperornovel-db","--local","--persist-to",persist,"--command",sql]);
 const wrongMethod=await request(origin,"/api/public-authors","POST");
 assert.equal(wrongMethod.status,405,"public author aggregate must reject non-GET methods");
 const all=await request(origin,"/api/public-authors");
 assert.equal(all.status,200);
 assert.ok(Array.isArray(all.data));
 assert.equal(all.data.length,100,"directory results must be capped at 100");
 for(const row of all.data){
  assert.deepEqual(Object.keys(row).sort(),["author","novel_count","rating","updated_at","views"].sort(),"response must expose only the documented aggregate projection");
  assert.equal(typeof row.author,"string");
  assert.ok(Number.isInteger(row.novel_count)&&row.novel_count>0);
  assert.ok(Number.isInteger(row.views)&&row.views>=0);
  assert.ok(row.rating===null||(Number.isInteger(row.rating)&&row.rating>=1&&row.rating<=10));
  assert.equal(typeof row.updated_at,"string");
 }
 const searchAuthor=async name=>{
  const result=await request(origin,"/api/public-authors?q="+encodeURIComponent(name));
  assert.equal(result.status,200);
  return result.data.find(x=>x.author===name)||null;
 };
 const eligible=await searchAuthor("Eligible Author");
 assert.deepEqual({novel_count:eligible?.novel_count,views:eligible?.views,rating:eligible?.rating},{novel_count:1,views:120,rating:9});
 for(const hidden of ["Draft Only Author","Pending Rights Author"])assert.equal(await searchAuthor(hidden),null,hidden+" must not appear");
 for(const visible of ["Public Domain Author","Licensed Author","Authorized Author"])assert.ok(await searchAuthor(visible),visible+" should be eligible");
 for(const [needle,expected] of [["%", "Wildcard%Author"],["_","Wildcard_Author"],["\\","Wildcard\\Author"]]){
  const result=await request(origin,"/api/public-authors?q="+encodeURIComponent(needle));
  assert.equal(result.status,200);
  assert.deepEqual(result.data.map(x=>x.author),[expected],"LIKE wildcard and escape characters must be searched literally");
 }
 const bounded=await request(origin,"/api/public-authors?q=DirectoryAuthor");
 assert.equal(bounded.status,200);
 assert.equal(bounded.data.length,50,"search results must be capped at 50");
 assert.ok(bounded.data.every(x=>x.author.startsWith("DirectoryAuthor")));
 const long=await request(origin,"/api/public-authors?q="+("x".repeat(200)));
 assert.equal(long.status,200,"overlong search input must be safely bounded rather than causing a query error");
 assert.deepEqual(long.data,[]);
 console.log("PASS: local D1 Worker public-author integration: GET-only method guard, exact aggregate projection, rights/publication filtering, null-safe aggregates, literal wildcard search and 50/100 result bounds.");
}catch(error){console.error(error);if(serverLogs)console.error(serverLogs);process.exitCode=1}
finally{
 if(server){stop(server);await Promise.race([once(server,"close"),wait(5000)])}
 fs.rmSync(persist,{recursive:true,force:true});
}
