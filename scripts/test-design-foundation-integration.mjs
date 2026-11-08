import assert from 'node:assert/strict';
import fs from 'node:fs';

const css=fs.readFileSync('public/imperial-design-foundation.css','utf8');
const worker=fs.readFileSync('src/index.js','utf8');
const app=fs.readFileSync('public/app.js','utf8');
const served=fs.readFileSync('public/app-17.23.0.js','utf8');
assert.equal(app,served,'Editable and served 17.23.0 browser bundles must remain byte-identical');
for(const theme of ['light','dark','sepia','midnight','imperial','cosmic'])assert.ok(css.includes('data-theme="'+theme+'"')||css.includes("data-theme='"+theme+"'"),'Missing CSS theme: '+theme);
assert.match(css,/--in-brand:/);
assert.match(css,/--in-discovery:/);
const adminBlock=css.slice(css.indexOf("/* Imperial Command Center:"),css.indexOf("@media(max-width:760px)",css.indexOf("/* Imperial Command Center:")));
assert.ok(adminBlock.length>0,"Admin workspace must be governed by the design foundation");
assert.ok(!/(^|[;{])(color|background|background-color|border-color|outline-color|box-shadow)\s*:[^;]*(#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\()/m.test(adminBlock.replace(/color:#FFFFFF/g,"")),"Admin workspace must not reintroduce hard-coded color values");
for(const token of ["--in-ink","--in-muted","--in-surface","--in-surface-raised","--in-brand","--in-brand-soft","--in-discovery","--in-success","--in-danger","--in-focus"])assert.ok(adminBlock.includes("var("+token+")"),"Admin workspace is missing semantic token "+token);

assert.match(css,/:focus-visible/);
assert.match(css,/prefers-reduced-motion/);
assert.match(css,/data-reduced-motion|data-reducedMotion/);
assert.match(worker,/imperial-design-foundation\.css/);
assert.match(worker,/\["light","dark","sepia","midnight","imperial","cosmic"\]\.includes\(t\)/);
assert.match(app,/const IMPERIAL_THEMES=\['light','dark','sepia','midnight','imperial','cosmic'\]/);
assert.match(app,/imperial_reduced_motion/);
assert.match(app,/imperial_high_contrast/);
assert.match(app,/imperial_compact_cards/);
assert.match(app,/IMPERIAL_THEMES\[\(IMPERIAL_THEMES\.indexOf\(document\.documentElement\.dataset\.theme\)\+1\)%IMPERIAL_THEMES\.length\]/);
for(const theme of ['light','dark','sepia','midnight','imperial','cosmic'])assert.ok(app.includes('value="'+theme+'"'),'Settings UI missing theme '+theme);
console.log('Design foundation integration passed: six themes, accessible tokens, device preference restoration, Worker stylesheet injection and served bundle parity.');
