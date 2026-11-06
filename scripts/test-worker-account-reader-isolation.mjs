import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root=process.cwd();
const npx=process.platform==="win32"?"npx.cmd":"npx";
const persist=fs.mkdtempSync(path.join(os.tmpdir(),"imperial-account-reader-d1-"));
let server=null;
let serverLogs="";
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function stopProcessGroup(child){
  if(!child||!child.pid)return;
  if(process.platform!=="win32"){
    try{process.kill(-child.pid,"SIGTERM");return}catch{}
  }
  try{child.kill("SIGTERM")}catch{}
}
async function wrangler(args,input){
  const child=spawn(npx,["--yes","wrangler@4",...args],{
    cwd:root,detached:process.platform!=="win32",stdio:["pipe","pipe","pipe"],
    env:{...process.env,CI:"1",WRANGLER_SEND_METRICS:"false"}
  });
  let stdout="",stderr="",timedOut=false;
  child.stdout.on("data",chunk=>{stdout+=chunk.toString()});
  child.stderr.on("data",chunk=>{stderr+=chunk.toString()});
  child.stdin.end(input||"");
  const timer=setTimeout(()=>{timedOut=true;stopProcessGroup(child)},180000);
  let code,signal;
  try{[code,signal]=await new Promise((resolve,reject)=>{child.once("error",reject);child.once("close",(exitCode,exitSignal)=>resolve([exitCode,exitSignal]))})}
  finally{clearTimeout(timer)}
  if(timedOut)throw new Error("Wrangler command timed out: "+args.join(" ")+"\n"+stdout+"\n"+stderr);
  if(code!==0)throw new Error("Wrangler command failed ("+code+"/"+signal+"): "+args.join(" ")+"\n"+stdout+"\n"+stderr);
  return stdout;
}
async function freePort(){
  const probe=createServer();
  await new Promise((resolve,reject)=>probe.listen(0,"127.0.0.1",error=>error?reject(error):resolve()));
  const port=probe.address().port;
  await new Promise(resolve=>probe.close(resolve));
  return port;
}
async function waitForWorker(base){
  let lastError=null;
  for(let attempt=0;attempt<100;attempt++){
    if(server.exitCode!==null)throw new Error("Wrangler dev exited before becoming ready.\n"+serverLogs);
    try{
      const response=await fetch(base+"/api/config",{signal:AbortSignal.timeout(1500)});
      if(response.status===200)return;
      lastError=new Error("Worker readiness returned HTTP "+response.status);
    }catch(error){lastError=error}
    await wait(300);
  }
  throw new Error("Local Worker did not become ready: "+String(lastError)+"\n"+serverLogs);
}
async function request(base,pathname,{method="GET",body,cookie,origin}={}){
  const headers={};
  if(body!==undefined)headers["content-type"]="application/json";
  if(cookie)headers.cookie=cookie;
  if(origin)headers.origin=origin;
  const response=await fetch(base+pathname,{
    method,headers,
    body:body===undefined?undefined:JSON.stringify(body),
    signal:AbortSignal.timeout(10000)
  });
  const raw=await response.text();
  let data={};
  try{data=raw?JSON.parse(raw):{}}catch{data={raw}}
  return {status:response.status,data,headers:response.headers};
}
async function createAccount(base,origin,username,email){
  const password="local-integration-password-2026";
  const registration=await request(base,"/api/auth/register",{method:"POST",origin,body:{username,email,password}});
  assert.equal(registration.status,200,"account registration should succeed: "+JSON.stringify(registration.data));
  const login=await request(base,"/api/auth/login",{method:"POST",origin,body:{email,password}});
  assert.equal(login.status,200,"account login should succeed: "+JSON.stringify(login.data));
  const setCookie=login.headers.get("set-cookie")||"";
  const cookie=setCookie.split(";")[0];
  assert.match(cookie,/^session=/,"login must issue a session cookie");
  assert.ok(Number(login.data.user?.id)>0,"login must return the account id");
  return {cookie,user:login.data.user,username};
}

