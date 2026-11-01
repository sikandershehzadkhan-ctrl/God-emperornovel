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
assert.ok(css.includes(".skeletonCard::before,.skeletonCard::after"),"Homepage loading placeholders must show cover and text shapes instead of blank blocks");
assert.ok(sourceApp.includes('aria-label="Trending stories" aria-busy="true"'),"Trending shelf must expose its loading state to assistive technology");
assert.ok(sourceApp.includes('aria-label="Recently updated stories" aria-busy="true"'),"Latest shelf must expose its loading state to assistive technology");
assert.ok(sourceApp.includes('class="skeletonCard" aria-hidden="true"'),"Decorative skeleton placeholders must be hidden from assistive technology");
assert.ok(sourceApp.includes("el.setAttribute('aria-busy','false')"),"Story shelf must clear its busy state after rendering results");
assert.ok(sourceApp.includes("$('#trend').setAttribute('aria-busy','false');$('#latest').setAttribute('aria-busy','false')"),"Story shelf must clear its busy state after a loading error");
assert.ok(css.includes("aspect-ratio:.76"),"Loading placeholders must reserve a stable story-card footprint");
assert.ok(css.includes("@media(prefers-reduced-motion:reduce){.skeletonCard{animation:none;background:var(--in-surface)}}"),"Story loading animation must respect reduced-motion preferences");
assert.ok(css.includes("Homepage story cards: editorial hierarchy"),"Homepage story-card refinement must remain in the design foundation");
assert.ok(css.includes(".authorLandingHero"),"Public author onboarding must use the shared Imperial design system.");
assert.ok(css.includes(".authorLandingBenefits"),"Author benefits must have a responsive card layout.");
assert.ok(css.includes(".authorLandingProcess"),"Author onboarding steps must have a structured responsive layout.");
assert.ok(css.includes("@media(max-width:640px)"),"Author onboarding must have a dedicated narrow-screen layout.");
assert.ok(css.includes("-webkit-line-clamp:2"),"Story titles must wrap to two readable lines instead of truncating after one");
assert.ok(css.includes(".homeStoryGrid.multiStory{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}"),"Phone story shelves must use a stable two-column grid");
assert.ok(css.includes("@media(max-width:360px)"),"Very narrow phones must switch story cards to a readable horizontal layout");
assert.ok(css.includes(".homePage .heroSearch{\n  display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;"),"Hero search must size itself safely inside the mobile hero");
assert.ok(css.includes(".homePage .heroSearch input{flex:1 1 auto;width:0;min-width:0}"),"Hero search input must shrink without forcing horizontal overflow");
assert.ok(css.includes("@media(max-width:340px)"),"Extra-narrow phone hero controls need a dedicated layout refinement");
assert.ok(css.includes(".skeletonCard::before,.skeletonCard::after{animation:none!important}"),"Reduced-motion preference must disable skeleton pseudo-element animation");
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

for(const selector of [".communityGrid>.panel",".communityGrid .commentItem",".communityGrid .commentReply",".communityGrid .commentActions .ghost",".communityGrid .ratingStar",".communityGrid :is(input,textarea,select)"]){
  assert.ok(css.includes(selector),"Community visual foundation must include "+selector);
}
assert.ok(css.includes("background:var(--in-surface);color:var(--in-ink)"),"Community panels must use semantic theme-aware surfaces and text");
assert.ok(css.includes("grid-template-columns:minmax(0,1fr);gap:12px"),"Community panels must stack without overflow on narrow screens");
assert.ok(css.includes("margin-inline-start:clamp(10px,3vw,28px)"),"Nested discussion replies must respect logical direction and mobile sizing");


for(const selector of [".novelCommentsComposer",".commentReportForm",".novelCommentComposerFooter",".replyContext",".commentStatus",".ratingIslandSummary"]){
  assert.ok(css.includes(selector),"Community interaction styling must include "+selector);
}
assert.ok(css.includes("min-height:104px"),"Comment composer must have a comfortable touch and writing area");
assert.ok(css.includes("background:var(--in-brand-soft)"),"Reply context must use the semantic brand surface");

console.log("Imperial design foundation syntax, responsive, accessibility, asset and brand consistency checks passed.");


