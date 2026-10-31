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
  assert.ok(css.includes(token),"Missing design foundation requirement: "+token);
}
assert.equal((html.match(/imperial-design-foundation\.css/g)||[]).length,1,"Design foundation must be linked exactly once");
assert.ok(html.indexOf("imperial-glass.css")<html.indexOf("imperial-design-foundation.css"),"Foundation must load after legacy global styles");
assert.equal(sourceApp,releaseApp,"Editable and versioned browser bundles must remain synchronized");
const theme=html.match(/<meta name="theme-color" content="([^"]+)"/);
assert.ok(theme,"HTML theme color meta must exist");
assert.equal(theme[1],manifest.theme_color,"HTML and PWA theme colors must match");
assert.equal(manifest.name,"Imperial Novel");
console.log("Imperial design foundation syntax, responsive, accessibility, asset and brand consistency checks passed.");