try{
  // Every run gets a fresh local D1 directory. No remote database or credentials are used.
  await wrangler(["d1","migrations","apply","god-emperornovel-db","--local","--persist-to",persist],"y\n");
  const port=await freePort();
  const origin="http://127.0.0.1:"+port;
  server=spawn(npx,["--yes","wrangler@4","dev","--local","--ip","127.0.0.1","--port",String(port),"--persist-to",persist],{
    cwd:root,detached:process.platform!=="win32",stdio:["ignore","pipe","pipe"],
    env:{...process.env,CI:"1",WRANGLER_SEND_METRICS:"false"}
  });
  server.stdout.on("data",chunk=>{serverLogs+=chunk.toString()});
  server.stderr.on("data",chunk=>{serverLogs+=chunk.toString()});
  await waitForWorker(origin);

  const studioAnonymousRoutes=[
    ["GET","/api/author/analytics"],["GET","/api/author/feedback"],["GET","/api/author/goals"],
    ["PUT","/api/author/goals"],["GET","/api/author/notes"],["POST","/api/author/notes"],
    ["PATCH","/api/author/notes/1"],["DELETE","/api/author/notes/1"],["GET","/api/author/readiness"],
    ["GET","/api/author/planning"],["GET","/api/author/schedules"],["GET","/api/author/chapters/1/revisions"],
    ["POST","/api/author/chapters/1/schedule"]
  ];
  for(const [method,route] of studioAnonymousRoutes){
    const response=await request(origin,route,{method,origin,body:method==="GET"?undefined:{cancel:true}});
    assert.equal(response.status,401,"anonymous access must be denied for "+method+" "+route);
  }

  const suffix=Date.now().toString(36).slice(-6);
  const accountA=await createAccount(origin,origin,"ReaderA"+suffix,"reader-a-"+suffix+"@example.test");
  const accountB=await createAccount(origin,origin,"ReaderB"+suffix,"reader-b-"+suffix+"@example.test");

  // Authentication is mandatory for every private account and reader endpoint.
  assert.equal((await request(origin,"/api/profile")).status,401,"anonymous profile reads must be denied");
  assert.equal((await request(origin,"/api/account/preferences")).status,401,"anonymous preference reads must be denied");
  assert.equal((await request(origin,"/api/reading-position?novel_id=990001")).status,401,"anonymous reader-progress reads must be denied");

  const profileA={display_name:"Reader Alpha",bio:"Alpha private biography",avatar_url:"/uploads/alpha.webp",website_url:"https://alpha.example.test",location:"Islamabad",profile_visibility:"private",show_reading_stats:false};
  const profileB={display_name:"Reader Beta",bio:"Beta biography",avatar_url:"",website_url:"",location:"Lahore",profile_visibility:"private",show_reading_stats:false};
  let result=await request(origin,"/api/profile",{method:"PUT",cookie:accountA.cookie,origin,body:profileA});
  assert.equal(result.status,200,"account A profile update should succeed");
  result=await request(origin,"/api/profile",{method:"PUT",cookie:accountB.cookie,origin,body:profileB});
  assert.equal(result.status,200,"account B profile update should succeed");

  const aProfile=await request(origin,"/api/profile",{cookie:accountA.cookie});
  const bProfile=await request(origin,"/api/profile",{cookie:accountB.cookie});
  assert.equal(aProfile.status,200);
  assert.equal(bProfile.status,200);
  assert.equal(aProfile.data.user.display_name,"Reader Alpha");
  assert.equal(bProfile.data.user.display_name,"Reader Beta");
  assert.notEqual(bProfile.data.user.bio,profileA.bio,"account B must never receive account A profile data");

  result=await request(origin,"/api/profile",{method:"PUT",cookie:accountA.cookie,origin,body:{owner_user_id:accountB.user.id}});
  assert.equal(result.status,400,"profile allowlist must reject owner selection");
  result=await request(origin,"/api/profile",{method:"PUT",cookie:accountA.cookie,origin:"https://attacker.example",body:profileA});
  assert.equal(result.status,403,"profile mutation must reject cross-origin requests");

  const privateProjection=await request(origin,"/api/public-profile/"+accountA.username);
  assert.equal(privateProjection.status,404,"private profile must not be publicly discoverable");

  const prefsA={site_theme:"imperial",reader_theme:"sepia",font_size:21,line_height:2,text_width:680,reduced_motion:true,high_contrast:false,compact_cards:true};
  const invalidPrefs=await request(origin,"/api/account/preferences",{method:"PUT",cookie:accountA.cookie,origin,body:{...prefsA,site_theme:"gold",owner_user_id:accountB.user.id}});
  assert.equal(invalidPrefs.status,400,"invalid themes and owner injection must be rejected");
  const crossOriginPrefs=await request(origin,"/api/account/preferences",{method:"PUT",cookie:accountA.cookie,origin:"https://attacker.example",body:prefsA});
  assert.equal(crossOriginPrefs.status,403,"preference writes must reject cross-origin requests");
  result=await request(origin,"/api/account/preferences",{method:"PUT",cookie:accountA.cookie,origin,body:prefsA});
  assert.equal(result.status,200,"account A preference update should succeed");
  const prefsBDefault=await request(origin,"/api/account/preferences",{cookie:accountB.cookie});
  assert.equal(prefsBDefault.status,200);
  assert.equal(prefsBDefault.data.preferences.site_theme,"light","account B must not inherit account A preferences");
  const prefsB={site_theme:"cosmic",reader_theme:"midnight",font_size:19,line_height:1.85,text_width:600,reduced_motion:false,high_contrast:true,compact_cards:false};
  result=await request(origin,"/api/account/preferences",{method:"PUT",cookie:accountB.cookie,origin,body:prefsB});
  assert.equal(result.status,200);
  const prefsAAfterBWrite=await request(origin,"/api/account/preferences",{cookie:accountA.cookie});
  assert.equal(prefsAAfterBWrite.data.preferences.site_theme,"imperial","account B preference writes must not overwrite account A");
  const prefsBAfterWrite=await request(origin,"/api/account/preferences",{cookie:accountB.cookie});
  assert.equal(prefsBAfterWrite.data.preferences.site_theme,"cosmic");

  const sql=[
    "UPDATE users SET role='author' WHERE id IN ("+Number(accountA.user.id)+","+Number(accountB.user.id)+")",
    "INSERT OR REPLACE INTO novels(id,title,author,rights_status,publication_status,owner_user_id) VALUES(990001,'Isolation Test Novel','Reader Alpha','original','published',"+Number(accountA.user.id)+")",
    "INSERT OR REPLACE INTO chapters(id,novel_id,chapter_number,title,content,is_locked,ticket_cost,publication_status) VALUES(990001,990001,1,'Chapter One','Local D1 integration fixture',0,0,'published')",
    "INSERT OR REPLACE INTO novels(id,title,author,rights_status,publication_status,owner_user_id) VALUES(990002,'Restricted Test Novel','Reader Alpha','pending','published',"+Number(accountA.user.id)+")",
    "INSERT OR REPLACE INTO chapters(id,novel_id,chapter_number,title,content,is_locked,ticket_cost,publication_status) VALUES(990002,990002,1,'Restricted Chapter','Local D1 integration fixture',0,0,'published')"
  ].join(";\n")+";";
  await wrangler(["d1","execute","god-emperornovel-db","--local","--persist-to",persist,"--command",sql]);

  // Public author discovery is exercised through the actual local Worker and isolated D1.
  const authorFixtures=[
    "INSERT INTO novels(id,title,author,rights_status,publication_status,owner_user_id,views,rating) VALUES(990003,'Wildcard Percent One','Wildcard % Author','original','published',NULL,4,8.4)",
    "INSERT INTO novels(id,title,author,rights_status,publication_status,owner_user_id,views,rating) VALUES(990004,'Wildcard Percent Two','Wildcard % Author','licensed','published',NULL,0,9)",
    "INSERT INTO novels(id,title,author,rights_status,publication_status,owner_user_id,views,rating) VALUES(990005,'Wildcard Underscore','Wildcard _ Author','original','published',NULL,7,11)",
    "INSERT INTO novels(id,title,author,rights_status,publication_status,owner_user_id,views,rating) VALUES(990006,'Wildcard Backslash','Wildcard \\ Author','original','published',NULL,0,0)",
    "INSERT INTO novels(id,title,author,rights_status,publication_status,owner_user_id,views,rating) VALUES(990007,'Excluded Draft','Excluded Draft Author','original','draft',NULL,500,10)",
    "INSERT INTO novels(id,title,author,rights_status,publication_status,owner_user_id,views,rating) VALUES(990008,'Excluded Rights','Excluded Rights Author','pending','published',NULL,500,10)"
  ];
  for(let i=0;i<105;i++){
    const id=991000+i;
    authorFixtures.push("INSERT INTO novels(id,title,author,rights_status,publication_status,owner_user_id,views,rating) VALUES("+id+",'Bounded Author "+i+"','Bounded Author "+i+"','original','published',NULL,0,8)");
  }
  await wrangler(["d1","execute","god-emperornovel-db","--local","--persist-to",persist,"--command",authorFixtures.join(";\n")+";"]);

  const publicAuthors=await request(origin,"/api/public-authors");
  assert.equal(publicAuthors.status,200,"anonymous author directory reads must succeed");
  assert.ok(Array.isArray(publicAuthors.data),"public author endpoint must return an array");
  assert.ok(publicAuthors.data.length<=100,"unfiltered author rows must be capped at 100");
  for(const row of publicAuthors.data){
    assert.deepEqual(Object.keys(row).sort(),["author","novel_count","rating","updated_at","views"],"public author projection must contain only approved aggregate fields");
    for(const field of ["id","user_id","email","password_hash","owner_user_id","rights_evidence"])assert.equal(Object.hasOwn(row,field),false,"public author projection must not expose "+field);
  }
  const percentSearch=await request(origin,"/api/public-authors?q="+encodeURIComponent("%"));
  assert.equal(percentSearch.status,200);
  assert.equal(percentSearch.data.length,1,"percent must be treated literally, not as a SQL wildcard");
  assert.equal(percentSearch.data[0].author,"Wildcard % Author");
  assert.equal(percentSearch.data[0].novel_count,2);
  assert.equal(percentSearch.data[0].views,4);
  assert.equal(percentSearch.data[0].rating,9,"ratings must aggregate only values within the 1–10 range");
  const underscoreSearch=await request(origin,"/api/public-authors?q="+encodeURIComponent("_"));
  assert.equal(underscoreSearch.data.length,1,"underscore must be treated literally, not as a SQL wildcard");
  assert.equal(underscoreSearch.data[0].author,"Wildcard _ Author");
  assert.equal(underscoreSearch.data[0].rating,null,"out-of-range ratings must not become public averages");
  const backslashSearch=await request(origin,"/api/public-authors?q="+encodeURIComponent("\\"));
  assert.equal(backslashSearch.data.length,1,"backslash must be treated literally in LIKE search");
  assert.equal(backslashSearch.data[0].author,"Wildcard \\ Author");
  const excludedDraft=await request(origin,"/api/public-authors?q="+encodeURIComponent("Excluded Draft"));
  assert.equal(excludedDraft.data.length,0,"unpublished novels must not contribute authors");
  const excludedRights=await request(origin,"/api/public-authors?q="+encodeURIComponent("Excluded Rights"));
  assert.equal(excludedRights.data.length,0,"rights-ineligible novels must not contribute authors");
  const methodGuard=await request(origin,"/api/public-authors",{method:"POST",origin,body:{}});
  assert.equal(methodGuard.status,405,"public author discovery must be GET-only");

  const emptyA=await request(origin,"/api/reading-position?novel_id=990001",{cookie:accountA.cookie});
  const emptyB=await request(origin,"/api/reading-position?novel_id=990001",{cookie:accountB.cookie});
  assert.equal(emptyA.status,200);
  assert.equal(emptyB.status,200);
  assert.equal(emptyA.data.position,null);
  assert.equal(emptyB.data.position,null);

  const saveA=await request(origin,"/api/reading-position",{method:"POST",cookie:accountA.cookie,origin,body:{novel_id:990001,chapter_number:1,percent:73,expected_revision:0}});
  assert.equal(saveA.status,200,"account A first progress write should succeed: "+JSON.stringify(saveA.data));
  assert.equal(saveA.data.position.revision,1);
  const bCannotReadA=await request(origin,"/api/reading-position?novel_id=990001",{cookie:accountB.cookie});
  assert.equal(bCannotReadA.data.position,null,"account B must not read account A progress");
  const saveB=await request(origin,"/api/reading-position",{method:"POST",cookie:accountB.cookie,origin,body:{novel_id:990001,chapter_number:1,percent:18,expected_revision:0}});
  assert.equal(saveB.status,200,"account B must have an independent progress row");
  const aAfterB=await request(origin,"/api/reading-position?novel_id=990001",{cookie:accountA.cookie});
  const bAfterB=await request(origin,"/api/reading-position?novel_id=990001",{cookie:accountB.cookie});
  assert.equal(aAfterB.data.position.percent,73,"account B progress must not overwrite account A");
  assert.equal(bAfterB.data.position.percent,18);
  const stale=await request(origin,"/api/reading-position",{method:"POST",cookie:accountA.cookie,origin,body:{novel_id:990001,chapter_number:1,percent:90,expected_revision:0}});
  assert.equal(stale.status,409,"stale progress revision must conflict");
  const crossOrigin=await request(origin,"/api/reading-position",{method:"POST",cookie:accountA.cookie,origin:"https://attacker.example",body:{novel_id:990001,chapter_number:1,percent:90,expected_revision:1}});
  assert.equal(crossOrigin.status,403,"reading progress writes must reject cross-origin requests");
  const restricted=await request(origin,"/api/reading-position",{method:"POST",cookie:accountA.cookie,origin,body:{novel_id:990002,chapter_number:1,percent:20,expected_revision:0}});
  assert.equal(restricted.status,404,"rights-ineligible novels must reject reading progress");

  const publicProfileBody={...profileA,profile_visibility:"public",show_reading_stats:false};
  result=await request(origin,"/api/profile",{method:"PUT",cookie:accountA.cookie,origin,body:publicProfileBody});
  assert.equal(result.status,200);
  const publicProfile=await request(origin,"/api/public-profile/"+accountA.username);
  assert.equal(publicProfile.status,200);
  assert.equal(publicProfile.data.profile.display_name,"Reader Alpha");
  assert.equal(publicProfile.data.stats,null,"reading statistics remain hidden without opt-in");
  for(const field of ["email","tickets","password_hash","id"])assert.equal(Object.hasOwn(publicProfile.data.profile,field),false,"public profile must not expose "+field);
  const publicWithStats={...publicProfileBody,show_reading_stats:true};
  result=await request(origin,"/api/profile",{method:"PUT",cookie:accountA.cookie,origin,body:publicWithStats});
  assert.equal(result.status,200);
  const optedIn=await request(origin,"/api/public-profile/"+accountA.username);
  assert.equal(optedIn.status,200);
  assert.equal(optedIn.data.stats.published_novels,1,"opt-in stats must use only published rights-eligible creator works");

  // Author Studio ownership and publication-state integration against the same local Worker.
  const authorNovel=await request(origin,"/api/author/novels",{method:"POST",cookie:accountA.cookie,origin,body:{title:"Author Studio Rights Test",author:accountA.username,kind:"original",rights_status:"original",description:"A local integration test work."}});
  assert.equal(authorNovel.status,201,"author should be able to create a private draft");
  const authorNovelId=authorNovel.data.id;
  const accountBNovels=await request(origin,"/api/author/novels",{cookie:accountB.cookie});
  assert.equal(accountBNovels.status,200);
  assert.equal(accountBNovels.data.some(n=>n.id===authorNovelId),false,"another author must not see the owner's private draft");
  const foreignNovelEdit=await request(origin,"/api/author/novels/"+authorNovelId,{method:"PATCH",cookie:accountB.cookie,origin,body:{title:"Stolen draft"}});
  assert.equal(foreignNovelEdit.status,403,"another author must not edit the owner's novel");

  const authorChapter=await request(origin,"/api/author/chapters",{method:"POST",cookie:accountA.cookie,origin,body:{novel_id:authorNovelId,chapter_number:1,title:"Draft chapter",content:"Original chapter text for local integration."}});
  assert.equal(authorChapter.status,201,"author should be able to create a chapter draft");
  const authorChapterId=authorChapter.data.id;
  const foreignChapterEdit=await request(origin,"/api/author/chapters/"+authorChapterId,{method:"PATCH",cookie:accountB.cookie,origin,body:{title:"Stolen chapter"}});
  assert.equal(foreignChapterEdit.status,403,"another author must not edit the owner's chapter");
  const draftParentPublish=await request(origin,"/api/author/chapters/"+authorChapterId+"/publish",{method:"POST",cookie:accountA.cookie,origin,body:{publication_status:"published"}});
  assert.equal(draftParentPublish.status,403,"a chapter must not publish while its parent novel is still a draft");

  const rightsMissing="UPDATE novels SET publication_status='published',rights_status='licensed',rights_evidence='' WHERE id="+Number(authorNovelId);
  await wrangler(["d1","execute","god-emperornovel-db","--local","--persist-to",persist,"--command",rightsMissing]);
  const missingEvidencePublish=await request(origin,"/api/author/chapters/"+authorChapterId+"/publish",{method:"POST",cookie:accountA.cookie,origin,body:{publication_status:"published"}});
  assert.equal(missingEvidencePublish.status,403,"licensed parent work must have rights evidence before chapter publication");
  const rightsEvidence="UPDATE novels SET rights_evidence='Local test license reference' WHERE id="+Number(authorNovelId);
  await wrangler(["d1","execute","god-emperornovel-db","--local","--persist-to",persist,"--command",rightsEvidence]);
  const eligiblePublish=await request(origin,"/api/author/chapters/"+authorChapterId+"/publish",{method:"POST",cookie:accountA.cookie,origin,body:{publication_status:"published"}});
  assert.equal(eligiblePublish.status,200,"valid parent status and rights evidence should allow chapter publication");

  // Creator Studio and Publishing Studio are tested through the real local Worker and fresh D1.
  const authorNovelB=await request(origin,"/api/author/novels",{method:"POST",cookie:accountB.cookie,origin,body:{title:"Account B Studio Novel",author:accountB.username,kind:"original",rights_status:"original",description:"Account B private work."}});
  assert.equal(authorNovelB.status,201,"account B should create its own author work");
  const authorNovelBId=authorNovelB.data.id;
  const authorChapterB=await request(origin,"/api/author/chapters",{method:"POST",cookie:accountB.cookie,origin,body:{novel_id:authorNovelBId,chapter_number:1,title:"B Draft Chapter",content:"Account B chapter content."}});
  assert.equal(authorChapterB.status,201);
  const authorChapterBId=authorChapterB.data.id;
  const authorChapterA2=await request(origin,"/api/author/chapters",{method:"POST",cookie:accountA.cookie,origin,body:{novel_id:authorNovelId,chapter_number:2,title:"A Scheduled Draft",content:"Account A scheduled chapter."}});
  assert.equal(authorChapterA2.status,201);
  const authorChapterA2Id=authorChapterA2.data.id;
  await wrangler(["d1","execute","god-emperornovel-db","--local","--persist-to",persist,"--command",[
    "UPDATE novels SET publication_status='published' WHERE id="+Number(authorNovelBId),
    "INSERT OR REPLACE INTO ratings(user_id,novel_id,rating) VALUES("+Number(accountB.user.id)+","+Number(authorNovelId)+",8)",
    "INSERT OR REPLACE INTO ratings(user_id,novel_id,rating) VALUES("+Number(accountA.user.id)+","+Number(authorNovelBId)+",9)",
    "INSERT INTO comments(user_id,novel_id,body,status) VALUES("+Number(accountB.user.id)+","+Number(authorNovelId)+",'A story feedback comment','visible')",
    "INSERT INTO comments(user_id,novel_id,body,status) VALUES("+Number(accountA.user.id)+","+Number(authorNovelBId)+",'B story feedback comment','visible')"
  ].join(";")+";"]);

  const goalA=await request(origin,"/api/author/goals",{method:"PUT",cookie:accountA.cookie,origin,body:{novel_id:authorNovelId,target_chapters:8,target_words:24000,target_date:"2027-01-31"}});
  assert.equal(goalA.status,200,"account A should save a story goal");
  const goalB=await request(origin,"/api/author/goals",{method:"PUT",cookie:accountB.cookie,origin,body:{novel_id:authorNovelBId,target_chapters:4,target_words:12000,target_date:"2027-02-28"}});
  assert.equal(goalB.status,200,"account B should save an independent story goal");
  const invalidGoalDate=await request(origin,"/api/author/goals",{method:"PUT",cookie:accountA.cookie,origin,body:{novel_id:authorNovelId,target_chapters:1,target_words:1,target_date:"2026-99-99"}});
  assert.equal(invalidGoalDate.status,400,"invalid calendar dates must return validation errors");
  const goalsA=await request(origin,"/api/author/goals",{cookie:accountA.cookie});
  const goalsB=await request(origin,"/api/author/goals",{cookie:accountB.cookie});
  assert.ok(goalsA.data.some(g=>g.novel_id===authorNovelId),"account A should see its own goal");
  assert.equal(goalsA.data.some(g=>g.novel_id===authorNovelBId),false,"account A must not see account B goals");
  assert.ok(goalsB.data.some(g=>g.novel_id===authorNovelBId),"account B should see its own goal");
  assert.equal(goalsB.data.some(g=>g.novel_id===authorNovelId),false,"account B must not see account A goals");
  const foreignGoal=await request(origin,"/api/author/goals",{method:"PUT",cookie:accountB.cookie,origin,body:{novel_id:authorNovelId,target_chapters:99,target_words:9999}});
  assert.equal(foreignGoal.status,404,"another author cannot create or overwrite a goal on a foreign novel");

  const noteA=await request(origin,"/api/author/notes",{method:"POST",cookie:accountA.cookie,origin,body:{novel_id:authorNovelId,chapter_id:authorChapterId,note:"Account A private editorial note."}});
  assert.equal(noteA.status,201,"account A should create a private note");
  const noteAId=noteA.data.id;
  const noteB=await request(origin,"/api/author/notes",{method:"POST",cookie:accountB.cookie,origin,body:{novel_id:authorNovelBId,chapter_id:authorChapterBId,note:"Account B private note."}});
  assert.equal(noteB.status,201,"account B should create a private note");
  const foreignNoteCreate=await request(origin,"/api/author/notes",{method:"POST",cookie:accountB.cookie,origin,body:{novel_id:authorNovelId,chapter_id:authorChapterId,note:"Attempted foreign note."}});
  assert.equal(foreignNoteCreate.status,404,"another author cannot attach a private note to a foreign novel");
  const notesA=await request(origin,"/api/author/notes?novel_id="+authorNovelId,{cookie:accountA.cookie});
  const notesB=await request(origin,"/api/author/notes?novel_id="+authorNovelId,{cookie:accountB.cookie});
  assert.ok(notesA.data.some(n=>n.id===noteAId),"account A should read its own private note");
  assert.equal(notesB.data.length,0,"account B must not read account A private notes");
  const foreignNotePatch=await request(origin,"/api/author/notes/"+noteAId,{method:"PATCH",cookie:accountB.cookie,origin,body:{note:"Stolen note"}});
  assert.equal(foreignNotePatch.status,404,"another author cannot edit a private note");
  const foreignNoteDelete=await request(origin,"/api/author/notes/"+noteAId,{method:"DELETE",cookie:accountB.cookie,origin});
  assert.equal(foreignNoteDelete.status,404,"another author cannot delete a private note");
  const notePatch=await request(origin,"/api/author/notes/"+noteAId,{method:"PATCH",cookie:accountA.cookie,origin,body:{note:"Updated private editorial note."}});
  assert.equal(notePatch.status,200,"the note owner can update its note");
  const noteDelete=await request(origin,"/api/author/notes/"+noteAId,{method:"DELETE",cookie:accountA.cookie,origin});
  assert.equal(noteDelete.status,200,"the note owner can delete its note");

  const analyticsFixtures=[];
  for(let i=0;i<105;i++){
    const id=993000+i;
    analyticsFixtures.push("INSERT INTO novels(id,title,author,rights_status,publication_status,owner_user_id,views,rating,updated_at) VALUES("+id+",'Analytics Fixture "+i+"','Reader Alpha','original','draft',"+Number(accountA.user.id)+",0,0,'2000-01-01')");
  }
  await wrangler(["d1","execute","god-emperornovel-db","--local","--persist-to",persist,"--command",analyticsFixtures.join(";")+";"]);

  const analyticsA=await request(origin,"/api/author/analytics",{cookie:accountA.cookie});
  const analyticsB=await request(origin,"/api/author/analytics",{cookie:accountB.cookie});
  assert.equal(analyticsA.status,200);
  assert.equal(analyticsB.status,200);
  assert.ok(analyticsA.data.novels.some(n=>n.id===authorNovelId),"account A analytics should include its own novel");
  assert.equal(analyticsA.data.novels.some(n=>n.id===authorNovelBId),false,"account A analytics must exclude account B novels");
  assert.ok(analyticsB.data.novels.some(n=>n.id===authorNovelBId),"account B analytics should include its own novel");
  assert.equal(analyticsB.data.novels.some(n=>n.id===authorNovelId),false,"account B analytics must exclude account A novels");
  assert.ok(analyticsA.data.totals.novels>=1&&analyticsB.data.totals.novels>=1,"lifetime totals must be calculated for each authenticated owner");
  assert.equal(analyticsA.data.novels.length,100,"analytics display list should remain bounded to 100 novels");
  assert.ok(analyticsA.data.totals.novels>analyticsA.data.novels.length,"lifetime analytics totals must include owned novels beyond the top-100 display list");
  const feedbackA=await request(origin,"/api/author/feedback",{cookie:accountA.cookie});
  const feedbackB=await request(origin,"/api/author/feedback",{cookie:accountB.cookie});
  assert.ok(feedbackA.data.items.some(item=>item.body==="A story feedback comment"),"account A should see feedback on its own story");
  assert.ok(feedbackA.data.items.some(item=>item.kind==="rating"&&item.novel_id===authorNovelId),"account A should see ratings for its own story");
  assert.equal(feedbackA.data.items.some(item=>item.body==="B story feedback comment"),false,"account A must not see feedback on account B stories");
  assert.ok(feedbackB.data.items.some(item=>item.body==="B story feedback comment"),"account B should see feedback on its own story");
  assert.ok(feedbackB.data.items.some(item=>item.kind==="rating"&&item.novel_id===authorNovelBId),"account B should see ratings for its own story");
  assert.equal(feedbackB.data.items.some(item=>item.body==="A story feedback comment"),false,"account B must not see feedback on account A stories");

  const readinessA=await request(origin,"/api/author/readiness",{cookie:accountA.cookie});
  const readinessB=await request(origin,"/api/author/readiness",{cookie:accountB.cookie});
  assert.ok(readinessA.data.items.some(item=>item.novel_id===authorNovelId));
  assert.equal(readinessA.data.items.some(item=>item.novel_id===authorNovelBId),false,"readiness must be owner-scoped");
  assert.ok(readinessB.data.items.some(item=>item.novel_id===authorNovelBId));
  assert.equal(readinessB.data.items.some(item=>item.novel_id===authorNovelId),false,"readiness must not expose another creator");
  const planningA=await request(origin,"/api/author/planning",{cookie:accountA.cookie});
  const planningB=await request(origin,"/api/author/planning",{cookie:accountB.cookie});
  assert.ok(planningA.data.some(item=>item.chapter_id===authorChapterA2Id),"account A planning should include its unscheduled draft");
  assert.equal(planningA.data.some(item=>item.novel_id===authorNovelBId),false,"planning must exclude account B stories");
  assert.ok(planningB.data.some(item=>item.chapter_id===authorChapterBId),"account B planning should include its own draft");
  assert.equal(planningB.data.some(item=>item.novel_id===authorNovelId),false,"planning must not expose account A stories");

  const revisionUpdate=await request(origin,"/api/author/chapters/"+authorChapterId,{method:"PATCH",cookie:accountA.cookie,origin,body:{title:"Draft chapter revised",content:"Updated chapter text for revision history."}});
  assert.equal(revisionUpdate.status,200,"the chapter owner should be able to create a revision");
  const revisionsA=await request(origin,"/api/author/chapters/"+authorChapterId+"/revisions",{cookie:accountA.cookie});
  assert.equal(revisionsA.status,200);
  assert.ok(revisionsA.data.length>=1,"the chapter owner should see revision history");
  const foreignRevisions=await request(origin,"/api/author/chapters/"+authorChapterId+"/revisions",{cookie:accountB.cookie});
  assert.equal(foreignRevisions.status,403,"another author cannot read private chapter revisions");

  const publishAt=new Date(Date.now()+10*60*1000).toISOString();
  const foreignSchedule=await request(origin,"/api/author/chapters/"+authorChapterA2Id+"/schedule",{method:"POST",cookie:accountB.cookie,origin,body:{publish_at:publishAt}});
  assert.equal(foreignSchedule.status,403,"another author cannot schedule a foreign chapter");
  const scheduleA=await request(origin,"/api/author/chapters/"+authorChapterA2Id+"/schedule",{method:"POST",cookie:accountA.cookie,origin,body:{publish_at:publishAt}});
  assert.equal(scheduleA.status,200,"the chapter owner should schedule an eligible draft");
  const schedulesA=await request(origin,"/api/author/schedules",{cookie:accountA.cookie});
  const schedulesB=await request(origin,"/api/author/schedules",{cookie:accountB.cookie});
  assert.ok(schedulesA.data.some(s=>s.chapter_id===authorChapterA2Id),"account A release calendar should include its schedule");
  assert.equal(schedulesB.data.some(s=>s.chapter_id===authorChapterA2Id),false,"account B release calendar must not expose account A schedule");
  const foreignCancel=await request(origin,"/api/author/chapters/"+authorChapterA2Id+"/schedule",{method:"POST",cookie:accountB.cookie,origin,body:{cancel:true}});
  assert.equal(foreignCancel.status,403,"another author cannot cancel a foreign schedule");
  const cancelA=await request(origin,"/api/author/chapters/"+authorChapterA2Id+"/schedule",{method:"POST",cookie:accountA.cookie,origin,body:{cancel:true}});
  assert.equal(cancelA.status,200);
  assert.equal(cancelA.data.cancelled,true,"the schedule owner should cancel an active release");

  // A transferred chapter's old owner cannot cancel its schedule; the current owner can.
  const transferNovel=await request(origin,"/api/author/novels",{method:"POST",cookie:accountA.cookie,origin,body:{title:"Schedule Transfer Guard",author:accountA.username,kind:"original",rights_status:"original"}});
  assert.equal(transferNovel.status,201);
  const transferChapter=await request(origin,"/api/author/chapters",{method:"POST",cookie:accountA.cookie,origin,body:{novel_id:transferNovel.data.id,chapter_number:1,title:"Transfer Draft",content:"Transfer guard chapter."}});
  assert.equal(transferChapter.status,201);
  await wrangler(["d1","execute","god-emperornovel-db","--local","--persist-to",persist,"--command","UPDATE novels SET publication_status='published' WHERE id="+Number(transferNovel.data.id)]);
  const transferSchedule=await request(origin,"/api/author/chapters/"+transferChapter.data.id+"/schedule",{method:"POST",cookie:accountA.cookie,origin,body:{publish_at:new Date(Date.now()+10*60*1000).toISOString()}});
  assert.equal(transferSchedule.status,200);
  await wrangler(["d1","execute","god-emperornovel-db","--local","--persist-to",persist,"--command","UPDATE novels SET owner_user_id="+Number(accountB.user.id)+" WHERE id="+Number(transferNovel.data.id)]);
  const oldOwnerCancel=await request(origin,"/api/author/chapters/"+transferChapter.data.id+"/schedule",{method:"POST",cookie:accountA.cookie,origin,body:{cancel:true}});
  assert.equal(oldOwnerCancel.status,403,"former owner cannot cancel a schedule after ownership changes");
  const newOwnerSchedules=await request(origin,"/api/author/schedules",{cookie:accountB.cookie});
  assert.ok(newOwnerSchedules.data.some(s=>s.chapter_id===transferChapter.data.id),"current owner should see the inherited schedule");
  const newOwnerCancel=await request(origin,"/api/author/chapters/"+transferChapter.data.id+"/schedule",{method:"POST",cookie:accountB.cookie,origin,body:{cancel:true}});
  assert.equal(newOwnerCancel.status,200);
  assert.equal(newOwnerCancel.data.cancelled,true,"current owner can cancel a schedule after ownership changes");

  const comicNovel=await request(origin,"/api/author/novels",{method:"POST",cookie:accountA.cookie,origin,body:{title:"Comic Edit Validation",author:accountA.username,kind:"manga",rights_status:"original"}});
  assert.equal(comicNovel.status,201);
  const comicContent=JSON.stringify({type:"imperial_comic_chapter",version:1,pages:[{src:"https://cdn.example.test/page.webp",alt:"Test page"}]});
  const comicChapter=await request(origin,"/api/author/chapters",{method:"POST",cookie:accountA.cookie,origin,body:{novel_id:comicNovel.data.id,chapter_number:1,title:"Comic page sequence",content:comicContent}});
  assert.equal(comicChapter.status,201,"valid comic page sequence should save");
  const invalidComicEdit=await request(origin,"/api/author/chapters/"+comicChapter.data.id,{method:"PATCH",cookie:accountA.cookie,origin,body:{content:"<script>invalid</script>"}});
  assert.equal(invalidComicEdit.status,400,"comic chapter edits must not bypass page-sequence validation");
  const fractionalTicketCost=await request(origin,"/api/author/chapters",{method:"POST",cookie:accountA.cookie,origin,body:{novel_id:authorNovelId,chapter_number:2,title:"Invalid cost chapter",content:"Text",ticket_cost:1.5}});
  assert.equal(fractionalTicketCost.status,400,"chapter ticket cost must be a whole number");

  const logout=await request(origin,"/api/auth/logout",{method:"POST",cookie:accountA.cookie,origin});
  assert.equal(logout.status,200);
  const afterLogout=await request(origin,"/api/profile",{cookie:accountA.cookie});
  assert.equal(afterLogout.status,401,"logout must revoke the session");
  const accountBStillAuthenticated=await request(origin,"/api/profile",{cookie:accountB.cookie});
  assert.equal(accountBStillAuthenticated.status,200,"logging out account A must not affect account B");

  console.log("PASS: local D1 Worker integration for two-account profile, preferences, public disclosure, reader-progress isolation, optimistic conflicts, rights gating and logout.");
}catch(error){
  console.error(error);
  if(serverLogs)console.error(serverLogs);
  process.exitCode=1;
}finally{
  if(server){
    stopProcessGroup(server);
    await Promise.race([once(server,"close"),wait(5000)]);
  }
  fs.rmSync(persist,{recursive:true,force:true});
}
