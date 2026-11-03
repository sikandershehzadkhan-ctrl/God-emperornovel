import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { renderHomepageHtml } from "../src/homepage-ssr.mjs";

const [worker, client, versionedClient, indexHtml, luxuryCss, homepageCss, homepageSourceCss] = await Promise.all([
  readFile(new URL("../src/index.js", import.meta.url), "utf8"),
  readFile(new URL("../public/app.js", import.meta.url), "utf8"),
  readFile(new URL("../public/app-17.23.0.js", import.meta.url), "utf8"),
  readFile(new URL("../public/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/imperial-luxury-17.23.0.css", import.meta.url), "utf8"),
  readFile(new URL("../public/style-17.23.0.css", import.meta.url), "utf8"),
  readFile(new URL("../public/style.css", import.meta.url), "utf8")
]);
const homepageTemplate = client.slice(client.indexOf("async function home(){"), client.indexOf("async function trendFactory(){"));
assert.ok(homepageTemplate.length > 0, "client homepage template must be available for localization selector checks");
for (const selector of [
  'class="nextHeroCopy"', 'class="nextHeroLead"', 'class="heroSearch"',
  'class="heroTags"', 'class="promiseText"', 'class="homeFormatShelf"',
  'class="homeFormatHeading"', 'id="homeFormatTitle"', 'class="homeFormatCard"',
  'class="section nextShelf"', 'class="sectionHead"'
]) {
  assert.ok(homepageTemplate.includes(selector), `homepage localization target ${selector} must exist in the actual client-rendered template`);
}
assert.equal((homepageTemplate.match(/class="section nextShelf"/g)||[]).length,2,"client homepage must contain separate trending and latest-updates shelves");
for (const locale of ["ur","ar","fa"]) {
  assert.ok(client.includes(locale+":{eyebrow:"), "latest-updates translations must define eyebrow, title and lead for "+locale);
}
assert.ok(homepageTemplate.includes('id="trend"') && homepageTemplate.includes('id="latest"'), "homepage story shelves must remain present alongside localized headings");
assert.ok(homepageTemplate.includes("translateHomepage(document.documentElement.lang||'en');"), "the rendered client homepage must apply the selected language after its template is inserted");
assert.ok(client.includes("function translateHomepage(c)"), "homepage fixed copy must have a dedicated localization pass");
assert.ok(client.includes('const putEyebrow=(el,value)=>{if(!el||value==null)return;const dot=el.querySelector(".eyebrowDot");el.textContent=value;if(dot)el.prepend(dot)};'),"localized eyebrow copy must preserve decorative dot markers instead of deleting nested markup");
assert.ok(client.includes('putEyebrow(root.querySelector(".homeFormatHeading .eyebrow"),d.formatEyebrow);'),"format shelf localization must preserve its eyebrow marker");
assert.ok(client.includes("if(eyebrow)putEyebrow(eyebrow,d.rotation);")&&client.includes("if(eyebrow)putEyebrow(eyebrow,latestCopy.eyebrow);"),"both story shelf translations must preserve eyebrow markers");
assert.ok(client.includes("HOME_LANG={"), "homepage Urdu, Arabic and Persian translations must be defined");
assert.ok(client.includes("const HOME_LATEST={"), "latest-updates shelf must have dedicated Urdu, Arabic and Persian translations");
assert.ok(client.includes('const latest=shelves[1],latestCopy=HOME_LATEST[c]'), "homepage localization must translate the second, latest-updates shelf independently");
assert.ok(versionedClient.includes("const HOME_LATEST={"), "versioned production bundle must include latest-updates translations");
assert.ok(client.includes("translateHomepage(c);"), "homepage localization must run whenever the interface language changes");
assert.ok(client.includes("translateHomepage(document.documentElement.lang||'en');"), "saved language must be applied after the client homepage replaces SSR markup");
assert.ok(client.includes("location.pathname!==\"/\""), "homepage localization must not alter dynamic novel or author content on other routes");
assert.match(worker, /renderHomepageHtml\(homepageNovels\)/);
assert.match(worker, /publication_status=.published./);
assert.match(worker, /<main id="app"/);
assert.match(client, /serverRenderedHome=location\.pathname==='\/'/);
assert.match(client, /data-imperial-ssr-header/);
const bootStart = client.indexOf("async function boot(){");
const bootCode = client.slice(bootStart);
const cleanupMarkers = ["[data-imperial-ssr-header]", "[data-imperial-ssr-footer]", "[data-imperial-ssr-mobile-nav]", ".ssrSkipLink"];
for (const marker of cleanupMarkers) {
  assert.ok(bootCode.includes(`document.querySelector('${marker}')?.remove()`), `client boot must remove the SSR ${marker} before creating its interactive shell`);
}
assert.ok(bootCode.indexOf("document.querySelector('[data-imperial-ssr-header]')?.remove()") < bootCode.indexOf("shell();"), "SSR navigation and skip-link cleanup must happen before the client shell is inserted");
assert.ok(bootCode.includes("const serverRenderedHome=location.pathname==='/'&&!!root.querySelector('[data-imperial-ssr-home]')"), "SSR cleanup must only activate when the server-rendered homepage is actually present");
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
assert.ok(worker.includes("FROM unlocks ux JOIN chapters cx ON cx.id=ux.chapter_id WHERE cx.novel_id=novels.id AND ux.unlocked_at>=datetime('now','-7 days')"), "server-rendered homepage stories must use the same seven-day unlock signal as the trending catalog");
assert.ok(worker.includes("ORDER BY (SELECT COUNT(*) FROM unlocks ux JOIN chapters cx ON cx.id=ux.chapter_id"), "server-rendered homepage ranking must not silently fall back to newest-created stories");
assert.ok(worker.includes("ORDER BY (SELECT COUNT(*) FROM unlocks ux JOIN chapters cx ON cx.id=ux.chapter_id WHERE cx.novel_id=novels.id AND ux.unlocked_at>=datetime('now','-7 days')) DESC,id DESC LIMIT 6"), "no-script homepage stories must use the same seven-day unlock ranking as the trending catalog");
assert.match(worker, /rights_status IN/);
assert.ok(worker.includes("rights_status IN ('original','public_domain','licensed','authorized')"), "SSR homepage must only select stories with an explicitly permitted rights status");
assert.ok(worker.includes('catch(error){console.error("homepage server-rendered catalog unavailable",error)}'), "homepage SSR must catch D1 catalog failures");
assert.ok(worker.includes("const serverMarkup=renderHomepageHtml(homepageNovels);"), "homepage SSR must still render its safe empty state after a catalog query failure");
assert.ok(luxuryCss.includes('html[data-theme="light"] .eyebrow,') && luxuryCss.includes("color: #0F52BA;"), "light-theme homepage eyebrow text must use accessible sapphire");
assert.ok(luxuryCss.includes('html[data-theme="light"] .nextFeatureIntro h2 span {\n  color: #6A0DAD;'), "light-theme feature heading accent must use accessible imperial purple");
assert.ok(luxuryCss.includes('html[data-theme="light"] .footerBrand {\n  color: #0B1215;'), "light-theme footer brand must use readable obsidian text");
assert.ok(luxuryCss.includes('html[data-theme="light"] a.skipLink:not(.primary):not(.secondary):not(.pill):not(.brand) {\n  color: #FFFFFF;\n  background: #0B1215;'), "light-theme skip link must retain readable foreground and background contrast");
assert.ok(homepageCss.includes('html[dir="rtl"] .homePage .heroSearch'), "homepage hero search must support RTL direction");
assert.ok(homepageCss.includes('html[dir="rtl"] .homePage .heroSearch input'), "homepage search input text must align correctly in RTL");
assert.ok(homepageCss.includes('html[dir="rtl"] .homePage .homeFormatGrid'), "homepage format grid must support RTL direction");
assert.ok(homepageCss.includes('html[dir="rtl"] .homePage .sectionHead'), "homepage shelf headings must support RTL direction");
assert.ok(homepageCss.includes('html[dir="rtl"] .footerLinks'), "homepage footer navigation must support RTL direction");
assert.ok(homepageSourceCss.includes('html[dir="rtl"] .homePage .heroSearch'), "source homepage stylesheet must include RTL search layout");
assert.ok(homepageSourceCss.includes('html[dir="rtl"] .homePage .homeFormatGrid'), "source homepage stylesheet must include RTL format layout");
assert.ok(homepageSourceCss.includes('html[dir="rtl"] .footerLinks'), "source homepage stylesheet must include RTL footer layout");
assert.ok(homepageCss.includes("@media(max-width:760px){.wrap,.homePage .wrap{width:calc(100% - 28px)}"), "homepage must provide a narrow-screen layout with safe side gutters");
assert.ok(homepageCss.includes(".homeStoryGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}"), "homepage story cards must collapse to two columns on mobile");
assert.ok(homepageCss.includes("@media(max-width:390px){.wrap,.homePage .wrap{width:calc(100% - 22px)}"), "homepage must tighten its layout on compact phones");
assert.ok(homepageCss.includes(".heroSearch button{font-size:0;width:42px;padding:0}.heroSearch button span{font-size:16px}"), "compact-phone search action must remain visible as a 42px icon target");
assert.ok(homepageCss.includes("@media(prefers-reduced-motion:reduce)"), "homepage stylesheet must respect the operating system reduced-motion preference");
assert.ok(homepageSourceCss.includes("@media(max-width:760px){.wrap,.homePage .wrap{width:calc(100% - 28px)}"), "source homepage stylesheet must retain narrow-screen gutters");
assert.ok(homepageSourceCss.includes(".homeStoryGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}"), "source homepage stylesheet must retain the two-column mobile story grid");
assert.ok(homepageSourceCss.includes("@media(max-width:390px){.wrap,.homePage .wrap{width:calc(100% - 22px)}"), "source homepage stylesheet must retain compact-phone gutters");
assert.ok(homepageSourceCss.includes(".heroSearch button{font-size:0;width:42px;padding:0}.heroSearch button span{font-size:16px}"), "source homepage stylesheet must retain the compact-phone search action");
assert.ok(homepageSourceCss.includes("@media(prefers-reduced-motion:reduce)"), "source homepage stylesheet must respect reduced-motion preferences");

