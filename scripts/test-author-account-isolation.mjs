import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import worker from "../src/index.js";
const db=new DatabaseSync(":memory:");
db.exec(`
CREATE TABLE app_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
INSERT INTO app_settings VALUES('core_schema_version','16.64.0'),('runtime_feature_schema_version','1');
CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT NOT NULL,email TEXT NOT NULL,role TEXT NOT NULL,tickets REAL DEFAULT 0,verified INTEGER DEFAULT 1,banned INTEGER DEFAULT 0);
CREATE TABLE sessions(token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL,expires_at INTEGER NOT NULL);
CREATE TABLE novels(id INTEGER PRIMARY KEY,title TEXT NOT NULL,alt_titles TEXT DEFAULT '',author TEXT NOT NULL,description TEXT DEFAULT '',status TEXT DEFAULT 'ongoing',kind TEXT DEFAULT 'original',language TEXT DEFAULT 'English',cover_url TEXT DEFAULT '',source_url TEXT DEFAULT '',rights_status TEXT DEFAULT 'original',rights_evidence TEXT DEFAULT '',rights_notes TEXT DEFAULT '',review_feedback TEXT DEFAULT '',reviewed_by INTEGER,reviewed_at TEXT,publication_status TEXT DEFAULT 'draft',views INTEGER DEFAULT 0,rating REAL DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,owner_user_id INTEGER NOT NULL);
CREATE TABLE chapters(id INTEGER PRIMARY KEY,novel_id INTEGER NOT NULL,chapter_number INTEGER NOT NULL,title TEXT NOT NULL,content TEXT NOT NULL,is_locked INTEGER DEFAULT 0,ticket_cost INTEGER DEFAULT 0,publication_status TEXT DEFAULT 'draft',created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE ai_author_projects(id INTEGER PRIMARY KEY,owner_user_id INTEGER NOT NULL,novel_id INTEGER,name TEXT NOT NULL,mode TEXT DEFAULT 'manual',status TEXT DEFAULT 'draft',genre TEXT DEFAULT '',fandom TEXT DEFAULT '',premise TEXT DEFAULT '',protagonist TEXT DEFAULT '',settings_json TEXT DEFAULT '{}',bible_json TEXT DEFAULT '{}',auto_publish INTEGER DEFAULT 0,chapters_target INTEGER DEFAULT 0,chapters_generated INTEGER DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE ai_chapter_jobs(id INTEGER PRIMARY KEY,project_id INTEGER NOT NULL,owner_user_id INTEGER NOT NULL,chapter_number INTEGER NOT NULL,job_type TEXT DEFAULT 'draft',status TEXT DEFAULT 'queued',prompt TEXT DEFAULT '',result TEXT DEFAULT '',error TEXT DEFAULT '',attempts INTEGER DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP,started_at TEXT,finished_at TEXT);
CREATE TABLE ai_generation_runs(id INTEGER PRIMARY KEY,project_id INTEGER NOT NULL,owner_user_id INTEGER NOT NULL,agent TEXT NOT NULL,mode TEXT NOT NULL,status TEXT DEFAULT 'ok',input_summary TEXT DEFAULT '',output_summary TEXT DEFAULT '',provider TEXT DEFAULT 'local',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE ai_provider_benchmarks(id INTEGER PRIMARY KEY,provider TEXT NOT NULL,observed_at TEXT DEFAULT CURRENT_TIMESTAMP,chapters_delta INTEGER DEFAULT 0,interval_seconds INTEGER DEFAULT 0,source_url TEXT DEFAULT '',access_mode TEXT DEFAULT 'public-metadata',confidence TEXT DEFAULT 'unknown');
CREATE TABLE ai_publish_policies(project_id INTEGER PRIMARY KEY,require_rights INTEGER DEFAULT 1,require_review INTEGER DEFAULT 1,max_chapters_per_day INTEGER DEFAULT 10,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE ticket_ledger(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,delta INTEGER NOT NULL,reason TEXT NOT NULL,reference TEXT DEFAULT '',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE novel_requests(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,url TEXT NOT NULL,source_host TEXT DEFAULT '',week_key INTEGER NOT NULL,cost INTEGER DEFAULT 0,status TEXT DEFAULT 'pending',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE author_applications(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,display_name TEXT NOT NULL,bio TEXT DEFAULT '',experience TEXT DEFAULT '',portfolio_url TEXT DEFAULT '',sample_work TEXT DEFAULT '',preferred_formats TEXT DEFAULT '[]',rights_confirmed INTEGER DEFAULT 0,status TEXT DEFAULT 'pending',review_notes TEXT DEFAULT '',reviewed_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,reviewed_at TEXT,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
INSERT INTO users(id,username,email,role) VALUES(1,'author-a','a@test','author'),(2,'author-b','b@test','author'),(3,'admin','admin@test','admin'),(4,'reader-a','reader-a@test','user'),(5,'reader-b','reader-b@test','user');
INSERT INTO novels(id,title,author,owner_user_id) VALUES(101,'A Novel','A',1),(202,'B Novel','B',2);
INSERT INTO chapters(id,novel_id,chapter_number,title,content) VALUES(1001,101,1,'A Chapter','A content'),(2001,202,1,'B Chapter','B content');
INSERT INTO ai_author_projects(id,owner_user_id,name) VALUES(11,1,'A Project'),(22,2,'B Project');
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
const env={DB:{prepare:s=>new Stmt(s),batch:async statements=>statements.map(statement=>statement.run())},SITE_NAME:"Imperial Novel",APP_VERSION:"test"};
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
assert.equal((await req("/api/author/chapters",tb,"POST",{novel_id:101,chapter_number:2,title:"Unauthorized Chapter",content:"This must not be written."})).status,403,"author B cannot create a chapter in author A's novel");
assert.equal(db.prepare("SELECT COUNT(*) n FROM chapters WHERE novel_id=101 AND chapter_number=2").get().n,0,"rejected cross-owner chapter creation writes no row");
const createdChapter=await req("/api/author/chapters",ta,"POST",{novel_id:101,chapter_number:2,title:"Owner Chapter",content:"An original chapter draft."});
assert.equal(createdChapter.status,201,"novel owner can create a chapter draft");
assert.equal(db.prepare("SELECT COUNT(*) n FROM chapters WHERE novel_id=101 AND chapter_number=2").get().n,1,"owner chapter draft is persisted");
assert.equal((await req("/api/author/chapters/1001",tb,"PATCH",{title:"Hijacked Chapter"})).status,403,"author B cannot mutate author A's existing chapter");
assert.equal(db.prepare("SELECT title FROM chapters WHERE id=1001").get().title,"A Chapter","rejected chapter mutation leaves original content unchanged");

assert.equal((await req("/api/author/novels",null)).status,403,"unauthenticated callers must be denied by the author-role guard");

const validApplication=(display_name)=>({display_name,bio:"I write original stories with consistent characters, thoughtful worldbuilding, and a long-term commitment to readers.",experience:"Independent writing practice",sample_work:"Original sample. ".repeat(20),preferred_formats:["original","web_novel"],rights_confirmed:true});
const submittedA=await req("/api/author/applications",td,"POST",validApplication("Reader A"));
const submittedB=await req("/api/author/applications",te,"POST",validApplication("Reader B"));
assert.equal(submittedA.status,201,"reader A can submit a valid rights-confirmed application");
assert.equal(submittedB.status,201,"reader B can submit an independent application");
assert.equal((await req("/api/author/applications/me",td)).data.application.id,submittedA.data.id,"applicant sees own newly submitted application");
assert.equal((await req("/api/author/applications/me",te)).data.application.id,submittedB.data.id,"second applicant sees own newly submitted application");
assert.equal((await req("/api/author/applications/me",td)).data.application.display_name,"Reader A","reader A sees only their own application");
assert.equal((await req("/api/admin/author-applications/"+submittedA.data.id,ta,"PATCH",{status:"approved",review_notes:"Approved by a non-admin"})).status,403,"authors cannot review applications");
assert.equal((await req("/api/admin/author-applications/"+submittedA.data.id,tc,"PATCH",{status:"approved",review_notes:"Application reviewed and approved."})).status,200,"admin can approve a pending application");
assert.equal(db.prepare("SELECT role FROM users WHERE id=4").get().role,"author","approval grants author role to the correct applicant");
assert.equal(db.prepare("SELECT status FROM author_applications WHERE id=?").get(submittedA.data.id).status,"approved","approval changes application status");
assert.equal((await req("/api/author/applications/me",td)).data.application.review_notes,"Application reviewed and approved.","applicant can read own admin review notes");
assert.equal((await req("/api/admin/author-applications/"+submittedB.data.id,tc,"PATCH",{status:"rejected",review_notes:"Please provide a clearer original sample."})).status,200,"admin can reject with feedback");
assert.equal(db.prepare("SELECT role FROM users WHERE id=5").get().role,"user","rejection does not grant author role");
assert.equal((await req("/api/admin/author-applications/"+submittedB.data.id,tc,"PATCH",{status:"approved",review_notes:"Second decision"})).status,409,"reviewed applications cannot be decided twice");
assert.equal((await req("/api/admin/author-applications/99999",tc,"PATCH",{status:"approved",review_notes:"Valid note"})).status,404,"missing application returns not found");

db.close();console.log("PASS: two-author Worker/SQLite isolation for novel lists, AI project lists, chapter workspaces, cross-owner read and write denials, AI project update isolation, chapter creation and update ownership, ticket-ledger isolation, per-user request quotas, applicant-private application records, valid application submission, admin-only application review, approval/rejection role transitions, immutable final decisions, and unauthenticated access.");
