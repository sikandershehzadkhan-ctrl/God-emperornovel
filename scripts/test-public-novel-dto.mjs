import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const source = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const catalog = source.split("\n").find(line => line.includes("let sql=")) || "";
const detail = source.split("\n").find(line => line.includes("let nm=p.match")) || "";
assert.ok(catalog); assert.ok(detail);
assert.ok(catalog.includes("SELECT n.id,n.title,n.alt_titles,n.author,n.description,n.status,n.kind,n.language,n.cover_url,n.views,n.rating,n.created_at,n.updated_at"));
assert.ok(!catalog.includes("SELECT n.*"));
assert.ok(detail.includes("SELECT id,title,alt_titles,author,description,status,kind,language,cover_url,views,rating,created_at,updated_at FROM novels"));
assert.ok(!detail.includes("SELECT * FROM novels"));
assert.ok(detail.includes("SELECT g.id,g.name,g.slug FROM genres"));
assert.ok(detail.includes("SELECT t.id,t.name,t.slug FROM tags"));
for (const field of ["owner_user_id","rights_evidence","rights_notes","rights_verified_by","review_feedback","reviewed_by"]) { assert.ok(!catalog.includes("n."+field)); assert.ok(!detail.includes(field)); }
for (const line of source.split("\\n").filter(line => /SELECT n\\.id,n\\.title,n\\.alt_titles,n\\.author,n\\.description,n\\.status,n\\.kind,n\\.language,n\\.cover_url,n\\.views,n\\.rating,n\\.created_at,n\\.updated_at/.test(line))) {
  assert.doesNotMatch(line, /SELECT n\\.\\*/);
}
for (const route of ["/api/made-for-you", "/api/recommendations", "/api/follows"]) assert.ok(source.includes(route), route + " route must remain present");
assert.doesNotMatch(source.split("\\n").find(line => line.includes("if(p===\"/api/recommendations\"")) || "", /SELECT n\\.\\*/);
assert.ok(source.includes('SELECT id,name,slug FROM genres ORDER BY name'), 'public genre endpoint must use an explicit DTO');
assert.ok(source.includes('SELECT id,name,slug FROM tags ORDER BY name'), 'public tag endpoint must use an explicit DTO');
assert.ok(source.includes('SELECT id,title,body,read_at,created_at FROM notifications WHERE user_id=?'), 'notification response must omit internal user_id and future private columns');
const chapterRead = source.split('\n').find(line => line.includes('let cm=p.match(/^\\/api\\/chapters')) || '';
const chapterUnlock = source.split('\n').find(line => line.includes('if(/^\\/api\\/chapters\\/\\d+\\/unlock')) || '';
const batchUnlock = source.split('\n').find(line => line.includes('let bu=p.match(/^\\/api\\/novels')) || '';
assert.ok(chapterRead.includes('SELECT c.id,c.novel_id,c.chapter_number,c.title,c.content,c.is_locked,c.ticket_cost,c.publication_status'), 'public chapter read must use an explicit reader DTO');
assert.ok(chapterUnlock.includes('SELECT c.id,c.novel_id,c.chapter_number,c.title,c.is_locked,c.ticket_cost,c.publication_status'), 'single chapter unlock must select only transaction-required fields');
assert.ok(batchUnlock.includes('SELECT c.id,c.chapter_number,c.ticket_cost FROM chapters'), 'batch unlock must select only transaction-required fields');
assert.ok(!chapterRead.includes('SELECT c.*') && !chapterUnlock.includes('SELECT c.*') && !batchUnlock.includes('SELECT c.*'), 'chapter routes must not fetch entire database rows');
console.log('PASS: public novel, taxonomy, notification and chapter DTO field allowlists.');
