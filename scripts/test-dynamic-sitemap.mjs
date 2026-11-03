import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  SITEMAP_PAGE_SIZE,
  renderSitemapIndex,
  renderStaticSitemap,
  renderNovelSitemap,
  renderChapterSitemap
} from "../src/sitemap.mjs";

const origin = "https://stories.example";
const index = renderSitemapIndex(origin, 3, 2);
assert.ok(index.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), "sitemap index must be XML");
assert.ok(index.includes(origin + "/sitemap-static.xml"), "index must include static routes");
assert.ok(index.includes(origin + "/sitemap-novels.xml?page=2"), "index must paginate novel URLs");
assert.ok(index.includes(origin + "/sitemap-chapters.xml?page=1"), "index must paginate chapter URLs");
const bounded = renderSitemapIndex(origin, 50000, 50000);
assert.equal((bounded.match(/<sitemap>/g) || []).length, 50000, "sitemap index must stay within 50,000 child entries");
const staticMap = renderStaticSitemap(origin);
for (const path of ["/", "/catalog", "/formats", "/genres", "/community", "/privacy", "/copyright"]) {
  assert.ok(staticMap.includes(origin + path), "static sitemap includes " + path);
}
assert.ok(!staticMap.includes("/admin") && !staticMap.includes("/author"), "private account surfaces must not be indexed");
const novels = renderNovelSitemap(origin, [
  { id: 7, updated_at: "2026-11-03 10:30:00" },
  { id: "<script>", updated_at: "bad" },
  { id: 8, updated_at: "2026-10-20" }
]);
assert.ok(novels.includes(origin + "/novel/7") && novels.includes("<lastmod>2026-11-03</lastmod>"), "novel URLs include validated last-modified dates");
assert.ok(novels.includes(origin + "/novel/8") && !novels.includes("<script>"), "novel sitemap accepts numeric IDs only");
const chapters = renderChapterSitemap(origin, [
  { novel_id: 7, chapter_number: 3, created_at: "2026-11-02 08:00:00" },
  { novel_id: 7, chapter_number: "bad" }
]);
assert.ok(chapters.includes(origin + "/read/7/3") && chapters.includes("<lastmod>2026-11-02</lastmod>"), "chapter URLs use the public reader route");
assert.equal((chapters.match(/<url>/g) || []).length, 1, "invalid chapter coordinates are rejected");

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const wrangler = await readFile(new URL("../wrangler.toml", import.meta.url), "utf8");
const robots = await readFile(new URL("../public/robots.txt", import.meta.url), "utf8");
const fallback = await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8");
assert.ok(worker.includes('import { SITEMAP_PAGE_SIZE, renderSitemapIndex, renderStaticSitemap, renderNovelSitemap, renderChapterSitemap } from "./sitemap.mjs";'), "Worker imports the sitemap renderer");
assert.ok(worker.includes('if(p.startsWith("/sitemap")&&p.endsWith(".xml"))r=await sitemap(req,env);'), "Worker routes XML sitemap requests dynamically");
assert.ok(worker.includes("SELECT COUNT(*) count FROM novels WHERE publication_status='published' AND rights_status IN ('original','public_domain','licensed','authorized')"), "novel sitemap count excludes ineligible works");
assert.ok(worker.includes("c.publication_status='published' AND n.publication_status='published' AND n.rights_status IN ('original','public_domain','licensed','authorized')"), "chapter sitemap excludes unpublished or ineligible novels");
assert.ok(worker.includes("ORDER BY id LIMIT ? OFFSET ?") && worker.includes("ORDER BY c.id LIMIT ? OFFSET ?"), "large sitemaps use bounded pagination");
assert.ok(worker.includes("status:503") && worker.includes('"retry-after":"300"'), "temporary database failures return retryable sitemap errors");
for (const path of ["/sitemap.xml", "/sitemap-static.xml", "/sitemap-novels.xml", "/sitemap-chapters.xml"]) {
  assert.ok(wrangler.includes('"' + path + '"'), "Cloudflare routes " + path + " through the Worker");
}
assert.ok(robots.includes("Sitemap: " + origin.replace("https://stories.example", "https://god-emperornovel.sikandershehzadkhan.workers.dev") + "/sitemap.xml"), "robots.txt advertises the canonical sitemap");
assert.ok(fallback.includes("/catalog") && fallback.includes("/copyright"), "static fallback sitemap contains core public pages");
assert.equal(SITEMAP_PAGE_SIZE, 10000, "sitemap chunks stay bounded");
console.log("Dynamic sitemap index, static routes, rights-filtered novels/chapters, pagination and robots.txt tests passed.");
