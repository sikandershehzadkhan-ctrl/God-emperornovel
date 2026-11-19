import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import worker from "../src/index.js";
const db=new DatabaseSync(":memory:");
db.exec(`
CREATE TABLE app_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
INSERT INTO app_settings VALUES('core_schema_version','16.64.0'),('runtime_feature_schema_version','1');
CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT NOT NULL,email TEXT NOT NULL,role TEXT NOT NULL,tickets REAL DEFAULT 0,verified INTEGER DEFAULT 1,banned INTEGER DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE sessions(token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL,expires_at INTEGER NOT NULL);
CREATE TABLE notifications(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,read_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE novels(id INTEGER PRIMARY KEY,title TEXT NOT NULL,alt_titles TEXT DEFAULT '',author TEXT NOT NULL,description TEXT DEFAULT '',status TEXT DEFAULT 'ongoing',kind TEXT DEFAULT 'original',language TEXT DEFAULT 'English',cover_url TEXT DEFAULT '',source_url TEXT DEFAULT '',rights_status TEXT DEFAULT 'original',rights_evidence TEXT DEFAULT '',rights_notes TEXT DEFAULT '',rights_verified_by INTEGER,rights_verified_at TEXT,review_feedback TEXT DEFAULT '',reviewed_by INTEGER,reviewed_at TEXT,publication_status TEXT DEFAULT 'draft',views INTEGER DEFAULT 0,rating REAL DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,owner_user_id INTEGER NOT NULL);
CREATE TABLE chapters(id INTEGER PRIMARY KEY,novel_id INTEGER NOT NULL,chapter_number INTEGER NOT NULL,title TEXT NOT NULL,content TEXT NOT NULL,is_locked INTEGER DEFAULT 0,ticket_cost INTEGER DEFAULT 0,publication_status TEXT DEFAULT 'draft',created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE ai_author_projects(id INTEGER PRIMARY KEY,owner_user_id INTEGER NOT NULL,novel_id INTEGER,name TEXT NOT NULL,mode TEXT DEFAULT 'manual',status TEXT DEFAULT 'draft',genre TEXT DEFAULT '',fandom TEXT DEFAULT '',premise TEXT DEFAULT '',protagonist TEXT DEFAULT '',settings_json TEXT DEFAULT '{}',bible_json TEXT DEFAULT '{}',auto_publish INTEGER DEFAULT 0,chapters_target INTEGER DEFAULT 0,chapters_generated INTEGER DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE ai_chapter_jobs(id INTEGER PRIMARY KEY,project_id INTEGER NOT NULL,owner_user_id INTEGER NOT NULL,chapter_number INTEGER NOT NULL,job_type TEXT DEFAULT 'draft',status TEXT DEFAULT 'queued',prompt TEXT DEFAULT '',result TEXT DEFAULT '',error TEXT DEFAULT '',attempts INTEGER DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP,started_at TEXT,finished_at TEXT);
CREATE TABLE ai_generation_runs(id INTEGER PRIMARY KEY,project_id INTEGER NOT NULL,owner_user_id INTEGER NOT NULL,agent TEXT NOT NULL,mode TEXT NOT NULL,status TEXT DEFAULT 'ok',input_summary TEXT DEFAULT '',output_summary TEXT DEFAULT '',provider TEXT DEFAULT 'local',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE ai_provider_benchmarks(id INTEGER PRIMARY KEY,provider TEXT NOT NULL,observed_at TEXT DEFAULT CURRENT_TIMESTAMP,chapters_delta INTEGER DEFAULT 0,interval_seconds INTEGER DEFAULT 0,source_url TEXT DEFAULT '',access_mode TEXT DEFAULT 'public-metadata',confidence TEXT DEFAULT 'unknown');
CREATE TABLE ai_publish_policies(project_id INTEGER PRIMARY KEY,require_rights INTEGER DEFAULT 1,require_review INTEGER DEFAULT 1,max_chapters_per_day INTEGER DEFAULT 10,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE ticket_ledger(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,delta INTEGER NOT NULL,reason TEXT NOT NULL,reference TEXT DEFAULT '',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE novel_requests(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,url TEXT NOT NULL,source_host TEXT DEFAULT '',week_key INTEGER NOT NULL,cost INTEGER DEFAULT 0,status TEXT DEFAULT 'pending',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE author_applications(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,display_name TEXT NOT NULL,bio TEXT DEFAULT '',experience TEXT DEFAULT '',portfolio_url TEXT DEFAULT '',sample_work TEXT DEFAULT '',preferred_formats TEXT DEFAULT '[]',rights_confirmed INTEGER DEFAULT 0,status TEXT DEFAULT 'pending',review_notes TEXT DEFAULT '',reviewed_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,reviewed_at TEXT,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE donations(id INTEGER PRIMARY KEY,user_id INTEGER,amount REAL NOT NULL DEFAULT 0,reference_id TEXT NOT NULL DEFAULT '',status TEXT DEFAULT 'pending',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE connectors(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,base_url TEXT NOT NULL,type TEXT NOT NULL,enabled INTEGER NOT NULL DEFAULT 0,rights_status TEXT NOT NULL DEFAULT 'pending',last_status TEXT DEFAULT '',last_checked_at TEXT);
INSERT INTO connectors(id,name,base_url,type,enabled,rights_status) VALUES(701,'Example Registry','https://registry.example.test','json',0,'pending'),(702,'Unreviewed Registry','https://unreviewed.example.test','json',0,'pending');
CREATE TABLE taxonomy_submissions(id INTEGER PRIMARY KEY,status TEXT DEFAULT 'pending');
CREATE TABLE reports(id INTEGER PRIMARY KEY,user_id INTEGER,novel_id INTEGER,status TEXT DEFAULT 'open');
CREATE TABLE comments(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,novel_id INTEGER NOT NULL,body TEXT NOT NULL,status TEXT DEFAULT 'visible',created_at TEXT DEFAULT CURRENT_TIMESTAMP,parent_id INTEGER,edited_at TEXT);
CREATE TABLE comment_reports(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,comment_id INTEGER NOT NULL,reason TEXT NOT NULL,details TEXT DEFAULT '',status TEXT DEFAULT 'open',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE audit_logs(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,action TEXT NOT NULL,details TEXT DEFAULT '',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
INSERT INTO comments(id,user_id,novel_id,body,status) VALUES(301,4,101,'A reader comment','visible');
INSERT INTO donations(id,user_id,amount,reference_id,status) VALUES(601,4,25,'reader-a-payment','pending'),(602,5,50,'reader-b-payment','pending');
INSERT INTO comment_reports(id,user_id,comment_id,reason,details,status) VALUES(401,5,301,'spam','Suspicious link','open');

INSERT INTO users(id,username,email,role) VALUES(1,'author-a','a@test','author'),(2,'author-b','b@test','author'),(3,'admin','admin@test','admin'),(4,'reader-a','reader-a@test','user'),(5,'reader-b','reader-b@test','user');
INSERT INTO novels(id,title,author,owner_user_id) VALUES(101,'A Novel','A',1),(202,'B Novel','B',2);
INSERT INTO chapters(id,novel_id,chapter_number,title,content) VALUES(1001,101,1,'A Chapter','A content'),(2001,202,1,'B Chapter','B content');
INSERT INTO ai_author_projects(id,owner_user_id,name) VALUES(11,1,'A Project'),(22,2,'B Project');
INSERT INTO ai_chapter_jobs(id,project_id,owner_user_id,chapter_number,status) VALUES(71,11,1,1,'complete'),(72,22,2,1,'complete');
INSERT INTO author_applications(id,user_id,display_name,bio,experience,preferred_formats,rights_confirmed,status,review_notes) VALUES(51,1,'Author A','A bio','A experience','["novel"]',1,'pending','A private review'),(52,2,'Author B','B bio','B experience','["comic"]',1,'rejected','B private review');
INSERT INTO ticket_ledger(id,user_id,delta,reason,reference) VALUES(31,1,-10,'unlock','A ledger'),(32,2,-20,'unlock','B ledger');
INSERT INTO novel_requests(id,user_id,url,source_host,week_key) VALUES(41,1,'https://example.test/a','example.test',2968),(42,1,'https://example.test/b','example.test',2968),(43,2,'https://example.test/c','example.test',2968);
`);
const digest=async v=>{const b=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v)));return btoa(String.fromCharCode(...b)).replaceAll("+","-").replaceAll("/","_").replaceAll("=","")};
const ta="author-a-token",tb="author-b-token",tc="admin-token",td="reader-a-token",te="reader-b-token";
db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(await digest(ta),1,Math.floor(Date.now()/1000)+3600);
db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(await digest(tb),2,Math.floor(Date.now()/1000)+3600);
db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(await digest(tc),3,Math.floor(Date.now()/1000)+3600);
db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(await digest(td),4,Math.floor(Date.now()/1000)+3600);
db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(await digest(te),5,Math.floor(Date.now()/1000)+3600);
class Stmt{constructor(sql){this.sql=sql;this.v=[]}bind(...v){this.v=v;return this}first(){return db.prepare(this.sql).get(...this.v)??null}all(){return{results:db.prepare(this.sql).all(...this.v)}}run(){const r=db.prepare(this.sql).run(...this.v);return{success:true,meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid||0)}}}}
const env={DB:{prepare:s=>new Stmt(s),batch:async statements=>statements.map(statement=>statement.run())},SITE_NAME:"Imperial Novel",APP_VERSION:"test",CONNECTOR_HOST_ALLOWLIST:"registry.example.test,unreviewed.example.test"};
async function req(path,token,method="GET",payload){const h=new Headers();if(token)h.set("cookie","session="+token);if(payload!==undefined)h.set("content-type","application/json");const r=await worker.fetch(new Request("https://test.invalid"+path,{method,headers:h,body:payload===undefined?undefined:JSON.stringify(payload)}),env);return{status:r.status,data:await r.json()}}
const a=await req("/api/author/novels",ta),b=await req("/api/author/novels",tb);
assert.equal(a.status,200);assert.equal(b.status,200);assert.deepEqual(a.data.map(x=>+x.id),[101]);assert.deepEqual(b.data.map(x=>+x.id),[202]);
const pa=await req("/api/author/ai/projects",ta),pb=await req("/api/author/ai/projects",tb);
assert.equal(pa.status,200);assert.equal(pb.status,200);assert.deepEqual(pa.data.map(x=>+x.id),[11]);assert.deepEqual(pb.data.map(x=>+x.id),[22]);
const ca=await req("/api/author/chapters?novel_id=101",ta),cb=await req("/api/author/chapters?novel_id=202",tb);
const xa=await req("/api/author/chapters?novel_id=202",ta),xb=await req("/api/author/chapters?novel_id=101",tb);
assert.equal(ca.status,200);assert.equal(cb.status,200);assert.deepEqual(ca.data.map(x=>+x.id),[1001]);assert.deepEqual(cb.data.map(x=>+x.id),[2001]);assert.equal(xa.status,403);assert.equal(xb.status,403);

