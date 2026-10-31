import assert from "node:assert/strict";
import { applySeoMetadata, buildRobotsTxt, buildSitemapXml, canonicalOrigin, canonicalPath, getPageSeo } from "../src/seo.mjs";

const origin="https://imperial.example";
assert.equal(canonicalOrigin(origin),origin);
assert.equal(canonicalPath("/discover"),"/catalog");
assert.equal(canonicalPath("/formats"),"/");
assert.equal(canonicalOrigin("http://evil.example"),"https://god-emperornovel.sikandershehzadkhan.workers.dev");
const robots=buildRobotsTxt(origin);
assert.match(robots,/Sitemap: https:\/\/imperial\.example\/sitemap\.xml/);
assert.match(robots,/Disallow: \/admin/);
assert.match(robots,/Disallow: \/api\//);
assert.match(robots,/Disallow: \/author\$/);
assert.match(robots,/Disallow: \/\*\?\*/);
assert.match(getPageSeo("/catalog").title,/Discover Novels/);
assert.match(getPageSeo("/author/some-writer").title,/Imperial Novel/);
const sitemap=buildSitemapXml(origin,[{id:12,updated_at:"2026-10-30T12:00:00Z"},{id:"13"},{id:"bad"},{id:0},{id:12}],[{author:"Sikander Khan"},{author:"Sikander & Co."},{author:"Sikander Khan"},{author:""}]);
assert.match(sitemap,/<loc>https:\/\/imperial\.example\/novel\/12<\/loc><lastmod>2026-10-30<\/lastmod>/);
assert.match(sitemap,/<loc>https:\/\/imperial\.example\/novel\/13<\/loc>/);
assert.equal((sitemap.match(/\/novel\/12/g)||[]).length,1);
assert.doesNotMatch(sitemap,/\/novel\/bad/);\nassert.match(sitemap,/\/author\/Sikander%20Khan/);\nassert.match(sitemap,/\/author\/Sikander%20%26%20Co\./);\nassert.equal((sitemap.match(/\/author\/Sikander%20Khan/g)||[]).length,1);
const page=applySeoMetadata('<html><head><title>Old</title><meta name="description" content="old"><meta property="og:title" content="old"></head></html>',{
 title:'A <Story> & More',description:'A useful story description.',canonical:origin+'/novel/12',robots:'index,follow'
});
assert.match(page,/<title>A &lt;Story&gt; &amp; More<\/title>/);
assert.match(page,/name="description" content="A useful story description\."/);
assert.match(page,/property="og:title" content="A &lt;Story&gt; &amp; More"/);
assert.match(page,/rel="canonical" href="https:\/\/imperial\.example\/novel\/12"/);
assert.match(page,/application\/ld\+json/);
assert.match(page,/schema\.org/);
assert.equal((page.match(/name="description"/g)||[]).length,1);
const privatePage=applySeoMetadata('<html><head><title>Account</title></head></html>',{title:"Account",robots:"noindex,nofollow"});
assert.match(privatePage,/name="robots" content="noindex,nofollow"/);
console.log("SEO metadata, robots policy, canonical URL and dynamic sitemap tests passed.");
