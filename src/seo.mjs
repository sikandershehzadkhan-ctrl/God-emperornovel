import { CONTENT_FORMATS } from "./content-formats.mjs";
const DEFAULT_ORIGIN="https://god-emperornovel.sikandershehzadkhan.workers.dev";
const STATIC_PUBLIC_PATHS=["/","/catalog","/formats","/genres","/tags","/community","/leaderboard","/omniportal","/become-an-author","/privacy","/terms","/copyright",...CONTENT_FORMATS.map(format=>"/format/"+format.id)];
const PRIVATE_PREFIXES=["/api/","/admin","/account","/login","/register","/library","/history","/following","/settings","/notifications","/tickets","/requests","/author$"];

export function canonicalOrigin(value){
  try{
    const url=new URL(value||DEFAULT_ORIGIN);
    if(url.protocol!=="https:"||url.username||url.password||url.pathname!=="/"||url.search||url.hash)return DEFAULT_ORIGIN;
    return url.origin;
  }catch{return DEFAULT_ORIGIN}
}
export function buildRobotsTxt(origin,{allowOaiSearch=true,allowModelTraining=false}={}){
  const base=canonicalOrigin(origin);
  const privateRules=[...PRIVATE_PREFIXES.map(path=>"Disallow: "+path),"Disallow: /*?*"];
  return [
    "User-agent: OAI-SearchBot",
    allowOaiSearch?"Allow: /":"Disallow: /",
    ...privateRules,
    "",
    "User-agent: GPTBot",
    allowModelTraining?"Allow: /":"Disallow: /",
    "",
    "User-agent: Google-Extended",
    allowModelTraining?"Allow: /":"Disallow: /",
    "",
    "User-agent: *","Allow: /",...privateRules,
    "Sitemap: "+base+"/sitemap.xml",""
  ].join("\n");
}
export function buildSitemapXml(origin,novels=[],authors=[]){
  const base=canonicalOrigin(origin),paths=STATIC_PUBLIC_PATHS.map(path=>({loc:base+path}));
  const seen=new Set(paths.map(item=>item.loc));
  for(const novel of Array.isArray(novels)?novels:[]){
    const id=Number(novel?.id);
    if(!Number.isSafeInteger(id)||id<1)continue;
    const loc=base+"/novel/"+id;
    if(seen.has(loc))continue;
    seen.add(loc);
    const item={loc},date=novel.updated_at?new Date(novel.updated_at):null;
    if(date&&!Number.isNaN(date.getTime()))item.lastmod=date.toISOString().slice(0,10);
    paths.push(item);
  }
  for(const author of Array.isArray(authors)?authors:[]){const name=String(author?.author??author??"").trim();if(!name)continue;const loc=base+"/author/"+encodeURIComponent(name);if(seen.has(loc))continue;seen.add(loc);paths.push({loc})}
  const entries=paths.map(item=>"  <url><loc>"+xml(item.loc)+"</loc>"+(item.lastmod?"<lastmod>"+item.lastmod+"</lastmod>":"")+"</url>").join("\n");
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+entries+"\n</urlset>\n";
}
function xml(value){return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&apos;")}
function attr(value){return String(value).replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}
function upsertMeta(html,attribute,key,content){
  const escapedKey=key.replace(/[.*+?^$()|[\]\\]/g,"\\$&");
  const re=new RegExp("<meta\\s+(?=[^>]*\\b"+attribute+"=[\\\"']"+escapedKey+"[\\\"'])[^>]*>","i");
  const existing=html.match(re);
  if(existing){
    let tag=existing[0];
    if(/\bcontent=["'][^"']*["']/i.test(tag))tag=tag.replace(/\bcontent=(["'])[^"']*\1/i,'content="'+attr(content)+'"');
    else tag=tag.replace(/\s*\/?>$/,' content="'+attr(content)+'">');
    return html.replace(existing[0],tag);
  }
  return html.replace(/<\/head>/i,'<meta '+attribute+'="'+attr(key)+'" content="'+attr(content)+'">\n</head>');
}
export function canonicalPath(path){const normalized=String(path||"/").replace(/\/+$/,"")||"/";return normalized==="/discover"?"/catalog":normalized}
export function robotsForPath(path,status=200,forceNoindex=false){if(forceNoindex||status!==200||/^\/(admin|account|login|register|search|library|history|following|settings|notifications|tickets|requests|fandom)(\/|$)/.test(path)||/^\/author\/?$/.test(path))return "noindex,nofollow";return "index,follow"}
export function applySeoMetadata(html,{title,description,canonical,robots="index,follow",image,structuredData}={}){
  const safeTitle=String(title||"Imperial Novel | Read • Create • Conquer").slice(0,180);
  const safeDescription=String(description||"Discover original, licensed and authorized stories on Imperial Novel.").replace(/\s+/g," ").trim().slice(0,300);
  let output=String(html).replace(/<title>[\s\S]*?<\/title>/i,"<title>"+attr(safeTitle)+"</title>");
  for(const [attribute,key,value] of [
    ["name","description",safeDescription],["property","og:title",safeTitle],
    ["property","og:description",safeDescription],["name","twitter:title",safeTitle],
    ["name","twitter:description",safeDescription],["name","robots",robots]
  ])output=upsertMeta(output,attribute,key,value);
  if(canonical){
    const href=attr(canonical);
    if(/<link\s+[^>]*rel=["']canonical["'][^>]*>/i.test(output))output=output.replace(/<link\s+[^>]*rel=["']canonical["'][^>]*>/i,'<link rel="canonical" href="'+href+'">');
    else output=output.replace(/<\/head>/i,'<link rel="canonical" href="'+href+'">\n</head>');
  }
  if(canonical){
    const origin=new URL(canonical).origin;
    let safeImage=origin+"/imperial-novel-app-icon.svg";
    try{const candidate=new URL(image||safeImage,origin);if(candidate.protocol==="https:"&&!candidate.username&&!candidate.password)safeImage=candidate.href}catch{}
    output=upsertMeta(output,"property","og:url",canonical);
    output=upsertMeta(output,"property","og:image",safeImage);
    output=upsertMeta(output,"name","twitter:image",safeImage);
    const originForGraph=origin;
    const graph={"@context":"https://schema.org","@graph":[
      {"@type":"Organization","name":"Imperial Novel","url":origin,"logo":origin+"/imperial-novel-app-icon.svg"},
      {"@type":"WebSite","name":"Imperial Novel","url":origin},
      {"@type":"WebPage","name":safeTitle,"description":safeDescription,"url":canonical},
      ...(structuredData&&typeof structuredData==="object"&&!Array.isArray(structuredData)?[structuredData]:[])
    ]};
    const jsonLd=JSON.stringify(graph).replaceAll("<","\\u003c");
    output=output.replace(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,"");
    output=output.replace(/<\/head>/i,'<script type="application/ld+json">'+jsonLd+'</script>\n</head>');
  }
  return output;
}
export const seoStaticPaths=STATIC_PUBLIC_PATHS;

const PAGE_SEO={
  "/":{title:"Imperial Novel | Read • Create • Conquer",description:"Discover original, licensed and authorized novels, comics and connected worlds. Read, create and explore on Imperial Novel."},
  "/catalog":{title:"Discover Novels & Stories | Imperial Novel",description:"Explore the Imperial Novel catalog. Discover original and authorized stories across genres, formats and reading worlds."},
  "/formats":{title:"Explore Story Formats | Imperial Novel",description:"Browse novels, fanfiction, light novels, web novels, manga, manhwa, comics and other supported story formats in the Imperial Library."},
  "/genres":{title:"Explore Story Genres | Imperial Novel",description:"Browse story genres and discover your next novel on Imperial Novel."},
  "/tags":{title:"Explore Story Tags | Imperial Novel",description:"Find stories by topic, theme and tag in the Imperial Novel catalog."},
  "/community":{title:"Reader Community | Imperial Novel",description:"Connect with readers and creators in the Imperial Novel storytelling community."},
  "/leaderboard":{title:"Story Rankings | Imperial Novel",description:"Explore popular stories and reader rankings on Imperial Novel."},
  "/omniportal":{title:"OmniPortal | Imperial Novel",description:"Explore authorized catalog connections and discover stories across connected providers."},
  "/privacy":{title:"Privacy Policy | Imperial Novel",description:"Read how Imperial Novel handles account information, privacy and data protection."},
  "/terms":{title:"Terms of Service | Imperial Novel",description:"Review the terms governing use of the Imperial Novel platform."},
  "/copyright":{title:"Copyright & Rights | Imperial Novel",description:"Learn about content rights, licensing, attribution and copyright reporting on Imperial Novel."},
  "/discover":{title:"Discover Novels & Stories | Imperial Novel",description:"Explore the Imperial Novel catalog and discover original and authorized stories across genres and formats."},
  "/search":{title:"Search Stories | Imperial Novel",description:"Search novels, authors and story metadata across the Imperial Novel catalog."},
  "/tier-list":{title:"Story Tier Lists | Imperial Novel",description:"Explore community story tier lists and reader recommendations on Imperial Novel."},
  "/random":{title:"Discover a Random Story | Imperial Novel",description:"Find a new story to explore from the Imperial Novel catalog."},
  "/made-for-you":{title:"Stories Made for You | Imperial Novel",description:"Explore story recommendations and reading discoveries on Imperial Novel."},
  "/for-you":{title:"Stories Made for You | Imperial Novel",description:"Explore story recommendations and reading discoveries on Imperial Novel."},
  "/trending":{title:"Trending Stories | Imperial Novel",description:"Discover stories gaining attention across the Imperial Novel catalog."},
  "/vote":{title:"Community Story Voting | Imperial Novel",description:"Take part in community story voting on Imperial Novel."},
  "/trend-factory":{title:"Trend Factory | Imperial Novel",description:"Explore story signals and authorized catalog metadata in Imperial Novel Trend Factory."},
  "/admin":{title:"Command Center | Imperial Novel",description:"Imperial Novel administration."},
  "/become-an-author":{title:"Become an Author | Publish Your Stories on Imperial Novel",description:"Apply to publish original and authorized fiction on Imperial Novel. Explore creator tools, editorial review, ownership principles and supported story formats."},
  "/author":{title:"Author Studio | Imperial Novel",description:"Create and manage original, licensed and authorized stories on Imperial Novel."},
  "/settings":{title:"Settings | Imperial Novel",description:"Manage your Imperial Novel account and reading preferences."},
  "/notifications":{title:"Notifications | Imperial Novel",description:"View your Imperial Novel account notifications."}
};
export function getPageSeo(path){
  const format=String(path||"").match(/^\/format\/([a-z0-9_-]+)\/?$/);
  if(format){const item=CONTENT_FORMATS.find(entry=>entry.id===format[1]);if(item)return {title:item.label+" | Imperial Novel",description:"Discover "+item.label.toLowerCase()+" on Imperial Novel. Explore published, rights-cleared stories and new worlds."}}
  return PAGE_SEO[path]||{title:"Imperial Novel | Read • Create • Conquer",description:"Discover original, licensed and authorized stories on Imperial Novel."};
}
