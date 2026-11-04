import fs from "node:fs";
import { spawnSync } from "node:child_process";

const eventPath=process.env.GITHUB_EVENT_PATH;
const token=process.env.GITHUB_TOKEN;
const repository=process.env.GITHUB_REPOSITORY;
function runGit(args){
  const result=spawnSync("git",args,{encoding:"utf8",maxBuffer:32*1024*1024});
  if(result.error)throw result.error;
  return {status:result.status,stdout:result.stdout||"",stderr:result.stderr||""};
}
function requireGit(args,label){
  const result=runGit(args);
  if(result.status!==0)throw new Error(label+": "+result.stderr.slice(0,1000));
  return result.stdout.trim();
}
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
  const url="https://api.github.com/repos/"+repository+path;
  let lastError;
  for(let attempt=0;attempt<4;attempt++){
    try{
      const response=await fetch(url,{
        headers:{
          accept:"application/vnd.github+json",
          authorization:"Bearer "+token,
          "x-github-api-version":"2022-11-28"
        },
        signal:AbortSignal.timeout(30000)
      });
      if(response.ok)return response.json();
      const detail=(await response.text()).slice(0,500);
      const retryable=response.status===429||response.status>=500||
        (response.status===403&&/rate limit|secondary rate/i.test(detail));
      if(!retryable||attempt===3)throw new Error("GitHub API "+response.status+" for "+path+": "+detail);
      const retryAfter=Number(response.headers.get("retry-after")||0);
      await new Promise(resolve=>setTimeout(resolve,Math.max(retryAfter*1000,300*(2**attempt))));
    }catch(error){
      lastError=error;
      if(attempt===3)throw error;
      if(error instanceof Error&&/^GitHub API 4/.test(error.message))throw error;
      await new Promise(resolve=>setTimeout(resolve,300*(2**attempt)));
    }
  }
  throw lastError||new Error("GitHub API request failed for "+path);
}
async function listOpenPullRequestsGraphQL(){
  const [owner,name]=repository.split("/");
  if(!owner||!name)throw new Error("GITHUB_REPOSITORY must be owner/name for GraphQL fallback.");
  const result=[];
  let after=null;
  for(let page=0;page<10;page++){
    const response=await fetch("https://api.github.com/graphql",{
      method:"POST",
      headers:{
        accept:"application/vnd.github+json",
        authorization:"Bearer "+token,
        "content-type":"application/json",
        "x-github-api-version":"2022-11-28"
      },
      body:JSON.stringify({
        query:"query OpenPullRequests($owner:String!,$name:String!,$after:String){repository(owner:$owner,name:$name){pullRequests(states:OPEN,first:100,after:$after){nodes{number title headRefName headRefOid baseRefName baseRefOid}pageInfo{hasNextPage endCursor}}}}",
        variables:{owner,name,after}
      }),
      signal:AbortSignal.timeout(30000)
    });
    const payload=await response.json();
    if(!response.ok||payload.errors?.length){
      throw new Error("GitHub GraphQL fallback failed: "+JSON.stringify(payload.errors||payload).slice(0,1000));
    }
    const connection=payload.data?.repository?.pullRequests;
    if(!connection)throw new Error("GitHub GraphQL returned no repository pull-request connection.");
    result.push(...connection.nodes.map(pr=>({
      number:pr.number,
      title:pr.title,
      head:{ref:pr.headRefName,sha:pr.headRefOid},
      base:{ref:pr.baseRefName,sha:pr.baseRefOid}
    })));
    if(!connection.pageInfo.hasNextPage)return result;
    after=connection.pageInfo.endCursor;
  }
  throw new Error("Open pull-request pagination exceeded 1000 records; refusing an incomplete collision audit.");
}
async function listOpenPullRequests(){
  const result=[];
  try{
    for(let page=1;page<=10;page++){
      const items=await github("/pulls?state=open&per_page=100&page="+page);
      result.push(...items);
      if(items.length<100)return result;
    }
    throw new Error("Open pull-request pagination exceeded 1000 records; refusing an incomplete collision audit.");
  }catch(error){
    if(!/GitHub API 403 .*rate limit|API rate limit exceeded/i.test(String(error?.message||error)))throw error;
    console.warn("REST API rate limit reached; retrying the same complete open-PR inventory through GraphQL.");
    return listOpenPullRequestsGraphQL();
  }
}
function listChangedFiles(pr){
  if(!pr.base?.sha||!pr.head?.sha)throw new Error("PR #"+pr.number+" is missing base/head commit metadata.");
  const output=requireGit(["diff","--name-only","--no-renames",pr.base.sha+"..."+pr.head.sha],"Unable to inspect changed paths for PR #"+pr.number);
  return output.split("\n").filter(Boolean);
}
function isAncestor(baseSha,headSha){
  if(baseSha===headSha)return true;
  const result=runGit(["merge-base","--is-ancestor",baseSha,headSha]);
  if(result.status===0)return true;
  if(result.status===1)return false;
  throw new Error("Unable to compare local Git ancestry for "+baseSha+" and "+headSha+": "+result.stderr.slice(0,1000));
}
function fileBlobSha(ref,file){
  const result=runGit(["rev-parse","--verify",ref+":"+file]);
  if(result.status===0)return result.stdout.trim();
  // A missing path on one side is a real deletion, not a network/API failure.
  requireGit(["cat-file","-e",ref+"^{commit}"],"Git commit "+ref+" is unavailable for shared-surface comparison");
  return null;
}
const currentFiles=listChangedFiles(current).filter(isSerialized);
if(currentFiles.length===0){
  console.log("PASS: this PR does not modify any serialized shared surface.");
  process.exit(0);
}
const currentPaths=new Set(currentFiles);
const open=await listOpenPullRequests();
// Restrict collision checks to this PR's active integration stack and sibling PRs
// targeting the same integration base. Legacy PRs targeting main are checked when
// their own main-targeted stack is evaluated, not against every nested integration PR.
const stackParentNumbers=new Set();
const relevantBaseRefs=new Set([current.base.ref]);
let cursorRef=current.base.ref;
let cursorSha=current.base.sha;
for(let depth=0;depth<30;depth++){
  const parent=open.find(pr=>pr.head.ref===cursorRef);
  if(!parent)break;
  if(parent.head.sha!==cursorSha){
    console.error("FAIL: integration base branch "+cursorRef+" advanced after this PR was created.");
    console.error("  PR #"+parent.number+" now points to "+parent.head.sha+" but this PR is based on "+cursorSha+".");
    console.error("  Restack this branch on the latest base PR head before continuing.");
    process.exit(1);
  }
  stackParentNumbers.add(parent.number);
  cursorRef=parent.base.ref;
  cursorSha=parent.base.sha;
  if(cursorRef!=="main")relevantBaseRefs.add(cursorRef);
}
// Evaluate every open sibling targeting the same base, regardless of creation
// order. Newer PRs are just as capable of carrying a conflicting shared surface.
// Nested stack parents are included even when their base ref differs.
const siblings=open.filter(pr=>{
  if(pr.number===current.number)return false;
  return stackParentNumbers.has(pr.number)||relevantBaseRefs.has(pr.base.ref);
}).sort((a,b)=>a.number-b.number);
const conflicts=[];
for(const other of siblings){
  const otherFiles=listChangedFiles(other);
  const overlap=otherFiles.filter(file=>currentPaths.has(file));
  if(overlap.length===0)continue;
  const currentBeforeOther=await isAncestor(current.head.sha,other.head.sha);
  const otherBeforeCurrent=await isAncestor(other.head.sha,current.head.sha);
  if(currentBeforeOther||otherBeforeCurrent)continue;
  // Divergent commit histories are not automatically collisions. If every
  // overlapping serialized path resolves to the same Git blob (including
  // both sides deleting it), the shared surface is already reconciled.
  const divergent=[];
  for(const file of overlap){
    const [currentBlob,otherBlob]=await Promise.all([
      fileBlobSha(current.head.sha,file),
      fileBlobSha(other.head.sha,file)
    ]);
    if(currentBlob!==otherBlob)divergent.push(file);
  }
  if(divergent.length){
    conflicts.push({
      number:other.number,
      title:other.title,
      head:other.head.ref,
      overlap:divergent
    });
  }
}
if(conflicts.length){
  console.error("FAIL: this PR diverges from another open PR in the same integration stack or targeting the same base on serialized shared surfaces.");
  for(const conflict of conflicts){
    console.error("  PR #"+conflict.number+" "+conflict.title+" ("+conflict.head+")");
    console.error("  Overlapping paths: "+conflict.overlap.join(", "));
  }
  console.error("If the difference is intentional, stack the work or reconcile the shared file explicitly; do not close a PR until its unique changes have been reviewed.");
  process.exit(1);
}
console.log("PASS: shared-surface lineage is linear for "+currentFiles.length+" changed protected path(s).");
