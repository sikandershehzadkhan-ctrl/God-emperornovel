import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { renderHomepageHtml } from "../src/homepage-ssr.mjs";

const [worker, client, versionedClient, indexHtml] = await Promise.all([
  readFile(new URL("../src/index.js", import.meta.url), "utf8"),
  readFile(new URL("../public/app.js", import.meta.url), "utf8"),
  readFile(new URL("../public/app-17.23.0.js", import.meta.url), "utf8"),
  readFile(new URL("../public/index.html", import.meta.url), "utf8")
]);
assert.match(worker, /renderHomepageHtml\(homepageNovels\)/);
assert.match(worker, /publication_status=.published./);
assert.match(worker, /<main id="app"/);
assert.match(client, /serverRenderedHome=location\.pathname==='\/'/);
assert.match(client, /data-imperial-ssr-header/);
assert.equal(versionedClient, client, "versioned production bundle must include the same SSR-preserving boot logic");
assert.match(worker, /if\(p===\"\/\"\)/);
assert.match(worker, /LIMIT 6/);
assert.match(worker, /rights_status IN/);


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
console.log("Homepage SSR markup, search, navigation, safe story data, cover fallback and empty-state tests passed.");
