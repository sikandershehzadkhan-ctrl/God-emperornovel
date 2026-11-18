import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const worker = await readFile(new URL("src/index.js", root), "utf8");
const client = await readFile(new URL("public/app.js", root), "utf8");
const inventory = JSON.parse(await readFile(new URL("docs/architecture/API-ENDPOINT-INVENTORY-2026-11-18.json", root), "utf8"));
const report = await readFile(new URL("docs/architecture/API-AUTHORIZATION-AUDIT-2026-11-18.md", root), "utf8");

const adminUserRoute = worker.slice(worker.indexOf('let au=p.match(/^\\/api\\/admin\\/users\\/(\\d+)$/)'), worker.indexOf('if(p==="/api/author/ai/status"', worker.indexOf('let au=p.match(/^\\/api\\/admin\\/users\\/(\\d+)$/)'));
assert.ok(adminUserRoute.length > 0, "Admin user PATCH route must remain explicit");
assert.match(adminUserRoute, /Number\\.isSafeInteger\\(id\\)\\|\\|id<1/, "Admin user IDs must be positive safe integers");
assert.match(adminUserRoute, /SELECT id,role,verified,banned FROM users WHERE id=\\?/);
assert.match(adminUserRoute, /b\\.role===undefined\\?String\\(current\\.role\\):String\\(b\\.role\\)/, "Omitted role must preserve the current role");
assert.match(adminUserRoute, /id===u\\.id&&role!=='admin'/, "An administrator must not demote their own account");
assert.match(adminUserRoute, /b\\.verified===undefined\\?Number\\(current\\.verified\\)/, "Omitted verification state must be preserved");
assert.match(adminUserRoute, /b\\.banned===undefined\\?Number\\(current\\.banned\\)/, "Omitted ban state must be preserved");

const adminNovelPatchStart = worker.indexOf('let apn=p.match(/^\\/api\\/admin\\/publishing\\/novels\\/(\\d+)$/)');
const adminChapterStart = worker.indexOf('let ach=p.match(/^\\/api\\/admin\\/publishing\\/chapters');
const adminChapterPatchStart = worker.indexOf('let acm=p.match(/^\\/api\\/admin\\/publishing\\/chapters\\/(\\d+)$/)');
const adminChapterDeleteStart = worker.indexOf('if(acm && m==="DELETE")');
const adminChapterCreateStart = worker.indexOf('if(p==="/api/admin/publishing/chapters"&&m==="POST")');
assert.ok(adminNovelPatchStart>=0 && adminChapterStart>adminNovelPatchStart);
assert.match(worker.slice(adminNovelPatchStart,adminChapterStart), /Number\\.isSafeInteger\\(id\\)\\|\\|id<1/);
assert.match(worker.slice(adminChapterStart,adminChapterPatchStart), /Number\\.isSafeInteger\\(nid\\)\\|\\|nid<1/);
assert.match(worker.slice(adminChapterPatchStart,adminChapterDeleteStart), /Number\\.isSafeInteger\\(id\\)\\|\\|id<1/);
assert.match(worker.slice(adminChapterPatchStart,adminChapterDeleteStart), /Number\\.isSafeInteger\\(num\\)\\|\\|num<1/);
assert.match(worker.slice(adminChapterDeleteStart,adminChapterCreateStart), /Number\\.isSafeInteger\\(id\\)\\|\\|id<1/);
assert.match(worker, /Number\\.isSafeInteger\\(id\\)\\|\\|id<1\\|\\|!\\['up','down'\\]\\.includes\\(direction\\)/);
assert.match(worker.slice(adminChapterCreateStart), /Number\\.isSafeInteger\\(nid\\)\\|\\|nid<1\\|\\|!Number\\.isSafeInteger\\(num\\)/);

const adminNovelCreateStart = worker.indexOf('if(p==="/api/admin/publishing/novels"&&m==="POST")');
const adminNovelCreateEnd = worker.indexOf('let apn=p.match',adminNovelCreateStart);
const adminNovelCreate = worker.slice(adminNovelCreateStart,adminNovelCreateEnd);
assert.ok(adminNovelCreateStart>=0 && adminNovelCreateEnd>adminNovelCreateStart);
assert.match(adminNovelCreate,/Number\\.isSafeInteger\\(ownerId\\)\\|\\|ownerId<1/,"Admin novel owner IDs must be positive safe integers");
assert.match(adminNovelCreate,/SELECT id,role,banned FROM users WHERE id=\\?/,"Admin novel creation must resolve the target owner account");
assert.match(adminNovelCreate,/!\\['author','admin'\\]\\.includes\\(String\\(owner\\.role\\)\\)/,"Only active author/admin accounts may own admin-created novels");
assert.match(adminNovelCreate,/Number\\(owner\\.banned\\)!==0/,"Banned accounts cannot be assigned new novels");
assert.match(adminNovelCreate,/rights,ownerId,'draft'/,"Novel creation must bind the validated owner ID");

const authorChapterPublishStart = worker.indexOf('if(/^\\/api\\/author\\/chapters\\/\\d+\\/publish$/.test(p)&&m==="POST"){');
const authorChapterPublishEnd = worker.indexOf('if(p==="/api/admin/publishing"',authorChapterPublishStart);
const authorChapterPublish = worker.slice(authorChapterPublishStart,authorChapterPublishEnd);
assert.ok(authorChapterPublishStart>=0 && authorChapterPublishEnd>authorChapterPublishStart,"Author chapter publication route must remain explicit");
assert.match(authorChapterPublish,/n\\.publication_status novel_publication_status/,"Author chapter publication must load parent novel status");
assert.match(authorChapterPublish,/status==='published'&&c\\.novel_publication_status!=='published'/,"Author chapter publication must require a published parent novel");

const authorChapterCreateStart = worker.indexOf('if(p==="/api/author/chapters"&&m==="POST"){');
const authorChapterCreateEnd = worker.indexOf('if(/^\\/api\\/author\\/chapters\\/\\d+$/.test(p)&&m==="PATCH"){',authorChapterCreateStart);
const authorChapterCreate = worker.slice(authorChapterCreateStart,authorChapterCreateEnd);
assert.ok(authorChapterCreateStart>=0 && authorChapterCreateEnd>authorChapterCreateStart,"Author chapter creation route must remain explicit");
assert.match(authorChapterCreate,/Number\\.isSafeInteger\\(nid\\)\\|\\|nid<1/,"Author chapter creation must validate the parent novel ID");
assert.match(authorChapterCreate,/Number\\.isSafeInteger\\(num\\)\\|\\|num<1/,"Author chapter numbers must be positive safe integers");
assert.match(authorChapterCreate,/Number\\.isSafeInteger\\(cost\\)\\|\\|cost<0\\|\\|cost>1000000/,"Author chapter ticket costs must be whole numbers within the platform limit");

const userLookup = worker.indexOf("const u=await getUser(req,env)");
const health = worker.indexOf('if(p==="/api/health"&&m==="GET")');
assert.ok(health >= 0 && userLookup > health, "Health route must bypass session lookup");

const taxonomyStart = worker.indexOf("function communityTaxonomy(req,env,user){");
const taxonomyEnd = worker.indexOf("async function adminTaxonomy(", taxonomyStart);
assert.ok(taxonomyStart >= 0 && taxonomyEnd > taxonomyStart);
const taxonomy = worker.slice(taxonomyStart, taxonomyEnd);
assert.ok(taxonomy.includes("if(method==='GET')"), "Taxonomy GET must remain public");
assert.ok(taxonomy.includes("if(method==='POST')"), "Taxonomy POST must remain available");
assert.ok(taxonomy.includes("const e=need(user);if(e)return e;"), "Taxonomy POST must require an authenticated account");
assert.ok(taxonomy.includes("user.id") && taxonomy.includes("user.username"));
assert.ok(!taxonomy.includes("b.creator_id") && !taxonomy.includes("b.creator_name"));

const routeLine = path => {
  const entry = inventory.literal_endpoints.find(x => x.path === path);
  assert.ok(entry, "Missing inventory route: " + path);
  return worker.split("\n")[entry.source_lines[0] - 1] || "";
};
assert.match(routeLine("/api/me"), /u\?/);
assert.ok(routeLine("/api/omni/status").includes('consumeAuthRateLimit(env,"omni-status-ip",ip,60,60)'));
assert.ok(!routeLine("/api/omni/status").includes("seedOmni(env)"), "Public Omni status must not seed/write the connector registry");
assert.match(routeLine("/api/omni/search"), /rights_status='authorized'/);
assert.ok(routeLine("/api/omni/search").includes('consumeAuthRateLimit(env,"omni-search-ip",ip,20,60)'));
assert.ok(routeLine("/api/omni/search").includes("q.length>120"));
assert.match(routeLine("/api/omni/smart-unlock"), /need\(u\)/);
assert.match(routeLine("/api/admin/stats"), /admin\(u\)/);
const connectorCreate = worker.slice(worker.indexOf('if(p==="/api/admin/connectors"&&m==="POST")'), worker.indexOf('if(p==="/api/admin/requests"&&m==="GET")'));
assert.match(connectorCreate, /VALUES\\(\\?,\\?,\\?,0,'pending'\\)/, "New connectors must default to disabled and pending rights review");
assert.doesNotMatch(connectorCreate, /VALUES\\(\\?,\\?,\\?,0,'authorized'\\)/, "Connector creation must never self-assert authorization");

const adminConnectors = worker.slice(worker.indexOf('if(p==="/api/admin/connectors"&&m==="GET")'), worker.indexOf('if(p==="/api/admin/connectors"&&m==="PATCH")'));
assert.match(adminConnectors, /admin\(u\)/);
assert.ok(adminConnectors.includes("seedOmni(env)"), "Only the authenticated admin connector listing should seed the registry");

const adminNovelPatchStart = worker.indexOf('let apn=p.match(/^\\/api\\/admin\\/publishing\\/novels\\/(\\d+)$/)');
const adminNovelPatchEnd = worker.indexOf('let ach=p.match', adminNovelPatchStart);
const adminNovelPatch = worker.slice(adminNovelPatchStart, adminNovelPatchEnd);
assert.ok(adminNovelPatchStart >= 0 && adminNovelPatchEnd > adminNovelPatchStart, "Admin novel publication route must remain explicit");
assert.match(adminNovelPatch, /const rightsVerified=pub==='published'\\|\\|b\\.rights_verified===true/);
assert.match(adminNovelPatch, /const verified=rightsVerified\\?u\\.id:null;const verifiedAt=rightsVerified\\?new Date\\(\\)\\.toISOString\\(\\):null/);
assert.match(adminNovelPatch, /rights_verified_by=\\?,rights_verified_at=\\?/);
assert.match(adminNovelPatch, /verified,verifiedAt,reviewedBy/);

const adminChapterPatchStart = worker.indexOf('let acm=p.match(/^\\/api\\/admin\\/publishing\\/chapters(?:\\/(\\d+))?$/)');
const adminChapterPostStart = worker.indexOf('if(p==="/api/admin/publishing/chapters"&&m==="POST")');
const adminChapterRoutes = worker.slice(adminChapterPatchStart, adminChapterPostStart);
assert.ok(adminChapterPatchStart >= 0 && adminChapterPostStart > adminChapterPatchStart, "Admin chapter update routes must remain explicit");
assert.match(adminChapterRoutes, /SELECT publication_status,rights_status FROM novels WHERE id=\\?/);
assert.match(adminChapterRoutes, /novel\\.publication_status!=='published'[\\s\\S]*rights_status/);
assert.match(adminChapterRoutes, /Number\\.isSafeInteger\\(cost\\).*cost<0.*cost>1000000/);
const adminChapterCreateEnd = worker.indexOf('if(p==="/api/admin/donations"&&m==="GET")', adminChapterPostStart);
const adminChapterCreate = worker.slice(adminChapterPostStart, adminChapterCreateEnd);
assert.match(adminChapterCreate, /chapterPublication==='published'[\\s\\S]*n\\.publication_status!=='published'/, "Admin chapter creation must not publish under an unpublished parent novel");
assert.match(adminChapterCreate, /Number\\.isSafeInteger\\(ticketCost\\).*ticketCost<0.*ticketCost>1000000/);

const novelsStart = worker.indexOf('if(p==="/api/novels"){');
const novelsEnd = worker.indexOf("let nm=p.match", novelsStart);
assert.ok(novelsStart >= 0 && novelsEnd > novelsStart && worker.slice(novelsStart, novelsEnd).includes("publication_status='published'"), "Public novel listing must filter to published content");
assert.match(report, /Public Omni search exposure/);
assert.match(report, /Public Omni status side effects/);
assert.match(report, /Full API authorization, resource ownership/);

const aiRunStart = worker.indexOf('if(/^\\/api\\/author\\/ai\\/projects\\/\\d+\\/run$/.test(p)&&m==="POST")');
const aiJobsStart = worker.indexOf('if(/^\\/api\\/author\\/ai\\/projects\\/\\d+\\/jobs$/.test(p)&&m==="GET")');
const aiRunHandler = worker.slice(aiRunStart, aiJobsStart);
assert.ok(aiRunStart >= 0 && aiJobsStart > aiRunStart, "AI chapter generation route must remain explicit");
assert.match(aiRunHandler, /status<>'running'[\s\S]*claimed\.meta\?\.changes/, "AI generation must atomically claim a non-running project to prevent concurrent duplicate runs");
assert.match(aiRunHandler, /status,output_summary,provider\) VALUES\(\?,\?,\? ,\? ,'failed',\?,\?,\?\)/, "Failed AI chapter attempts must be recorded in generation history");
assert.match(aiRunHandler, /aiSafeText\(ai\.error\|\|'AI provider returned no chapter text',500\)/, "Stored AI failure summaries must be length-bounded");
assert.match(aiRunHandler, /ai_chapter_jobs\(project_id,owner_user_id,chapter_number[\s\S]*row\.owner_user_id/, "AI job ownership must follow the project owner, including admin-assisted runs");
assert.equal((aiRunHandler.match(/ai_generation_runs\(project_id,owner_user_id/g)||[]).length, 2, "Both failed and successful chapter attempts must write generation history");
assert.match(aiRunHandler, /ai_generation_runs\(project_id,owner_user_id[\s\S]*row\.owner_user_id/, "Generation history must remain associated with the project owner");

const exactPaths = ["/api/health","/api/taxonomy","/api/me","/api/config","/api/genres","/api/tags","/api/public-authors","/api/sources","/api/omni/status","/api/omni/search","/api/omni/resolve","/api/omni/smart-unlock","/api/novels","/api/admin/stats"];
assert.equal(exactPaths.length, 14);
for (const path of exactPaths) assert.ok(inventory.literal_endpoints.some(x => x.path === path), "Authorization slice must stay in route inventory: " + path);
const authorChapterPatch = worker.slice(worker.indexOf('if(/^\\/api\\/author\\/chapters\\/\\d+$/.test(p)&&m==="PATCH")'), worker.indexOf('if(/^\\/api\\/author\\/chapters\\/\\d+\\/publish$/.test(p)'));
assert.match(authorChapterPatch, /b\.is_locked===undefined\?Number\(c\.is_locked\):b\.is_locked\?1:0/, "Partial chapter edits must preserve the existing lock state");
assert.match(authorChapterPatch, /Number\.isSafeInteger\(cost\).*cost>1000000/, "Chapter ticket costs must be bounded whole numbers");

assert.match(authorChapterPatch, /Number\.isSafeInteger\(id\)\|\|id<1/, "Author chapter path IDs must be positive safe integers");
assert.match(authorChapterPatch, /Number\.isSafeInteger\(num\)\|\|num<1/, "Edited chapter numbers must be positive safe integers");

const authorChapterPublishStart = worker.indexOf('if(/^\/api\/author\/chapters\/\d+\/publish$/.test(p)&&m==="POST"){');
const authorChapterPublishEnd = worker.indexOf('if(p==="/api/admin/publishing"&&m==="GET"){', authorChapterPublishStart);
const authorChapterPublish = worker.slice(authorChapterPublishStart, authorChapterPublishEnd);
assert.ok(authorChapterPublishStart >= 0 && authorChapterPublishEnd > authorChapterPublishStart, "Author chapter publish route must remain explicit");
assert.match(authorChapterPublish, /Number\.isSafeInteger\(id\)\|\|id<1/, "Author chapter publication must validate its chapter ID");
const authorNovelSubmitStart = worker.indexOf('if(/^\/api\/author\/novels\/\d+\/submit$/.test(p)&&m==="POST"){');
const authorNovelSubmitEnd = worker.indexOf('if(/^\/api\/author\/novels\/\d+$/.test(p)&&m==="PATCH"){', authorNovelSubmitStart);
const authorNovelSubmit = worker.slice(authorNovelSubmitStart, authorNovelSubmitEnd);
assert.ok(authorNovelSubmitStart >= 0 && authorNovelSubmitEnd > authorNovelSubmitStart, "Author novel submit route must remain explicit");
assert.match(authorNovelSubmit, /Number\.isSafeInteger\(id\)\|\|id<1/, "Author novel submission must validate its novel ID");
const authorNovelPatchStart = worker.indexOf('if(/^\/api\/author\/novels\/\d+$/.test(p)&&m==="PATCH"){');
const authorNovelPatchEnd = worker.indexOf('if(p==="/api/author/chapters"&&m==="GET"){', authorNovelPatchStart);
const authorNovelPatch = worker.slice(authorNovelPatchStart, authorNovelPatchEnd);
assert.ok(authorNovelPatchStart >= 0 && authorNovelPatchEnd > authorNovelPatchStart, "Author novel edit route must remain explicit");
assert.match(authorNovelPatch, /Number\.isSafeInteger\(id\)\|\|id<1/, "Author novel edits must validate their novel ID");const authorChapterListStart = worker.indexOf('if(p==="/api/author/chapters"&&m==="GET"){');
const authorChapterListEnd = worker.indexOf('if(p==="/api/author/chapters"&&m==="POST"){', authorChapterListStart);
const authorChapterList = worker.slice(authorChapterListStart, authorChapterListEnd);
assert.ok(authorChapterListStart >= 0 && authorChapterListEnd > authorChapterListStart, "Author chapter list route must remain explicit");
assert.match(authorChapterList, /Number\.isSafeInteger\(nid\)\|\|nid<1/, "Author chapter list must reject invalid novel IDs before database lookup");const bookmarkStart = worker.indexOf('if(p==="/api/bookmark"&&m==="POST")');
const bookmarkEnd = worker.indexOf('if(p==="/api/history"&&m==="GET")', bookmarkStart);
const bookmarkHandler = worker.slice(bookmarkStart, bookmarkEnd);
assert.match(bookmarkHandler, /Number\.isSafeInteger\(novelId\)/, "Bookmark writes must validate the novel ID");
assert.match(bookmarkHandler, /c\.novel_id=\? AND c\.chapter_number=\?/);
assert.match(bookmarkHandler, /c\.publication_status='published'.*n\.publication_status='published'/);
assert.match(authorChapterPatch, /validateComicChapterContent\(content\)/, "Comic chapter edits must use the same content policy as creation");
const historyStart = worker.indexOf('if(p==="/api/history"&&m==="POST")');
const historyEnd = worker.indexOf('if(p==="/api/library"&&m==="GET")', historyStart);
const historyWrite = worker.slice(historyStart, historyEnd);
assert.match(historyWrite, /Number\.isSafeInteger\(chapterNumber\)/, "History writes must validate chapter numbers");
assert.match(historyWrite, /c\.novel_id=\? AND c\.chapter_number=\?/);
assert.match(historyWrite, /c\.publication_status='published'.*n\.publication_status='published'/);
const commentsStart = worker.indexOf('if(p==="/api/comments"&&m==="GET")');
const commentsEnd = worker.indexOf('if(p==="/api/comments/like"&&m==="POST")', commentsStart);
const commentsRoutes = worker.slice(commentsStart, commentsEnd);
assert.equal((commentsRoutes.match(/publication_status='published' AND rights_status IN/g)||[]).length, 2, "Public comment reads and writes must enforce novel publication and rights eligibility");
const ratingGetStart = worker.indexOf('if(p==="/api/rating"&&m==="GET")');
const ratingGetEnd = worker.indexOf('if(p==="/api/rating"&&m==="POST")', ratingGetStart);
assert.match(worker.slice(ratingGetStart, ratingGetEnd), /publication_status='published' AND rights_status IN/, "Public rating reads must hide unpublished and ineligible novels");

const userScopedRoutes = [
  ['history reads', /WHERE h\.user_id=\?/],
  ['library reads', /WHERE l\.user_id=\?/],
  ['bookmark reads', /WHERE b\.user_id=\?/],
  ['notifications reads', /notifications WHERE user_id=\?/],
  ['ticket ledger reads', /ticket_ledger WHERE user_id=\?/],
  ['recommendation reads', /WHERE r\.user_id=\?/],
  ['follow reads', /WHERE f\.user_id=\?/]
];
for (const [label, pattern] of userScopedRoutes) {
  assert.match(worker, pattern, label + " must be scoped to the authenticated account");
}
assert.match(worker, /if\(u\.role!==['"]admin['"]&&Number\(row\.owner_user_id\)!==Number\(u\.id\)\)return json\(\{error:['"]You do not own this project/);
assert.match(worker, /if\(u\.role!==['"]admin['"]&&Number\(n\.owner_user_id\)!==Number\(u\.id\)\)return json\(\{error:['"]You do not own this novel/);
assert.match(worker, /if\(u\.role!==['"]admin['"]&&Number\(c\.owner_user_id\)!==Number\(u\.id\)\)return json\(\{error:['"]You do not own this chapter/);
const aiJobsStart = worker.indexOf('if(/^\\/api\\/author\\/ai\\/projects\\/\\d+\\/jobs$/.test(p)&&m==="GET")');
const aiJobsEnd = worker.indexOf('if(p==="/api/author/novels"', aiJobsStart);
const aiJobsHandler = worker.slice(aiJobsStart, aiJobsEnd);
assert.ok(aiJobsStart >= 0 && aiJobsEnd > aiJobsStart, "AI job history route must remain explicit");
assert.match(aiJobsHandler, /SELECT owner_user_id FROM ai_author_projects WHERE id=\?/);
assert.match(aiJobsHandler, /Number\(row\.owner_user_id\)!==Number\(u\.id\)/);
assert.match(aiJobsHandler, /ai_chapter_jobs WHERE project_id=\?/);

assert.ok(client.length > 0, "Client source must be available for literal call-site review");

const reportStart = worker.indexOf('if(p==="/api/report"&&m==="POST")');
const reportEnd = worker.indexOf('if(p==="/api/tickets/ledger"', reportStart);
assert.ok(reportStart >= 0 && reportEnd > reportStart, "User report submission route must remain explicit");
const reportHandler = worker.slice(reportStart, reportEnd);
assert.match(reportHandler, /Number\.isSafeInteger\(novelId\)/, "Report novel identifiers must be positive safe integers");
assert.match(reportHandler, /Number\.isSafeInteger\(chapterId\)/, "Report chapter identifiers must be positive safe integers");
assert.match(reportHandler, /SELECT id,novel_id FROM chapters WHERE id=\?/);
assert.match(reportHandler, /Number\(chapter\.novel_id\)!==novelId/, "A reported chapter must belong to the supplied novel");
assert.match(reportHandler, /resolvedNovelId=Number\(chapter\.novel_id\)/, "Chapter-only reports must be linked to their actual novel");
assert.match(reportHandler, /typeof b\.details==="string"\?b\.details\.slice\(0,2000\):""/, "Report details must be bounded plain text");


const authorChapterReviewEdit = authorChapterPatch;
assert.match(authorChapterReviewEdit, /chapterChanged=.*content!==String\(c\.content\|\|''\)/, "Changes to published chapter content must be detected");
assert.match(authorChapterReviewEdit, /publication_status=CASE WHEN \?=1 THEN 'review'/, "Editing a published chapter must move it into review");
assert.match(authorChapterReviewEdit, /author_chapter_paused_for_review/, "Published chapter edits must be audited");
assert.match(authorChapterReviewEdit, /notifyAdmins\(env,'Published chapter requires review'/, "Published chapter edits must notify administrators");
assert.match(authorChapterPublish, /requestedStatus==='published'\?'review':'draft'/, "Authors must submit chapters for review instead of publishing directly");
assert.match(authorChapterPublish, /author_chapter_submitted_for_review/, "Chapter review submissions must be audited");
assert.match(authorNovelPatch, /novelContentChanged=.*description/, "Published novel content and metadata changes must be detected");
assert.match(authorNovelPatch, /publication_status=CASE WHEN \?=1 THEN 'review'/, "Material edits to published novels must move them into review");
assert.match(authorNovelPatch, /author_novel_paused_for_review/, "Published novel edits must be audited as review transitions");
assert.match(authorNovelPatch, /notifyAdmins\(env,'Published novel requires renewed review'/, "Published novel edits must notify administrators");
const adminChapterPatchStart = worker.indexOf('if(acm && m==="PATCH"){');
const adminChapterPatchEnd = worker.indexOf("if(p==='/api/admin/publishing/chapters/reorder'", adminChapterPatchStart);
const adminChapterPatch = worker.slice(adminChapterPatchStart, adminChapterPatchEnd);
assert.ok(adminChapterPatchStart>=0 && adminChapterPatchEnd>adminChapterPatchStart, "Admin chapter review route must remain explicit");
assert.match(adminChapterPatch, /\['draft','review','published'\]/, "Administrators must be able to retain, review, or approve chapters");


const adminNovelStart = worker.indexOf('let apn=p.match(/^\\/api\\/admin\\/publishing\\/novels');
const adminNovelEnd = worker.indexOf('\n let ach=p.match', adminNovelStart);
const adminNovelPatch = worker.slice(adminNovelStart, adminNovelEnd);
assert.ok(adminNovelStart>=0&&adminNovelEnd>adminNovelStart, "Admin novel review route must remain explicit");
assert.match(adminNovelPatch, /previous!=='review'&&previous!=='published'/, "A novel cannot be approved directly from draft");
assert.match(adminNovelPatch, /pub==='draft'&&previous==='review'&&!feedback/, "Returning a novel for changes requires reviewer feedback");
assert.match(adminNovelPatch, /rights_verified_by/, "Novel approval must record rights reviewer identity");
assert.match(adminNovelPatch, /reviewedBy=decision\?u\.id/, "Novel review decisions must record reviewer identity");
assert.match(adminNovelPatch, /notifyUser\(env,row\.owner_user_id,'Novel approved and published'/, "Novel approval must notify its owner");
assert.match(adminNovelPatch, /notifyUser\(env,row\.owner_user_id,'Changes requested for your novel'/, "Novel rejection must send reviewer feedback to its owner");
assert.match(adminChapterPatch, /previous!=='review'&&previous!=='published'/, "A chapter cannot be approved directly from draft");
assert.match(adminChapterPatch, /pub==='draft'&&previous==='review'&&!feedback/, "Returning a chapter for changes requires reviewer feedback");
assert.match(adminChapterPatch, /admin_chapter_review_decision/, "Chapter decisions must be audited");
assert.match(adminChapterPatch, /audit\(env,u,'admin_chapter_review_decision'/, "Chapter audit events must identify the acting administrator");
assert.match(adminChapterPatch, /notifyUser\(env,parent\.owner_user_id,'Chapter approved and published'/, "Chapter approval must notify its owner");
assert.match(adminChapterPatch, /notifyUser\(env,parent\.owner_user_id,'Changes requested for your chapter'/, "Chapter rejection must send reviewer feedback to its owner");
assert.match(adminChapterPatch, /feedback=\$\{feedback\}/, "Chapter reviewer feedback must be retained in the audit trail");

console.log("API authorization audit slice passed: 14 route classifications and taxonomy identity boundaries.");
