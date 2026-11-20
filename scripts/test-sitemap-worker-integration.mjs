import assert from "node:assert/strict";
import worker from "../src/index.js";

const sqlCalls = [];
const bindings = [];
const db = {
  prepare(sql) {
    sqlCalls.push(sql);
    return {
      bind(...values) {
        bindings.push({ sql, values });
        return this;
      },
      async first() {
        if (sql.includes("COUNT(*) count FROM novels")) return { count: 10001 };
        if (sql.includes("COUNT(*) count FROM chapters c JOIN novels")) return { count: 1 };
        throw new Error("Unexpected sitemap count query: " + sql);
      },
      async all() {
        if (sql.includes("FROM novels")) {
          return { results: [{ id: 7, updated_at: "2026-11-19T12:00:00Z" }] };
        }
        if (sql.includes("FROM chapters c JOIN novels")) {
          return { results: [{ novel_id: 7, chapter_number: 3, created_at: "2026-11-19T13:00:00Z" }] };
        }
        throw new Error("Unexpected sitemap page query: " + sql);
      }
    };
  }
};
const env = { DB: db };
const request = path => new Request("https://imperial.example" + path);

const indexResponse = await worker.fetch(request("/sitemap.xml"), env);
assert.equal(indexResponse.status, 200);
assert.match(indexResponse.headers.get("content-type"), /application\/xml/);
const indexXml = await indexResponse.text();
assert.ok(indexXml.includes("https://imperial.example/sitemap-static.xml"));
assert.ok(indexXml.includes("https://imperial.example/sitemap-novels.xml?page=0"));
assert.ok(indexXml.includes("https://imperial.example/sitemap-novels.xml?page=1"));
assert.ok(indexXml.includes("https://imperial.example/sitemap-chapters.xml?page=0"));

const staticResponse = await worker.fetch(request("/sitemap-static.xml"), env);
assert.equal(staticResponse.status, 200);
const staticXml = await staticResponse.text();
for (const path of ["/", "/catalog", "/community", "/privacy", "/copyright"]) {
  assert.ok(staticXml.includes("https://imperial.example" + path), "static sitemap missing " + path);
}
for (const path of ["/admin", "/account", "/library", "/author", "/login", "/register"]) {
  assert.ok(!staticXml.includes("https://imperial.example" + path), "private route leaked into static sitemap: " + path);
}

const novelResponse = await worker.fetch(request("/sitemap-novels.xml?page=1"), env);
assert.equal(novelResponse.status, 200);
const novelXml = await novelResponse.text();
assert.ok(novelXml.includes("https://imperial.example/novel/7"));
assert.ok(novelXml.includes("<lastmod>2026-11-19</lastmod>"));

const chapterResponse = await worker.fetch(request("/sitemap-chapters.xml?page=0"), env);
assert.equal(chapterResponse.status, 200);
const chapterXml = await chapterResponse.text();
assert.ok(chapterXml.includes("https://imperial.example/read/7/3"));

const invalidPage = await worker.fetch(request("/sitemap-novels.xml?page=not-a-number"), env);
assert.equal(invalidPage.status, 400);

const novelQueries = sqlCalls.filter(sql => /FROM novels(?: |$)/.test(sql));
const chapterQueries = sqlCalls.filter(sql => /FROM chapters c JOIN novels n/.test(sql));
const eligibleRights = "rights_status IN ('original','public_domain','licensed','authorized')";
assert.equal(novelQueries.length, 2);
assert.equal(chapterQueries.length, 2);
for (const sql of novelQueries) {
  assert.ok(sql.includes("publication_status='published'"));
  assert.ok(sql.includes(eligibleRights));
}
for (const sql of chapterQueries) {
  assert.ok(sql.includes("c.publication_status='published'"));
  assert.ok(sql.includes("n.publication_status='published'"));
  assert.ok(sql.includes(eligibleRights));
}
assert.ok(bindings.some(item => item.values[0] === 10000 && item.values[1] === 10000),
  "novel sitemap page 1 must use bounded page-size/offset binding");
assert.ok(bindings.some(item => item.values[0] === 10000 && item.values[1] === 0),
  "chapter sitemap page 0 must use bounded page-size/offset binding");

console.log("PASS: Worker sitemap routes, XML output, route-registry static paths, publication/rights SQL filters and pagination.");
