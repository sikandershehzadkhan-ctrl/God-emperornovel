import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { renderHomepageHtml } from "../src/homepage-ssr.mjs";

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const source = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
const served = await readFile(new URL("../public/app-17.23.0.js", import.meta.url), "utf8");
const css = await readFile(new URL("../public/style.css", import.meta.url), "utf8");
const versionedCss = await readFile(new URL("../public/style-17.23.0.css", import.meta.url), "utf8");
const luxuryCss = await readFile(new URL("../public/imperial-luxury-17.23.0.css", import.meta.url), "utf8");

assert.equal(source, served, "editable and served application bundles must remain identical");
const rendered = renderHomepageHtml([
  { id: 7, title: "<script>alert(1)</script>", author: "A & B", cover_url: "//unsafe.example/cover.jpg" },
  { id: 8, title: "Safe story", author: "Writer", cover_url: "https://covers.example/book.jpg" },
  { id: "invalid", title: "Invalid ID" },
  ...Array.from({ length: 7 }, (_, i) => ({ id: 20 + i, title: "Story " + i, author: "Writer" }))
]);
assert.ok(rendered.header.includes('data-imperial-ssr-header'), "SSR header marker must exist");
assert.ok(rendered.header.includes('data-imperial-ssr-mobile-nav'), "SSR mobile navigation must exist");
assert.ok(rendered.header.includes('class="skipLink ssrSkipLink"'), "SSR must include a keyboard skip link");
assert.ok(rendered.content.includes('data-imperial-ssr-home'), "SSR content must be marked for client handoff");
assert.ok(rendered.content.includes("&lt;script&gt;alert(1)&lt;/script&gt;"), "novel titles must be HTML-escaped");
assert.ok(rendered.content.includes("A &amp; B"), "author names must be HTML-escaped");
assert.ok(rendered.content.includes("/story-cover-placeholder.svg"), "protocol-relative cover URLs must be rejected");
assert.ok(rendered.content.includes("https://covers.example/book.jpg"), "valid HTTPS cover URLs must be retained");
assert.equal((rendered.content.match(/class="card"/g) || []).length, 6, "SSR must cap the story shelf at six valid records");
const empty = renderHomepageHtml([]);
assert.ok(empty.content.includes("New stories are being prepared."), "empty catalog must produce a truthful empty state");

assert.ok(worker.includes('import { renderHomepageHtml } from "./homepage-ssr.mjs";'), "Worker must import the SSR renderer");
assert.ok(worker.includes("publication_status='published' AND rights_status IN ('original','public_domain','licensed','authorized')"), "SSR query must restrict to published rights-cleared stories");
assert.ok(worker.includes("LIMIT 6"), "SSR query must be bounded");
assert.ok(worker.includes('const serverMarkup=renderHomepageHtml(homepageNovels);'), "Worker must render a safe empty state even if the catalog query fails");
assert.ok(worker.includes('text=text.replace("<body>","<body>"+serverMarkup.header);'), "Worker must include the SSR header before the app");
assert.ok(worker.includes("serverMarkup.content"), "Worker must replace the app boot shell with rendered story content");
assert.ok(worker.includes('text=text.replace("</body>",serverMarkup.footer+"</body>");'), "Worker must include the SSR footer");

assert.ok(source.includes("const serverRenderedHome=location.pathname==='/'&&!!root.querySelector('[data-imperial-ssr-home]')"), "client boot must detect SSR homepage markup");
for (const marker of ["[data-imperial-ssr-header]", "[data-imperial-ssr-footer]", "[data-imperial-ssr-mobile-nav]", ".ssrSkipLink"]) {
  assert.ok(source.includes("document.querySelector('" + marker + "')?.remove()"), "client boot must remove duplicate SSR shell marker " + marker);
}
assert.ok(source.includes("function translateHomepage(c)"), "homepage Urdu, Arabic and Persian translations must be available");
assert.ok(source.includes("translateHomepage(document.documentElement.lang||'en');"), "homepage translation must run after client template insertion");
assert.ok(source.includes("translateHomepage(c);"), "changing interface language must retranslate the homepage");
assert.ok(source.includes('document.documentElement.dir=(c==="ur"||c==="ar"||c==="fa")?"rtl":"ltr";'), "Urdu, Arabic and Persian must activate RTL document direction");
assert.ok(css.includes('html[dir="rtl"] [data-imperial-ssr-home] .heroSearch'), "source stylesheet must support SSR RTL hero search");
assert.ok(versionedCss.includes('html[dir="rtl"] [data-imperial-ssr-home] .homeStoryGrid'), "served stylesheet must support SSR RTL story grids");
assert.ok(luxuryCss.includes('html[data-theme="light"] .eyebrow') && luxuryCss.includes("#0F52BA"), "light-theme homepage eyebrow contrast must use readable sapphire");
console.log("Homepage SSR, rights filtering, safe rendering, client handoff, localization, and RTL regression passed.");
