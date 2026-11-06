// Creator-owned editorial workspace APIs. Chapter lifecycle is delegated to Publishing.
export async function handleCreatorStudioRequest({req,env,url,u,body,json,author,CONTENT_FORMAT_IDS}){
 const p=url.pathname,m=req.method;
if(p==="/api/author/analytics"&&m==="GET"){
  const e=author(u);if(e)return e;
  const [novelRows,chapterRows]=await Promise.all([
   env.DB.prepare(`SELECT n.id,n.title,n.publication_status,n.views,n.rating,n.updated_at,
    (SELECT COUNT(*) FROM ratings r WHERE r.novel_id=n.id) rating_count,
    (SELECT COUNT(*) FROM chapters c WHERE c.novel_id=n.id AND c.publication_status='published') published_chapters,
    (SELECT COUNT(*) FROM chapters c WHERE c.novel_id=n.id AND c.publication_status='draft') draft_chapters,
    (SELECT COALESCE(SUM(v.views),0) FROM chapter_views v JOIN chapters c ON c.id=v.chapter_id WHERE c.novel_id=n.id) chapter_views,
    (SELECT COUNT(*) FROM unlocks x JOIN chapters c ON c.id=x.chapter_id WHERE c.novel_id=n.id) unlocks,
    (SELECT COALESCE(SUM(x.cost),0) FROM unlocks x JOIN chapters c ON c.id=x.chapter_id WHERE c.novel_id=n.id AND x.cost>0) reader_crown_spend,
    (SELECT COUNT(*) FROM unlocks x JOIN chapters c ON c.id=x.chapter_id WHERE c.novel_id=n.id AND x.cost>0) paid_unlocks,
    (SELECT COUNT(DISTINCT x.user_id) FROM unlocks x JOIN chapters c ON c.id=x.chapter_id WHERE c.novel_id=n.id AND x.cost>0) paying_readers,
    (SELECT MAX(x.unlocked_at) FROM unlocks x JOIN chapters c ON c.id=x.chapter_id WHERE c.novel_id=n.id AND x.cost>0) last_paid_unlock_at
    FROM novels n WHERE n.owner_user_id=? ORDER BY n.views DESC,n.updated_at DESC LIMIT 100`).bind(u.id).all(),
   env.DB.prepare(`SELECT c.id,c.novel_id,n.title novel_title,c.chapter_number,c.title chapter_title,
    COALESCE(v.views,0) views,(SELECT COUNT(*) FROM unlocks x WHERE x.chapter_id=c.id) unlocks,
    (SELECT COALESCE(SUM(x.cost),0) FROM unlocks x WHERE x.chapter_id=c.id AND x.cost>0) reader_crown_spend,
    (SELECT COUNT(*) FROM unlocks x WHERE x.chapter_id=c.id AND x.cost>0) paid_unlocks
    FROM chapters c JOIN novels n ON n.id=c.novel_id LEFT JOIN chapter_views v ON v.chapter_id=c.id
    WHERE n.owner_user_id=? AND c.publication_status='published'
    ORDER BY views DESC,unlocks DESC,c.id DESC LIMIT 10`).bind(u.id).all()
  ]);
  const novels=novelRows.results||[],sum=key=>novels.reduce((total,row)=>total+Number(row[key]||0),0);
  return json({generated_at:new Date().toISOString(),scope:"lifetime_counters",totals:{novels:novels.length,published_novels:novels.filter(n=>n.publication_status==="published").length,published_chapters:sum("published_chapters"),draft_chapters:sum("draft_chapters"),novel_views:sum("views"),chapter_views:sum("chapter_views"),ratings:sum("rating_count"),unlocks:sum("unlocks"),reader_crown_spend:sum("reader_crown_spend"),paid_unlocks:sum("paid_unlocks")},novels,top_chapters:chapterRows.results||[]})
 }


if(p==="/api/author/feedback"&&m==="GET"){
  const e=author(u);if(e)return e;
  const [ratings,comments,ratingTotal,commentTotal]=await Promise.all([
   env.DB.prepare(`SELECT 'rating' kind,r.rating rating,'' body,r.updated_at created_at,'Reader' username,n.id novel_id,n.title novel_title FROM ratings r JOIN novels n ON n.id=r.novel_id WHERE n.owner_user_id=? ORDER BY r.updated_at DESC LIMIT 100`).bind(u.id).all(),
   env.DB.prepare(`SELECT 'comment' kind,NULL rating,c.body,c.created_at,COALESCE(u.username,'Reader') username,n.id novel_id,n.title novel_title FROM comments c JOIN novels n ON n.id=c.novel_id JOIN users u ON u.id=c.user_id WHERE n.owner_user_id=? AND c.status='visible' ORDER BY c.created_at DESC LIMIT 100`).bind(u.id).all(),
   env.DB.prepare(`SELECT COUNT(*) total FROM ratings r JOIN novels n ON n.id=r.novel_id WHERE n.owner_user_id=?`).bind(u.id).first(),
   env.DB.prepare(`SELECT COUNT(*) total FROM comments c JOIN novels n ON n.id=c.novel_id WHERE n.owner_user_id=? AND c.status='visible'`).bind(u.id).first()
  ]);
  const items=[...(ratings.results||[]),...(comments.results||[])].sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))).slice(0,100);
  return json({items,scope:'owned_stories',limit:100,ratings_count:(ratings.results||[]).length,comments_count:(comments.results||[]).length,ratings_total:Number(ratingTotal?.total||0),comments_total:Number(commentTotal?.total||0)});
 }
 

