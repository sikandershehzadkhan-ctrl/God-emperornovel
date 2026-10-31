import assert from "node:assert/strict";
import { applySeoMetadata, buildRobotsTxt, buildSitemapXml, canonicalOrigin, getPageSeo } from "../src/seo.mjs";

const origin="https://imperial.example";
assert.equal(canonicalOrigin(origin),origin);
assert.equal(canonicalOrigin("http://evil.example"),"https://god-emperornovel.sikandershehzadkhan.workers.dev");
const robots=buildRobotsTxt(origin);
assert.match(robots,/Sitemap: https:\/\/imperial\.example\/sitemap\.xml/);
assert.match(robots,/Disallow: \/admin/);
assert.match(robots,/Disallow: \/api\//);\nassert.match(robots,/Disallow: \/author\\$/);\nassert.doesNotMatch(robots,/Disallow: \/author\\n/);\nassert.match(getPageSeo("/catalog").title,/Discover Novels/);\nassert.match(getPageSeo("/author/some-writer").title,/Imperial Novel/);
assert.match(robots,/Disallow: \/\*\?\*/);
const sitemap=buildSitemapXml(origin,[{id:12,updated_at:"2026-10-30T12:00:00Z"},{id:"13"},{id:"bad"},{id:0},{id:12}]);
assert.match(sitemap,/<loc>https:\/\/imperial\.example\/novel\/12<\/loc><lastmod>2026-10-30<\/lastmod>/);
assert.match(sitemap,/<loc>https:\/\/imperial\.example\/novel\/13<\/loc>/);
assert.equal((sitemap.match(/\/novel\/12/g)||[]).length,1);
assert.doesNotMatch(sitemap,/\/novel\/bad/);
const page=applySeoMetadata('<html><head><title>Old</title><meta name="description" content="old"><meta property="og:title" content="old"></head></html>',{
 title:'A <Story> & More',description:'A useful story description.',canonical:origin+'/novel/12',robots:'index,follow'
});
assert.match(page,/<title>A &lt;Story&gt; &amp; More<\/title>/);
assert.match(page,/name="description" content="A useful story description\."/);
assert.match(page,/property="og:title" content="A &lt;Story&gt; &amp; More"/);
assert.match(page,/rel="canonical" href="https:\/\/imperial\.example\/novel\/12"/);
assert.equal((page.match(/name="description"/g)||[]).length,1);
const privatePage=applySeoMetadata('<html><head><title>Account</title></head></html>',{title:"Account",robots:"noindex,nofollow"});
assert.match(privatePage,/name="robots" content="noindex,nofollow"/);
console.log("SEO metadata, robots policy, canonical URL and dynamic sitemap tests passed.");
