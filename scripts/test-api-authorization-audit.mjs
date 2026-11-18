import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const worker = await readFile(new URL("src/index.js", root), "utf8");
const client = await readFile(new URL("public/app.js", root), "utf8");
const inventory = JSON.parse(await readFile(new URL("docs/architecture/API-ENDPOINT-INVENTORY-2026-11-18.json", root), "utf8"));
const report = await readFile(new URL("docs/architecture/API-AUTHORIZATION-AUDIT-2026-11-18.md", root), "utf8");

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
const adminConnectors = worker.slice(worker.indexOf('if(p==="/api/admin/connectors"&&m==="GET")'), worker.indexOf('if(p==="/api/admin/connectors"&&m==="PATCH")'));
assert.match(adminConnectors, /admin\(u\)/);
assert.ok(adminConnectors.includes("seedOmni(env)"), "Only the authenticated admin connector listing should seed the registry");
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
const bookmarkStart = worker.indexOf('if(p==="/api/bookmark"&&m==="POST")');
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
assert.ok(client.length > 0, "Client source must be available for literal call-site review");

const reportStart = worker.indexOf('if(p==="/api/report"&&m==="POST")');
const reportEnd = worker.indexOf('if(p==="/api/tickets/ledger"', reportStart);
assert.ok(reportStart >= 0 && reportEnd > reportStart, "User report submission route must remain explicit");
const reportHandler = worker.slice(reportStart, reportEnd);
assert.match(reportHandler, /Number\\.isSafeInteger\\(novelId\\)/, "Report novel identifiers must be positive safe integers");
assert.match(reportHandler, /Number\\.isSafeInteger\\(chapterId\\)/, "Report chapter identifiers must be positive safe integers");
assert.match(reportHandler, /SELECT id,novel_id FROM chapters WHERE id=\\?/);
assert.match(reportHandler, /Number\\(chapter\\.novel_id\\)!==novelId/, "A reported chapter must belong to the supplied novel");
assert.match(reportHandler, /resolvedNovelId=Number\\(chapter\\.novel_id\\)/, "Chapter-only reports must be linked to their actual novel");
assert.match(reportHandler, /typeof b\\.details==="string"\\?b\\.details\\.slice\\(0,2000\\):""/, "Report details must be bounded plain text");

console.log("API authorization audit slice passed: 14 route classifications and taxonomy identity boundaries.");
