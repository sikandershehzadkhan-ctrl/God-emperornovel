const MAX_CHAPTER_BYTES=95000;
const MAX_NODES=5000;
const MAX_DEPTH=20;
const MAX_TEXT_LENGTH=90000;
const BLOCKS=new Set(["paragraph","heading","blockquote","bulletList","orderedList","listItem"]);
const INLINE=new Set(["text","hardBreak"]);
const MARKS=new Set(["bold","italic","strike","code","link"]);
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function plainObject(value){return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype}
function onlyKeys(value,allowed){return Object.keys(value).every(key=>allowed.has(key))}
function safeHref(value){
 if(typeof value!=="string"||!value.trim()||value.length>2048)return false;
 let url;try{url=new URL(value)}catch{return false}
 return ["https:","http:"].includes(url.protocol)&&!url.username&&!url.password&&!!url.hostname;
}
function validateNode(node,state,depth,parent){
 if(!plainObject(node)||depth>MAX_DEPTH||++state.nodes>MAX_NODES)return false;
 if(typeof node.type!=="string")return false;
 if(node.type==="text"){
  if(parent!=="inline"||!onlyKeys(node,new Set(["type","text","marks"]))||typeof node.text!=="string"||!node.text.length)return false;
  state.text+=node.text.length;if(state.text>MAX_TEXT_LENGTH)return false;
  if(node.marks!==undefined){
   if(!Array.isArray(node.marks)||node.marks.length>8)return false;
   for(const mark of node.marks){
    if(!plainObject(mark)||!MARKS.has(mark.type)||!onlyKeys(mark,new Set(["type","attrs"])))return false;
    if(mark.type==="link"){
     if(!plainObject(mark.attrs)||!onlyKeys(mark.attrs,new Set(["href","target","rel","class"]))||!safeHref(mark.attrs.href))return false;
     for(const key of ["target","rel","class"])if(own(mark.attrs,key)&&mark.attrs[key]!==null&&typeof mark.attrs[key]!=="string")return false;
    }else if(own(mark,"attrs"))return false;
   }
  }
  return true;
 }
 if(node.type==="hardBreak")return parent==="inline"&&onlyKeys(node,new Set(["type"]));
 if(!BLOCKS.has(node.type)||parent==="inline"||!onlyKeys(node,new Set(["type","attrs","content"])))return false;
 if(parent==="root"&&!["paragraph","heading","blockquote","bulletList","orderedList"].includes(node.type))return false;
 if(parent==="list"&&node.type!=="listItem")return false;
 if(parent==="listItem"&&!["paragraph","heading","blockquote","bulletList","orderedList"].includes(node.type))return false;
 if(parent==="blockquote"&&!["paragraph","heading","blockquote","bulletList","orderedList"].includes(node.type))return false;
 if(node.type==="heading"){
  if(!plainObject(node.attrs)||!onlyKeys(node.attrs,new Set(["level"]))||![1,2,3].includes(node.attrs.level))return false;
 }else if(node.type==="orderedList"){
  if(node.attrs!==undefined&&(!plainObject(node.attrs)||!onlyKeys(node.attrs,new Set(["start"]))||!(node.attrs.start===null||Number.isInteger(node.attrs.start)&&node.attrs.start>=1&&node.attrs.start<=10000)))return false;
 }else if(own(node,"attrs"))return false;
 if(node.type==="paragraph"||node.type==="heading"){
  if(node.content!==undefined&&!Array.isArray(node.content))return false;
  for(const child of node.content||[])if(!validateNode(child,state,depth+1,"inline"))return false;
  return true;
 }
 if(!Array.isArray(node.content)||!node.content.length)return false;
 for(const child of node.content){
  if(node.type==="bulletList"||node.type==="orderedList"){
   if(child?.type!=="listItem"||!validateNode(child,state,depth+1,"list"))return false;
  }else if(node.type==="listItem"){
   if(!validateNode(child,state,depth+1,"listItem"))return false;
  }else if(node.type==="blockquote"){
   if(!validateNode(child,state,depth+1,"blockquote"))return false;
  }
 }
 return true;
}
export function parseTextChapter(raw){
 if(typeof raw!=="string"||!raw.trim()||raw.length>MAX_CHAPTER_BYTES)return {ok:false,error:"Text chapter data is empty or exceeds the 95 KB limit."};
 let payload;try{payload=JSON.parse(raw)}catch{return {ok:false,error:"Text chapter document is not valid JSON."}}
 if(!plainObject(payload)||payload.type!=="imperial_text_chapter"||payload.version!==1||!plainObject(payload.document)||payload.document.type!=="doc"||!Array.isArray(payload.document.content)||!payload.document.content.length||!onlyKeys(payload,new Set(["type","version","document"]))||!onlyKeys(payload.document,new Set(["type","content"])))return {ok:false,error:"Text chapter document format is invalid."};
 const state={nodes:0,text:0};
 for(const node of payload.document.content)if(!validateNode(node,state,1,"root"))return {ok:false,error:"Text chapter contains unsupported or unsafe formatting."};
 return {ok:true,payload};
}
const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
function renderInline(node){
 if(node.type==="hardBreak")return "<br>";
 let value=esc(node.text);
 for(const mark of node.marks||[]){
  if(mark.type==="bold")value="<strong>"+value+"</strong>";
  else if(mark.type==="italic")value="<em>"+value+"</em>";
  else if(mark.type==="strike")value="<s>"+value+"</s>";
  else if(mark.type==="code")value="<code>"+value+"</code>";
  else if(mark.type==="link")value='<a href="'+esc(mark.attrs.href)+'" target="_blank" rel="noopener noreferrer">'+value+"</a>";
 }
 return value;
}
function renderBlock(node){
 const content=(node.content||[]).map(child=>child.type==="text"||child.type==="hardBreak"?renderInline(child):renderBlock(child)).join("");
 switch(node.type){
  case "paragraph":return "<p>"+content+"</p>";
  case "heading":return "<h"+node.attrs.level+">"+content+"</h"+node.attrs.level+">";
  case "blockquote":return "<blockquote>"+content+"</blockquote>";
  case "bulletList":return "<ul>"+content+"</ul>";
  case "orderedList":return "<ol"+(node.attrs?.start&&node.attrs.start!==1?' start="'+node.attrs.start+'"':"")+">"+content+"</ol>";
  case "listItem":return "<li>"+content+"</li>";
  default:return "";
 }
}
export function renderTextChapter(raw){
 const parsed=parseTextChapter(raw);if(!parsed.ok)return null;
 return parsed.payload.document.content.map(renderBlock).join("");
}