assert.equal((await req("/api/author/ai/projects/11",tb,"PATCH",{name:"Compromised Project"})).status,403,"author B cannot mutate author A's AI project");
assert.equal(db.prepare("SELECT name FROM ai_author_projects WHERE id=11").get().name,"A Project","cross-owner AI project mutation leaves the record unchanged");
assert.equal((await req("/api/author/ai/projects/11",ta,"PATCH",{name:"A Updated Project"})).status,200,"project owner can update their own AI project");
assert.equal(db.prepare("SELECT name FROM ai_author_projects WHERE id=11").get().name,"A Updated Project","owner update is persisted");
assert.equal((await req("/api/author/ai/projects/11/jobs",tb)).status,403,"author B cannot read author A's AI job history");
const ownerJobs=await req("/api/author/ai/projects/11/jobs",ta);
assert.equal(ownerJobs.status,200,"project owner can read their own AI job history");
assert.deepEqual(ownerJobs.data.map(x=>+x.id),[71],"job history is scoped to the owned project");
assert.equal((await req("/api/author/ai/projects/11/blueprint",tb,"POST",{})).status,403,"cross-owner blueprint requests are denied before provider availability is disclosed");
assert.equal((await req("/api/author/ai/projects/11/run",tb,"POST",{})).status,403,"cross-owner generation runs are denied before provider availability is disclosed");
assert.equal((await req("/api/author/ai/projects/11/blueprint",ta,"POST",{})).status,503,"owner receives the expected unconfigured-provider response");
assert.equal((await req("/api/author/ai/projects/11/run",ta,"POST",{})).status,503,"owner receives the expected unconfigured-provider response");
assert.equal(db.prepare("SELECT status FROM ai_author_projects WHERE id=11").get().status,"draft","unconfigured generation attempts do not mutate project status");
assert.equal(db.prepare("SELECT COUNT(*) n FROM ai_chapter_jobs WHERE project_id=11").get().n,1,"unconfigured generation attempts do not create jobs");

