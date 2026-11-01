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
console.log("PASS: public novel catalog/detail and taxonomy queries expose only explicitly selected public fields.");
