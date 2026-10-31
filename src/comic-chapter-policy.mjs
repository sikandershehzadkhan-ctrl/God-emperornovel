const MAX_COMIC_CHAPTER_LENGTH=95000;
const MAX_COMIC_PAGES=300;
function isPublicHttpsImageUrl(value){
 if(typeof value!=="string"||!value.trim()||value.length>2048)return false;
 let url;try{url=new URL(value)}catch{return false}
 const host=url.hostname.toLowerCase();
 if(url.protocol!=="https:"||url.username||url.password||url.port||!host)return false;
 if(host==="localhost"||host.endsWith(".localhost")||host.endsWith(".local")||host.endsWith(".internal"))return false;
 if(host.includes(":")||/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host))return false;
 return true;
}
function isPrivateImperialMediaPath(value){
 return typeof value==="string"&&/^\\/api\\/media\\/[1-9][0-9]*$/.test(value);
}
export function validateComicChapterContent(raw){
 if(typeof raw!=="string"||!raw.trim())return {ok:false,error:"Comic chapter pages are required."};
 if(raw.length>MAX_COMIC_CHAPTER_LENGTH)return {ok:false,error:"Comic chapter data exceeds the 95 KB limit."};
 let payload;try{payload=JSON.parse(raw)}catch{return {ok:false,error:"Comic chapters must use the supported page-sequence format."}}
 if(!payload||payload.type!=="imperial_comic_chapter"||payload.version!==1||!Array.isArray(payload.pages))return {ok:false,error:"Comic chapter page data is invalid."};
 if(payload.pages.length<1||payload.pages.length>MAX_COMIC_PAGES)return {ok:false,error:"Comic chapters must contain between 1 and 300 pages."};
 for(let i=0;i<payload.pages.length;i++){
  const page=payload.pages[i];
  if(!page||typeof page!=="object"||Array.isArray(page)||(!isPublicHttpsImageUrl(page.src)&&!isPrivateImperialMediaPath(page.src)))return {ok:false,error:"Comic page "+(i+1)+" must use a valid public HTTPS image URL or a private Imperial Novel media path."};
  if(page.alt!==undefined&&(typeof page.alt!=="string"||page.alt.length>300))return {ok:false,error:"Comic page "+(i+1)+" has invalid alternative text."};
  if(page.caption!==undefined&&(typeof page.caption!=="string"||page.caption.length>500))return {ok:false,error:"Comic page "+(i+1)+" has an invalid caption."};
 }
 return {ok:true};
}
