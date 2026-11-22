const MAX_LENGTH=95000;
const MAX_NODES=3000;
const MAX_DEPTH=12;
const MAX_TEXT=80000;
const NODE_TYPES=new Set(["doc","paragraph","heading","blockquote","bulletList","orderedList","listItem","horizontalRule","hardBreak","text"]);
const BLOCK_CHILDREN={
 doc:new Set(["paragraph","heading","blockquote","bulletList","orderedList","horizontalRule"]),
 blockquote:new Set(["paragraph","heading","bulletList","orderedList","blockquote"]),
 bulletList:new Set(["listItem"]),
 orderedList:new Set(["listItem"]),
 listItem:new Set(["paragraph","heading","bulletList","orderedList","blockquote"])
};
const INLINE_PARENTS=new Set(["paragraph","heading"]);
const MARKS=new Set(["bold","italic","underline","strike","code","link"]);
const SAFE_LINK=/^https?:\/\/[^\s"'<>]+$/i;
function fail(error){return {ok:false,richText:true,error}}
function exactKeys(value,allowed){return Object.keys(value).every(key=>allowed.has(key))}
function validateNode(node,parent,depth,state){
 if(!node||typeof node!=="object"||Array.isArray(node))return "Every rich-text node must be an object.";
 if(++state.nodes>MAX_NODES)return "Rich-text chapter contains too many nodes.";
 if(depth>MAX_DEPTH)return "Rich-text chapter nesting is too deep.";
 if(typeof node.type!=="string"||!NODE_TYPES.has(node.type))return "Rich-text chapter contains an unsupported node.";
 if(parent==="root"&&node.type!=="doc")return "Rich-text chapter root must be a document.";
 if(parent!=="root"&&!((BLOCK_CHILDREN[parent]?.has(node.type))||(INLINE_PARENTS.has(parent)&&["text","hardBreak"].includes(node.type))))return "Rich-text node is not allowed in this position.";
 if(!exactKeys(node,new Set(["type","attrs","content","text","marks"])))return "Rich-text node contains unsupported fields.";
 if(node.attrs!==undefined&&(!node.attrs||typeof node.attrs!=="object"||Array.isArray(node.attrs)))return "Rich-text node attributes are invalid.";
 if(node.type==="heading"){
  if(!node.attrs||!exactKeys(node.attrs,new Set(["level"]))||![2,3].includes(Number(node.attrs.level)))return "Only level 2 and level 3 headings are supported.";
 }else if(node.type==="orderedList"){
  if(node.attrs!==undefined&&(!exactKeys(node.attrs,new Set(["start"]))||!Number.isInteger(Number(node.attrs.start))||Number(node.attrs.start)<1||Number(node.attrs.start)>1000))return "Ordered-list start value is invalid.";
 }else if(node.attrs!==undefined)return "Attributes are not supported on this node.";
 if(node.type==="text"){
  if(parent==="root"||!INLINE_PARENTS.has(parent)||typeof node.text!=="string"||!node.text.length||node.text.length>20000||node.content!==undefined)return "Text node is invalid.";
  state.text+=node.text.length;if(state.text>MAX_TEXT)return "Rich-text chapter contains too much text.";
  if(node.marks!==undefined){
   if(!Array.isArray(node.marks)||node.marks.length>6)return "Text marks are invalid.";
   const seen=new Set();
   for(const mark of node.marks){
    if(!mark||typeof mark!=="object"||Array.isArray(mark)||!exactKeys(mark,new Set(["type","attrs"]))||!MARKS.has(mark.type)||seen.has(mark.type))return "Text contains an unsupported mark.";
    seen.add(mark.type);
    if(mark.type==="link"){
     if(!mark.attrs||!exactKeys(mark.attrs,new Set(["href"]))||typeof mark.attrs.href!=="string"||mark.attrs.href.length>2048||!SAFE_LINK.test(mark.attrs.href))return "Links must use a valid HTTPS or HTTP address.";
     let link;try{link=new URL(mark.attrs.href)}catch{return "Links must use a valid HTTPS or HTTP address."}
     if(!["http:","https:"].includes(link.protocol)||!link.hostname||link.username||link.password)return "Links must use a valid HTTPS or HTTP address.";
    }else if(mark.attrs!==undefined)return "Text mark attributes are not supported.";
   }
  }
  return null;
 }
 if(node.type==="horizontalRule"||node.type==="hardBreak"){
  if(node.content!==undefined||node.text!==undefined||node.marks!==undefined)return "This rich-text node cannot contain content.";
  return null;
 }
 if(node.text!==undefined||node.marks!==undefined)return "Only text nodes may contain text or marks.";
 if(!Array.isArray(node.content)||node.content.length===0)return "Rich-text blocks must contain content.";
 if(node.type==="doc"&&node.attrs!==undefined)return "Document attributes are not supported.";
 for(const child of node.content){const error=validateNode(child,node.type,depth+1,state);if(error)return error;}
 return null;
}
export function validateRichTextChapterContent(raw){
 if(typeof raw!=="string"||!raw.trimStart().startsWith("{"))return {ok:true,richText:false};
 let payload;try{payload=JSON.parse(raw)}catch{return {ok:true,richText:false}};
 if(payload?.type!=="imperial_rich_text_chapter")return {ok:true,richText:false};
 if(raw.length>MAX_LENGTH)return fail("Rich-text chapter data exceeds the 95 KB limit.");
 if(payload.version!==1||!payload.doc||!exactKeys(payload,new Set(["type","version","doc"])))return fail("Rich-text chapter version or envelope is invalid.");
 const state={nodes:0,text:0};
 const error=validateNode(payload.doc,"root",0,state);
 if(error)return fail(error);
 return {ok:true,richText:true,nodes:state.nodes,textLength:state.text};
}
