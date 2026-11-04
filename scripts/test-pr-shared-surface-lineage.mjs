import fs from "node:fs";

const eventPath=process.env.GITHUB_EVENT_PATH;
const token=process.env.GITHUB_TOKEN;
const repository=process.env.GITHUB_REPOSITORY;
if(!eventPath||!token||!repository){
  console.log("SKIP: shared-surface lineage check requires a GitHub pull_request event and read-only token.");
  process.exit(0);
}
const event=JSON.parse(fs.readFileSync(eventPath,"utf8"));
const current=event.pull_request;
if(!current){
  console.log("SKIP: event is not a pull_request event.");
  process.exit(0);
}
const contract=JSON.parse(fs.readFileSync("docs/architecture/feature-contracts/platform-integration-governance.json","utf8"));
const patterns=contract.sharedSurfaceSerialization;
if(!Array.isArray(patterns)||patterns.length===0)throw new Error("Platform contract must declare sharedSurfaceSerialization.");

function escapeRegExp(value){return value.replace(/[.+?^$(){}|[\]\\]/g,"\\$&")}
function matches(file,pattern){
  if(pattern.endsWith("/"))return file.startsWith(pattern);
  if(pattern.includes("*"))return new RegExp("^"+pattern.split("*").map(escapeRegExp).join(".*")+"$").test(file);
  return file===pattern;
}
function isSerialized(file){return patterns.some(pattern=>matches(file,pattern))}
async function github(path){
  const response=await fetch("https://api.github.com/repos/"+repository+path,{
    headers:{
      accept:"application/vnd.github+json",
      authorization:"Bearer "+token,
      "x-github-api-version":"2022-11-28"
    },
    signal:AbortSignal.timeout(20000)
  });
  if(!response.ok)throw new Error("GitHub API "+response.status+" for "+path+": "+(await response.text()).slice(0,500));
  return response.json();
}
async function listOpenPullRequests(){
  const result=[];
  for(let page=1;page<=10;page++){
    const items=await github("/pulls?state=open&per_page=100&page="+page);
    result.push(...items);
    if(items.length<100)break;
  }
  return result;
}
async function listChangedFiles(number){
  const result=[];
  for(let page=1;page<=10;page++){
    const items=await github("/pulls/"+number+"/files?per_page=100&page="+page);
    result.push(...items.map(item=>item.filename));
    if(items.length<100)break;
  }
  return result;
}
async function isAncestor(baseSha,headSha){
  if(baseSha===headSha)return true;
  const result=await github("/compare/"+baseSha+"..."+headSha);
  return result.status==="ahead"||result.status==="identical";
}
const currentFiles=(await listChangedFiles(current.number)).filter(isSerialized);
if(currentFiles.length===0){
  console.log("PASS: this PR does not modify any serialized shared surface.");
  process.exit(0);
}
const currentPaths=new Set(currentFiles);
const open=await listOpenPullRequests();
const older=open.filter(pr=>{
  if(pr.number===current.number)return false;
  const otherTime=Date.parse(pr.created_at),currentTime=Date.parse(current.created_at);
  return otherTime<currentTime||(otherTime===currentTime&&pr.number<current.number);
}).sort((a,b)=>Date.parse(a.created_at)-Date.parse(b.created_at));
const conflicts=[];
for(const other of older){
  const otherFiles=await listChangedFiles(other.number);
  const overlap=otherFiles.filter(file=>currentPaths.has(file));
  if(overlap.length===0)continue;
  const currentBeforeOther=await isAncestor(current.head.sha,other.head.sha);
  const otherBeforeCurrent=await isAncestor(other.head.sha,current.head.sha);
  if(!currentBeforeOther&&!otherBeforeCurrent){
    conflicts.push({
      number:other.number,
      title:other.title,
      head:other.head.ref,
      overlap
    });
  }
}
if(conflicts.length){
  console.error("FAIL: this PR diverges from an older open PR on serialized shared surfaces.");
  for(const conflict of conflicts){
    console.error("  PR #"+conflict.number+" "+conflict.title+" ("+conflict.head+")");
    console.error("  Overlapping paths: "+conflict.overlap.join(", "));
  }
  console.error("Stack the new branch on the earlier PR head, integrate that head first, or close the superseded draft before proceeding.");
  process.exit(1);
}
console.log("PASS: shared-surface lineage is linear for "+currentFiles.length+" changed protected path(s).");