assert.equal((await req("/api/author/chapters",tb,"POST",{novel_id:101,chapter_number:2,title:"Unauthorized Chapter",content:"This must not be written."})).status,403,"author B cannot create a chapter in author A's novel");
assert.equal(db.prepare("SELECT COUNT(*) n FROM chapters WHERE novel_id=101 AND chapter_number=2").get().n,0,"rejected cross-owner chapter creation writes no row");
const createdChapter=await req("/api/author/chapters",ta,"POST",{novel_id:101,chapter_number:2,title:"Owner Chapter",content:"An original chapter draft."});
assert.equal(createdChapter.status,201,"novel owner can create a chapter draft");
assert.equal(db.prepare("SELECT COUNT(*) n FROM chapters WHERE novel_id=101 AND chapter_number=2").get().n,1,"owner chapter draft is persisted");
assert.equal((await req("/api/author/chapters/1001",tb,"PATCH",{title:"Hijacked Chapter"})).status,403,"author B cannot mutate author A's existing chapter");
assert.equal(db.prepare("SELECT title FROM chapters WHERE id=1001").get().title,"A Chapter","rejected chapter mutation leaves original content unchanged");

assert.equal((await req("/api/author/chapters/1001/publish",tb,"POST",{publication_status:"published"})).status,403,"author B cannot publish a chapter in author A's novel");
assert.equal(db.prepare("SELECT publication_status FROM chapters WHERE id=1001").get().publication_status,"draft","rejected cross-owner chapter publication leaves status unchanged");
assert.equal((await req("/api/author/chapters/1001/publish",ta,"POST",{publication_status:"published"})).status,200,"novel owner can publish their own eligible chapter");
assert.equal(db.prepare("SELECT publication_status FROM chapters WHERE id=1001").get().publication_status,"published","owner publication updates the chapter status");
assert.equal((await req("/api/author/chapters/1001/publish",ta,"POST",{publication_status:"draft"})).status,200,"novel owner can return their own chapter to draft");

