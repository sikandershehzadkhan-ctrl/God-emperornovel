import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { renderHomepageHtml } from "../src/homepage-ssr.mjs";

const [worker, client, versionedClient, indexHtml, luxuryCss, homepageCss] = await Promise.all([
  readFile(new URL("../src/index.js", import.meta.url), "utf8"),
  readFile(new URL("../public/app.js", import.meta.url), "utf8"),
  readFile(new URL("../public/app-17.23.0.js", import.meta.url), "utf8"),
  readFile(new URL("../public/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/imperial-luxury-17.23.0.css", import.meta.url), "utf8"),
  readFile(new URL("../public/style-17.23.0.css", import.meta.url), "utf8")
]);
assert.match(worker, /renderHomepageHtml\(homepageNovels\)/);
assert.match(worker, /publication_status=.published./);
assert.match(worker, /<main id="app"/);
assert.match(client, /serverRenderedHome=location\.pathname==='\/'/);
assert.match(client, /data-imperial-ssr-header/);
assert.equal(versionedClient, client, "versioned production bundle must include the same SSR-preserving boot logic");
const rtlDirectionRule = 'document.documentElement.dir=(c==="ur"||c==="ar"||c==="fa")?"rtl":"ltr";';
assert.ok(client.includes(rtlDirectionRule), "Urdu, Arabic and Persian must all activate RTL direction");
assert.ok(versionedClient.includes(rtlDirectionRule), "versioned production bundle must preserve RTL direction for Urdu, Arabic and Persian");
const languageSelect = client.match(/<select id="imperialLanguageSelect"[\s\S]*?<\/select>/)?.[0] || "";
const languageCodes = [...languageSelect.matchAll(/<option value="([^"]+)"/g)].map(([, code]) => code);
assert.equal(languageCodes.length, 14, "the homepage shell must expose all 14 supported interface languages");
assert.ok(languageCodes.includes("fa"), "Persian must remain selectable in the language menu");
assert.ok(client.includes("trendIds=new Set(trendRows.map(row=>String(row.id)))"), "trending story IDs must be collected before rendering the latest shelf");
assert.ok(client.includes("latestRows=(l.results||[]).filter(row=>!trendIds.has(String(row.id)))"), "latest shelf must exclude stories already shown in trending");
assert.ok(versionedClient.includes("latestRows=(l.results||[]).filter(row=>!trendIds.has(String(row.id)))"), "versioned production bundle must also deduplicate homepage shelves");
assert.match(worker, /if\(p===\"\/\"\)/);
assert.match(worker, /LIMIT 6/);
assert.match(worker, /rights_status IN/);
assert.ok(luxuryCss.includes('html[data-theme="light"] .eyebrow,') && luxuryCss.includes("color: #0F52BA;"), "light-theme homepage eyebrow text must use accessible sapphire");
assert.ok(luxuryCss.includes('html[data-theme="light"] .nextFeatureIntro h2 span {\n  color: #6A0DAD;'), "light-theme feature heading accent must use accessible imperial purple");
assert.ok(luxuryCss.includes('html[data-theme="light"] .footerBrand {\n  color: #0B1215;'), "light-theme footer brand must use readable obsidian text");
assert.ok(luxuryCss.includes('html[data-theme="light"] a.skipLink:not(.primary):not(.secondary):not(.pill):not(.brand) {\n  color: #FFFFFF;\n  background: #0B1215;'), "light-theme skip link must retain readable foreground and background contrast");
assert.ok(homepageCss.includes('html[dir="rtl"] .homePage .heroSearch'), "homepage hero search must support RTL direction");
assert.ok(homepageCss.includes('html[dir="rtl"] .homePage .heroSearch input'), "homepage search input text must align correctly in RTL");
assert.ok(homepageCss.includes('html[dir="rtl"] .homePage .homeFormatGrid'), "homepage format grid must support RTL direction");
assert.ok(homepageCss.includes('html[dir="rtl"] .homePage .sectionHead'), "homepage shelf headings must support RTL direction");
assert.ok(homepageCss.includes('html[dir="rtl"] .footerLinks'), "homepage footer navigation must support RTL direction");

const rendered = renderHomepageHtml([
  { id: 7, title: "The <Glass> Throne", author: "A & B", cover_url: "https://covers.example/book.jpg" },
  { id: 8, title: "Second Story", author: "Writer", cover_url: "//unsafe.example/cover.jpg" }
]);
assert.match(rendered.header, /<nav class="navlinks" aria-label="Primary navigation">/);
assert.match(rendered.header, /data-imperial-ssr-mobile-nav/);
assert.match(rendered.header, /href="\/author"/);
assert.match(rendered.header, /href="\/search"/);
assert.match(rendered.content, /<h1>Open a world\.<br>Shape an empire\.<\/h1>/);
assert.match(rendered.content, /type="search"/);
assert.match(rendered.content, /class="sr" for="ssr-home-search"/);
assert.match(rendered.content, /href="\/novel\/7"/);
assert.match(rendered.content, /The &lt;Glass&gt; Throne/);
assert.match(rendered.content, /A &amp; B/);
assert.match(rendered.content, /src="\/story-cover-placeholder\.svg"/);
assert.match(rendered.footer, /Rights &amp; Copyright/);
const capped = renderHomepageHtml(Array.from({ length: 9 }, (_, index) => ({ id: index + 1, title: `Story ${index + 1}` }))).content;
assert.equal((capped.match(/class="card"/g) || []).length, 6, "SSR must render no more than six story cards");
const safeLocalCover = renderHomepageHtml([{ id: 10, title: "Local cover", cover_url: "/uploads/cover.webp" }]).content;
assert.ok(safeLocalCover.includes('src="/uploads/cover.webp"'), "same-origin cover paths should be preserved");
const noJsDocument = indexHtml
  .replace("<body>", "<body>" + rendered.header)
  .replace(/(<main id="app"[^>]*>)[\s\S]*?(<\/main>)/, (_match, opening, closing) => opening + rendered.content + closing)
  .replace("</body>", rendered.footer + "</body>");
assert.match(noJsDocument, /data-imperial-ssr-home/);
assert.match(noJsDocument, /data-imperial-ssr-mobile-nav/);
assert.match(noJsDocument, /type="search"/);
assert.doesNotMatch(noJsDocument, /class="bootFallback"/);

assert.doesNotMatch(rendered.content, /href="\/novel\/NaN"/);
assert.match(renderHomepageHtml([]).content, /New stories are being prepared/);
assert.match(renderHomepageHtml([{ id: "not-an-id", title: "Hidden invalid row" }]).content, /New stories are being prepared/);
const hostile = renderHomepageHtml([{ id: 9, title: '"<img src=x onerror=alert(1)>', author: '<svg onload=alert(1)>', cover_url: "javascript:alert(1)" }]).content;
assert.doesNotMatch(hostile, /<img src=x onerror=alert\(1\)>/);
assert.doesNotMatch(hostile, /<svg onload=/);
assert.match(hostile, /src="\/story-cover-placeholder\.svg"/);
console.log("Homepage SSR markup, search, navigation, safe story data, cover fallback and empty-state tests passed.");
