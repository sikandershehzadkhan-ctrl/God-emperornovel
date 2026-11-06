// Publishing-owned chapter editing, revision and release lifecycle APIs.
export async function handlePublishingStudioRequest({req,env,url,u,body,json,author,audit,notifyUser,canPublishChapter,validateComicChapterContent}){
 const p=url.pathname,m=req.method;
if(/^\/api\/author\/chapters\/\d+$/.test(p)&&m==="PATCH"){
  const e=author(u);if(e)return e;const id=Number(p.split('/').pop()),b=await body(req);
  const c=await env.DB.prepare(`SELECT c.*,n.owner_user_id,n.kind FROM chapters c JOIN novels n ON n.id=c.novel_id WHERE c.id=?`).bind(id).first();if(!c)return json({error:'Chapter not found'},404);if(u.role!=="admin"&&Number(c.owner_user_id)!==Number(u.id))return json({error:'You do not own this chapter'},403);
  const num=Number(b.chapter_number??c.chapter_number),title=String(b.title??c.title).trim(),content=String(b.content??c.content),cost=Number(b.ticket_cost??c.ticket_cost),locked=b.is_locked===undefined?Number(c.is_locked):b.is_locked?1:0;
  if(!Number.isInteger(num)||num<1||!title||title.length>180||!content||content.length>100000||!Number.isSafeInteger(cost)||cost<0)return json({error:'Invalid chapter data'},400);
  if(["manga","manhwa","manhua","webtoon","comic","graphic_novel"].includes(String(c.kind||"").toLowerCase())){const comicCheck=validateComicChapterContent(content);if(!comicCheck.ok)return json({error:comicCheck.error},400)}
  const dup=await env.DB.prepare('SELECT id FROM chapters WHERE novel_id=? AND chapter_number=? AND id<>?').bind(c.novel_id,num,id).first();if(dup)return json({error:'Another chapter already uses that chapter number.'},409);
  const adminEdit=u.role==="admin"?1:0;
  const results=await env.DB.batch([
   env.DB.prepare(`INSERT INTO chapter_revisions(chapter_id,chapter_number,title,content,is_locked,ticket_cost,editor_user_id) SELECT id,chapter_number,title,content,is_locked,ticket_cost,? FROM chapters WHERE id=? AND (chapter_number<>? OR title<>? OR content<>? OR is_locked<>? OR ticket_cost<>?) AND EXISTS(SELECT 1 FROM novels WHERE id=chapters.novel_id AND (?=1 OR owner_user_id=?))`).bind(u.id,id,num,title,content,locked,cost,adminEdit,u.id),
   env.DB.prepare(`UPDATE chapters SET chapter_number=?,title=?,content=?,is_locked=?,ticket_cost=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND EXISTS(SELECT 1 FROM novels WHERE id=chapters.novel_id AND (?=1 OR owner_user_id=?))`).bind(num,title,content,locked,cost,id,adminEdit,u.id),
   env.DB.prepare('UPDATE novels SET updated_at=CURRENT_TIMESTAMP WHERE id=? AND (?=1 OR owner_user_id=?)').bind(c.novel_id,adminEdit,u.id)
  ]);
  const changed=Number(results?.[1]?.meta?.changes??results?.[1]?.changes??0);if(changed!==1)return json({error:'Chapter ownership changed. Refresh and try again.'},403);
  await audit(env,u,'author_chapter_updated',`chapter=${id}`);return json({ok:true,message:'Chapter saved. A previous version is available in revision history when changes were made.'})
 }
 

if(/^\/api\/author\/chapters\/\d+\/revisions$/.test(p)&&m==="GET"){
  const e=author(u);if(e)return e;const id=Number(p.split('/')[4]);
  const c=await env.DB.prepare('SELECT c.id,n.owner_user_id FROM chapters c JOIN novels n ON n.id=c.novel_id WHERE c.id=?').bind(id).first();if(!c)return json({error:'Chapter not found'},404);if(Number(c.owner_user_id)!==Number(u.id))return json({error:'You do not own this chapter'},403);
  return json((await env.DB.prepare('SELECT id,chapter_id,chapter_number,title,content,is_locked,ticket_cost,created_at FROM chapter_revisions WHERE chapter_id=? ORDER BY id DESC LIMIT 10').bind(id).all()).results||[])
 }
 

if(/^\/api\/author\/chapters\/\d+\/publish$/.test(p)&&m==="POST"){
  const e=author(u);if(e)return e;const id=Number(p.split('/')[4]),b=await body(req);
  const c=await env.DB.prepare(`SELECT c.*,n.owner_user_id,n.publication_status AS novel_publication_status,n.rights_status,n.rights_evidence FROM chapters c JOIN novels n ON n.id=c.novel_id WHERE c.id=?`).bind(id).first();
  if(!c)return json({error:'Chapter not found'},404);
  if(u.role!=="admin"&&Number(c.owner_user_id)!==Number(u.id))return json({error:'You do not own this chapter'},403);
  const status=String(b.publication_status||'published');
  if(!['draft','published'].includes(status))return json({error:'Invalid publication status'},400);
  if(status==='published'&&!canPublishChapter({novelPublicationStatus:c.novel_publication_status,rightsStatus:c.rights_status,rightsEvidence:c.rights_evidence}))return json({error:'Parent novel must be published and rights evidence must be eligible before publishing a chapter.'},403);
  const adminEdit=u.role==="admin"?1:0;
  const results=await env.DB.batch([
   env.DB.prepare(`UPDATE chapters SET publication_status=?,updated_at=CURRENT_TIMESTAMP
    WHERE id=? AND EXISTS(SELECT 1 FROM novels n WHERE n.id=chapters.novel_id
     AND (?=1 OR n.owner_user_id=?)
     AND (?<>'published' OR (n.publication_status='published'
      AND n.rights_status IN ('original','public_domain','licensed','authorized')
      AND (n.rights_status='original' OR TRIM(COALESCE(n.rights_evidence,''))<>''))))`).bind(status,id,adminEdit,u.id,status),
   env.DB.prepare('UPDATE novels SET updated_at=CURRENT_TIMESTAMP WHERE id=? AND changes()=1').bind(c.novel_id),
   env.DB.prepare('DELETE FROM scheduled_chapter_publications WHERE chapter_id=? AND changes()=1').bind(id)
  ]);
  const changed=Number(results?.[0]?.meta?.changes??results?.[0]?.changes??0);
  if(changed!==1)return json({error:'Chapter ownership or publication eligibility changed. Refresh and try again.'},403);
  await audit(env,u,status==='published'?'author_chapter_published':'author_chapter_unpublished',`chapter=${id}`);
  return json({ok:true,message:status==='published'?'Chapter published.':'Chapter moved to draft.'})
 }
 
if(/^\/api\/author\/chapters\/\d+\/schedule$/.test(p)&&m==="POST"){
  const e=author(u);if(e)return e;const id=Number(p.split('/')[4]),b=await body(req);const c=await env.DB.prepare(`SELECT c.id,c.publication_status,n.id novel_id,n.owner_user_id,n.publication_status novel_status,n.rights_status,n.rights_evidence FROM chapters c JOIN novels n ON n.id=c.novel_id WHERE c.id=?`).bind(id).first();if(!c)return json({error:'Chapter not found'},404);if(Number(c.owner_user_id)!==Number(u.id))return json({error:'You do not own this chapter'},403);
  if(b.cancel===true){await env.DB.prepare('DELETE FROM scheduled_chapter_publications WHERE chapter_id=?').bind(id).run();await audit(env,u,'author_chapter_schedule_cancelled',`chapter=${id}`);return json({ok:true,message:'Scheduled publication cancelled.'})}
  if(c.publication_status==='published')return json({error:'Move the chapter to draft before scheduling it again.'},409);if(c.novel_status!=='published')return json({error:'The novel must be approved and published before a chapter can be scheduled.'},409);if(!canPublishChapter({novelPublicationStatus:c.novel_status,rightsStatus:c.rights_status,rightsEvidence:c.rights_evidence}))return json({error:'Novel must be published and rights evidence must be eligible before scheduling a chapter.'},403);
  const timestamp=Date.parse(String(b.publish_at||''));const now=Date.now();if(!Number.isFinite(timestamp)||timestamp<now+5*60*1000||timestamp>now+365*24*60*60*1000)return json({error:'Choose a publication time at least 5 minutes from now and within the next 365 days.'},400);const publishAt=new Date(timestamp).toISOString();const saved=await env.DB.prepare(`INSERT INTO scheduled_chapter_publications(chapter_id,publish_at,created_by,updated_at) SELECT ?,?,?,CURRENT_TIMESTAMP WHERE EXISTS(SELECT 1 FROM chapters c JOIN novels n ON n.id=c.novel_id WHERE c.id=? AND c.publication_status='draft' AND n.owner_user_id=? AND n.publication_status='published' AND n.rights_status IN ('original','public_domain','licensed','authorized') AND (n.rights_status='original' OR TRIM(COALESCE(n.rights_evidence,''))<>'')) ON CONFLICT(chapter_id) DO UPDATE SET publish_at=excluded.publish_at,created_by=excluded.created_by,updated_at=CURRENT_TIMESTAMP`).bind(id,publishAt,u.id,id,u.id).run();if(!Number(saved.meta?.changes||0))return json({error:'Chapter or publication eligibility changed. Refresh and try again.'},409);await audit(env,u,'author_chapter_scheduled',`chapter=${id};publish_at=${publishAt}`);return json({ok:true,message:'Chapter publication scheduled.',publish_at:publishAt})
 }
 
if(p==="/api/author/schedules"&&m==="GET"){
  const e=author(u);if(e)return e;
  const rows=await env.DB.prepare(`SELECT s.chapter_id,s.publish_at,s.created_at,s.updated_at,c.chapter_number,c.title chapter_title,n.id novel_id,n.title novel_title,n.owner_user_id FROM scheduled_chapter_publications s JOIN chapters c ON c.id=s.chapter_id JOIN novels n ON n.id=c.novel_id WHERE n.owner_user_id=? ORDER BY s.publish_at ASC LIMIT 200`).bind(u.id).all();
  return json(rows.results||[])
 }
 
  return null;
}