assert.equal((await req("/api/author/novels/101",tb,"PATCH",{title:"Hijacked Novel"})).status,403,"author B cannot mutate author A's novel metadata");
assert.equal(db.prepare("SELECT title FROM novels WHERE id=101").get().title,"A Novel","rejected cross-owner novel mutation leaves metadata unchanged");
assert.equal((await req("/api/author/novels/101/submit",tb,"POST",{})).status,403,"author B cannot submit author A's novel for publication review");
assert.equal(db.prepare("SELECT publication_status FROM novels WHERE id=101").get().publication_status,"draft","rejected cross-owner submission leaves publication state unchanged");
assert.equal((await req("/api/author/novels/101",ta,"PATCH",{title:"A Novel Updated",description:"Owner-authored description"})).status,200,"novel owner can update their own metadata");
assert.equal(db.prepare("SELECT title,description FROM novels WHERE id=101").get().title,"A Novel Updated","owner novel metadata update is persisted");
assert.equal((await req("/api/author/novels/101/submit",ta,"POST",{})).status,200,"novel owner can submit their own rights-declared original work for review");
assert.equal(db.prepare("SELECT publication_status FROM novels WHERE id=101").get().publication_status,"review","owner submission moves the novel into review, not public publication");

assert.equal((await req("/api/author/novels",null)).status,403,"unauthenticated callers must be denied by the author-role guard");

