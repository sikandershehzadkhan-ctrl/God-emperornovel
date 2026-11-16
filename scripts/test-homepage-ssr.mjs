import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { injectHomepageMarkup, loadHomepageStories, renderHomepage } from "../src/homepage-ssr.mjs";

const html = renderHomepage(
  [{ id: 7, title: '<script>alert(1)</script>', author: 'A & B', cover_url: 'javascript:alert(1)', rating: 0, chapter_count: 12 }],
  [{ id: 7, title: "Duplicate" }, { id: 8, title: "Latest story", author: "Writer", chapter_count: 3 }]
);
assert.match(html, /data-home-ssr="true"/);
assert.match(html, /class="top homeSsrHeader"/);
assert.match(html, /class="homeSsrFooter"/);
assert.match(html, /href="\/novel\/7"/);
assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
assert.doesNotMatch(html, /javascript:alert/);
assert.match(html, /id="trend"/);
assert.match(html, /id="latest"/);
assert.equal((html.match(/href="\/novel\/7"/g) || []).length, 1);
assert.match(html, /href="\/novel\/8"/);
assert.match(html, /name="q"/);
assert.match(html, /12 chapters/);
assert.doesNotMatch(html, /5\/10|10\/10|Not rated/);

const documentShell = '<html><body><header>Existing shell</header><main id="app" class="appBootRoot"><p>Boot fallback</p></main><script src="/app.js"></script></body></html>';
const injectedShell = injectHomepageMarkup(documentShell, html);
assert.ok(injectedShell.includes('<header class="top homeSsrHeader">'));
assert.ok(injectedShell.includes('<main id="app" class="appBootRoot"'));
assert.ok(injectedShell.includes('<script src="/app.js"></script>'));
assert.ok(!injectedShell.includes("Boot fallback"));
assert.equal(injectHomepageMarkup(documentShell, null), documentShell);
assert.equal(injectHomepageMarkup("<html><body>No app root</body></html>", html), "<html><body>No app root</body></html>");

const sqlCalls = [];
const db = {
  prepare(sql) {
    const index = sqlCalls.push(sql) - 1;
    return {
      async all() {
        return { results: index === 0 ? [{ id: 1 }] : [{ id: 2 }] };
      }
    };
  }
};
const shelves = await loadHomepageStories(db);
assert.equal(shelves.trending[0].id, 1);
assert.equal(shelves.latest[0].id, 2);
assert.equal(sqlCalls.length, 2);
for (const sql of sqlCalls) {
  assert.match(sql, /publication_status='published'/);
  assert.match(sql, /rights_status IN \('original','public_domain','licensed','authorized'\)/);
  assert.match(sql, /LIMIT 10/);
}
assert.match(sqlCalls[0], /unlocked_at>=datetime\('now','-7 days'\)/);
assert.match(sqlCalls[1], /ORDER BY n.updated_at DESC/);
const serviceWorker = readFileSync("public/sw.js", "utf8");
assert.match(serviceWorker, /design-system-4-homepage-ssr/);
assert.match(serviceWorker, /\/app-17\.23\.0\.js/);
assert.match(serviceWorker, /\/imperial-design-system\.css/);
const worker = readFileSync("src/index.js", "utf8");
assert.match(worker, /import \{ loadHomepageStories, renderHomepage \} from "\.\/homepage-ssr\.mjs"/);
assert.match(worker, /if\(p==="\/"&&env\.DB\)/);
assert.match(worker, /homepageMarkup=renderHomepage\(shelves\.trending,shelves\.latest\)/);
assert.match(worker, /if\(homepageMarkup\)\{const appStart=text\.indexOf/);
for (const path of ["public/app.js", "public/app-17.23.0.js"]) {
  const client = readFileSync(path, "utf8");
  assert.match(client, /if\(!root\.querySelector\('\[data-home-ssr="true"\]'\)\)root\.innerHTML=/);
  assert.match(client, /const ssrHeader=document\.querySelector\('header\.homeSsrHeader'\)/);
  assert.match(client, /if\(root\.querySelector\('\[data-home-ssr="true"\]'\)\)return;/);
  assert.match(client, /rows\.map\(n=>card\(n,\{showRating:false\}\)\)\.join\(\)/);
}
console.log("Homepage SSR safety, rights eligibility, deduplication, and query contracts passed.");
