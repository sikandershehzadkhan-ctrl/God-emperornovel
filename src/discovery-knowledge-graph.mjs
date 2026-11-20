export function buildDiscoveryGraph(novels=[],genres=[],tags=[],formats=[]){
  const nodes=new Map(),edges=new Map();
  const addNode=node=>{if(node.id&&!nodes.has(node.id))nodes.set(node.id,node)};
  const addEdge=(source,target,type)=>{const id=source+"|"+type+"|"+target;if(source!==target&&!edges.has(id))edges.set(id,{id,source,target,type})};
  for(const novel of Array.isArray(novels)?novels:[]){
    const id=Number(novel?.id);
    const title=String(novel?.title??"").trim();
    const author=String(novel?.author??"").trim();
    const kind=String(novel?.kind??"").trim().toLowerCase();
    if(!Number.isSafeInteger(id)||id<1||!title||!author)continue;
    const novelId="novel:"+id,authorId="author:"+encodeURIComponent(author.toLowerCase());
    addNode({id:novelId,type:"novel",label:title,novelId:id,language:String(novel.language??""),description:String(novel.description??"").slice(0,240),coverUrl:String(novel.cover_url??"")});
    addNode({id:authorId,type:"author",label:author});
    addEdge(authorId,novelId,"created");
    if(kind){const formatId="format:"+kind;const format=(Array.isArray(formats)?formats:[]).find(item=>item.id===kind);if(format){addNode({id:formatId,type:"format",label:format.label});addEdge(novelId,formatId,"uses-format")}}
  }
  const validNovelIds=new Set([...nodes.values()].filter(node=>node.type==="novel").map(node=>node.novelId));
  for(const item of Array.isArray(genres)?genres:[]){
    const novelId=Number(item?.novel_id),id=Number(item?.id);
    if(!validNovelIds.has(novelId)||!Number.isSafeInteger(id)||id<1)continue;
    const genreId="genre:"+id;addNode({id:genreId,type:"genre",label:String(item.name??""),slug:String(item.slug??"")});addEdge("novel:"+novelId,genreId,"classified-as");
  }
  for(const item of Array.isArray(tags)?tags:[]){
    const novelId=Number(item?.novel_id),id=Number(item?.id);
    if(!validNovelIds.has(novelId)||!Number.isSafeInteger(id)||id<1)continue;
    const tagId="tag:"+id;addNode({id:tagId,type:"tag",label:String(item.name??""),slug:String(item.slug??"")});addEdge("novel:"+novelId,tagId,"tagged-with");
  }
  return {version:1,nodes:[...nodes.values()],edges:[...edges.values()]};
}
