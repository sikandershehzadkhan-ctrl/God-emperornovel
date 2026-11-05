const form=document.getElementById("authorSearch");
const input=document.getElementById("authorQuery");
const statusNode=document.getElementById("authorStatus");
const grid=document.getElementById("authorGrid");
const numberFormat=new Intl.NumberFormat();
let requestSequence=0;
function makeStat(value,label){
 const node=document.createElement("span");
 node.textContent=numberFormat.format(Number(value)||0)+" "+label;
 return node;
}
function renderAuthors(rows){
 grid.replaceChildren();
 if(!rows.length){
  const empty=document.createElement("p");
  empty.className="authorsEmpty";
  empty.textContent="No published authors match this search yet.";
  grid.append(empty);
  return;
 }
 for(const row of rows){
  const author=String(row.author||"").trim();
  if(!author)continue;
  const card=document.createElement("article");
  card.className="authorCard";
  const heading=document.createElement("h2");
  const link=document.createElement("a");
  link.href="/author/"+encodeURIComponent(author);
  link.textContent=author;
  heading.append(link);
  const description=document.createElement("p");
  const count=Number(row.novel_count)||0;
  description.textContent=count+" published "+(count===1?"story":"stories")+" in the Imperial catalog.";
  const stats=document.createElement("div");
  stats.className="authorStats";
  stats.append(makeStat(count,"stories"),makeStat(row.views,"recorded reads"));
  if(row.updated_at){
   const updated=document.createElement("span");
   updated.textContent="Updated "+String(row.updated_at).slice(0,10);
   stats.append(updated);
  }
  card.append(heading,description,stats);
  grid.append(card);
 }
}
async function loadAuthors(query=""){
 const sequence=++requestSequence;
 statusNode.textContent=query?"Searching published authors…":"Loading published authors…";
 grid.replaceChildren();
 try{
  const url=new URL("/api/public-authors",location.origin);
  if(query)url.searchParams.set("q",query.slice(0,80));
  const response=await fetch(url,{credentials:"same-origin",headers:{accept:"application/json"}});
  if(!response.ok)throw new Error("Author directory is temporarily unavailable.");
  const rows=await response.json();
  if(sequence!==requestSequence)return;
  if(!Array.isArray(rows))throw new Error("The author directory returned an invalid response.");
  renderAuthors(rows);
  statusNode.textContent=rows.length?(query?"Search results for “"+query+"”.":"Published authors in the Imperial catalog."):"No published authors are listed yet.";
 }catch(error){
  if(sequence!==requestSequence)return;
  statusNode.textContent=error.message||"Unable to load authors right now.";
  const retry=document.createElement("button");
  retry.type="button";
  retry.className="authorsRetry";
  retry.textContent="Try again";
  retry.addEventListener("click",()=>loadAuthors(input.value.trim()));
  grid.replaceChildren(retry);
 }
}
form.addEventListener("submit",event=>{
 event.preventDefault();
 loadAuthors(input.value.trim());
});
loadAuthors();
