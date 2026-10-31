import assert from "node:assert/strict";
import { applySeoMetadata, buildRobotsTxt, buildSitemapXml, canonicalOrigin, canonicalPath, getPageSeo, robotsForPath } from "../src/seo.mjs";

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
assert.match(robots,/User-agent: OAI-SearchBot\nAllow: \/\n/);
assert.match(robots,/User-agent: GPTBot\nDisallow: \/\n/);
assert.match(robots,/User-agent: Google-Extended\nDisallow: \/\n/);
const trainingAllowed=buildRobotsTxt(origin,{allowOaiSearch:true,allowModelTraining:true});
assert.match(trainingAllowed,/User-agent: GPTBot\nAllow: \/\n/);
assert.match(trainingAllowed,/User-agent: Google-Extended\nAllow: \/\n/);
const searchDisabled=buildRobotsTxt(origin,{allowOaiSearch:false});
assert.match(searchDisabled,/User-agent: OAI-SearchBot\nDisallow: \/\n/);

assert.match(getPageSeo("/catalog").title,/Discover Novels/);
assert.match(getPageSeo("/search").title,/Search Stories/);
assert.match(getPageSeo("/format/manhwa").title,/Manhwa/);
assert.equal(robotsForPath("/search"),"noindex,nofollow");
assert.equal(robotsForPath("/account"),"noindex,nofollow");
assert.equal(robotsForPath("/author"),"noindex,nofollow");
assert.equal(robotsForPath("/author/some-writer"),"index,follow");
assert.equal(robotsForPath("/catalog",404),"noindex,nofollow");
assert.match(getPageSeo("/author/some-writer").title,/Imperial Novel/);

const sitemap=buildSitemapXml(origin,[{id:12,updated_at:"2026-10-30T12:00:00Z"},{id:"13"},{id:"bad"},{id:0},{id:12}],[{author:"Sikander Khan"},{author:"Sikander & Co."},{author:"Sikander Khan"},{author:""}]);
assert.match(sitemap,/<loc>https:\/\/imperial\.example\/novel\/12<\/loc><lastmod>2026-10-30<\/lastmod>/);
assert.match(sitemap,/<loc>https:\/\/imperial\.example\/novel\/13<\/loc>/);
assert.equal((sitemap.match(/\/novel\/12/g)||[]).length,1);
assert.doesNotMatch(sitemap,/\/novel\/bad/);
assert.match(sitemap,/\/format\/original/);
assert.match(sitemap,/\/format\/audiobook/);
assert.equal((sitemap.match(/\/format\//g)||[]).length,15);
assert.match(sitemap,/\/author\/Sikander%20Khan/);
assert.match(sitemap,/\/author\/Sikander%20%26%20Co\./);
assert.equal((sitemap.match(/\/author\/Sikander%20Khan/g)||[]).length,1);

const page=applySeoMetadata('<html><head><title>Old</title><meta name="description" content="old"><meta property="og:title" content="old"></head></html>',{
 title:'A <Story> & More',description:'A useful story description.',canonical:origin+'/novel/12',robots:'index,follow',image:'/covers/novel-12.webp',structuredData:{'@type':'Book',name:'A <Novel>',author:{'@type':'Person',name:'Writer'}}
});
assert.match(page,/<title>A &lt;Story&gt; &amp; More<\/title>/);
assert.match(page,/name="description" content="A useful story description\."/);
assert.match(page,/property="og:title" content="A &lt;Story&gt; &amp; More"/);
assert.match(page,/rel="canonical" href="https:\/\/imperial\.example\/novel\/12"/);
assert.match(page,/property="og:url" content="https:\/\/imperial\.example\/novel\/12"/);
assert.match(page,/property="og:image" content="https:\/\/imperial\.example\/covers\/novel-12\.webp"/);
assert.match(page,/name="twitter:image" content="https:\/\/imperial\.example\/covers\/novel-12\.webp"/);
assert.match(page,/application\/ld\+json/);
assert.match(page,/schema\.org/);
assert.ok(page.includes('"@type":"Book"'));
assert.ok(page.includes('A \\u003cNovel>'));
assert.doesNotMatch(page,/SearchAction/);
assert.equal((page.match(/name="description"/g)||[]).length,1);

const unsafeImage=applySeoMetadata('<html><head></head></html>',{title:"Test",canonical:origin+"/test",image:"javascript:alert(1)"});
assert.match(unsafeImage,/og:image" content="https:\/\/imperial\.example\/imperial-novel-app-icon\.svg/);
const privatePage=applySeoMetadata('<html><head><title>Account</title></head></html>',{title:"Account",robots:"noindex,nofollow"});
assert.match(privatePage,/name="robots" content="noindex,nofollow"/);
console.log("SEO/AEO metadata, AI crawler policies, safe cover previews, canonical URLs, JSON-LD and dynamic novel/author sitemap tests passed.");