for(const selector of [".catalogTop form",".catalogSearch .search",".filterRow",".filterGroup",".catalogGrid",".catalogCover",".catalogBody",".catalogStats",".activeFilters",".catalogEmpty",".pager"]){
  assert.ok(css.includes(selector),"Catalog visual foundation must include "+selector);
}
assert.ok(css.includes("grid-template-columns:repeat(4,minmax(0,1fr))"),"Desktop catalog must use a balanced four-column card grid");
assert.ok(css.includes("@media(max-width:640px){\n .catalogTop"),"Catalog filters and cards must have a dedicated mobile layout");
assert.ok(css.includes("@media(max-width:360px)"),"Very narrow phones must use compact horizontal catalog cards");
assert.ok(css.includes("grid-template-columns:104px minmax(0,1fr)"),"Compact catalog cards must preserve readable cover and title space");
assert.ok(css.includes(".catalogGrid[aria-busy=\"true\"]"),"Catalog loading state must remain visibly distinct");
assert.ok(css.includes(".catalogCard:focus-visible"),"Catalog story links must have a visible keyboard focus treatment");
assert.ok(css.includes("background:var(--in-surface);color:var(--in-ink)"),"Catalog controls and cards must use theme-aware semantic surfaces");
assert.ok(sourceApp.includes('class="catalogGrid"'),"Catalog page must render its story grid");
assert.ok(sourceApp.includes('class="activeFilters"'),"Catalog page must expose removable active-filter chips");
assert.ok(sourceApp.includes('class="catalogEmpty"'),"Catalog page must render a designed empty state");


for(const selector of [".novelHero",".novelCover",".novelInfo h1",".novelInfo .stats",".novelInfo .actions",".tabs a.active",".chapterList .chapter","#community"]){
  assert.ok(css.includes(selector),"Story detail design foundation must include "+selector);
}
assert.ok(css.includes("grid-template-columns:minmax(190px,260px) minmax(0,1fr)"),"Desktop story detail must separate cover art from editorial metadata");
assert.ok(css.includes("@media(max-width:420px){\n .novelHero"),"Story detail must have a compact phone layout");
assert.ok(css.includes("grid-template-columns:88px minmax(0,1fr)"),"Narrow phone story detail must preserve a readable cover and content column");
assert.ok(css.includes("scroll-margin-top:92px"),"Community deep links must account for the sticky navigation");
assert.ok(sourceApp.includes('class="novelHero"'),"Novel detail route must render the shared story hero");
assert.ok(sourceApp.includes('class="tabs"'),"Novel detail route must render overview and chapter navigation");
assert.ok(sourceApp.includes('class="chapterList"'),"Novel detail route must render the chapter archive");


for(const selector of [".accountGrid",".accountMenu",".accountMenu a.active",".profileTop",".metricGrid",".metric",".accountGrid .card",".accountGrid .statline"]){
  assert.ok(css.includes(selector),"Account and library design foundation must include "+selector);
}
assert.ok(css.includes("grid-template-columns:210px minmax(0,1fr)"),"Desktop account workspace must separate navigation and content");
assert.ok(css.includes("@media(max-width:760px){\n .accountGrid"),"Account workspace must collapse cleanly on mobile");
assert.ok(css.includes("overflow-x:auto"),"Account navigation must remain usable on narrow screens");
assert.ok(css.includes("grid-template-columns:repeat(2,minmax(0,1fr))"),"Personal library must use a two-column mobile grid");
assert.ok(sourceApp.includes('class="accountGrid"'),"Account route must render the account workspace");
assert.ok(sourceApp.includes('class="accountMenu"'),"Account route must render account navigation");
assert.ok(sourceApp.includes('class="metricGrid"'),"Account route must render account metrics");
assert.ok(sourceApp.includes('id="savedList"'),"Library route must render saved stories");
assert.ok(sourceApp.includes('id="continueList"'),"Library route must render reading progress");


for(const selector of [".authorStudioLayout",".authorStudioIntro",".authorCreateForm",".authorFormGrid",".authorWorksPanel",".authorWorksList",".authorWork",".authorStatus",".authorWorkActions",".authorEditForm",".authorChapterForm"]){
  assert.ok(css.includes(selector),"Author Studio design foundation must include "+selector);
}
assert.ok(css.includes("grid-template-columns:minmax(0,1fr) minmax(0,1fr)"),"Author Studio must use a balanced desktop workspace");
assert.ok(css.includes(".authorEditForm[hidden],.authorChapterForm[hidden]"),"Hidden author editing forms must remain hidden");
assert.ok(css.includes("@media(max-width:520px){\n .authorStudioIntro"),"Author Studio must have a dedicated narrow-phone layout");
assert.ok(css.includes("background:var(--in-canvas);color:var(--in-ink)"),"Author forms must use accessible semantic theme colors");
assert.ok(sourceApp.includes('class="authorStudioLayout"'),"Author route must render the Author Studio workspace");
assert.ok(sourceApp.includes('id="createStoryForm"'),"Author route must render the create-story form");
assert.ok(sourceApp.includes('id="authorWorksList"'),"Author route must render the creator's works list");
assert.ok(sourceApp.includes('id="authorAnalyticsMetrics"'),"Author route must render live author analytics");