if(p==="/api/author/goals"&&m==="GET"){
  const e=author(u);if(e)return e;
  const rows=await env.DB.prepare(`SELECT g.novel_id,n.title novel_title,g.target_chapters,g.target_words,g.target_date,g.created_at,g.updated_at,
   (SELECT COUNT(*) FROM chapters c WHERE c.novel_id=n.id) actual_chapters,
   (SELECT COUNT(*) FROM chapters c WHERE c.novel_id=n.id AND c.publication_status='published') published_chapters
   FROM author_story_goals g JOIN novels n ON n.id=g.novel_id
   WHERE g.owner_user_id=? AND n.owner_user_id=? ORDER BY g.updated_at DESC LIMIT 100`).bind(u.id,u.id).all();
  return json(rows.results||[])
 }
 if(p==="/api/author/goals"&&m==="PUT"){
  const e=author(u);if(e)return e;
  const b=await body(req),novelId=Number(b.novel_id);
  if(!Number.isSafeInteger(novelId)||novelId<1)return json({error:'A valid story is required.'},400);
  const targetChapters=Number(b.target_chapters??0),targetWords=Number(b.target_words??0);
  if(!Number.isInteger(targetChapters)||targetChapters<0||targetChapters>10000)return json({error:'Chapter target must be a whole number from 0 to 10,000.'},400);
  if(!Number.isInteger(targetWords)||targetWords<0||targetWords>5000000)return json({error:'Word target must be a whole number from 0 to 5,000,000.'},400);
  const rawDate=String(b.target_date??'').trim();
  if(rawDate&&!/^\d{4}-\d{2}-\d{2}$/.test(rawDate))return json({error:'Target date must use YYYY-MM-DD.'},400);
  if(rawDate&&new Date(rawDate+'T00:00:00Z').toISOString().slice(0,10)!==rawDate)return json({error:'Target date is not a valid calendar date.'},400);
  if(targetChapters===0&&targetWords===0&&!rawDate){
   const removed=await env.DB.prepare('DELETE FROM author_story_goals WHERE novel_id=? AND owner_user_id=? AND EXISTS(SELECT 1 FROM novels WHERE id=? AND owner_user_id=?)').bind(novelId,u.id,novelId,u.id).run();
   if(!Number(removed.meta?.changes||0)){
    const owned=await env.DB.prepare('SELECT id FROM novels WHERE id=? AND owner_user_id=?').bind(novelId,u.id).first();
    if(!owned)return json({error:'Story not found.'},404);
   }
   await audit(env,u,'author_story_goal_cleared',`novel=${novelId}`);
   return json({ok:true,cleared:true})
  }
  const saved=await env.DB.prepare(`INSERT INTO author_story_goals(novel_id,owner_user_id,target_chapters,target_words,target_date,updated_at)
   SELECT id,?,?,?, ?,CURRENT_TIMESTAMP FROM novels WHERE id=? AND owner_user_id=?
   ON CONFLICT(novel_id) DO UPDATE SET
   target_chapters=excluded.target_chapters,target_words=excluded.target_words,target_date=excluded.target_date,
   updated_at=CURRENT_TIMESTAMP WHERE author_story_goals.owner_user_id=excluded.owner_user_id
   AND EXISTS(SELECT 1 FROM novels WHERE id=excluded.novel_id AND owner_user_id=excluded.owner_user_id)`)
   .bind(u.id,targetChapters,targetWords,rawDate||null,novelId,u.id).run();
  if(!Number(saved.meta?.changes||0))return json({error:'Story not found.'},404);
  await audit(env,u,'author_story_goal_saved',`novel=${novelId};chapters=${targetChapters};words=${targetWords}`);
  return json({ok:true})
 }
 

