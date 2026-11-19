import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import worker from "../src/index.js";

const database = new DatabaseSync(":memory:");
database.exec(`
CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT INTO app_settings(key,value) VALUES ('core_schema_version','16.64.0'),('runtime_feature_schema_version','1');
CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT NOT NULL, email TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user', tickets REAL NOT NULL DEFAULT 0, verified INTEGER NOT NULL DEFAULT 1, banned INTEGER NOT NULL DEFAULT 0);
CREATE TABLE sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE novels (id INTEGER PRIMARY KEY, title TEXT NOT NULL, author TEXT NOT NULL, cover_url TEXT DEFAULT '', rating REAL DEFAULT 0, status TEXT DEFAULT 'ongoing', publication_status TEXT NOT NULL DEFAULT 'published', rights_status TEXT NOT NULL DEFAULT 'original', updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE chapters (id INTEGER PRIMARY KEY, novel_id INTEGER NOT NULL, chapter_number INTEGER NOT NULL, publication_status TEXT NOT NULL DEFAULT 'published', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE user_library (user_id INTEGER NOT NULL, novel_id INTEGER NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id,novel_id));
CREATE TABLE history (user_id INTEGER NOT NULL, novel_id INTEGER NOT NULL, chapter_number INTEGER NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id,novel_id));
CREATE TABLE bookmarks (user_id INTEGER NOT NULL, novel_id INTEGER NOT NULL, chapter_number INTEGER NOT NULL DEFAULT 1, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id,novel_id));
CREATE TABLE follows (user_id INTEGER NOT NULL, novel_id INTEGER NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id,novel_id));
CREATE TABLE notifications (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, read_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
INSERT INTO users(id,username,email,role) VALUES (1,'reader-a','a@example.test','user'),(2,'reader-b','b@example.test','user');
INSERT INTO novels(id,title,author) VALUES (101,'Novel A','Author A'),(202,'Novel B','Author B');
INSERT INTO novels(id,title,author,publication_status,rights_status) VALUES (303,'Draft Novel','Author C','draft','original'),(404,'Uncleared Novel','Author D','published','pending');
INSERT INTO chapters(id,novel_id,chapter_number) VALUES (1001,101,1),(2001,202,2),(3001,303,1),(4001,404,1);
INSERT INTO user_library(user_id,novel_id) VALUES (1,101),(2,202);
INSERT INTO history(user_id,novel_id,chapter_number) VALUES (1,101,1),(2,202,2);
INSERT INTO bookmarks(user_id,novel_id,chapter_number) VALUES (1,101,1),(2,202,2);
INSERT INTO follows(user_id,novel_id) VALUES (1,101),(2,202);
INSERT INTO notifications(id,user_id,title,body) VALUES (11,1,'A only','Private A'),(22,2,'B only','Private B');
`);

const digest = async value => {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  return btoa(String.fromCharCode(...bytes)).replaceAll("+","-").replaceAll("/","_").replaceAll("=","");
};
const tokenA = "test-session-reader-a";
const tokenB = "test-session-reader-b";
database.prepare("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)").run(await digest(tokenA),1,Math.floor(Date.now()/1000)+3600);
database.prepare("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)").run(await digest(tokenB),2,Math.floor(Date.now()/1000)+3600);

class LocalD1Statement {
  constructor(sql) { this.sql=sql; this.values=[]; }
  bind(...values) { this.values=values; return this; }
  first() { return database.prepare(this.sql).get(...this.values) ?? null; }
  all() { return { results: database.prepare(this.sql).all(...this.values) }; }
  run() {
    const result=database.prepare(this.sql).run(...this.values);
    return { success:true, meta:{ changes:Number(result.changes), last_row_id:Number(result.lastInsertRowid||0) } };
  }
}
const DB = { prepare(sql) { return new LocalD1Statement(sql); } };
const env = { DB, SITE_NAME:"Imperial Novel", APP_VERSION:"test" };

async function request(path, token, method="GET", body) {
  const headers = new Headers();
  if(token) headers.set("cookie","session="+encodeURIComponent(token));
  if(body!==undefined) headers.set("content-type","application/json");
  const response=await worker.fetch(new Request("https://imperial.test"+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)}),env);
  const text=await response.text();
  let data=null; try { data=JSON.parse(text); } catch {}
  return { response, data, text };
}
async function ids(path,token) {
  const {response,data}=await request(path,token);
  assert.equal(response.status,200,path+" should be available to an authenticated reader");
  return data.map(row=>Number(row.id??row.novel_id));
}

