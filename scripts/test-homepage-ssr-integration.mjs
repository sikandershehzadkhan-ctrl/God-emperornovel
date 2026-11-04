import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderHomepageHtml } from '../src/homepage-ssr.mjs';

const worker=fs.readFileSync('src/index.js','utf8');
const source=fs.readFileSync('public/app.js','utf8');
const served=fs.readFileSync('public/app-17.24.0.js','utf8');
const html=fs.readFileSync('public/index.html','utf8');
assert.equal(source,served,'Editable and served browser bundles must remain byte-identical');
assert.match(worker,/import\s*\{\s*renderHomepageHtml\s*\}\s*from\s*["']\.\/homepage-ssr\.mjs["']/);
assert.match(worker,/if\(p===["']\/["']\)\s*\{[\s\S]*?renderHomepageHtml\(homepageNovels\)/);
assert.match(worker,/publication_status='published'/);
assert.match(worker,/rights_status IN \('original','public_domain','licensed','authorized'\)/);
assert.match(worker,/LIMIT 6/);
assert.match(worker,/serverMarkup\.header/);
assert.match(worker,/serverMarkup\.footer/);
assert.match(source,/const serverRenderedHome=location\.pathname===["']\/["']&&!!root\.querySelector\('\[data-imperial-ssr-home\]'\)/);
assert.match(source,/if\(!serverRenderedHome\)root\.innerHTML=/);
assert.match(source,/if\(serverRenderedHome\)\{document\.querySelector\('\[data-imperial-ssr-header\]'\)/);
assert.match(source,/const serverRenderedHome=!!root\.querySelector\('\[data-imperial-ssr-home\]'\)/);
assert.match(source,/if\(!serverRenderedHome\)root\.innerHTML=/);
assert.match(html,/id=["']app["']/);
assert.match(html,/app-17\.24\.0\.js/);

const rendered=renderHomepageHtml({
 trending:[{id:1,title:'<script>alert(1)</script>',author:'A&B',cover_url:'javascript:alert(1)',chapter_count:0}],
 latest:[{id:1,title:'Duplicate'},{id:2,title:'Fresh',author:'Writer',cover_url:'//evil.example/x',chapter_count:4}]
});
assert.match(rendered.content,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert.doesNotMatch(rendered.content,/<script>alert\(1\)<\/script>/);
assert.match(rendered.content,/A&amp;B/);
assert.doesNotMatch(rendered.content,/javascript:/);
assert.doesNotMatch(rendered.content,/evil\.example/);
assert.match(rendered.content,/Fresh/);
assert.doesNotMatch(rendered.content,/Duplicate/);
assert.match(rendered.header,/data-imperial-ssr-header/);
assert.match(rendered.header,/data-imperial-ssr-mobile-nav/);
assert.match(rendered.footer,/data-imperial-ssr-footer/);
console.log('Homepage SSR integration regression passed: rights-bounded Worker query, safe first-render markup, client shell handoff, bundle parity and cross-shelf deduplication.');
