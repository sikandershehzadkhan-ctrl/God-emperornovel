const ALLOWED_RIGHTS=new Set(["original","public_domain","licensed","authorized"]);
const TEXT_FORMATS=new Set(["original","fanfiction","light_novel","web_novel"]);

function plainText(value){
  return String(value??"")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ")
    .replace(/<[^>]*>/g," ")
    .replace(/&nbsp;|&#160;/gi," ")
    .replace(/&(?:amp|lt|gt|quot|apos);/gi," ")
    .replace(/\s+/g," ").trim();
}

export function assessPublicationQuality(novel={},chapters=[],supportedFormats=[]){
  const issues=[],warnings=[];
  const title=String(novel.title??"").trim();
  const author=String(novel.author??"").trim();
  const description=plainText(novel.description);
  const language=String(novel.language??"").trim();
  const format=String(novel.kind??"").trim().toLowerCase();
  const rights=String(novel.rights_status??"").trim().toLowerCase();
  const evidence=String(novel.rights_evidence??"").trim();
  const published=Array.isArray(chapters)?chapters.filter(ch=>String(ch.publication_status??"published")==="published"):[];

  if(title.length<3||title.length>160)issues.push({code:"title_invalid",message:"Title must contain 3 to 160 characters."});
  if(author.length<2||author.length>100)issues.push({code:"author_invalid",message:"Author name must contain 2 to 100 characters."});
  if(description.length<80)issues.push({code:"description_too_short",message:"Add a meaningful description of at least 80 characters."});
  if(!language||language.length>40)issues.push({code:"language_invalid",message:"Choose a valid content language."});
  if(!supportedFormats.includes(format))issues.push({code:"format_invalid",message:"Choose a supported content format."});
  if(!ALLOWED_RIGHTS.has(rights))issues.push({code:"rights_ineligible",message:"A valid rights declaration is required."});
  if(rights!=="original"&&!evidence)issues.push({code:"rights_evidence_missing",message:"Add rights evidence for licensed, public-domain or authorized works."});
  if(published.length===0)issues.push({code:"published_chapter_required",message:"Publish at least one chapter before publishing this novel."});

  const invalidChapters=published.filter(ch=>String(ch.title??"").trim().length<2||plainText(ch.content).length===0);
  if(invalidChapters.length)issues.push({code:"chapter_content_missing",message:"Every published chapter needs a title and readable content."});
  if(description.length>0&&description.length<140)warnings.push({code:"description_brief",message:"A more informative description may help readers understand the story."});
  if(!String(novel.cover_url??"").trim())warnings.push({code:"cover_missing",message:"A cover image is recommended for discovery, but is not required for rights approval."});
  const shortTextChapters=TEXT_FORMATS.has(format)?published.filter(ch=>plainText(ch.content).split(/\s+/).filter(Boolean).length<80):[];
  if(shortTextChapters.length)warnings.push({code:"short_chapter",message:"Some published text chapters are very short. Review them for completeness."});

  return {ready:issues.length===0,issues,warnings,summary:{publishedChapters:published.length,invalidChapters:invalidChapters.length,descriptionCharacters:description.length}};
}
