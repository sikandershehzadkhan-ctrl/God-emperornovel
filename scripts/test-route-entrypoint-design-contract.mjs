import fs from 'node:fs';
import assert from 'node:assert/strict';
const pages=["404.html","index.html","account.html","author-public.html","catalog.html","fandom.html","following.html","genres.html","history.html","library.html","login.html","novel.html","omniportal.html","read.html","register.html","requests.html","search.html","tags.html","tickets.html"];
for(const name of pages){const html=fs.readFileSync('public/'+name,'utf8');for(const token of ['/style-17.23.0.css','/app-17.23.0.css','/imperial-design-tokens.css','/imperial-ui-primitives.css','app.js?v=18.1.0'])assert.ok(html.includes(token),name+' entrypoint missing '+token);assert.ok(!html.includes('href="/style.css"'),name+' still loads legacy stylesheet');assert.ok(!html.includes('app.js?v=16.16.0'),name+' still uses stale app asset version')}
const app=fs.readFileSync('public/app.js','utf8');
const simple=app.slice(app.indexOf('function simplePage('),app.indexOf('\nasync function authorApplicationPage'));
for(const token of ['in-system-state','in-system-actions','in-button--primary','/catalog','/search'])assert.ok(simple.includes(token),'System recovery state missing '+token);
console.log('19 route entrypoints and system recovery state use the Imperial design system.');