if(p==="/api/author/notes"&&m==="GET"){
  const e=author(u);if(e)return e;
  const novelId=Number(url.searchParams.get('novel_id')||0),chapterId=Number(url.searchParams.get('chapter_id')||0);
  if(!Number.isSafeInteger(novelId)||novelId<0||!Number.isSafeInteger(chapterId)||chapterId<0)return json({error:'Invalid story or chapter.'},400);
  const rows=await env.DB.prepare(`SELECT pn.id,pn.novel_id,pn.chapter_id,pn.note,pn.created_at,pn.updated_at,n.title novel_title,c.chapter_number,c.title chapter_title
   FROM author_private_notes pn JOIN novels n ON n.id=pn.novel_id
   LEFT JOIN chapters c ON c.id=pn.chapter_id
   WHERE pn.owner_user_id=? AND n.owner_user_id=? AND (?=0 OR pn.novel_id=?) AND (?=0 OR pn.chapter_id=?)
   ORDER BY pn.updated_at DESC,pn.id DESC LIMIT 100`).bind(u.id,u.id,novelId,novelId,chapterId,chapterId).all();
  return json(rows.results||[])
 }
 if(p==="/api/author/notes"&&m==="POST"){
  const e=author(u);if(e)return e;
  const b=await body(req),novelId=Number(b.novel_id),chapterId=b.chapter_id==null||b.chapter_id===''?null:Number(b.chapter_id);
  const note=String(b.note||'').replace(/\u0000/g,'').trim();
  if(!Number.isSafeInteger(novelId)||novelId<1)return json({error:'A valid story is required.'},400);
  if(chapterId!==null&&(!Number.isSafeInteger(chapterId)||chapterId<1))return json({error:'Invalid chapter.'},400);
  if(!note||note.length>4000)return json({error:'Notes must contain between 1 and 4,000 characters.'},400);
  const saved=await env.DB.prepare(`INSERT INTO author_private_notes(owner_user_id,novel_id,chapter_id,note)
   SELECT ?,n.id,?,? FROM novels n WHERE n.id=? AND n.owner_user_id=?
   AND (? IS NULL OR EXISTS(SELECT 1 FROM chapters c WHERE c.id=? AND c.novel_id=n.id))`)
   .bind(u.id,chapterId,note,novelId,u.id,chapterId,chapterId).run();
  if(!Number(saved.meta?.changes||0))return json({error:'Story or chapter not found.'},404);
  await audit(env,u,'author_private_note_created',`novel=${novelId};chapter=${chapterId||'story'}`);
  return json({ok:true,id:Number(saved.meta.last_row_id)},201)
 }

 let authorNote=p.match(/^\/api\/author\/notes\/(\d+)$/);
 if(authorNote&&m==="PATCH"){
  const e=author(u);if(e)return e;
  const id=Number(authorNote[1]),b=await body(req),note=String(b.note||'').replace(/\u0000/g,'').trim();
  if(!note||note.length>4000)return json({error:'Notes must contain between 1 and 4,000 characters.'},400);
  const saved=await env.DB.prepare(`UPDATE author_private_notes SET note=?,updated_at=CURRENT_TIMESTAMP
   WHERE id=? AND owner_user_id=? AND EXISTS(SELECT 1 FROM novels n WHERE n.id=author_private_notes.novel_id AND n.owner_user_id=?)`).bind(note,id,u.id,u.id).run();
  if(!Number(saved.meta?.changes||0))return json({error:'Note not found.'},404);
  await audit(env,u,'author_private_note_updated',`note=${id}`);
  return json({ok:true})
 }
 if(authorNote&&m==="DELETE"){
  const e=author(u);if(e)return e;
  const id=Number(authorNote[1]);
  const removed=await env.DB.prepare(`DELETE FROM author_private_notes WHERE id=? AND owner_user_id=?
   AND EXISTS(SELECT 1 FROM novels n WHERE n.id=author_private_notes.novel_id AND n.owner_user_id=?)`).bind(id,u.id,u.id).run();
  if(!Number(removed.meta?.changes||0))return json({error:'Note not found.'},404);
  await audit(env,u,'author_private_note_deleted',`note=${id}`);
  return json({ok:true})
 }
 