for(const selector of [".readerPage",".readerBarInner",".readerBack",".readerBook",".readerTools",".readerTool:focus-visible",".readerMain",".readerArticle h1",".readerContent",".readerActions",".readerFooterCard",".chapterDrawer",".readerPrefs",".readerChapterItem.current",".readerLock",".comicPage img"]){
  assert.ok(css.includes(selector),"Reader experience must include "+selector);
}
assert.ok(css.includes("max-width:68ch"),"Reader prose must preserve an editorially comfortable reading measure");
assert.ok(css.includes("grid-template-columns:78px minmax(0,1fr)"),"Chapter drawer entries must retain clear chapter number and title hierarchy");
assert.ok(css.includes("@media(max-width:640px){\n .readerBarInner"),"Reader toolbar and article must adapt to phone widths");
assert.ok(css.includes("@media(max-width:360px)"),"Reader controls must remain usable on very narrow phones");
assert.ok(sourceApp.includes('class="readerPage"'),"Chapter route must render the reader experience");
assert.ok(sourceApp.includes('id="chapterDrawer"'),"Reader must expose its chapter and preference drawer");
assert.ok(sourceApp.includes('class="readerChapterItem'),"Reader must render chapter navigation");
assert.ok(sourceApp.includes('class="readerFooterCard"'),"Reader must provide a clear next-step footer");


for(const selector of [".genreGrid",".genreCard",".genreGlyph",".tagGrid",".tagTile",".formatDirectoryGrid",".formatGroup",".formatLinks",".formatLink",".tabs .period.active",".rankBadge","#lbNovels>.panel","#lbAuthors>.panel","#sf .search"]){
  assert.ok(css.includes(selector),"Discovery and rankings must include "+selector);
}
assert.ok(css.includes("@media(max-width:640px){\n .genreGrid"),"Genre and format discovery must adapt to mobile screens");
assert.ok(css.includes("@media(max-width:360px)"),"Discovery tiles must fit narrow phone screens");
assert.ok(sourceApp.includes('class="genreCard"'),"Genre directory must render linked genre cards");
assert.ok(sourceApp.includes('class="tagTile"'),"Tag directory must render linked tag tiles");
assert.ok(sourceApp.includes('class="formatDirectoryGrid"'),"Format directory must render grouped format navigation");
assert.ok(sourceApp.includes('id="lbNovels"')&&sourceApp.includes('id="lbAuthors"'),"Leaderboard must render novel and author rankings");
assert.ok(sourceApp.includes('id="sf"'),"Search must expose its semantic search form");


for(const selector of [".skipLink:focus",".menuDrawer.is-open",".menuDrawer:not(.is-open)",".menuDrawerHead",".menuDrawer>a:not(.menuDrawerBrand) svg",".menuToggle[aria-expanded=\"true\"]",".navlinks a:focus-visible",".languageControl select",".mobileNav a span svg",".footerLinks a:focus-visible"]){
 assert.ok(css.includes(selector),"Navigation shell must include "+selector);
}
assert.ok(css.includes("env(safe-area-inset-bottom)"),"Mobile navigation must respect device safe areas");
assert.ok(css.includes("overscroll-behavior:contain"),"Open navigation drawer must contain scroll chaining");
assert.ok(css.includes("@media(forced-colors:active)"),"Navigation must preserve affordances in forced-colors mode");
assert.ok(sourceApp.includes('href="#app"'),"Shell must provide a skip-to-main-content link");
assert.ok(sourceApp.includes('aria-controls="imperialMenuDrawer"'),"Menu toggle must identify its controlled drawer");
assert.ok(sourceApp.includes('aria-expanded="false"'),"Menu toggle must expose its collapsed state");
assert.ok(sourceApp.includes("e.key==='Escape'"),"Navigation drawer must close on Escape");
assert.ok(sourceApp.includes("e.key==='Tab'"),"Navigation drawer must manage keyboard focus");
assert.ok(sourceApp.includes('aria-label="Primary mobile navigation"'),"Mobile navigation must have an accessible name");
assert.ok(sourceApp.includes('aria-label="Language"'),"Language selector must have an accessible name");

assert.ok(sourceApp.includes('aria-current="page"'),"Navigation must expose the current page to assistive technology");
assert.ok((sourceApp.match(/aria-current="page"/g)||[]).length>=7,"Desktop and mobile primary navigation must expose current-page state");
assert.ok(html.includes('<main id="app" class="appBootRoot" tabindex="-1">'),"Skip navigation target must be programmatically focusable");