const rendered = renderHomepageHtml([
  { id: 7, title: "The <Glass> Throne", author: "A & B", cover_url: "https://covers.example/book.jpg" },
  { id: 8, title: "Second Story", author: "Writer", cover_url: "//unsafe.example/cover.jpg" }
]);
assert.ok(rendered.header.includes('<a class="skipLink ssrSkipLink" href="#app">Skip to main content</a>'), "SSR must expose a keyboard-accessible skip link to the main landmark");
assert.equal((rendered.content.match(/<h1>/g) || []).length, 1, "SSR homepage must expose exactly one primary heading");
assert.match(indexHtml, /<main id="app"/, "the document shell must provide the skip-link destination as the main landmark");
assert.match(rendered.content, /<section class="homeFormatShelf" aria-labelledby="ssr-home-formats">/, "format shelf must have an accessible section name");
assert.match(rendered.content, /<section class="section nextShelf" aria-labelledby="ssr-home-stories">/, "story shelf must have an accessible section name");
assert.match(rendered.header, /<nav class="navlinks" aria-label="Primary navigation">/);
for (const [label, href] of [["Discover", "/catalog"], ["Formats", "/formats"], ["Genres", "/genres"], ["Community", "/community"], ["Rankings", "/leaderboard"], ["OmniPortal", "/omniportal"], ["Library", "/library"]]) {
  assert.ok(rendered.header.includes(`<a href="${href}">${label}</a>`), `SSR primary navigation must include the client-shell destination ${label}`);
}
for (const href of ["/search", "/notifications", "/account"]) {
  assert.ok(rendered.header.includes(`href="${href}"`), `SSR account navigation must preserve ${href}`);
}
for (const href of ["/formats", "/genres", "/omniportal", "/trend-factory"]) {
  assert.ok(client.includes(`href="${href}"`), `interactive shell must retain the ${href} destination`);
}
assert.ok(rendered.footer.includes('<a href="/trend-factory">Trend Factory</a>'), "SSR footer must include the Trend Factory destination available in the client footer");
assert.match(rendered.header, /data-imperial-ssr-mobile-nav/);
assert.match(rendered.header, /href="\/author"/);
assert.match(rendered.header, /href="\/search"/);
assert.match(rendered.content, /<h1>Open a world\.<br>Shape an empire\.<\/h1>/);
assert.match(rendered.content, /type="search"/);
for (const genre of ["Fantasy", "Progression", "Romance", "Isekai"]) {
  assert.ok(rendered.content.includes(`href="/genres?genre=${genre}"`), `SSR homepage genre tag must use the client homepage route for ${genre}`);
}
assert.ok(client.includes('href="/genres?genre=Fantasy"') && client.includes('href="/genres?genre=Progression"') && client.includes('href="/genres?genre=Romance"') && client.includes('href="/genres?genre=Isekai"'), "client homepage genre tags must retain the same genre destinations as SSR");
assert.ok(rendered.content.includes('<form class="heroSearch" action="/search" method="get"'), "no-script homepage search must use the same search route as the client homepage");
assert.match(rendered.content, /class="sr" for="ssr-home-search"/);
assert.match(rendered.content, /href="\/novel\/7"/);
assert.match(rendered.content, /The &lt;Glass&gt; Throne/);
assert.match(rendered.content, /A &amp; B/);
assert.match(rendered.content, /src="\/story-cover-placeholder\.svg"/);
const quotedText = renderHomepageHtml([{ id: "13", title: 'A "Quoted" & <Brave> Writer\'s Tale', author: 'Author "One" & <Two>' }]).content;
assert.ok(quotedText.includes('A &quot;Quoted&quot; &amp; &lt;Brave&gt; Writer&#39;s Tale'), "SSR must escape quotes, apostrophes, ampersands and angle brackets in story titles");
assert.ok(quotedText.includes('Author &quot;One&quot; &amp; &lt;Two&gt;'), "SSR must escape quotes and markup characters in author names");
assert.doesNotMatch(quotedText, /<Brave>|<Two>/, "escaped story metadata must never become live HTML elements");
const invalidIds = renderHomepageHtml([
  { id: "not-a-number", title: "Invalid first" },
  { id: -1, title: "Invalid second" },
  { id: 14, title: "Valid after invalid rows" }
]).content;
assert.ok(invalidIds.includes('href="/novel/14"'), "invalid database IDs must be discarded without hiding later valid stories");
assert.equal((invalidIds.match(/class="card"/g) || []).length, 1, "invalid database IDs must not create story cards");
assert.match(rendered.footer, /Rights &amp; Copyright/);
const capped = renderHomepageHtml(Array.from({ length: 9 }, (_, index) => ({ id: index + 1, title: `Story ${index + 1}` }))).content;
assert.equal((capped.match(/class="card"/g) || []).length, 6, "SSR must render no more than six story cards");
const safeLocalCover = renderHomepageHtml([{ id: 10, title: "Local cover", cover_url: "/uploads/cover.webp" }]).content;
assert.ok(safeLocalCover.includes('src="/uploads/cover.webp"'), "same-origin cover paths should be preserved");
const safeRemoteCover = renderHomepageHtml([{ id: 11, title: "Remote cover", cover_url: "https://cdn.example/story.webp" }]).content;
assert.ok(safeRemoteCover.includes('src="https://cdn.example/story.webp"'), "HTTPS cover URLs should be preserved");
assert.match(safeRemoteCover, /alt="Remote cover cover" width="240" height="320" loading="lazy" decoding="async"/, "story cover images must have descriptive alt text, intrinsic dimensions and non-blocking loading");
for (const unsafeCover of ["http://insecure.example/cover.jpg", "data:image/svg+xml,<svg></svg>", "//external.example/cover.jpg", "/\\\\external.example/cover.jpg", "https://reader:secret@cdn.example/cover.jpg", "https://"]) {
  const unsafeCoverMarkup = renderHomepageHtml([{ id: 12, title: "Fallback cover", cover_url: unsafeCover }]).content;
  assert.ok(unsafeCoverMarkup.includes('src="/story-cover-placeholder.svg"'), `unsafe cover URL ${unsafeCover} must use the local placeholder`);
}

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