// The real Worker sitemap handler queries this same D1-compatible database.
let sitemap=await request("/sitemap.xml",null);
assert.equal(sitemap.response.status,200);
assert.match(sitemap.response.headers.get("content-type")||"",/application\/xml/);
assert.ok(sitemap.text.includes("/sitemap-static.xml"));
assert.ok(sitemap.text.includes("/sitemap-novels.xml?page=0"));
assert.ok(sitemap.text.includes("/sitemap-chapters.xml?page=0"));
sitemap=await request("/sitemap-novels.xml?page=0",null);
assert.equal(sitemap.response.status,200);
assert.ok(sitemap.text.includes("/novel/101")&&sitemap.text.includes("/novel/202"));
assert.ok(!sitemap.text.includes("/novel/303")&&!sitemap.text.includes("/novel/404"),"draft and rights-pending novels must never enter the sitemap");
sitemap=await request("/sitemap-chapters.xml?page=0",null);
assert.equal(sitemap.response.status,200);
assert.ok(sitemap.text.includes("/read/101/1")&&sitemap.text.includes("/read/202/2"));
assert.ok(!sitemap.text.includes("/read/303/1")&&!sitemap.text.includes("/read/404/1"),"chapters of draft or rights-pending novels must never enter the sitemap");
sitemap=await request("/sitemap-novels.xml?page=-1",null);
assert.equal(sitemap.response.status,400,"invalid sitemap page numbers must be rejected");

// Each reader can see only their own library, progress, bookmarks, follows and notifications.
assert.deepEqual(await ids("/api/library",tokenA),[101]);
assert.deepEqual(await ids("/api/library",tokenB),[202]);
assert.deepEqual(await ids("/api/history",tokenA),[101]);
assert.deepEqual(await ids("/api/history",tokenB),[202]);
assert.deepEqual(await ids("/api/bookmarks",tokenA),[101]);
assert.deepEqual(await ids("/api/bookmarks",tokenB),[202]);
assert.deepEqual(await ids("/api/follows",tokenA),[101]);
assert.deepEqual(await ids("/api/follows",tokenB),[202]);
assert.deepEqual(await ids("/api/notifications",tokenA),[11]);
assert.deepEqual(await ids("/api/notifications",tokenB),[22]);

// Reader A mutates shared novel targets, but only A's account rows may change.
let result=await request("/api/library",tokenA,"POST",{novel_id:202});
assert.equal(result.response.status,200);
assert.equal(database.prepare("SELECT 1 FROM user_library WHERE user_id=1 AND novel_id=202").get()?.["1"],1);
assert.equal(database.prepare("SELECT 1 FROM user_library WHERE user_id=2 AND novel_id=202").get()?.["1"],1);

result=await request("/api/history",tokenA,"POST",{novel_id:202,chapter_number:2});
assert.equal(result.response.status,200);
assert.equal(database.prepare("SELECT chapter_number FROM history WHERE user_id=1 AND novel_id=202").get().chapter_number,2);
assert.equal(database.prepare("SELECT chapter_number FROM history WHERE user_id=2 AND novel_id=202").get().chapter_number,2);

result=await request("/api/bookmark",tokenA,"POST",{novel_id:202,chapter_number:2});
assert.equal(result.response.status,200);
assert.equal(database.prepare("SELECT chapter_number FROM bookmarks WHERE user_id=1 AND novel_id=202").get().chapter_number,2);
assert.equal(database.prepare("SELECT chapter_number FROM bookmarks WHERE user_id=2 AND novel_id=202").get().chapter_number,2);

result=await request("/api/follow",tokenA,"POST",{novel_id:202});
assert.equal(result.response.status,200);
assert.equal(database.prepare("SELECT 1 FROM follows WHERE user_id=1 AND novel_id=202").get()?.["1"],1);
assert.equal(database.prepare("SELECT 1 FROM follows WHERE user_id=2 AND novel_id=202").get()?.["1"],1);

result=await request("/api/notifications/read",tokenA,"POST",{});
assert.equal(result.response.status,200);
assert.ok(database.prepare("SELECT read_at FROM notifications WHERE user_id=1 AND id=11").get().read_at);
assert.equal(database.prepare("SELECT read_at FROM notifications WHERE user_id=2 AND id=22").get().read_at,null);

// Invalid chapter/novel pairs cannot create either account's bookmark or progress.
result=await request("/api/bookmark",tokenA,"POST",{novel_id:101,chapter_number:2});
assert.equal(result.response.status,404);
result=await request("/api/history",tokenA,"POST",{novel_id:101,chapter_number:2});
assert.equal(result.response.status,404);
assert.equal(database.prepare("SELECT COUNT(*) AS count FROM bookmarks WHERE user_id=1 AND novel_id=101 AND chapter_number=2").get().count,0);
assert.equal(database.prepare("SELECT COUNT(*) AS count FROM history WHERE user_id=1 AND novel_id=101 AND chapter_number=2").get().count,0);

const unauth=await request("/api/library",null);
assert.equal(unauth.response.status,401,"reader collections must reject unauthenticated requests");
database.close();
console.log("PASS: two-user SQLite/D1-adapter isolation for library, history, bookmarks, follows, notifications, scoped mutations, invalid chapter pairs, and unauthenticated access.");
