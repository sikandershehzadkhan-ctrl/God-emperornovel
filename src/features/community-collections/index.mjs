const MAX_COLLECTIONS_PER_OWNER=50;
const MAX_ITEMS_PER_COLLECTION=100;
const cleanText=(value,max)=>String(value??'').trim().slice(0,max);
const safeId=value=>{const id=Number(value);return Number.isSafeInteger(id)&&id>0?id:null};

export async function handleCommunityCollectionsRequest({req,env,url,u,body,json,need}){
 const p=url.pathname,m=req.method;
 if(p==='/api/community/collections'&&m==='GET'){
  const rows=await env.DB.prepare(`SELECT c.id,c.title,c.description,c.updated_at,
   COALESCE(u.username,'Reader') creator,COUNT(i.novel_id) item_count
   FROM community_collections c JOIN users u ON u.id=c.owner_user_id
   LEFT JOIN community_collection_items i ON i.collection_id=c.id
   WHERE c.visibility='public'
   GROUP BY c.id ORDER BY c.updated_at DESC,c.id DESC LIMIT 50`).all();
  return json(rows.results||[]);
 }
 if(p==='/api/community/collections/mine'&&m==='GET'){
  const e=need(u);if(e)return e;
  const rows=await env.DB.prepare(`SELECT c.id,c.title,c.description,c.visibility,c.updated_at,
   COUNT(i.novel_id) item_count FROM community_collections c
   LEFT JOIN community_collection_items i ON i.collection_id=c.id
   WHERE c.owner_user_id=? GROUP BY c.id ORDER BY c.updated_at DESC,c.id DESC LIMIT ?`).bind(u.id,MAX_COLLECTIONS_PER_OWNER).all();
  return json(rows.results||[]);
 }
 const detail=p.match(/^\/api\/community\/collections\/(\d+)$/);
 if(detail&&m==='GET'){
  const id=safeId(detail[1]);if(!id)return json({error:'Collection not found.'},404);
  const collection=await env.DB.prepare(`SELECT c.id,c.owner_user_id,c.title,c.description,c.visibility,c.updated_at,
   COALESCE(u.username,'Reader') creator FROM community_collections c
   JOIN users u ON u.id=c.owner_user_id WHERE c.id=?`).bind(id).first();
  if(!collection||(collection.visibility!=='public'&&Number(collection.owner_user_id)!==Number(u?.id)))return json({error:'Collection not found.'},404);
  const items=await env.DB.prepare(`SELECT n.id,n.title,n.author,n.cover,n.rating,n.views,i.position,i.added_at
   FROM community_collection_items i JOIN novels n ON n.id=i.novel_id
   WHERE i.collection_id=? AND n.publication_status='published'
   AND n.rights_status IN ('original','public_domain','licensed','authorized')
   ORDER BY i.position,i.added_at LIMIT ?`).bind(id,MAX_ITEMS_PER_COLLECTION).all();
  delete collection.owner_user_id;
  return json({collection,items:items.results||[]});
 }
 if(p==='/api/community/collections'&&m==='POST'){
  const e=need(u);if(e)return e;
  const b=await body(req),title=cleanText(b.title,80),description=cleanText(b.description,500);
  const visibility=b.visibility==='public'?'public':'private';
  if(!title)return json({error:'A collection title is required.'},400);
  const count=await env.DB.prepare('SELECT COUNT(*) total FROM community_collections WHERE owner_user_id=?').bind(u.id).first();
  if(Number(count?.total||0)>=MAX_COLLECTIONS_PER_OWNER)return json({error:'Collection limit reached.'},409);
  const result=await env.DB.prepare('INSERT INTO community_collections(owner_user_id,title,description,visibility) VALUES(?,?,?,?) RETURNING id,title,description,visibility,created_at,updated_at').bind(u.id,title,description,visibility).first();
  return json(result,201);
 }
 if(detail&&m==='PATCH'){
  const e=need(u);if(e)return e;
  const id=safeId(detail[1]);if(!id)return json({error:'Collection not found.'},404);
  const b=await body(req),title=cleanText(b.title,80),description=cleanText(b.description,500);
  if(!title)return json({error:'A collection title is required.'},400);
  if(!['public','private'].includes(b.visibility))return json({error:'Visibility must be public or private.'},400);
  const result=await env.DB.prepare(`UPDATE community_collections SET title=?,description=?,visibility=?,updated_at=CURRENT_TIMESTAMP
   WHERE id=? AND owner_user_id=? RETURNING id,title,description,visibility,updated_at`).bind(title,description,b.visibility,id,u.id).first();
  return result?json(result):json({error:'Collection not found.'},404);
 }
 if(detail&&m==='DELETE'){
  const e=need(u);if(e)return e;
  const id=safeId(detail[1]);if(!id)return json({error:'Collection not found.'},404);
  const result=await env.DB.prepare('DELETE FROM community_collections WHERE id=? AND owner_user_id=?').bind(id,u.id).run();
  return Number(result.meta?.changes||0)===1?json({ok:true}):json({error:'Collection not found.'},404);
 }
 const add=p.match(/^\/api\/community\/collections\/(\d+)\/items$/);
 if(add&&m==='POST'){
  const e=need(u);if(e)return e;
  const id=safeId(add[1]);if(!id)return json({error:'Collection not found.'},404);
  const b=await body(req),novelId=safeId(b.novel_id);
  if(!novelId)return json({error:'A valid novel is required.'},400);
  const owned=await env.DB.prepare('SELECT id FROM community_collections WHERE id=? AND owner_user_id=?').bind(id,u.id).first();
  if(!owned)return json({error:'Collection not found.'},404);
  const novel=await env.DB.prepare(`SELECT id FROM novels WHERE id=? AND publication_status='published'
   AND rights_status IN ('original','public_domain','licensed','authorized')`).bind(novelId).first();
  if(!novel)return json({error:'This story is not currently eligible for reader collections.'},404);
  const count=await env.DB.prepare('SELECT COUNT(*) total FROM community_collection_items WHERE collection_id=?').bind(id).first();
  if(Number(count?.total||0)>=MAX_ITEMS_PER_COLLECTION)return json({error:'Collection item limit reached.'},409);
  try{
   await env.DB.prepare('INSERT INTO community_collection_items(collection_id,novel_id,position) VALUES(?,?,?)').bind(id,novelId,Number(count?.total||0)).run();
  }catch(error){
   if(String(error?.message||'').includes('UNIQUE'))return json({error:'This story is already in the collection.'},409);
   throw error;
  }
  await env.DB.prepare('UPDATE community_collections SET updated_at=CURRENT_TIMESTAMP WHERE id=? AND owner_user_id=?').bind(id,u.id).run();
  return json({ok:true},201);
 }
 const remove=p.match(/^\/api\/community\/collections\/(\d+)\/items\/(\d+)$/);
 if(remove&&m==='DELETE'){
  const e=need(u);if(e)return e;
  const id=safeId(remove[1]),novelId=safeId(remove[2]);
  if(!id||!novelId)return json({error:'Collection item not found.'},404);
  const result=await env.DB.prepare(`DELETE FROM community_collection_items
   WHERE collection_id=? AND novel_id=? AND EXISTS(
    SELECT 1 FROM community_collections c WHERE c.id=? AND c.owner_user_id=?
   )`).bind(id,novelId,id,u.id).run();
  if(Number(result.meta?.changes||0)!==1)return json({error:'Collection item not found.'},404);
  await env.DB.prepare('UPDATE community_collections SET updated_at=CURRENT_TIMESTAMP WHERE id=? AND owner_user_id=?').bind(id,u.id).run();
  return json({ok:true});
 }
 if(p.startsWith('/api/community/collections'))return json({error:'Method not allowed.'},405);
 return null;
}
