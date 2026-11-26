import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const app=fs.readFileSync('public/app.js','utf8');
const served=fs.readFileSync(`public/app-${pkg.version}.js`,'utf8');
const css=fs.readFileSync('public/reader-comfort.css','utf8');
const html=fs.readFileSync('public/index.html','utf8');

assert.equal(app,served,'Reader theme source and served release bundle must match');
assert.ok(html.includes('/reader-comfort.css'),'Reader comfort stylesheet must be loaded');
assert.ok(app.includes("theme==='light'?'soft-paper':theme"),'Legacy saved light reader theme must map to Soft Paper');
assert.ok(app.includes("setReaderTheme(localStorage.getItem('imperial_reader_theme')||'dark',false)"),'Initial theme restoration must not rewrite the saved reader preference');
assert.ok(app.includes("if(persist)localStorage.setItem('imperial_reader_theme',chosen)"),'Explicit theme changes must persist the selected reader preference');

const themes=[
 ['soft-paper','Soft Paper'],['dark','Gentle Dark'],['midnight','Midnight'],
 ['sepia','Muted Sepia'],['imperial','Imperial Plum'],['cosmic','Cosmic Dusk'],
 ['warm-parchment','Warm Parchment'],['oat','Oat Milk'],['sage','Sage Garden'],
 ['mist-blue','Misty Blue'],['dusty-rose','Dusty Rose'],['lavender-mist','Lavender Mist'],
 ['charcoal','Soft Charcoal'],['forest','Deep Forest'],['ocean','Quiet Ocean']
];
const settings=app.slice(app.indexOf('id="setReaderTheme"'),app.indexOf('</select>',app.indexOf('id="setReaderTheme"')));
const drawer=app.slice(app.indexOf('id="readerThemeSelect"'),app.indexOf('</select>',app.indexOf('id="readerThemeSelect"')));
for(const [value,label] of themes){
  assert.ok(settings.includes(`<option value="${value}">${label}</option>`),`Settings missing ${label}`);
  assert.ok(drawer.includes(`<option value="${value}">${label}</option>`),`Reader drawer missing ${label}`);
  assert.ok(css.includes(`data-reader-theme="${value}"`),`CSS palette missing ${value}`);
}
assert.equal((settings.match(/<option/g)||[]).length,themes.length,'Settings must offer exactly 15 reader backgrounds');
assert.equal((drawer.match(/<option/g)||[]).length,themes.length,'Reader drawer must offer exactly 15 reader backgrounds');

function luminance(hex){
 const channels=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 return .2126*channels[0]+.7152*channels[1]+.0722*channels[2];
}
function contrast(a,b){
 const values=[luminance(a),luminance(b)].sort((x,y)=>y-x);
 return (values[0]+.05)/(values[1]+.05);
}
for(const [value] of themes){
 const block=css.match(new RegExp(String.raw`\.readerPage\[data-reader-theme="${value}"\]\{([^}]*)\}`));
 assert.ok(block,`Missing palette block for ${value}`);
 const get=name=>block[1].match(new RegExp(name+':(#[0-9a-fA-F]{6})'))?.[1];
 const bg=get('--read-bg'),surface=get('--read-surface'),bar=get('--read-bar'),control=get('--read-control'),text=get('--read-text'),muted=get('--read-muted'),heading=get('--read-heading');
 assert.ok(bg&&surface&&bar&&control&&text&&muted&&heading,`Palette ${value} must define all reading surfaces and text roles`);
 assert.ok(contrast(bg,text)>=4.5,`${value} body text contrast on page background is below WCAG AA`);
 assert.ok(contrast(surface,text)>=4.5,`${value} body text contrast on chapter surface is below WCAG AA`);
 assert.ok(contrast(bar,text)>=4.5,`${value} toolbar text contrast is below WCAG AA`);
 assert.ok(contrast(control,text)>=4.5,`${value} control text contrast is below WCAG AA`);
 assert.ok(contrast(bg,muted)>=4.5,`${value} muted text contrast on page background is below WCAG AA`);
 assert.ok(contrast(surface,muted)>=4.5,`${value} muted text contrast on chapter surface is below WCAG AA`);
 assert.ok(contrast(bg,heading)>=4.5,`${value} heading contrast is below WCAG AA`);
}
assert.ok(!css.includes('--read-bg:#ffffff'),'Reader backgrounds must not use pure white');
assert.ok(css.includes('.readerPage .chapterDrawer{background:var(--read-surface)!important'), 'Chapter drawer must follow the selected reader surface');
assert.ok(css.includes('.readerPage .readerChapterItem.current{background:color-mix'), 'Selected chapter must use the active reader palette');
assert.ok(css.includes('.readerPage .readerLock .lockCost b{color:var(--read-accent)!important}'), 'Locked chapter price must use the reader accent');
assert.ok(css.split('\n').filter(line=>line.includes('.readerPage')).every(line=>!line.includes('html,')&&!line.includes('body{')),'Reader theme selectors must remain scoped');
console.log('Reader comfort themes: 15 palettes, selector parity, release parity and AA text contrast passed.');
