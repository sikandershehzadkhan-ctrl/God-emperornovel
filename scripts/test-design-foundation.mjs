import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css=readFileSync("public/imperial-design-foundation.css","utf8");
const html=readFileSync("public/index.html","utf8");
const sourceApp=readFileSync("public/app.js","utf8");
const releaseApp=readFileSync("public/app-17.23.0.js","utf8");
const manifest=JSON.parse(readFileSync("public/manifest-17.23.0.webmanifest","utf8"));

function luminance(hex){
  const rgb=hex.replace("#","").match(/.{2}/g).map(value=>parseInt(value,16)/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);
  return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
}
function contrast(foreground,background){
  const a=luminance(foreground),b=luminance(background);
  return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}
function token(block,name){return block.match(new RegExp(name+":(#[0-9A-Fa-f]{6})"))?.[1]||null}
const lightBlock=css.match(/:root\{([\s\S]*?)\}/)?.[1]||"";
const darkBlock=css.match(/html\[data-theme="dark"\]\{([\s\S]*?)\}/)?.[1]||"";
const lightSubtle=token(lightBlock,"--in-subtle"),lightCanvas=token(lightBlock,"--in-canvas");
const darkSubtle=token(darkBlock,"--in-subtle"),darkCanvas=token(darkBlock,"--in-canvas");
assert.ok(lightSubtle&&lightCanvas&&darkSubtle&&darkCanvas,"Light and dark text contrast tokens must be explicit hex colors");
assert.ok(contrast(lightSubtle,lightCanvas)>=4.5,"Light-theme subtle text must meet WCAG AA normal-text contrast");
assert.ok(contrast(darkSubtle,darkCanvas)>=4.5,"Dark-theme subtle text must meet WCAG AA normal-text contrast");

let braces=0,parens=0,quote="",comment=false,escaped=false;
for(let i=0;i<css.length;i++){
  const ch=css[i],next=css[i+1];
  if(comment){if(ch==="*"&&next==="/"){comment=false;i++}continue}
  if(quote){if(escaped){escaped=false;continue}if(ch==="\\"){escaped=true;continue}if(ch===quote)quote="";continue}
  if(ch==="/"&&next==="*"){comment=true;i++;continue}
  if(ch==='"'||ch==="'"){quote=ch;continue}
  if(ch==="{")braces++;else if(ch==="}")braces--;
  if(ch==="(")parens++;else if(ch===")")parens--;
  assert.ok(braces>=0,"CSS has an unmatched closing brace");
  assert.ok(parens>=0,"CSS has an unmatched closing parenthesis");
}
assert.equal(braces,0,"CSS braces must be balanced");
assert.equal(parens,0,"CSS parentheses must be balanced");
assert.equal(quote,"","CSS strings must be terminated");
assert.equal(comment,false,"CSS comments must be terminated");
assert.doesNotMatch(css,/@import\s+url|url\(\s*["']?https?:/i,"Design foundation must not add remote runtime assets");
for(const token of ["--in-brand:#6A0DAD","--in-discovery:#0F52BA","--in-ink:#0B1215","--in-surface:#FFFFFF","@media(max-width:760px)","@media(prefers-reduced-motion:reduce)",":focus-visible"]){
assert.ok(css.includes("@media(max-width:1180px) and (min-width:761px){.nav{gap:12px}.brand{min-width:205px}.navlinks{display:none!important}"),"Tablet header must use the menu drawer instead of compressing desktop navigation");
assert.ok(css.includes("@media(max-width:760px){"),"Phone layout must have a separate responsive breakpoint");
assert.ok(sourceApp.includes("id=\"imperialMenuToggle\"")&&sourceApp.includes("id=\"imperialMenuDrawer\""),"Tablet navigation must have a working menu trigger and drawer");
  assert.ok(css.includes(token),"Missing design foundation requirement: "+token);
}
assert.ok(css.includes("Homepage story cards: editorial hierarchy"),"Homepage story-card refinement must remain in the design foundation");
assert.ok(css.includes("-webkit-line-clamp:2"),"Story titles must wrap to two readable lines instead of truncating after one");
assert.ok(css.includes(".homeStoryGrid.multiStory{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}"),"Phone story shelves must use a stable two-column grid");
assert.ok(css.includes("@media(max-width:360px)"),"Very narrow phones must switch story cards to a readable horizontal layout");
assert.ok(css.includes(".homeStoryGrid .card:focus-visible"),"Story cards must have a visible keyboard focus treatment");
assert.equal((html.match(/imperial-design-foundation\.css/g)||[]).length,1,"Design foundation must be linked exactly once");
assert.ok(html.indexOf("imperial-glass.css")<html.indexOf("imperial-design-foundation.css"),"Foundation must load after legacy global styles");
assert.equal(sourceApp,releaseApp,"Editable and versioned browser bundles must remain synchronized");
for(const label of ["Home","Discover","Trending","Rankings","Library","Community","Create"]){
  assert.ok(sourceApp.includes(">"+label+"</a>"),"Primary desktop navigation must include "+label);
}
assert.ok(sourceApp.includes('<nav class="navlinks" aria-label="Primary navigation">'),"Desktop navigation must have an accessible label");
assert.ok(sourceApp.includes("const isTrending="),"Trending navigation state must be derived from the catalog sort query");
assert.ok(sourceApp.includes("const current=x=>navActive(x)?"),"Current-page state must be exposed to assistive technology");
assert.ok(sourceApp.includes("aria-current"),"Current navigation destination must expose aria-current");
assert.ok(!sourceApp.includes("aria-current=false"),"Inactive navigation links must not receive aria-current=false");
for(const genre of ["fantasy","progression","romance","isekai"]){assert.ok(sourceApp.includes('href="/catalog?genre='+genre+'"'),"Homepage genre shortcut must open the catalog filter for "+genre);}
assert.ok(!sourceApp.includes('href="/genres?genre='),"Homepage must not send genre shortcuts to an unsupported genre query route");
assert.ok(sourceApp.includes('aria-label="Primary mobile navigation"'),"Mobile navigation must have an accessible label");
assert.ok(sourceApp.includes("menuDrawer?.querySelector('a[href]')?.focus()"),"Opening the navigation drawer must move keyboard focus inside");
assert.ok(sourceApp.includes("e.key==='Tab'&&menuButton?.getAttribute('aria-expanded')==='true'"),"Navigation drawer must trap keyboard focus while open");
assert.ok(sourceApp.includes("menuButton?.focus()"),"Closing the navigation drawer must restore focus to its trigger");


const theme=html.match(/<meta name="theme-color" content="([^"]+)"/);
assert.ok(theme,"HTML theme color meta must exist");
assert.equal(theme[1],manifest.theme_color,"HTML and PWA theme colors must match");
assert.equal(manifest.name,"Imperial Novel");
console.log("Imperial design foundation syntax, responsive, accessibility, asset and brand consistency checks passed.");