const validApplication=(display_name)=>({display_name,bio:"I write original stories with consistent characters, thoughtful worldbuilding, and a long-term commitment to readers.",experience:"Independent writing practice",sample_work:"Original sample. ".repeat(20),preferred_formats:["original","web_novel"],rights_confirmed:true});
const submittedA=await req("/api/author/applications",td,"POST",validApplication("Reader A"));
const submittedB=await req("/api/author/applications",te,"POST",validApplication("Reader B"));
assert.equal(submittedA.status,201,"reader A can submit a valid rights-confirmed application");
assert.equal(submittedB.status,201,"reader B can submit an independent application");
assert.equal((await req("/api/author/applications/me",td)).data.application.id,submittedA.data.id,"applicant sees own newly submitted application");
assert.equal((await req("/api/author/applications/me",te)).data.application.id,submittedB.data.id,"second applicant sees own newly submitted application");
assert.equal((await req("/api/author/applications/me",td)).data.application.display_name,"Reader A","reader A sees only their own application");
const initialReaderTickets=db.prepare("SELECT tickets FROM users WHERE id=4").get().tickets;
const initialLedgerRows=db.prepare("SELECT COUNT(*) n FROM ticket_ledger WHERE user_id=4").get().n;
for (const [token,label] of [[ta,"author"],[td,"reader"],[null,"unauthenticated caller"]]) {
  assert.equal((await req("/api/admin/tickets",token,"POST",{user_id:4,amount:25})).status,403, label+" cannot credit Crown balances");
  assert.equal(db.prepare("SELECT tickets FROM users WHERE id=4").get().tickets,initialReaderTickets,label+" denied credit leaves balance unchanged");
  assert.equal(db.prepare("SELECT COUNT(*) n FROM ticket_ledger WHERE user_id=4").get().n,initialLedgerRows,label+" denied credit creates no ledger row");
}
const credited=await req("/api/admin/tickets",tc,"POST",{user_id:4,amount:25});
assert.equal(credited.status,200,"admin can credit a valid account");
assert.equal(db.prepare("SELECT tickets FROM users WHERE id=4").get().tickets,initialReaderTickets+25,"admin credit updates the intended account");
assert.equal(db.prepare("SELECT COUNT(*) n FROM ticket_ledger WHERE user_id=4 AND reason='admin_adjustment'").get().n,1,"admin credit creates its matching ledger entry");
assert.equal((await req("/api/admin/users",tc)).status,200,"admin can read user administration list");
for (const [token,label] of [[ta,"author"],[td,"reader"],[null,"unauthenticated caller"]]) assert.equal((await req("/api/admin/users",token)).status,403,label+" cannot read user administration list");
assert.equal((await req("/api/admin/stats",tc)).status,200,"admin can read administrative dashboard statistics");
for (const [token,label] of [[ta,"author"],[td,"reader"],[null,"unauthenticated caller"]]) assert.equal((await req("/api/admin/stats",token)).status,403,label+" cannot read administrative dashboard statistics");
const donationA=db.prepare("SELECT tickets FROM users WHERE id=4").get().tickets;
const donationLedgerA=db.prepare("SELECT COUNT(*) n FROM ticket_ledger WHERE user_id=4").get().n;
for (const [token,label] of [[ta,"author"],[td,"reader"],[null,"unauthenticated caller"]]) {
  assert.equal((await req("/api/admin/donations/601",token,"PATCH",{status:"approved"})).status,403,label+" cannot approve donations");
  assert.equal(db.prepare("SELECT status FROM donations WHERE id=601").get().status,"pending",label+" denied donation approval leaves payment pending");
  assert.equal(db.prepare("SELECT tickets FROM users WHERE id=4").get().tickets,donationA,label+" denied donation approval does not credit Crown balance");
  assert.equal(db.prepare("SELECT COUNT(*) n FROM ticket_ledger WHERE user_id=4").get().n,donationLedgerA,label+" denied donation approval creates no ledger row");
}
assert.equal((await req("/api/admin/donations/601",tc,"PATCH",{status:"approved"})).status,200,"admin can approve a pending donation");
assert.equal(db.prepare("SELECT status FROM donations WHERE id=601").get().status,"approved","admin donation approval is persisted");
assert.equal(db.prepare("SELECT tickets FROM users WHERE id=4").get().tickets,donationA+25,"approved donation credits the correct account");
assert.equal(db.prepare("SELECT COUNT(*) n FROM ticket_ledger WHERE user_id=4 AND reason='payment' AND reference='601'").get().n,1,"approved donation writes its matching payment ledger row");
assert.equal((await req("/api/admin/donations/602",tc,"PATCH",{status:"rejected"})).status,200,"admin can reject a pending donation");
assert.equal(db.prepare("SELECT status FROM donations WHERE id=602").get().status,"rejected","admin donation rejection is persisted");
assert.equal(db.prepare("SELECT tickets FROM users WHERE id=5").get().tickets,0,"rejected donation does not credit Crown balance");
assert.equal((await req("/api/admin/donations/602",tc,"PATCH",{status:"approved"})).status,409,"processed donations cannot be approved a second time");
assert.equal((await req("/api/admin/community/comments",tc)).status,200,"admin can read community moderation comments");
assert.equal((await req("/api/admin/community/reports",tc)).status,200,"admin can read community moderation reports");
const auditCountBeforeDeniedModeration=db.prepare("SELECT COUNT(*) n FROM audit_logs").get().n;
for (const [token,label] of [[ta,"author"],[td,"reader"],[null,"unauthenticated caller"]]) {
  assert.equal((await req("/api/admin/community/comments",token)).status,403,label+" cannot read private moderation comments");
  assert.equal((await req("/api/admin/community/reports",token)).status,403,label+" cannot read private moderation reports");
  assert.equal((await req("/api/admin/community/comments",token,"PATCH",{comment_id:301,status:"hidden"})).status,403,label+" cannot moderate comments");
  assert.equal(db.prepare("SELECT status FROM comments WHERE id=301").get().status,"visible",label+" denied comment moderation leaves comment unchanged");
  assert.equal((await req("/api/admin/community/reports",token,"PATCH",{report_id:401,status:"resolved"})).status,403,label+" cannot resolve community reports");
  assert.equal(db.prepare("SELECT status FROM comment_reports WHERE id=401").get().status,"open",label+" denied report review leaves report unchanged");
  assert.equal(db.prepare("SELECT COUNT(*) n FROM audit_logs").get().n,auditCountBeforeDeniedModeration,label+" denied moderation creates no audit entry");
}
assert.equal((await req("/api/admin/community/comments",tc,"PATCH",{comment_id:301,status:"hidden"})).status,200,"admin can hide a reported comment");
assert.equal(db.prepare("SELECT status FROM comments WHERE id=301").get().status,"hidden","admin comment moderation is persisted");
assert.equal((await req("/api/admin/community/reports",tc,"PATCH",{report_id:401,status:"resolved"})).status,200,"admin can resolve a community report");
assert.equal(db.prepare("SELECT status FROM comment_reports WHERE id=401").get().status,"resolved","admin report decision is persisted");
assert.equal(db.prepare("SELECT action FROM audit_logs ORDER BY id DESC LIMIT 1").get().action,"community_report_resolved","report decision is recorded in audit log");
const originalNovelStatus=db.prepare("SELECT publication_status FROM novels WHERE id=101").get().publication_status;
for (const [token,label] of [[ta,"author"],[td,"reader"],[null,"unauthenticated caller"]]) {
  assert.equal((await req("/api/admin/publishing/novels/101",token,"PATCH",{publication_status:"published"})).status,403,label+" cannot approve or publish a novel");
  assert.equal(db.prepare("SELECT publication_status FROM novels WHERE id=101").get().publication_status,originalNovelStatus,label+" denied publication review leaves the novel unchanged");
  assert.equal((await req("/api/admin/publishing/chapters",token,"POST",{novel_id:101,chapter_number:9,title:"Unauthorized chapter",content:"Must not be inserted"})).status,403,label+" cannot create chapters through admin publishing");
  assert.equal(db.prepare("SELECT COUNT(*) n FROM chapters WHERE novel_id=101 AND chapter_number=9").get().n,0,label+" denied chapter creation inserts no row");
}
const adminReview=await req("/api/admin/publishing/novels/101",tc,"PATCH",{publication_status:"review",review_feedback:"Rights and editorial review completed."});
assert.equal(adminReview.status,200,"admin can move a novel into review");
assert.equal(db.prepare("SELECT publication_status FROM novels WHERE id=101").get().publication_status,"review","admin publication review status is persisted");
const adminChapter=await req("/api/admin/publishing/chapters",tc,"POST",{novel_id:101,chapter_number:9,title:"Admin Draft Chapter",content:"Administrator-created editorial draft.",publication_status:"draft"});
assert.equal(adminChapter.status,200,"admin can create an editorial chapter draft");
assert.equal(db.prepare("SELECT title,publication_status FROM chapters WHERE novel_id=101 AND chapter_number=9").get().title,"Admin Draft Chapter","admin chapter draft is persisted");
assert.equal(db.prepare("SELECT publication_status FROM chapters WHERE novel_id=101 AND chapter_number=9").get().publication_status,"draft","admin chapter creation does not silently publish content");
const adminApplicationList=await req("/api/admin/author-applications",tc);
assert.equal(adminApplicationList.status,200,"admin can read the author application queue");
assert.deepEqual(adminApplicationList.data.map(x=>+x.id).sort((x,y)=>x-y),[51,submittedA.data.id,submittedB.data.id].sort((x,y)=>x-y),"admin queue contains the submitted applications");
assert.equal((await req("/api/admin/author-applications",ta)).status,403,"authors cannot read the private admin application queue");
assert.equal((await req("/api/admin/author-applications",td)).status,403,"reader accounts cannot read the private admin application queue");
assert.equal((await req("/api/admin/author-applications",null)).status,403,"unauthenticated callers cannot read the private admin application queue");
assert.equal((await req("/api/admin/author-applications/"+submittedA.data.id,ta,"PATCH",{status:"approved",review_notes:"Approved by a non-admin"})).status,403,"authors cannot review applications");
assert.equal((await req("/api/admin/author-applications/"+submittedA.data.id,tc,"PATCH",{status:"approved",review_notes:"Application reviewed and approved."})).status,200,"admin can approve a pending application");
assert.equal(db.prepare("SELECT role FROM users WHERE id=4").get().role,"author","approval grants author role to the correct applicant");
assert.equal(db.prepare("SELECT status FROM author_applications WHERE id=?").get(submittedA.data.id).status,"approved","approval changes application status");
assert.equal((await req("/api/author/applications/me",td)).data.application.review_notes,"Application reviewed and approved.","applicant can read own admin review notes");
assert.equal((await req("/api/admin/author-applications/"+submittedB.data.id,tc,"PATCH",{status:"rejected",review_notes:"Please provide a clearer original sample."})).status,200,"admin can reject with feedback");
assert.equal(db.prepare("SELECT role FROM users WHERE id=5").get().role,"user","rejection does not grant author role");
assert.equal((await req("/api/admin/author-applications/"+submittedB.data.id,tc,"PATCH",{status:"approved",review_notes:"Second decision"})).status,409,"reviewed applications cannot be decided twice");
assert.equal((await req("/api/admin/author-applications/99999",tc,"PATCH",{status:"approved",review_notes:"Valid note"})).status,404,"missing application returns not found");


