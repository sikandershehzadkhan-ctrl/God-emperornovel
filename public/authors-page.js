async function authors(){
 const root=document.querySelector("#app");
 const params=new URLSearchParams(location.search);
 const initial=String(params.get("q")||"").slice(0,80);
 root.innerHTML=pageStart("Discover Authors","Meet creators behind published, rights-cleared stories.")+
 '<section class="panel"><form id="authorSearch" class="toolbar" role="search"><label class="search" style="display:flex;flex:1"><span aria-hidden="true">⌕</span><input id="authorQuery" name="q" type="search" maxlength="80" placeholder="Search by author name…" data-in-lang-placeholder="Search by author name…" data-in-lang-aria="Search authors" aria-label="Search authors"></label><button class="primary" type="submit" data-in-lang>Search authors</button><a class="ghost" href="/authors" data-in-lang>Clear</a></form><p class="muted" id="authorDirectoryMeta" role="status" aria-live="polite" data-in-lang>Loading published authors…</p></section><section class="section"><div id="authorDirectory" class="grid" aria-label="Published authors"></div></section></div></div>';
 root.querySelector(".title .eyebrow").dataset.inLang="";
 root.querySelector(".title h1").dataset.inLang="";
 root.querySelector(".title .sub").dataset.inLang="";
 const list=document.querySelector("#authorDirectory");
 const meta=document.querySelector("#authorDirectoryMeta");
 const form=document.querySelector("#authorSearch");
 const input=document.querySelector("#authorQuery");
 const t=key=>{const lang=document.documentElement.lang||"en";return (IN_LANG[lang]||IN_LANG.en)[key]||IN_LANG.en[key]||key};
 const setStatus=key=>{meta.dataset.inLang="";meta.dataset.inLangKey=key;meta.textContent=t(key)};
 setINLang(document.documentElement.lang||"en");
 input.value=initial;
 const makeLabel=key=>{const node=document.createElement("span");node.dataset.inLang="";node.dataset.inLangKey=key;node.textContent=t(key);return node};
 const render=rows=>{
  list.replaceChildren();
  for(const row of rows){
   const author=String(row.author||"").trim();
   if(!author)continue;
   const card=document.createElement("article");card.className="panel authorDirectoryCard";
   const heading=document.createElement("h2"),link=document.createElement("a");
   link.href="/author/"+encodeURIComponent(author);link.textContent=author;heading.append(link);
   const description=document.createElement("p"),count=Number(row.novel_count)||0;
   description.append(document.createTextNode(String(count)+" "),makeLabel(count===1?"published story":"published stories"));
   const stats=document.createElement("p");stats.className="muted";
   stats.append(document.createTextNode((Number(row.views)||0).toLocaleString()+" "),makeLabel("recorded reads"));
   if(row.updated_at){stats.append(document.createTextNode(" · "));stats.append(makeLabel("Updated"));stats.append(document.createTextNode(" "+String(row.updated_at).slice(0,10)))}
   card.append(heading,description,stats);list.append(card);
  }
  if(!list.children.length){const empty=document.createElement("div");empty.className="panel empty";const message=makeLabel("No published authors found.");empty.append(message);list.append(empty)}
  setINLang(document.documentElement.lang||"en");
 };
 const load=async query=>{
  setStatus(query?"Searching published authors…":"Loading published authors…");
  list.replaceChildren();
  try{
   const rows=await api("/api/public-authors"+(query?"?q="+encodeURIComponent(query):""));
   if(!Array.isArray(rows))throw new Error(t("Author directory is temporarily unavailable."));
   render(rows);
   setStatus(rows.length?"Published authors in the Imperial catalog.":"No published authors found.");
  }catch(error){
   setStatus("Author directory is temporarily unavailable.");
   const notice=document.createElement("div");notice.className="notice";
   const retry=document.createElement("button");retry.type="button";retry.className="ghost";retry.dataset.inLang="";retry.dataset.inLangKey="Try again";retry.textContent=t("Try again");
   retry.addEventListener("click",()=>load(input.value.trim().slice(0,80)));
   notice.append(document.createTextNode(error.message||t("Author directory is temporarily unavailable.")),document.createTextNode(" "),retry);
   list.replaceChildren(notice);setINLang(document.documentElement.lang||"en");
  }
 };
 form.addEventListener("submit",event=>{event.preventDefault();const query=String(input.value||"").trim().slice(0,80);history.replaceState(null,"","/authors"+(query?"?q="+encodeURIComponent(query):""));load(query)});
 await load(initial.trim());
}