export async function publishDueChapters(env,{notifyUser,canPublishChapter}){
 await env.DB.prepare(`DELETE FROM scheduled_chapter_publications WHERE NOT EXISTS(SELECT 1 FROM chapters c JOIN novels n ON n.id=c.novel_id WHERE c.id=scheduled_chapter_publications.chapter_id AND c.publication_status='draft' AND n.publication_status='published' AND n.owner_user_id=scheduled_chapter_publications.created_by AND n.rights_status IN ('original','public_domain','licensed','authorized') AND (n.rights_status='original' OR TRIM(COALESCE(n.rights_evidence,''))<>''))`).run();
 const due=await env.DB.prepare(`SELECT s.chapter_id,s.created_by,c.chapter_number,c.title chapter_title,n.id AS novel_id,n.title novel_title,n.owner_user_id,n.publication_status novel_publication_status,n.rights_status,n.rights_evidence FROM scheduled_chapter_publications s JOIN chapters c ON c.id=s.chapter_id JOIN novels n ON n.id=c.novel_id WHERE s.publish_at<=strftime('%Y-%m-%dT%H:%M:%fZ','now') AND c.publication_status='draft' AND n.publication_status='published' AND n.owner_user_id=s.created_by AND n.rights_status IN ('original','public_domain','licensed','authorized') AND (n.rights_status='original' OR TRIM(COALESCE(n.rights_evidence,''))<>'') ORDER BY s.publish_at LIMIT 100`).all();
 const rows=due.results||[];let published=0;
 for(const row of rows){
  if(!canPublishChapter({novelPublicationStatus:row.novel_publication_status,rightsStatus:row.rights_status,rightsEvidence:row.rights_evidence}))continue;
  const results=await env.DB.batch([
   env.DB.prepare(`UPDATE chapters SET publication_status='published',updated_at=CURRENT_TIMESTAMP WHERE id=? AND publication_status='draft' AND EXISTS(SELECT 1 FROM novels n WHERE n.id=chapters.novel_id AND n.owner_user_id=? AND n.publication_status='published' AND n.rights_status IN ('original','public_domain','licensed','authorized') AND (n.rights_status='original' OR TRIM(COALESCE(n.rights_evidence,''))<>''))`).bind(row.chapter_id,row.created_by),
   env.DB.prepare('DELETE FROM scheduled_chapter_publications WHERE chapter_id=? AND changes()=1').bind(row.chapter_id),
   env.DB.prepare('UPDATE novels SET updated_at=CURRENT_TIMESTAMP WHERE id=? AND changes()=1').bind(row.novel_id),
   env.DB.prepare('INSERT INTO audit_logs(user_id,action,details) SELECT ?,?,? WHERE changes()=1').bind(row.created_by,'author_chapter_scheduled_published',`chapter=${row.chapter_id}`)
  ]);
  const changed=Number(results?.[0]?.meta?.changes??results?.[0]?.changes??0);
  if(changed===1){published++;await notifyUser(env,row.created_by,'Scheduled chapter published',`${row.novel_title} · Chapter ${row.chapter_number}: ${row.chapter_title} is now live.`)}
 }
 return published
}