const connectorList=await req("/api/admin/connectors",tc);
assert.equal(connectorList.status,200,"admin can inspect connector authorization state");
assert.equal(connectorList.data.find(x=>+x.id===701).rights_status,"pending","new connector starts pending");
for(const [token,label] of [[ta,"author"],[td,"reader"],[null,"unauthenticated caller"]]) {
  assert.equal((await req("/api/admin/connectors",token)).status,403,label+" cannot inspect connector administration");
  assert.equal((await req("/api/admin/connectors/701",token,"PATCH",{enabled:true,rights_status:"authorized",rights_evidence_url:"https://rights.example.test/license"})).status,404,label+" cannot use an unknown connector route");
  assert.equal((await req("/api/admin/connector-authorization-requests",token)).status,403,label+" cannot inspect private connector rights requests");
}
assert.equal((await req("/api/admin/connectors",tc,"PATCH",{id:702,enabled:true,rights_status:"pending"})).status,400,"pending connector cannot be enabled");
assert.equal(db.prepare("SELECT enabled,rights_status FROM connectors WHERE id=702").get().enabled,0,"failed enable attempt leaves connector disabled");
const requestA=await req("/api/connector-authorization-requests",td,"POST",{connector_id:701,evidence_url:"https://rights.example.test/registry-license",notes:"Metadata-only permission; no chapter-body ingestion.",metadata_import_allowed:true,attribution_required:true});
assert.equal(requestA.status,200,"reader can submit a connector rights request");
const authorizationA=db.prepare("SELECT * FROM connector_authorization_requests WHERE id=?").get(requestA.data.request_id);
assert.equal(authorizationA.user_id,4,"connector requester identity is derived from the authenticated session");
assert.equal(authorizationA.status,"pending","submitted connector rights request remains pending");
for(const [token,label] of [[ta,"author"],[td,"reader"],[null,"unauthenticated caller"]]) {
  assert.equal((await req("/api/admin/connector-authorization-requests/"+requestA.data.request_id,token,"PATCH",{status:"approved"})).status,403,label+" cannot approve connector rights");
  assert.equal(db.prepare("SELECT status FROM connector_authorization_requests WHERE id=?").get(requestA.data.request_id).status,"pending",label+" denied connector review leaves request pending");
}
assert.equal((await req("/api/admin/connectors",ta,"PATCH",{id:701,enabled:true,rights_status:"authorized",rights_evidence_url:"https://rights.example.test/license"})).status,403,"non-admin cannot directly authorize or enable a connector");
assert.equal(db.prepare("SELECT enabled,rights_status FROM connectors WHERE id=701").get().enabled,0,"non-admin connector mutation leaves connector disabled");
const reviewed=await req("/api/admin/connector-authorization-requests/"+requestA.data.request_id,tc,"PATCH",{status:"approved",review_notes:"Evidence reviewed; metadata-only access approved."});
assert.equal(reviewed.status,200,"admin can approve a rights-evidenced connector request");
const authorized=db.prepare("SELECT enabled,rights_status,rights_evidence_url,metadata_import_allowed,attribution_required FROM connectors WHERE id=701").get();
assert.equal(authorized.rights_status,"authorized","approved request authorizes connector rights");
assert.equal(authorized.enabled,0,"rights approval does not silently enable external access");
assert.equal(authorized.rights_evidence_url,"https://rights.example.test/registry-license","reviewed evidence is attached to connector");
assert.equal(authorized.metadata_import_allowed,1,"approved metadata-import permission is persisted");
assert.equal(authorized.attribution_required,1,"approved attribution requirement is persisted");
const enabled=await req("/api/admin/connectors",tc,"PATCH",{id:701,enabled:true,rights_status:"authorized",rights_evidence_url:"https://rights.example.test/registry-license",search_url:"https://api.registry.example.test/search?q={q}",metadata_import_allowed:true,attribution_required:true});
assert.equal(enabled.status,200,"admin can enable only the explicitly rights-authorized connector");
assert.equal(db.prepare("SELECT enabled FROM connectors WHERE id=701").get().enabled,1,"authorized connector enablement is persisted");
const requestB=await req("/api/connector-authorization-requests",te,"POST",{connector_id:702,terms_url:"https://unreviewed.example.test/terms",notes:"Second account request."});
assert.equal(requestB.status,200,"a second account can submit a separate connector rights request");
assert.equal(db.prepare("SELECT user_id FROM connector_authorization_requests WHERE id=?").get(requestB.data.request_id).user_id,5,"second request is attributed to the second authenticated account");
assert.equal((await req("/api/admin/connector-authorization-requests/"+requestB.data.request_id,tc,"PATCH",{status:"rejected",review_notes:"Insufficient rights for import."})).status,200,"admin can reject a connector rights request");
assert.equal(db.prepare("SELECT status FROM connector_authorization_requests WHERE id=?").get(requestB.data.request_id).status,"rejected","rejection is persisted");
assert.equal(db.prepare("SELECT rights_status,enabled FROM connectors WHERE id=702").get().rights_status,"rejected","rejected rights request leaves connector unauthorized");
assert.equal(db.prepare("SELECT enabled FROM connectors WHERE id=702").get().enabled,0,"rejected connector remains disabled");

db.close();console.log("PASS: two-author Worker/SQLite isolation for novel lists, AI project lists, chapter workspaces, cross-owner read and write denials, AI project update isolation, chapter creation and update ownership, ticket-ledger isolation, per-user request quotas, applicant-private application records, valid application submission, admin-only application review, approval/rejection role transitions, immutable final decisions, and unauthenticated access.");