if(p==="/api/author/readiness"&&m==="GET"){
  const e=author(u);if(e)return e;
  const rows=await env.DB.prepare(`SELECT n.id novel_id,n.title,n.description,n.language,n.rights_status,n.rights_evidence,n.publication_status,n.kind,
   (SELECT COUNT(*) FROM chapters c WHERE c.novel_id=n.id) chapter_count,
   (SELECT COUNT(*) FROM chapters c WHERE c.novel_id=n.id AND c.publication_status='published') published_chapters,
   (SELECT COUNT(*) FROM chapters c WHERE c.novel_id=n.id AND c.publication_status='draft') draft_chapters,
   (SELECT COUNT(*) FROM chapters c WHERE c.novel_id=n.id AND (TRIM(COALESCE(c.title,''))='' OR TRIM(COALESCE(c.content,''))='')) incomplete_drafts
   FROM novels n WHERE n.owner_user_id=? ORDER BY n.updated_at DESC LIMIT 100`).bind(u.id).all();
  const checks=(rows.results||[]).map(n=>{
   const items=[
    {key:'title',label:'Story title',status:String(n.title||'').trim()?'pass':'attention',detail:String(n.title||'').trim()?'A title is recorded.':'Add a story title.'},
    {key:'synopsis',label:'Synopsis',status:String(n.description||'').trim()?'pass':'attention',detail:String(n.description||'').trim()?'A synopsis is recorded.':'Add a synopsis so readers and reviewers can understand the work.'},
    {key:'language',label:'Language',status:String(n.language||'').trim()?'pass':'attention',detail:String(n.language||'').trim()?'A language is selected.':'Choose the story language.'},
    {key:'format',label:'Content format',status:CONTENT_FORMAT_IDS.has(String(n.kind||'').toLowerCase())?'pass':'attention',detail:CONTENT_FORMAT_IDS.has(String(n.kind||'').toLowerCase())?'The format is supported.':'Select a supported content format.'},
    {key:'rights',label:'Rights status',status:['original','public_domain','licensed','authorized'].includes(String(n.rights_status||'').toLowerCase())?'pass':'attention',detail:['original','public_domain','licensed','authorized'].includes(String(n.rights_status||'').toLowerCase())?'A recognized rights status is recorded.':'Choose a valid rights status.'},
    {key:'evidence',label:'Rights evidence',status:String(n.rights_status||'').toLowerCase()==='original'?'not_applicable':String(n.rights_evidence||'').trim()?'pass':'attention',detail:String(n.rights_status||'').toLowerCase()==='original'?'Not required for a work declared original.':String(n.rights_evidence||'').trim()?'Supporting evidence is recorded.':'Add the license, permission or public-domain evidence required for review.'},
    {key:'chapters',label:'Chapter content',status:Number(n.chapter_count)>0?'pass':'attention',detail:Number(n.chapter_count)>0?Number(n.chapter_count)+' chapter records exist.':'Create at least one chapter.'},
    {key:'drafts',label:'Draft completeness',status:Number(n.incomplete_drafts)>0?'attention':'pass',detail:Number(n.incomplete_drafts)>0?Number(n.incomplete_drafts)+' draft chapters have a blank title or content.':'No incomplete draft chapters were detected.'}
   ];
   return {novel_id:Number(n.novel_id),title:n.title,publication_status:n.publication_status,chapter_count:Number(n.chapter_count||0),published_chapters:Number(n.published_chapters||0),draft_chapters:Number(n.draft_chapters||0),checks:items,attention_count:items.filter(x=>x.status==='attention').length};
  });
  return json({scope:'owned_stories',generated_at:new Date().toISOString(),items:checks});
 }
 

if(p==="/api/author/planning"&&m==="GET"){
  const e=author(u);if(e)return e;
  const rows=await env.DB.prepare(`SELECT * FROM (
   SELECT c.id chapter_id,c.novel_id,n.title novel_title,n.kind,n.publication_status novel_status,c.chapter_number,c.title chapter_title,c.updated_at,'draft_chapter' item_type
   FROM chapters c JOIN novels n ON n.id=c.novel_id
   WHERE n.owner_user_id=? AND c.publication_status='draft' AND NOT EXISTS(SELECT 1 FROM scheduled_chapter_publications s WHERE s.chapter_id=c.id)
   UNION ALL
   SELECT NULL chapter_id,n.id novel_id,n.title novel_title,n.kind,n.publication_status novel_status,NULL chapter_number,NULL chapter_title,n.updated_at,'first_chapter' item_type
   FROM novels n WHERE n.owner_user_id=? AND NOT EXISTS(SELECT 1 FROM chapters c WHERE c.novel_id=n.id)
  ) ORDER BY updated_at DESC LIMIT 100`).bind(u.id,u.id).all();
  return json(rows.results||[])
 }
 

if(p==="/api/author/schedules"&&m==="GET"){
  const e=author(u);if(e)return e;
  const rows=await env.DB.prepare(`SELECT s.chapter_id,s.publish_at,s.created_at,s.updated_at,c.chapter_number,c.title chapter_title,n.id novel_id,n.title novel_title,n.owner_user_id FROM scheduled_chapter_publications s JOIN chapters c ON c.id=s.chapter_id JOIN novels n ON n.id=c.novel_id WHERE n.owner_user_id=? ORDER BY s.publish_at ASC LIMIT 200`).bind(u.id).all();
  return json(rows.results||[])
 }
 
 return null;
}
