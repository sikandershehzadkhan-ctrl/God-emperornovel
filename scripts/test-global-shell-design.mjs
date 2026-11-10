import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('public/app.js', 'utf8');
const css = fs.readFileSync('public/imperial-ui-primitives.css', 'utf8');
const html = fs.readFileSync('public/index.html', 'utf8');
const start = app.indexOf('function shell(){');
const end = app.indexOf('\nfunction pageStart(', start);
assert.ok(start >= 0 && end > start, 'Global shell function must be present');
const shell = app.slice(start, end);

for (const [label, route] of [
  ['Home', 'href="/"'],
  ['Discover', 'href="/catalog"'],
  ['Library', 'href="/library"'],
  ['Create', 'href="/author"'],
  ['Community', 'href="/community"']
]) {
  assert.ok(shell.includes(route), label + ' must be reachable from the global shell');
}
assert.ok(shell.includes('class="in-shell-links"'), 'Desktop primary navigation must use canonical shell component');
assert.ok(shell.includes('class="in-mobile-nav"'), 'Mobile primary navigation must use canonical shell component');
assert.equal((shell.match(/class="in-mobile-nav"/g) || []).length, 1, 'Exactly one mobile navigation must be rendered');
assert.ok(shell.includes('aria-controls="imperialMenuDrawer"'), 'Menu trigger must identify its controlled drawer');
assert.ok(shell.includes("if(e.key==='Tab')"), 'Drawer must contain keyboard focus');
assert.ok(shell.includes("if(e.key==='Escape')"), 'Escape must close the drawer');
assert.ok(shell.includes("menuDrawer.removeAttribute('inert')"), 'Opening drawer must restore interactivity');
assert.ok(shell.includes("menuDrawer.setAttribute('inert','')"), 'Closing drawer must remove it from interaction');
assert.ok(shell.includes('id="imperialThemeSelect"') && shell.includes('id="imperialLanguageSelect"'), 'Theme and language controls must remain available');
assert.ok(css.includes('.in-shell-header') && css.includes('.in-shell-drawer') && css.includes('.in-mobile-nav'), 'Canonical shell styles must exist');
assert.ok(css.includes('env(safe-area-inset-bottom)'), 'Mobile navigation must respect device safe areas');
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'), 'Shell must respect reduced-motion preference');
assert.ok(css.includes('@media(max-width:54rem)'), 'Mobile layout breakpoint must exist');
assert.ok(html.includes('/imperial-ui-primitives.css'), 'Canonical component stylesheet must be loaded');
assert.ok(!shell.includes('class="mobileNav"'), 'Legacy mobile navigation must not be rendered');
console.log('Global shell design contract passed.');
