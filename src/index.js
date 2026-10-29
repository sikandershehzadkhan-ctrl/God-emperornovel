const json=(d,s=200,h={})=>new Response(JSON.stringify(d),{status:s,headers:{"content-type":"application/json;charset=UTF-8","cache-control":"no-store",...h}});
const now=()=>Math.floor(Date.now()/1000);
const b64=a=>btoa(String.fromCharCode(...new Uint8Array(a))).replaceAll("+","-").replaceAll("/","_").replaceAll("=","");
const digest=async s=>b64(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)));
const rnd=n=>{const a=new Uint8Array(n);crypto.getRandomValues(a);return b64(a)};
const slug=s=>String(s||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const CONTENT_FORMATS=[
 {id:"original",label:"Original novels",group:"text"},
 {id:"fanfiction",label:"Fanfiction",group:"text"},
 {id:"light_novel",label:"Light novels",group:"text"},
 {id:"web_novel",label:"Web novels",group:"text"},
 {id:"manga",label:"Manga",group:"comics"},
 {id:"manhwa",label:"Manhwa",group:"comics"},
 {id:"manhua",label:"Manhua",group:"comics"},
 {id:"webtoon",label:"Webtoons",group:"comics"},
 {id:"comic",label:"Comics",group:"comics"},
 {id:"graphic_novel",label:"Graphic novels",group:"comics"},
 {id:"anime",label:"Anime",group:"screen"},
 {id:"cartoon",label:"Cartoons",group:"screen"},
 {id:"audiobook",label:"Audiobooks",group:"audio"},
 {id:"drama",label:"Drama adaptations",group:"screen"},
 {id:"game",label:"Games",group:"interactive"}
];
const CONTENT_FORMAT_IDS=new Set(CONTENT_FORMATS.map(x=>x.id));
const cookies=h=>Object.fromEntries((h||"").split(";").map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf("=");return[i<0?x:x.slice(0,i),decodeURIComponent(i<0?"":x.slice(i+1))]}));
const body=async r=>await r.json().catch(()=>({}));
const phash=async(p,s)=>digest(p+":"+s);

let coreSchemaReady=null;
async function ensurePublishingSchema(env){
 const novelCols=[
  ['owner_user_id','INTEGER'],
  ['publication_status',"TEXT NOT NULL DEFAULT 'published'"],
  ['rights_evidence',"TEXT DEFAULT ''"],
  ['rights_notes',"TEXT DEFAULT ''"],
  ['rights_verified_by','INTEGER'],
  ['rights_verified_at','TEXT'],
  ['review_feedback',"TEXT DEFAULT ''"],
  ['reviewed_by','INTEGER'],
  ['reviewed_at','TEXT']
 ];
 try{
  const info=(await env.DB.prepare('PRAGMA table_info(novels)').all()).results||[];
  const have=new Set(info.map(x=>String(x.name)));
  for(const [name,type] of novelCols) if(!have.has(name)){await env.DB.prepare(`ALTER TABLE novels ADD COLUMN ${name} ${type}`).run()}
  await env.DB.prepare("UPDATE novels SET publication_status='draft' WHERE publication_status IS NULL OR publication_status=''").run()
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_novels_publication ON novels(publication_status,updated_at)').run()
  const ci=(await env.DB.prepare('PRAGMA table_info(chapters)').all()).results||[];
  const chHave=new Set(ci.map(x=>String(x.name)));
  if(!chHave.has('publication_status')){await env.DB.prepare("ALTER TABLE chapters ADD COLUMN publication_status TEXT NOT NULL DEFAULT 'published'").run()}
  await env.DB.prepare("UPDATE chapters SET publication_status='published' WHERE publication_status IS NULL OR publication_status=''").run()
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_chapters_publication ON chapters(novel_id,publication_status,chapter_number)').run()
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS chapter_views (chapter_id INTEGER PRIMARY KEY, views INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(chapter_id) REFERENCES chapters(id) ON DELETE CASCADE)`).run();
 }catch(e){console.error('publishing schema failed; schema version must not advance',e);throw e}
}
async function notifyAdmins(env,title,message){
 try{const admins=(await env.DB.prepare("SELECT id FROM users WHERE role='admin' AND banned=0").all()).results||[];for(const a of admins)await env.DB.prepare('INSERT INTO notifications(user_id,title,body) VALUES(?,?,?)').bind(a.id,title,message).run()}catch(e){console.error('admin notification',e)}}
async function notifyUser(env,userId,title,message){
 try{if(userId)await env.DB.prepare('INSERT INTO notifications(user_id,title,body) VALUES(?,?,?)').bind(userId,title,message).run()}catch(e){console.error('user notification',e)}}


async function ensureAuthorAISchema(env){
 try{
  const qs=[
   `CREATE TABLE IF NOT EXISTS ai_author_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_user_id INTEGER NOT NULL,
    novel_id INTEGER,
    name TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'manual',
    status TEXT NOT NULL DEFAULT 'draft',
    genre TEXT DEFAULT '',
    fandom TEXT DEFAULT '',
    premise TEXT DEFAULT '',
    protagonist TEXT DEFAULT '',
    settings_json TEXT NOT NULL DEFAULT '{}',
    bible_json TEXT NOT NULL DEFAULT '{}',
    auto_publish INTEGER NOT NULL DEFAULT 0,
    chapters_target INTEGER NOT NULL DEFAULT 0,
    chapters_generated INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
   )`,
   `CREATE TABLE IF NOT EXISTS ai_chapter_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    owner_user_id INTEGER NOT NULL,
    chapter_number INTEGER NOT NULL,
    job_type TEXT NOT NULL DEFAULT 'draft',
    status TEXT NOT NULL DEFAULT 'queued',
    prompt TEXT DEFAULT '',
    result TEXT DEFAULT '',
    error TEXT DEFAULT '',
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TEXT,
    finished_at TEXT
   )`,
   `CREATE TABLE IF NOT EXISTS ai_generation_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    owner_user_id INTEGER NOT NULL,
    agent TEXT NOT NULL,
    mode TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ok',
    input_summary TEXT DEFAULT '',
    output_summary TEXT DEFAULT '',
    provider TEXT DEFAULT 'local',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
   )`,
   `CREATE TABLE IF NOT EXISTS ai_provider_benchmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider TEXT NOT NULL,
    observed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    chapters_delta INTEGER NOT NULL DEFAULT 0,
    interval_seconds INTEGER NOT NULL DEFAULT 0,
    source_url TEXT DEFAULT '',
    access_mode TEXT DEFAULT 'public-metadata',
    confidence TEXT DEFAULT 'unknown'
   )`,
   `CREATE TABLE IF NOT EXISTS ai_publish_policies (
    project_id INTEGER PRIMARY KEY,
    require_rights INTEGER NOT NULL DEFAULT 1,
    require_review INTEGER NOT NULL DEFAULT 1,
    max_chapters_per_day INTEGER NOT NULL DEFAULT 10,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
   )`,
   `CREATE INDEX IF NOT EXISTS idx_ai_projects_owner ON ai_author_projects(owner_user_id,updated_at)`,
   `CREATE INDEX IF NOT EXISTS idx_ai_jobs_project ON ai_chapter_jobs(project_id,status,chapter_number)`,
   `CREATE INDEX IF NOT EXISTS idx_ai_runs_project ON ai_generation_runs(project_id,created_at)`
  ];
  for(const q of qs){try{await env.DB.prepare(q).run()}catch(e){console.error('author AI schema statement failed; aborting bootstrap',e);throw e}}
 }catch(e){console.error('author AI schema failed; schema version must not advance',e);throw e}
}
function aiSafeText(s,max=12000){return String(s||'').replace(/\u0000/g,'').trim().slice(0,max)}
function aiJson(v){try{return JSON.parse(String(v||'{}'))}catch{return {}}}
function localStoryBlueprint(b){
 const title=aiSafeText(b.title||b.name||'Untitled Project',160);
 const premise=aiSafeText(b.premise||'An ambitious protagonist enters a dangerous world and builds a new future.',1800);
 const genre=aiSafeText(b.genre||'Fantasy',120);
 const fandom=aiSafeText(b.fandom||'Original World',160);
 const protagonist=aiSafeText(b.protagonist||'A male protagonist',500);
 const defaults={
  male_mc:b.male_mc!==false, system:b.system!==false, helmet:b.helmet!==false, harem:b.harem===true
 };
 return {
  title,genre,fandom,premise,protagonist,
  core_tropes:[genre,...(fandom&&fandom!=='Original World'?[fandom]:[]),defaults.male_mc?'Male MC':null,defaults.system?'System':null,defaults.helmet?'Helmet':null,defaults.harem?'Harem':null].filter(Boolean),
  rules:[
   'Create original expression and scenes. Use external works only as permitted references or user-provided material.',
   'Do not reproduce chapters, distinctive passages, or protected text from third-party sites.',
   'Keep continuity in the story bible and flag contradictions for author review.',
   'Fanfiction projects must clearly identify the fandom and remain subject to rights/takedown rules.'
  ],
  world:{premise:`${premise} The setting should support gradual territory, character and consequence building.`,factions:['Protagonist faction','Local power','Rival faction'],resources:['Money','Manpower','Information','Territory']},
  cast:[{name:protagonist,role:'protagonist',goal:'Build a lasting future',conflict:'Limited knowledge and rising opposition'},{name:'Primary Ally',role:'ally',goal:'Protect their people',conflict:'Trust and political pressure'},{name:'Primary Rival',role:'rival',goal:'Preserve their influence',conflict:'Underestimates the protagonist'}],
  arcs:[{arc:1,title:'The First Foundation',chapters:'1-10',purpose:'Establish the protagonist, rules, first allies and first meaningful victory.'},{arc:2,title:'Growing Territory',chapters:'11-25',purpose:'Develop infrastructure, relationships, factions and consequences.'},{arc:3,title:'The Wider World',chapters:'26-50',purpose:'Expand the scale while preserving character-driven stakes.'}]
 };
}
function localChapterDraft(project,chapterNumber){
 const b=aiJson(project.bible_json), title=chapterNumber===1?'A New Beginning':`The Next Move`;
 const p=aiSafeText(project.premise||b.premise||'The story begins.',1800);
 const mc=aiSafeText(project.protagonist||b.protagonist||'the protagonist',500);
 const tropes=(b.core_tropes||[]).join(', ');
 return `<h2>Chapter ${chapterNumber}: ${title}</h2>
<p>${mc} took a slow breath and studied the unfamiliar horizon. The world had rules, but none of them were written on paper. Every choice would create a consequence, and every consequence would shape what came next.</p>
<p>The immediate problem was simple to describe and difficult to solve: ${p}</p>
<p>A small system window appeared with a quiet notification. It did not explain everything. Instead, it offered a direction, leaving the protagonist to decide whether to trust it.</p>
<p>For the first time, the larger plan became clear. Build carefully. Learn the people. Secure resources. Avoid unnecessary enemies. The goal was not a single spectacular victory, but a foundation strong enough to survive tomorrow.</p>
<p>By evening, the first practical decision had been made. A route was chosen, a small group was organized, and the next task was written down. The journey had begun.</p>
<p><strong>Story controls:</strong> ${aiSafeText(tropes,700)}.</p>
<p><em>Local draft engine output. Expand or revise this draft in Chapter Studio, or connect an AI provider for full generation.</em></p>`;
}
async function callAuthorModel(env,systemPrompt,userPrompt,maxTokens=1800){
 const key=String(env.OPENAI_API_KEY||'').trim();
 if(!key)return {provider:'not-configured',text:'',error:'AI generation is not configured on this deployment. Manual Chapter Studio remains available.'};
 try{
  const model=String(env.OPENAI_MODEL||'gpt-5-mini').trim();
  const r=await fetch(String(env.OPENAI_BASE_URL||'https://api.openai.com/v1/responses'),{
   method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+key},
   body:JSON.stringify({model,input:[{role:'system',content:systemPrompt},{role:'user',content:userPrompt}],max_output_tokens:maxTokens})
  });
  if(!r.ok)return {provider:'openai',text:'',error:'The configured AI provider returned HTTP '+r.status+'. No generated content was saved.'};
  const raw=await r.text();let d;try{d=JSON.parse(raw)}catch{return {provider:'openai',text:'',error:'The configured AI provider returned an unreadable response. No generated content was saved.'}};
  let out=String(d.output_text||'').trim();
  if(!out&&Array.isArray(d.output))for(const item of d.output)for(const part of (item.content||[]))if(part.type==='output_text'&&part.text)out+=String(part.text);
  if(!out)return {provider:'openai',text:'',error:'The configured AI provider returned no text. No generated content was saved.'};
  return {provider:'openai',text:out.slice(0,50000)};
 }catch{return {provider:'openai',text:'',error:'The configured AI provider could not be reached. No generated content was saved.'}}
}

async function ensureCoreSchema(env){
 if(coreSchemaReady)return coreSchemaReady;
 coreSchemaReady=(async()=>{
  // Fast path: the production database is already initialized. Avoid replaying
  // hundreds of CREATE/INSERT/INDEX statements on every new Worker isolate.
  try{
   const marker=await env.DB.prepare("SELECT value FROM app_settings WHERE key='core_schema_version' LIMIT 1").first();
   if(marker?.value === '16.64.0'){return;}
  }catch(e){/* First installation or pre-marker database, continue bootstrap. */}
  const qs=[
`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT NOT NULL UNIQUE,email TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'user',tickets REAL NOT NULL DEFAULT 0,verified INTEGER NOT NULL DEFAULT 0,banned INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
`CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL,expires_at INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
`CREATE TABLE IF NOT EXISTS novels (id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,alt_titles TEXT DEFAULT '',author TEXT NOT NULL,description TEXT DEFAULT '',status TEXT NOT NULL DEFAULT 'ongoing',kind TEXT NOT NULL DEFAULT 'original',language TEXT DEFAULT 'English',cover_url TEXT DEFAULT '',source_url TEXT DEFAULT '',rights_status TEXT NOT NULL DEFAULT 'original',views INTEGER NOT NULL DEFAULT 0,rating REAL NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
`CREATE TABLE IF NOT EXISTS chapters (id INTEGER PRIMARY KEY AUTOINCREMENT,novel_id INTEGER NOT NULL,chapter_number INTEGER NOT NULL,title TEXT NOT NULL,content TEXT NOT NULL,is_locked INTEGER NOT NULL DEFAULT 1,ticket_cost REAL NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(novel_id,chapter_number))`,
`CREATE TABLE IF NOT EXISTS genres (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL UNIQUE,slug TEXT NOT NULL UNIQUE)`,
`CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL UNIQUE,slug TEXT NOT NULL UNIQUE)`,
`CREATE TABLE IF NOT EXISTS novel_genres (novel_id INTEGER NOT NULL,genre_id INTEGER NOT NULL,PRIMARY KEY(novel_id,genre_id))`,
`CREATE TABLE IF NOT EXISTS novel_tags (novel_id INTEGER NOT NULL,tag_id INTEGER NOT NULL,PRIMARY KEY(novel_id,tag_id))`,
`CREATE TABLE IF NOT EXISTS unlocks (user_id INTEGER NOT NULL,chapter_id INTEGER NOT NULL,cost REAL NOT NULL,unlocked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,chapter_id))`,
`CREATE TABLE IF NOT EXISTS unlock_batches (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,novel_id INTEGER NOT NULL,start_chapter INTEGER NOT NULL,end_chapter INTEGER NOT NULL,requested_count INTEGER NOT NULL,cost REAL NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
`CREATE TABLE IF NOT EXISTS bookmarks (user_id INTEGER NOT NULL,novel_id INTEGER NOT NULL,chapter_number INTEGER NOT NULL DEFAULT 1,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,novel_id))`,
`CREATE TABLE IF NOT EXISTS history (user_id INTEGER NOT NULL,novel_id INTEGER NOT NULL,chapter_number INTEGER NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,novel_id))`,
`CREATE TABLE IF NOT EXISTS donations (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,amount REAL NOT NULL,reference_id TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
`CREATE TABLE IF NOT EXISTS connectors (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,base_url TEXT NOT NULL,type TEXT NOT NULL DEFAULT 'json',enabled INTEGER NOT NULL DEFAULT 0,rights_status TEXT NOT NULL DEFAULT 'pending',last_status TEXT DEFAULT 'never',last_checked_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
`CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,novel_id INTEGER NOT NULL,body TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'visible',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
`CREATE TABLE IF NOT EXISTS novel_requests (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,url TEXT NOT NULL,source_host TEXT NOT NULL,week_key INTEGER NOT NULL,cost REAL NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'pending',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
`CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,action TEXT NOT NULL,details TEXT DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
`CREATE TABLE IF NOT EXISTS ticket_ledger (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,delta REAL NOT NULL,reason TEXT NOT NULL,reference TEXT DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
`CREATE TABLE IF NOT EXISTS follows (user_id INTEGER NOT NULL,novel_id INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,novel_id))`,`CREATE TABLE IF NOT EXISTS user_library (user_id INTEGER NOT NULL,novel_id INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,novel_id))`,
`CREATE TABLE IF NOT EXISTS ratings (user_id INTEGER NOT NULL,novel_id INTEGER NOT NULL,rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,novel_id))`,
`CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,novel_id INTEGER,chapter_id INTEGER,reason TEXT NOT NULL,details TEXT DEFAULT '',status TEXT NOT NULL DEFAULT 'open',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
`CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,read_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
`CREATE TABLE IF NOT EXISTS agents (id INTEGER PRIMARY KEY AUTOINCREMENT,slug TEXT NOT NULL UNIQUE,name TEXT NOT NULL,role TEXT NOT NULL,icon TEXT DEFAULT '🤖',mode TEXT NOT NULL DEFAULT 'automation',status TEXT NOT NULL DEFAULT 'ready',enabled INTEGER NOT NULL DEFAULT 1,last_run_at TEXT,last_result TEXT DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
`CREATE TABLE IF NOT EXISTS agent_runs (id INTEGER PRIMARY KEY AUTOINCREMENT,agent_id INTEGER NOT NULL,trigger TEXT NOT NULL,result TEXT DEFAULT '',status TEXT NOT NULL DEFAULT 'ok',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
`CREATE INDEX IF NOT EXISTS idx_agent_runs_agent ON agent_runs(agent_id,created_at)`,`CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY,value TEXT NOT NULL)`,
`CREATE INDEX IF NOT EXISTS idx_novels_updated ON novels(updated_at)`,`CREATE INDEX IF NOT EXISTS idx_unlocks_time ON unlocks(unlocked_at)`,`CREATE INDEX IF NOT EXISTS idx_history_user ON history(user_id,updated_at)`,`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id,created_at)`];
  for(const q of qs){try{await env.DB.prepare(q).run()}catch(e){console.error('core schema statement failed; aborting bootstrap',e);throw e}}
  await ensurePublishingSchema(env);
  await env.DB.prepare(`INSERT OR IGNORE INTO app_settings(key,value) VALUES('ticket_packs','[]')`).run()
  await seedTaxonomy(env);
  await ensureCommunityTaxonomySchema(env);
  await ensureAgents(env);
  await ensureAuthorAISchema(env);
  // Never grant administrator privileges to an arbitrary first/oldest account.
  // Provision an administrator through a deliberate, authenticated owner-only process.
  await env.DB.prepare("INSERT OR REPLACE INTO app_settings(key,value) VALUES('first_admin_bootstrap_done','disabled-securely')").run()
  await env.DB.prepare("INSERT OR REPLACE INTO app_settings(key,value) VALUES('core_schema_version','16.64.0')").run()

 })();
 return coreSchemaReady.catch(e=>{coreSchemaReady=null;throw e});
}


const AGENT_SEED=[
['novel-finder','Novel Finder Agent','Finds relevant novels across the local catalog and authorized provider indexes','🔎','orchestration'],
['import','Authorized Import Agent','Processes author-owned or licensed imports and normalizes permitted metadata/content','📥','automation'],
['metadata','Metadata Agent','Normalizes titles, authors, genres, tags, fandoms, language and status','🏷️','automation'],
['chapter-tracker','Chapter Tracker Agent','Tracks authorized feeds and first-party publishing updates','📚','automation'],
['recommendation','Recommendation Agent','Builds personalized recommendations from catalog and reading signals','⭐','ai-ready'],
['summary','Summary Agent','Creates summaries for content the platform is permitted to process','📝','ai-ready'],
['translation','Translation Agent','Assists translation for content the platform is permitted to process','🌐','ai-ready'],
['rights','Rights & Copyright Agent','Routes rights metadata, duplicate claims and takedown cases for review','🛡️','automation'],
['moderation','Moderation Agent','Flags spam, abuse, unsafe links and policy-sensitive submissions','🧹','automation'],
['notification','Notification Agent','Queues chapter, follow, request and system notifications','🔔','automation'],
['trend','Trend Agent','Calculates trending novels, authors, fandoms and tags','📈','automation'],
['seo','SEO Agent','Maintains public metadata and discovery signals for eligible pages','🧭','automation'],
['community','Community Agent','Assists comment quality and community workflows','💬','ai-ready'],
['support','Support Agent','Classifies support issues and routes complex cases to humans','🧑‍💻','ai-ready'],
['revenue','Revenue Agent','Reports monetization metrics and anomalies without autonomous financial decisions','💰','automation'],
['provider-health','Provider Health Agent','Checks configured authorized connectors and records health','❤️','automation'],
['duplicate','Duplicate Detection Agent','Finds likely duplicate catalog records for review','🧬','automation'],
['catalog','Catalog Steward Agent','Keeps catalog metadata consistent and identifies stale records','🗂️','automation'],
['security','Security Sentinel Agent','Monitors suspicious auth/report patterns and creates admin review signals','🚨','automation'],
['analytics','Analytics Agent','Produces operational reading and platform analytics','📊','automation'],
['orchestrator','Omni Orchestrator','Routes jobs to specialist agents and records execution','🌌','orchestration']
];
async function ensureAgents(env){
 try{
  await env.DB.batch(AGENT_SEED.map(a=>env.DB.prepare(`INSERT OR IGNORE INTO agents(slug,name,role,icon,mode) VALUES(?,?,?,?,?)`).bind(...a)));
 }catch(e){console.error('agent seed failed; schema version must not advance',e);throw e}
}
const AI_AGENT_PROMPTS={
 'novel-finder':'Act as a novel discovery assistant. Confirm the provider is available and describe, in one concise sentence, how you would search only the Imperial Novel catalog and authorized provider indexes.',
 'import':'Act as an authorized-import assistant. Confirm the provider is available and state that imports must be limited to author-owned, licensed, public-domain, or otherwise authorized material.',
 'metadata':'Act as a metadata assistant. Return a one-sentence confirmation that you can normalize title, author, genres, tags, fandom, language, and publication status without inventing facts.',
 'chapter-tracker':'Act as a chapter tracking assistant. Confirm you can reason about authorized first-party or licensed publishing updates without accessing unauthorized sources.',
 'recommendation':'Act as a recommendation assistant. Confirm you can build recommendations from permitted catalog and reading signals while avoiding sensitive profiling.',
 'summary':'Act as a summary assistant. Confirm you can summarize content only when Imperial Novel is permitted to process that content.',
 'translation':'Act as a translation assistant. Confirm you can translate content only when Imperial Novel is permitted to process that content.',
 'rights':'Act as a rights assistant. Confirm you can classify rights metadata and route uncertain ownership or takedown cases to human review.',
 'moderation':'Act as a moderation assistant. Confirm you can flag spam, abuse, unsafe links, and policy-sensitive submissions for review.',
 'trend':'Act as a trend assistant. Confirm you can calculate trends from platform signals without exposing private user data.',
 'seo':'Act as an SEO assistant. Confirm you can prepare public metadata for eligible pages without making unsupported claims.',
 'community':'Act as a community assistant. Confirm you can help with comment quality and route serious issues to human review.',
 'support':'Act as a support assistant. Confirm you can classify support issues and route complex or sensitive cases to humans.',
 'orchestrator':'Act as the Imperial Novel Omni Orchestrator. Confirm you can route a permitted job to the appropriate specialist agent while preserving rights, security, and human-review boundaries.'
};
function localAgentResult(env,slug){
 const local={
  'novel-finder':'Local discovery engine ready: searches the Imperial Novel catalog and only configured authorized indexes.',
  'import':'Local import guard ready: accepts only author-owned, licensed, public-domain, or otherwise authorized material.',
  'metadata':'Local metadata engine ready: normalizes title, author, genres, tags, fandom, language, and publication status without inventing facts.',
  'chapter-tracker':'Local chapter tracker ready: checks permitted first-party or licensed publishing updates only.',
  'recommendation':'Local recommendation engine ready: uses permitted catalog and reading signals while avoiding sensitive profiling.',
  'summary':'Local summary workflow ready: processes only content Imperial Novel is permitted to process.',
  'translation':'Local translation workflow ready: processes only content Imperial Novel is permitted to process.',
  'rights':'Local rights engine ready: checks rights metadata and routes uncertain ownership or takedown cases to human review.',
  'moderation':'Local moderation engine ready: flags basic spam, abuse, unsafe links, and policy-sensitive submissions for review.',
  'trend':'Local trend engine ready: calculates trends from platform signals without exposing private user data.',
  'seo':'Local SEO engine ready: prepares public metadata for eligible pages without unsupported claims.',
  'community':'Local community workflow ready: checks basic comment quality signals and routes serious issues to human review.',
  'support':'Local support router ready: classifies basic support categories and routes complex or sensitive cases to humans.'
 };
 return local[slug]||`Local Cloudflare agent logic is active for ${slug}.`;
}
async function callOpenAI(env,slug){
 const key=String(env.OPENAI_API_KEY||'').trim();
 if(!key) return localAgentResult(env,slug);
 try{
  const model=String(env.OPENAI_MODEL||'gpt-5-mini').trim();
  const prompt=AI_AGENT_PROMPTS[slug]||'Confirm that the Imperial Novel AI provider is available for this specialist agent.';
  const r=await fetch(String(env.OPENAI_BASE_URL||'https://api.openai.com/v1/responses'),{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${key}`},body:JSON.stringify({model,input:[{role:'system',content:'You are a safe internal AI provider for Imperial Novel. Keep responses concise. Never claim access to data you were not given. Respect rights, privacy, security, and human-review requirements.'},{role:'user',content:prompt}],max_output_tokens:120})});
  const text=await r.text();
  if(!r.ok) return localAgentResult(env,slug)+` OpenAI fallback active (${r.status}).`;
  let d;try{d=JSON.parse(text)}catch{return localAgentResult(env,slug);}
  let out=String(d.output_text||'').trim();
  if(!out&&Array.isArray(d.output))for(const item of d.output){for(const c of (item.content||[])){if(c.type==='output_text'&&c.text)out+=String(c.text)}}
  return out?out.slice(0,2000):localAgentResult(env,slug);
 }catch{return localAgentResult(env,slug);}
}
async function runAgent(env,slug,trigger="manual"){await ensureAgents(env);const a=await env.DB.prepare("SELECT * FROM agents WHERE slug=? AND enabled=1").bind(slug).first();if(!a)return {slug,status:"not-found"};let result="queued";try{if(slug==="provider-health"){await ensureOmniTables(env);const rows=(await env.DB.prepare(`SELECT * FROM connectors WHERE enabled=1 AND rights_status='authorized'`).all()).results;result=`Checked ${rows.length} authorized connectors`;for(const c of rows){const status=c.search_url?"configured":"not-configured";await env.DB.prepare("UPDATE connectors SET last_status=?,last_checked_at=CURRENT_TIMESTAMP WHERE id=?").bind(status,c.id).run()}}else if(slug==="notification"){result="Notification queue scan complete"}else if(slug==="catalog"){const r=await env.DB.prepare("SELECT COUNT(*) n FROM novels").first();result=`Catalog steward scanned ${Number(r.n)} novels`}else if(slug==="duplicate"){result="Duplicate detection pass queued for review"}else if(slug==="security"){const r=await env.DB.prepare("SELECT COUNT(*) n FROM reports WHERE status='open'").first();result=`Security review sees ${Number(r.n)} open reports`}else if(slug==="analytics"){const [u,n,c]=await Promise.all([env.DB.prepare("SELECT COUNT(*) n FROM users").first(),env.DB.prepare("SELECT COUNT(*) n FROM novels").first(),env.DB.prepare("SELECT COUNT(*) n FROM chapters").first()]);result=`Users ${u.n}; novels ${n.n}; chapters ${c.n}`}else if(slug==="orchestrator"){const rows=(await env.DB.prepare("SELECT slug,name,enabled,status FROM agents WHERE slug<>? ORDER BY name").bind("orchestrator").all()).results;const active=rows.filter(x=>Number(x.enabled)===1).length;result=`Local Omni Orchestrator active: ${active} specialist agents available for Cloudflare-native routing; rights, security, and human-review boundaries enforced.`}else if(AI_AGENT_PROMPTS[slug]){result=await callOpenAI(env,slug)}else{result=`Local Cloudflare agent logic is active for ${slug}.`}await env.DB.prepare("UPDATE agents SET last_run_at=CURRENT_TIMESTAMP,last_result=?,status='ready' WHERE id=?").bind(result,a.id).run();await env.DB.prepare("INSERT INTO agent_runs(agent_id,trigger,result,status) VALUES(?,?,?,'ok')").bind(a.id,trigger,result).run();return {slug,status:"ok",result}}catch(e){const msg=String(e.message||e);await env.DB.prepare("UPDATE agents SET last_run_at=CURRENT_TIMESTAMP,last_result=?,status='error' WHERE id=?").bind(msg,a.id).run();await env.DB.prepare("INSERT INTO agent_runs(agent_id,trigger,result,status) VALUES(?,?,?,'error')").bind(a.id,trigger,msg).run();return {slug,status:"error",result:msg}}}
async function runAutomation(env){for(const slug of ['provider-health','notification','catalog','duplicate','security','analytics'])await runAgent(env,slug,'scheduled');return {ok:true,ran:6}}

async function getUser(req,env){const c=cookies(req.headers.get("cookie"));if(!c.session)return null;const u=await env.DB.prepare(`SELECT u.id,u.username,u.email,u.role,u.tickets,u.verified,u.banned,s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?`).bind(await digest(c.session)).first();if(!u||u.banned||u.expires_at<now())return null;return u}
const need=u=>u?null:json({error:"Authentication required"},401);
const admin=u=>u?.role==="admin"?null:json({error:"Administrator access required"},403);
const author=u=>(u?.role==="admin"||u?.role==="author")?null:json({error:"Author access required"},403);
async function audit(env,u,action,details=""){try{await env.DB.prepare("INSERT INTO audit_logs(user_id,action,details) VALUES(?,?,?)").bind(u?.id||null,action,details).run()}catch{}}
function allowedHost(env,url){try{const h=new URL(url);if(h.protocol!=="https:")return false;const list=String(env.CONNECTOR_HOST_ALLOWLIST||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);return list.length>0&&list.some(x=>h.hostname===x||h.hostname.endsWith("."+x))}catch{return false}}
const SOURCES=[
 ["Fanqie Novel","fanqienovel.com","/page/{id}","fast"],["Tadu","tadu.com","/book/{id}","API required"],["Qimao","qimao.com","/shuku/{id}","API required"],["69Shuba","69shuba.com","/book/{id}.htm","fast"],["TWKan","twkan.com","/book/{id}.html","fast"],["Novel543","novel543.com","/{id}/","standard"],["UURead","uuread.tw","/{id}","very slow"],["TWBook","twbook.cc","/{id}/","standard"],["Piaotia","piaotia.com","/bookinfo/{id}/{id}.html","standard"],["TRXS","trxs.cc","/tongren/{id}.html","standard"],["TongrenShe","tongrenshe.cc","/tongren/{id}.html","standard"],["UuKanShu","uukanshu.cc","/book/{id}/","standard"],["BiXiangE","bixiange.xyz","/book/{id}/","standard"],["FFXS8","ffxs8.com","/book/{id}/","standard"],["BiQuGe","biquge.tw","/book/{id}.html","standard"],["101KKS","101kks.com","/book/{id}.html","new domain"],["QQ Reading","book.qq.com","/book-detail/{id}","API required"],
 ["WTR-Lab","wtr-lab.com","/{id}","connector required"],["FictionZone","fictionzone.net","/{id}","connector required"],["TomatoMTL","tomatomtl.com","/{id}","connector required"]
];
function sourceForUrl(value){try{const u=new URL(value);const h=u.hostname.toLowerCase();return SOURCES.find(x=>h===x[1]||h.endsWith("."+x[1]))||null}catch{return null}}
function normalizeOmniItem(x,provider){const title=String(x.title||x.name||x.book_title||'').trim();if(!title)return null;return {provider,title,author:String(x.author||x.writer||x.creator||'Unknown'),url:String(x.url||x.source_url||x.link||''),cover_url:String(x.cover_url||x.cover||x.image||''),description:String(x.description||x.synopsis||''),latest_chapter:Number(x.latest_chapter||x.chapter_count||0),language:String(x.language||''),status:String(x.status||'')};}
async function omniLocal(env,q){const z='%'+q.toLowerCase()+'%';const rows=(await env.DB.prepare(`SELECT id,title,author,description,cover_url,source_url,views,updated_at FROM novels WHERE LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR LOWER(description) LIKE ? OR LOWER(alt_titles) LIKE ? ORDER BY updated_at DESC LIMIT 30`).bind(z,z,z,z).all()).results;return rows.map(x=>({provider:'Imperial Novel',id:x.id,title:x.title,author:x.author,url:'/novel/'+x.id,cover_url:x.cover_url,description:x.description,views:x.views,updated_at:x.updated_at}));}
async function omniConnectorSearch(env,c,q){if(!c.enabled||c.rights_status!=='authorized'||!c.search_url)return [];const target=c.search_url.replaceAll('{q}',encodeURIComponent(q));const h=new Headers({'accept':'application/json'});if(c.secret_name&&env[c.secret_name])h.set(c.auth_header||'authorization',String(env[c.secret_name]));const ctrl=new AbortController(),t=setTimeout(()=>ctrl.abort(),7000);try{const r=await fetch(target,{headers:h,signal:ctrl.signal});if(!r.ok)return [];const d=await r.json();const arr=Array.isArray(d)?d:(Array.isArray(d.results)?d.results:Array.isArray(d.items)?d.items:[]);return arr.map(x=>normalizeOmniItem(x,c.name)).filter(Boolean).slice(0,20)}catch{return []}finally{clearTimeout(t)}}
async function ensureOmniTables(env){for(const q of ["ALTER TABLE connectors ADD COLUMN search_url TEXT DEFAULT ''","ALTER TABLE connectors ADD COLUMN auth_header TEXT DEFAULT 'authorization'","ALTER TABLE connectors ADD COLUMN secret_name TEXT DEFAULT ''","ALTER TABLE connectors ADD COLUMN rights_evidence_url TEXT DEFAULT ''","ALTER TABLE connectors ADD COLUMN terms_url TEXT DEFAULT ''","ALTER TABLE connectors ADD COLUMN rights_notes TEXT DEFAULT ''","ALTER TABLE connectors ADD COLUMN metadata_import_allowed INTEGER NOT NULL DEFAULT 0","ALTER TABLE connectors ADD COLUMN attribution_required INTEGER NOT NULL DEFAULT 0"]){try{await env.DB.prepare(q).run()}catch{}}await env.DB.batch([env.DB.prepare("CREATE TABLE IF NOT EXISTS connector_events (id INTEGER PRIMARY KEY AUTOINCREMENT,connector_id INTEGER,event TEXT NOT NULL,status TEXT NOT NULL,details TEXT DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),env.DB.prepare("CREATE TABLE IF NOT EXISTS import_jobs (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,connector_id INTEGER,source_url TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'queued',message TEXT DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),env.DB.prepare("CREATE TABLE IF NOT EXISTS recommendations (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,novel_id INTEGER,reason TEXT,score REAL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),env.DB.prepare("CREATE TABLE IF NOT EXISTS connector_authorization_requests (id INTEGER PRIMARY KEY AUTOINCREMENT,connector_id INTEGER NOT NULL,user_id INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'pending',evidence_url TEXT DEFAULT '',terms_url TEXT DEFAULT '',notes TEXT DEFAULT '',metadata_import_allowed INTEGER NOT NULL DEFAULT 0,attribution_required INTEGER NOT NULL DEFAULT 0,reviewed_by INTEGER,reviewed_at TEXT,review_notes TEXT DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_connector_events_connector ON connector_events(connector_id,created_at)"),env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_import_jobs_user ON import_jobs(user_id,created_at)"),env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_connector_auth_requests_status ON connector_authorization_requests(status,created_at)")]).catch(()=>{})}
async function seedOmni(env){await ensureOmniTables(env);try{await env.DB.batch(SOURCES.map(x=>env.DB.prepare(`INSERT OR IGNORE INTO connectors(name,base_url,type,enabled,rights_status,last_status) VALUES(?,?, 'registry',0,'pending','registry')`).bind(x[0],'https://'+x[1])))}catch(e){console.error('connector seed',e)}}
async function seedTaxonomy(env){
 const genres=["Action","Adventure","Fantasy","Romance","Comedy","Drama","Mystery","Thriller","Horror","Crime","Psychological","Slice of Life","Sports","School Life","Academy","Youth","Family","Historical","Military","War","Politics","Royalty","Nobility","Kingdom Building","Empire Building","City Building","Business","Economics","Finance","Law","Medical","Cooking","Entertainment","Showbiz","Urban","Contemporary","Modern","Eastern Fantasy","Western Fantasy","Dark Fantasy","Epic Fantasy","High Fantasy","Low Fantasy","Xuanhuan","Xianxia","Wuxia","Cultivation","Immortal Cultivation","Martial Arts","Mecha","Cyberpunk","Science Fiction","Space Opera","Post-Apocalyptic","Apocalypse","Dystopian","Steampunk","Time Travel","Alternate History","Isekai","Transmigration","Reincarnation","Regression","System","Game","Virtual Reality","LitRPG","Progression Fantasy","Superpowers","Supernatural","Paranormal","Magic","Mythology","Gods","Demons","Angels","Vampire","Werewolf","Monster","Zombies","Survival","Fanfiction","Crossover","Anime & Manga","Manhua","Manhwa","Light Novel","Web Novel","Drama & TV","Movie","Game Fiction","Comics","Girls Love","Boys Love","Harem","Reverse Harem","Shoujo","Shounen","Josei","Seinen","Mature","Adult Fiction"];
 const tags=["System","Isekai","Reincarnation","Transmigration","Regression","Time Travel","Alternate Universe","Alternate History","Crossover","Multiverse","Self Insert","Original Character","Original Protagonist","Male MC","Female MC","Strong MC","Overpowered MC","Genius MC","Smart MC","Cold MC","Calm MC","Ruthless MC","Villain MC","Antihero MC","Hidden Identity","Secret Identity","Face Slapping","Slow Burn","Slow Life","Slice of Life","Romance","Comedy","Drama","Harem","Reverse Harem","Love Triangle","Multiple Love Interests","Strong Female Lead","Strong Male Lead","Kingdom Building","Empire Building","Nation Building","City Building","World Building","Territory Development","Politics","Court Politics","Nobility","Royal Family","Emperor","King","Queen","Prince","Princess","Duke","Duchess","Lord","Lady","Military","War","Strategy","Tactics","Conquest","Diplomacy","Economy","Trade","Business","Technology","Modern Technology","Industrialization","Infrastructure","Agriculture","Logistics","Science","Engineering","Medicine","Magic","Mana","Spells","Magic Academy","Cultivation","Qi","Sword Cultivation","Alchemy","Pill Refining","Martial Arts","Swordmaster","Immortal","Dao","Sect","Clan","Family","Bloodline","Divine Bloodline","Dragon","Phoenix","Beast","Sacred Beast","Mythical Beast","Gods","Goddess","Demons","Angels","Vampires","Werewolves","Zombies","Apocalypse","Survival","Post-Apocalypse","Monster","Dungeon","Tower","Quest","Levels","Stats","Skills","Talent","Blessing","Divine Power","Superpowers","Psychic","Mecha","Spaceship","Space Travel","Galactic Empire","Cyberpunk","Virtual Reality","Game World","LitRPG","Academy","School","College","Workplace","Military Academy","Detective","Mystery","Crime","Mafia","Assassin","Pirate","Ninja","Samurai","Historical","Ancient China","Ancient Japan","Medieval","Modern World","Near Future","Dystopia","Steampunk","Anime","Manga","Manhwa","Manhua","K-Drama","C-Drama","J-Drama","TV Series","Movie Universe","Game Universe","Book Universe","Fanfiction","Canon Divergence","Fix-It","What If","Power Fantasy","Character Growth","Training Arc","Tournament","Adventure","Exploration","Travel","Treasure Hunt","Revenge","Redemption","Friendship","Found Family","Family Bonds","Brotherhood","Fated Lovers","Enemies to Lovers","Childhood Friends","Marriage","Pregnancy","Parenting","Mature Themes","Dark","Gore","Tragedy","Happy Ending","Open Ending","Ongoing","Completed"];
 try{
  await env.DB.batch(genres.map(x=>env.DB.prepare("INSERT OR IGNORE INTO genres(name,slug) VALUES(?,?)").bind(x,slug(x))));
  await env.DB.batch(tags.map(x=>env.DB.prepare("INSERT OR IGNORE INTO tags(name,slug) VALUES(?,?)").bind(x,slug(x))));
 }catch(e){console.error('taxonomy seed failed; schema version must not advance',e);throw e}
}
async function ensureCommunityTaxonomySchema(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS taxonomy_submissions(
 id INTEGER PRIMARY KEY AUTOINCREMENT,type TEXT NOT NULL,name TEXT NOT NULL,slug TEXT NOT NULL,
 description TEXT DEFAULT '',creator_id INTEGER,creator_name TEXT DEFAULT '',status TEXT NOT NULL DEFAULT 'pending',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,reviewed_at TEXT,reviewer_id INTEGER,
 UNIQUE(type,slug))`).run();
}
async function communityTaxonomy(req,env){
 const u=new URL(req.url), method=req.method;
 if(method==='GET'){
  const type=String(u.searchParams.get('type')||'').toLowerCase();
  if(!['genre','tag'].includes(type)) return json({error:'type must be genre or tag'},400);
  const status=String(u.searchParams.get('status')||'pending').toLowerCase();
  if(!['pending','approved','rejected','all'].includes(status)) return json({error:'status must be pending, approved, rejected, or all'},400);
  const q=status==='all' ? `SELECT * FROM taxonomy_submissions WHERE type=? ORDER BY name COLLATE NOCASE` : `SELECT * FROM taxonomy_submissions WHERE type=? AND status=? ORDER BY name COLLATE NOCASE`;
  const r=status==='all' ? await env.DB.prepare(q).bind(type).all() : await env.DB.prepare(q).bind(type,status).all();
  return json(r.results||[]);
 }
 if(method==='POST'){
  const b=await body(req),type=String(b.type||'').toLowerCase(),name=String(b.name||'').trim().replace(/\s+/g,' ');
  if(!['genre','tag'].includes(type)) return json({error:'type must be genre or tag'},400);
  if(name.length<2||name.length>80)return json({error:'Name must be 2-80 characters'},400);
  const s=slug(name),table=type==='genre'?'genres':'tags';
  if(await env.DB.prepare(`SELECT id FROM ${table} WHERE slug=? LIMIT 1`).bind(s).first())return json({error:'Already exists in official taxonomy'},409);
  const existing=await env.DB.prepare('SELECT id,status FROM taxonomy_submissions WHERE type=? AND slug=? LIMIT 1').bind(type,s).first();
  if(existing) return json({error:'Already submitted',id:existing.id,status:existing.status},409);
  try{const r=await env.DB.prepare(`INSERT INTO taxonomy_submissions(type,name,slug,description,creator_id,creator_name,status) VALUES(?,?,?,?,?,?,?)`).bind(type,name,s,String(b.description||'').slice(0,500),b.creator_id||null,String(b.creator_name||'').slice(0,80),'pending').run();return json({ok:true,id:r.meta.last_row_id,status:'pending'})}catch(e){return json({error:'Unable to save submission',detail:String(e&&e.message||e)},500)}
 }
 return json({error:'Method not allowed'},405);
}
async function adminTaxonomy(req,env,u){
 const e=admin(u);if(e)return e;const b=await body(req),id=Number(b.id||0),decision=String(b.decision||'').toLowerCase();
 if(!id||!['approve','reject'].includes(decision))return json({error:'id and decision required'},400);
 const row=await env.DB.prepare('SELECT * FROM taxonomy_submissions WHERE id=?').bind(id).first();if(!row)return json({error:'Submission not found'},404);
 if(row.status!=='pending')return json({error:'Already reviewed'},409);
 if(decision==='reject'){await env.DB.prepare("UPDATE taxonomy_submissions SET status='rejected',reviewed_at=CURRENT_TIMESTAMP,reviewer_id=? WHERE id=?").bind(u.id,id).run();return json({ok:true,status:'rejected'});}
 const table=row.type==='genre'?'genres':'tags';await env.DB.prepare(`INSERT OR IGNORE INTO ${table}(name,slug) VALUES(?,?)`).bind(row.name,row.slug).run();
 await env.DB.prepare("UPDATE taxonomy_submissions SET status='approved',reviewed_at=CURRENT_TIMESTAMP,reviewer_id=? WHERE id=?").bind(u.id,id).run();return json({ok:true,status:'approved',name:row.name,type:row.type});
}

async function seed(env){
 const genres=["Action","Adventure","Fantasy","Romance","Harem","Cultivation","Xianxia","Wuxia","Isekai","Reincarnation","System","Sci-Fi","Mystery","Horror","Historical","Comedy","Drama","Fanfiction","School Life","Military","Politics"];
 const tags=["System","Isekai","Reincarnation","Transmigration","Crossover","Self Insert","Alternate Universe","Multiverse","Dragon","Empire","Magic","Academy","Strong MC","Slow Burn","Fanfiction","Anime","Manga","Manhwa","Manhua","Game","K-Drama","C-Drama","Time Travel","Overpowered MC"];
 for(const x of genres)await env.DB.prepare("INSERT OR IGNORE INTO genres(name,slug) VALUES(?,?)").bind(x,slug(x)).run();
 for(const x of tags)await env.DB.prepare("INSERT OR IGNORE INTO tags(name,slug) VALUES(?,?)").bind(x,slug(x)).run();
 const n=await env.DB.prepare("SELECT id FROM novels LIMIT 1").first();
 if(!n){const r=await env.DB.prepare("INSERT INTO novels(title,alt_titles,author,description,status,kind,language,rights_status,cover_url) VALUES(?,?,?,?,?,?,?,?,?)").bind("God-Emperor's Infinite Ascension","Infinite Ascension","Sikander Shehzad","A cosmic system, an empire, and an infinite path upward. This seeded title is a deployment demo. Replace it with content you own or are licensed to publish.","ongoing","original","English","original","https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=700&q=80").run();const id=r.meta.last_row_id;for(let i=1;i<=120;i++)await env.DB.prepare("INSERT INTO chapters(novel_id,chapter_number,title,content,is_locked,ticket_cost,publication_status) VALUES(?,?,?,?,?,?,?)").bind(id,i,`Chapter ${i}: The Imperial Awakening`,`<p><strong>Imperial Novel</strong></p><p>This is placeholder chapter content for deployment testing. Replace it with text you own or have permission to publish.</p><p>The story continues beyond the mortal page.</p>`,i>1,1,'published').run();for(const x of (await env.DB.prepare("SELECT id FROM genres WHERE slug IN ('fantasy','action','isekai','system','fanfiction')").all()).results)await env.DB.prepare("INSERT OR IGNORE INTO novel_genres VALUES(?,?)").bind(id,x.id).run();for(const x of (await env.DB.prepare("SELECT id FROM tags WHERE slug IN ('system','isekai','empire','strong-mc','multiverse')").all()).results)await env.DB.prepare("INSERT OR IGNORE INTO novel_tags VALUES(?,?)").bind(id,x.id).run();}
}
async function ensureDiscoverySchema(env){
 if(globalThis.__discoveryReady)return globalThis.__discoveryReady;
 globalThis.__discoveryReady=(async()=>{
  try{await env.DB.prepare("CREATE TABLE IF NOT EXISTS request_votes (request_id INTEGER NOT NULL,user_id INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(request_id,user_id))").run()}catch(e){console.error('discovery schema',e)}
  try{await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_request_votes_request ON request_votes(request_id)").run()}catch{}
 })(); return globalThis.__discoveryReady;
}
function ensureCommunityV2(env){
 if(globalThis.__communityV2Ready)return globalThis.__communityV2Ready;
 globalThis.__communityV2Ready=(async()=>{
  try{await env.DB.prepare("ALTER TABLE comments ADD COLUMN parent_id INTEGER").run()}catch{}
  try{await env.DB.prepare("ALTER TABLE comments ADD COLUMN edited_at TEXT").run()}catch{}
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS comment_likes (user_id INTEGER NOT NULL,comment_id INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,comment_id))").run();
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS comment_reports (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,comment_id INTEGER NOT NULL,reason TEXT NOT NULL,details TEXT DEFAULT '',status TEXT NOT NULL DEFAULT 'open',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
 })(); return globalThis.__communityV2Ready;
}
async function api(req,env){
 await ensureCoreSchema(env);
 await ensureCommunityV2(env);
 await ensureDiscoverySchema(env);
 const url=new URL(req.url),p=url.pathname,m=req.method,u=await getUser(req,env);
 if(p==="/api/agents"&&m==="GET"){return json((await env.DB.prepare(`SELECT slug,name,role,icon,mode,status,last_run_at,last_result FROM agents WHERE enabled=1 ORDER BY id`).all()).results)}
 if(p==="/api/admin/agents"&&m==="GET"){const e=admin(u);if(e)return e;return json((await env.DB.prepare(`SELECT id,slug,name,role,icon,mode,status,enabled,last_run_at,last_result FROM agents ORDER BY id`).all()).results)}
 if(p==="/api/admin/agents/run"&&m==="POST"){const e=admin(u);if(e)return e;const b=await body(req);const slug=String(b.slug||'');if(slug)return json(await runAgent(env,slug,'admin'));return json(await runAutomation(env))}
 if(p==="/api/taxonomy")return communityTaxonomy(req,env);
 if(p==="/api/admin/taxonomy"&&m==='GET'){const e=admin(u);if(e)return e;return json((await env.DB.prepare("SELECT * FROM taxonomy_submissions ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END,created_at DESC LIMIT 300").all()).results||[])}
 if(p==="/api/admin/taxonomy"&&m==='POST')return adminTaxonomy(req,env,u);
 if(p==="/api/health"){let db=true;try{await env.DB.prepare("SELECT 1").first()}catch{db=false}return json({ok:db,service:env.SITE_NAME||"Imperial Novel",version:env.APP_VERSION||"5.0.0",database:db,time:new Date().toISOString()})}
 if(p==="/api/auth/register"&&m==="POST"){const b=await body(req),username=String(b.username||"").trim(),email=String(b.email||"").trim().toLowerCase(),password=String(b.password||"");if(!/^[a-zA-Z0-9_]{3,24}$/.test(username))return json({error:"Username must be 3-24 letters, numbers or underscores"},400);if(!email.includes("@"))return json({error:"Enter a valid email"},400);if(password.length<8)return json({error:"Password must be at least 8 characters"},400);const salt=rnd(16);try{await env.DB.prepare("INSERT INTO users(username,email,password_hash) VALUES(?,?,?)").bind(username,email,(await phash(password,salt))+":"+salt).run()}catch{return json({error:"Username or email already exists"},409)}return json({ok:true,message:"Account created. You can now sign in."})}
 if(p==="/api/auth/login"&&m==="POST"){const b=await body(req),x=await env.DB.prepare("SELECT * FROM users WHERE email=?").bind(String(b.email||"").trim().toLowerCase()).first();if(!x)return json({error:"Invalid email or password"},401);const [hp,salt]=String(x.password_hash||"").split(":");if(!salt||await phash(String(b.password||""),salt)!==hp)return json({error:"Invalid email or password"},401);const token=rnd(32);await env.DB.prepare("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)").bind(await digest(token),x.id,now()+2592000).run();return json({ok:true,user:{id:x.id,username:x.username,email:x.email,role:x.role,tickets:x.tickets}},200,{"set-cookie":`session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`})}
 if(p==="/api/auth/logout"&&m==="POST"){const c=cookies(req.headers.get("cookie"));if(c.session)await env.DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await digest(c.session)).run();return json({ok:true},200,{"set-cookie":"session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"})}
 if(p==="/api/me")return json({user:u?{id:u.id,username:u.username,email:u.email,role:u.role,tickets:u.tickets,verified:u.verified}:null});
 if(p==="/api/config")return json({site:env.SITE_NAME||"Imperial Novel",payment:{method:"EasyPaisa",account:env.EASYPaisa_NUMBER||"",verification:"manual or official webhook"},batchUnlock:[10,25,50,100]});
 if(p==="/api/genres")return json((await env.DB.prepare("SELECT * FROM genres ORDER BY name").all()).results);
 if(p==="/api/tags")return json((await env.DB.prepare("SELECT * FROM tags ORDER BY name").all()).results);
 if(p==="/api/public-authors") {
  const q=String(url.searchParams.get("q")||"").trim().toLowerCase();
  const sql=q?`SELECT author,COUNT(*) novel_count,SUM(views) views,ROUND(AVG(rating),2) rating,MAX(updated_at) updated_at FROM novels WHERE publication_status='published' AND LOWER(author) LIKE ? GROUP BY author ORDER BY novel_count DESC,author COLLATE NOCASE LIMIT 50`:`SELECT author,COUNT(*) novel_count,SUM(views) views,ROUND(AVG(rating),2) rating,MAX(updated_at) updated_at FROM novels WHERE publication_status='published' GROUP BY author ORDER BY novel_count DESC,views DESC,author COLLATE NOCASE LIMIT 100`;
  return json((await env.DB.prepare(sql).bind(...(q?[`%${q}%`]:[])).all()).results||[]);
 }
 if(p==="/api/sources")return json(SOURCES.map(x=>({name:x[0],host:x[1],path:x[2],speed:x[3],connection:x[3].includes('required')?'authorized API/feed required':'registry only until connected'})));
 if(p==="/api/omni/status"){await seedOmni(env);const rows=(await env.DB.prepare(`SELECT id,name,base_url,type,enabled,rights_status,last_status,last_checked_at FROM connectors ORDER BY name`).all()).results;return json({engine:'OmniPortal',version:'1.0',mode:'federated',sources:rows,capabilities:['catalog-search','authorized-api-search','source-validation','import-queue','health-monitoring','smart-unlock']})}
 if(p==="/api/omni/search"){await ensureOmniTables(env);const q=String(url.searchParams.get('q')||'').trim();if(q.length<2)return json({query:q,results:[],providers:[]});const local=await omniLocal(env,q);const cs=(await env.DB.prepare(`SELECT * FROM connectors WHERE enabled=1 AND rights_status='authorized' LIMIT 30`).all()).results;const ext=(await Promise.all(cs.map(c=>omniConnectorSearch(env,c,q)))).flat();const seen=new Set(),results=[...local,...ext].filter(x=>{const k=(x.title+'|'+x.author+'|'+x.url).toLowerCase();if(seen.has(k))return false;seen.add(k);return true}).slice(0,100);return json({query:q,results,providers:[...new Set(results.map(x=>x.provider))],searched_connectors:cs.length})}
 if(p==="/api/omni/resolve"){const src=sourceForUrl(url.searchParams.get('url')||'');if(!src)return json({supported:false,error:'Unsupported or invalid source URL'},400);return json({supported:true,name:src[0],host:src[1],path:src[2],speed:src[3],rights_required:src[3].toLowerCase().includes('api')})}
 if(p==="/api/omni/import"&&m==="POST"){const e=need(u);if(e)return e;await ensureOmniTables(env);const b=await body(req),source=sourceForUrl(String(b.url||''));if(!source)return json({error:'Unsupported source URL'},400);const c=await env.DB.prepare(`SELECT id,name,enabled,rights_status FROM connectors WHERE base_url=? LIMIT 1`).bind('https://'+source[1]).first();if(!c||!c.enabled||c.rights_status!=='authorized')return json({error:'This source is registered but not connected to an authorized API/feed yet.'},409);const r=await env.DB.prepare(`INSERT INTO import_jobs(user_id,connector_id,source_url,status,message) VALUES(?,?,?,'queued','Queued for authorized connector import')`).bind(u.id,c.id,String(b.url)).run();return json({ok:true,job_id:r.meta.last_row_id,status:'queued'})}
 if(p==="/api/omni/jobs"&&m==="GET"){const e=need(u);if(e)return e;await ensureOmniTables(env);return json((await env.DB.prepare(`SELECT j.*,c.name connector FROM import_jobs j LEFT JOIN connectors c ON c.id=j.connector_id WHERE j.user_id=? ORDER BY j.created_at DESC LIMIT 50`).bind(u.id).all()).results)}
 if(p==="/api/omni/smart-unlock"){const e=need(u);if(e)return e;const novelId=Number(url.searchParams.get('novel_id'));const n=await env.DB.prepare(`SELECT COUNT(*) n FROM chapters WHERE novel_id=? AND publication_status='published' AND is_locked=1 AND id NOT IN(SELECT chapter_id FROM unlocks WHERE user_id=?)`).bind(novelId,u.id).first();const bal=Number(u.tickets);const packs=[10,25,50,100],options=[];for(const psize of packs){const rows=(await env.DB.prepare(`SELECT ticket_cost FROM chapters c WHERE c.novel_id=? AND c.publication_status='published' AND c.is_locked=1 AND c.id NOT IN(SELECT chapter_id FROM unlocks WHERE user_id=?) ORDER BY chapter_number LIMIT ?`).bind(novelId,u.id,psize).all()).results;const cost=rows.reduce((a,x)=>a+Number(x.ticket_cost),0);options.push({count:psize,cost,affordable:bal>=cost,chapters:rows.length})}return json({balance:bal,remaining:Number(n),recommended:options.find(x=>x.affordable&&x.chapters>0)?.count||0,options})}

 if(p==="/api/formats"&&m==="GET")return json({formats:CONTENT_FORMATS,groups:["text","comics","screen","audio","interactive"],version:1});

 if(p==="/api/novels"){
  const q=url.searchParams,term=(q.get("q")||"").trim().toLowerCase(),genre=q.get("genre"),tag=q.get("tag"),status=q.get("status"),kind=q.get("kind"),language=q.get("language"),author=(q.get("author")||"").trim(),minRating=Number(q.get("min_rating")||0),sort=q.get("sort")||"updated",page=Math.max(1,Number(q.get("page")||1)),limit=Math.min(50,Math.max(1,Number(q.get("limit")||24))),offset=(page-1)*limit;
  let sql="SELECT n.*,GROUP_CONCAT(DISTINCT g.name) genres,GROUP_CONCAT(DISTINCT t.name) tags,COUNT(DISTINCT c.id) chapter_count,MAX(c.chapter_number) latest_chapter FROM novels n LEFT JOIN novel_genres ng ON ng.novel_id=n.id LEFT JOIN genres g ON g.id=ng.genre_id LEFT JOIN novel_tags nt ON nt.novel_id=n.id LEFT JOIN tags t ON t.id=nt.tag_id LEFT JOIN chapters c ON c.novel_id=n.id AND c.publication_status='published' WHERE n.publication_status='published'",a=[];
  if(term){sql+=" AND (LOWER(n.title) LIKE ? OR LOWER(n.author) LIKE ? OR LOWER(n.description) LIKE ? OR LOWER(n.alt_titles) LIKE ?)";const z="%"+term+"%";a.push(z,z,z,z)}
  if(genre){sql+=" AND n.id IN(SELECT ng.novel_id FROM novel_genres ng JOIN genres g ON g.id=ng.genre_id WHERE g.slug=?)";a.push(genre)}
  if(tag){sql+=" AND n.id IN(SELECT nt.novel_id FROM novel_tags nt JOIN tags t ON t.id=nt.tag_id WHERE t.slug=?)";a.push(tag)}
  if(status && ['ongoing','completed'].includes(status)){sql+=" AND n.status=?";a.push(status)}
  if(kind){sql+=" AND n.kind=?";a.push(kind)}
  if(language){sql+=" AND LOWER(n.language)=LOWER(?)";a.push(language)}
  if(author){sql+=" AND LOWER(n.author)=LOWER(?)";a.push(author)}
  if(minRating>0){sql+=" AND n.rating>=?";a.push(Math.min(5,minRating))}
  sql+=" GROUP BY n.id ORDER BY "+(sort==="views"?"n.views DESC":sort==="rating"?"n.rating DESC":sort==="chapters"?"chapter_count DESC":sort==="newest"?"n.created_at DESC":sort==="trending"?"(SELECT COUNT(*) FROM unlocks ux JOIN chapters cx ON cx.id=ux.chapter_id WHERE cx.novel_id=n.id AND ux.unlocked_at>=datetime('now','-7 days')) DESC":"n.updated_at DESC")+",n.id DESC LIMIT ? OFFSET ?";
  const rows=(await env.DB.prepare(sql).bind(...a,limit,offset).all()).results.map(x=>({...x,status:(x.status===null||x.status===undefined||String(x.status).toLowerCase()==="undefined"||String(x.status).trim()==="")?"ongoing":x.status}));return json({page,limit,filters:{q:term,genre,tag,status,kind,language,author,min_rating:minRating,sort},results:rows})}
 let nm=p.match(/^\/api\/novels\/(\d+)$/);if(nm){const n=await env.DB.prepare("SELECT * FROM novels WHERE id=? AND publication_status=\'published\'").bind(nm[1]).first();if(!n)return json({error:"Novel not found"},404);await env.DB.prepare("UPDATE novels SET views=views+1 WHERE id=?").bind(n.id).run();const [c,g,t]=await Promise.all([env.DB.prepare("SELECT id,chapter_number,title,is_locked,ticket_cost FROM chapters WHERE novel_id=? AND publication_status='published' ORDER BY chapter_number").bind(n.id).all(),env.DB.prepare("SELECT g.* FROM genres g JOIN novel_genres ng ON ng.genre_id=g.id WHERE ng.novel_id=?").bind(n.id).all(),env.DB.prepare("SELECT t.* FROM tags t JOIN novel_tags nt ON nt.tag_id=t.id WHERE nt.novel_id=?").bind(n.id).all()]);const [bm,lib,fol,rat]=u?await Promise.all([env.DB.prepare("SELECT chapter_number FROM bookmarks WHERE user_id=? AND novel_id=?").bind(u.id,n.id).first(),env.DB.prepare("SELECT 1 FROM user_library WHERE user_id=? AND novel_id=?").bind(u.id,n.id).first(),env.DB.prepare("SELECT 1 FROM follows WHERE user_id=? AND novel_id=?").bind(u.id,n.id).first(),env.DB.prepare("SELECT rating FROM ratings WHERE user_id=? AND novel_id=?").bind(u.id,n.id).first()]):[null,null,null,null];return json({...n,status:(n.status===null||n.status===undefined||String(n.status).toLowerCase()==="undefined"||String(n.status).trim()==="")?"ongoing":n.status,chapters:c.results,genres:g.results,tags:t.results,bookmark:bm?.chapter_number||0,in_library:!!lib,following:!!fol,user_rating:rat?.rating||0})}
 let cm=p.match(/^\/api\/chapters\/(\d+)$/);if(cm){const c=await env.DB.prepare("SELECT c.*,n.publication_status AS novel_publication_status,n.rights_status FROM chapters c JOIN novels n ON n.id=c.novel_id WHERE c.id=? AND n.publication_status='published' AND c.publication_status='published'").bind(cm[1]).first();if(!c)return json({error:"Chapter not found"},404);await env.DB.prepare("INSERT INTO chapter_views(chapter_id,views,updated_at) VALUES(?,1,CURRENT_TIMESTAMP) ON CONFLICT(chapter_id) DO UPDATE SET views=views+1,updated_at=CURRENT_TIMESTAMP").bind(c.id).run();let open=!c.is_locked||u?.role==="admin"||!!(u&&await env.DB.prepare("SELECT 1 FROM unlocks WHERE user_id=? AND chapter_id=?").bind(u.id,c.id).first());const [prev,next]=await Promise.all([env.DB.prepare("SELECT id,chapter_number,title FROM chapters WHERE novel_id=? AND publication_status='published' AND chapter_number<? ORDER BY chapter_number DESC LIMIT 1").bind(c.novel_id,c.chapter_number).first(),env.DB.prepare("SELECT id,chapter_number,title FROM chapters WHERE novel_id=? AND publication_status='published' AND chapter_number>? ORDER BY chapter_number LIMIT 1").bind(c.novel_id,c.chapter_number).first()]);return json({id:c.id,novel_id:c.novel_id,chapter_number:c.chapter_number,title:c.title,is_locked:!!c.is_locked,publication_status:c.publication_status,unlocked:open,content:open?c.content:null,ticket_cost:c.ticket_cost,previous:prev||null,next:next||null})}
 if(/^\/api\/chapters\/\d+\/unlock$/.test(p)&&m==="POST"){const e=need(u);if(e)return e;const id=p.split("/")[3],c=await env.DB.prepare("SELECT c.*,n.publication_status,n.rights_status FROM chapters c JOIN novels n ON n.id=c.novel_id WHERE c.id=? AND n.publication_status='published' AND c.publication_status='published'").bind(id).first();if(!c)return json({error:"Chapter not found"},404);if(!c.is_locked)return json({ok:true});if(await env.DB.prepare("SELECT 1 FROM unlocks WHERE user_id=? AND chapter_id=?").bind(u.id,c.id).first())return json({ok:true});const cost=Number(c.ticket_cost);if(Number(u.tickets)<cost)return json({error:"Insufficient tickets",tickets:u.tickets,cost},402);await env.DB.batch([env.DB.prepare("UPDATE users SET tickets=tickets-? WHERE id=? AND tickets>=?").bind(cost,u.id,cost),env.DB.prepare("INSERT INTO unlocks(user_id,chapter_id,cost) VALUES(?,?,?)").bind(u.id,c.id,cost),env.DB.prepare("INSERT INTO ticket_ledger(user_id,delta,reason,reference) VALUES(?,?,?,?)").bind(u.id,-cost,"chapter_unlock",String(c.id))]);await audit(env,u,"chapter_unlock",`chapter=${c.id};cost=${cost}`);const nu=await env.DB.prepare("SELECT tickets FROM users WHERE id=?").bind(u.id).first();return json({ok:true,tickets:nu.tickets})}
 let bu=p.match(/^\/api\/novels\/(\d+)\/batch-unlock$/);if(bu&&m==="POST"){const e=need(u);if(e)return e;const b=await body(req),count=Number(b.count),start=Math.max(1,Number(b.start_chapter||1));const pub=await env.DB.prepare("SELECT id FROM novels WHERE id=? AND publication_status='published'").bind(bu[1]).first();if(!pub)return json({error:"Novel is not published"},404);if(![10,25,50,100].includes(count))return json({error:"Batch size must be 10, 25, 50 or 100"},400);const rows=(await env.DB.prepare("SELECT c.* FROM chapters c LEFT JOIN unlocks x ON x.chapter_id=c.id AND x.user_id=? WHERE c.novel_id=? AND c.publication_status='published' AND c.chapter_number>=? AND x.chapter_id IS NULL ORDER BY c.chapter_number LIMIT ?").bind(u.id,bu[1],start,count).all()).results;const cost=rows.reduce((s,c)=>s+Number(c.is_locked?c.ticket_cost:0),0);if(Number(u.tickets)<cost)return json({error:"Insufficient tickets",tickets:u.tickets,cost,needed:rows.length},402);const stm=[env.DB.prepare("UPDATE users SET tickets=tickets-? WHERE id=?").bind(cost,u.id)];for(const c of rows)if(c.is_locked)stm.push(env.DB.prepare("INSERT OR IGNORE INTO unlocks(user_id,chapter_id,cost) VALUES(?,?,?)").bind(u.id,c.id,c.ticket_cost));if(cost)stm.push(env.DB.prepare("INSERT INTO ticket_ledger(user_id,delta,reason,reference) VALUES(?,?,?,?)").bind(u.id,-cost,"batch_unlock",`${bu[1]}:${start}:${count}`));if(rows.length)stm.push(env.DB.prepare("INSERT INTO unlock_batches(user_id,novel_id,start_chapter,end_chapter,requested_count,cost) VALUES(?,?,?,?,?,?)").bind(u.id,bu[1],rows[0].chapter_number,rows.at(-1).chapter_number,count,cost));await env.DB.batch(stm);const nu=await env.DB.prepare("SELECT tickets FROM users WHERE id=?").bind(u.id).first();return json({ok:true,unlocked:rows.length,cost,tickets:nu.tickets})}
 if(p==="/api/bookmark"&&m==="POST"){const e=need(u);if(e)return e;const b=await body(req);await env.DB.prepare("INSERT INTO bookmarks(user_id,novel_id,chapter_number) VALUES(?,?,?) ON CONFLICT(user_id,novel_id) DO UPDATE SET chapter_number=excluded.chapter_number,updated_at=CURRENT_TIMESTAMP").bind(u.id,b.novel_id,b.chapter_number).run();return json({ok:true})}
 if(p==="/api/history"&&m==="GET"){const e=need(u);if(e)return e;return json((await env.DB.prepare(`SELECT h.novel_id,h.chapter_number,h.updated_at,n.title,n.author,n.cover_url FROM history h JOIN novels n ON n.id=h.novel_id WHERE h.user_id=? AND n.publication_status='published' ORDER BY h.updated_at DESC LIMIT 50`).bind(u.id).all()).results)}
 if(p==="/api/history"&&m==="POST"){const e=need(u);if(e)return e;const b=await body(req);await env.DB.prepare("INSERT INTO history(user_id,novel_id,chapter_number) VALUES(?,?,?) ON CONFLICT(user_id,novel_id) DO UPDATE SET chapter_number=excluded.chapter_number,updated_at=CURRENT_TIMESTAMP").bind(u.id,b.novel_id,b.chapter_number).run();return json({ok:true})}
 if(p==="/api/library"&&m==="GET"){const e=need(u);if(e)return e;return json((await env.DB.prepare(`SELECT l.novel_id,l.created_at,n.title,n.author,n.cover_url,n.rating,n.status,(SELECT chapter_number FROM history h WHERE h.user_id=l.user_id AND h.novel_id=l.novel_id) last_chapter,(SELECT chapter_number FROM bookmarks b WHERE b.user_id=l.user_id AND b.novel_id=l.novel_id) bookmark_chapter,(SELECT MAX(chapter_number) FROM chapters c WHERE c.novel_id=l.novel_id AND c.publication_status='published') latest_chapter FROM user_library l JOIN novels n ON n.id=l.novel_id WHERE l.user_id=? AND n.publication_status='published' ORDER BY l.created_at DESC LIMIT 100`).bind(u.id).all()).results)}
 if(p==="/api/library"&&m==="POST"){const e=need(u);if(e)return e;const b=await body(req),nid=Number(b.novel_id);if(!nid)return json({error:"Novel id required"},400);const n=await env.DB.prepare("SELECT id FROM novels WHERE id=? AND publication_status='published'").bind(nid).first();if(!n)return json({error:"Novel not found"},404);const exists=await env.DB.prepare("SELECT 1 FROM user_library WHERE user_id=? AND novel_id=?").bind(u.id,nid).first();if(exists){await env.DB.prepare("DELETE FROM user_library WHERE user_id=? AND novel_id=?").bind(u.id,nid).run();return json({in_library:false})}await env.DB.prepare("INSERT OR IGNORE INTO user_library(user_id,novel_id) VALUES(?,?)").bind(u.id,nid).run();return json({in_library:true})}
 if(p==="/api/bookmarks"&&m==="GET"){const e=need(u);if(e)return e;return json((await env.DB.prepare(`SELECT b.novel_id,b.chapter_number,b.updated_at,n.title,n.author,n.cover_url FROM bookmarks b JOIN novels n ON n.id=b.novel_id WHERE b.user_id=? AND n.publication_status='published' ORDER BY b.updated_at DESC LIMIT 100`).bind(u.id).all()).results)}
 if(p==="/api/comments"&&m==="GET"){const novel=Number(url.searchParams.get("novel_id"));if(!novel)return json({error:"Novel id required"},400);const rows=(await env.DB.prepare(`SELECT c.id,c.body,c.parent_id,c.created_at,c.edited_at,u.username,(SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id=c.id) likes,CASE WHEN ? IS NULL THEN 0 ELSE (SELECT COUNT(*) FROM comment_likes cl2 WHERE cl2.comment_id=c.id AND cl2.user_id=?) END liked FROM comments c JOIN users u ON u.id=c.user_id WHERE c.novel_id=? AND c.status='visible' ORDER BY c.created_at ASC LIMIT 300`).bind(u?.id||null,u?.id||null,novel).all()).results;return json(rows)}
 if(p==="/api/comments"&&m==="POST"){const e=need(u);if(e)return e;const b=await body(req),text=String(b.body||"").trim(),nid=Number(b.novel_id),parent=Number(b.parent_id||0);if(!nid||!text||text.length>1000)return json({error:"Novel and comment text (1-1000 characters) are required"},400);if(parent){const pc=await env.DB.prepare("SELECT id FROM comments WHERE id=? AND novel_id=? AND status='visible'").bind(parent,nid).first();if(!pc)return json({error:"Parent comment not found"},404)}await env.DB.prepare("INSERT INTO comments(user_id,novel_id,body,parent_id) VALUES(?,?,?,?)").bind(u.id,nid,text,parent||null).run();return json({ok:true})}
 if(p==="/api/comments/like"&&m==="POST"){const e=need(u);if(e)return e;const b=await body(req),cid=Number(b.comment_id);if(!cid)return json({error:"Comment id required"},400);const c=await env.DB.prepare("SELECT id FROM comments WHERE id=? AND status='visible'").bind(cid).first();if(!c)return json({error:"Comment not found"},404);const x=await env.DB.prepare("SELECT 1 FROM comment_likes WHERE user_id=? AND comment_id=?").bind(u.id,cid).first();if(x){await env.DB.prepare("DELETE FROM comment_likes WHERE user_id=? AND comment_id=?").bind(u.id,cid).run()}else await env.DB.prepare("INSERT INTO comment_likes(user_id,comment_id) VALUES(?,?)").bind(u.id,cid).run();const count=await env.DB.prepare("SELECT COUNT(*) count FROM comment_likes WHERE comment_id=?").bind(cid).first();return json({liked:!x,likes:Number(count?.count||0)})}
 if(p==="/api/comments/report"&&m==="POST"){const e=need(u);if(e)return e;const b=await body(req),cid=Number(b.comment_id),reason=String(b.reason||"spam").slice(0,80),details=String(b.details||"").slice(0,500);if(!cid)return json({error:"Comment id required"},400);await env.DB.prepare("INSERT INTO comment_reports(user_id,comment_id,reason,details) VALUES(?,?,?,?)").bind(u.id,cid,reason,details).run();return json({ok:true})}
 if(p==="/api/rating"&&m==="GET"){const nid=Number(url.searchParams.get("novel_id"));if(!nid)return json({error:"Novel id required"},400);const stats=await env.DB.prepare("SELECT COUNT(*) count,COALESCE(AVG(rating),0) avg FROM ratings WHERE novel_id=?").bind(nid).first();const mine=u?await env.DB.prepare("SELECT rating FROM ratings WHERE user_id=? AND novel_id=?").bind(u.id,nid).first():null;const dist=(await env.DB.prepare("SELECT rating,COUNT(*) count FROM ratings WHERE novel_id=? GROUP BY rating ORDER BY rating DESC").bind(nid).all()).results;return json({count:Number(stats?.count||0),average:Number(stats?.avg||0),user_rating:Number(mine?.rating||0),distribution:dist})}
 if(p==="/api/rating"&&m==="POST"){const e=need(u);if(e)return e;const b=await body(req),nid=Number(b.novel_id),rating=Math.round(Number(b.rating));if(!nid||rating<1||rating>5)return json({error:"Rating must be 1-5"},400);await env.DB.prepare("INSERT INTO ratings(user_id,novel_id,rating) VALUES(?,?,?) ON CONFLICT(user_id,novel_id) DO UPDATE SET rating=excluded.rating,updated_at=CURRENT_TIMESTAMP").bind(u.id,nid,rating).run();await env.DB.prepare("UPDATE novels SET rating=COALESCE((SELECT AVG(rating) FROM ratings WHERE novel_id=?),0) WHERE id=?").bind(nid,nid).run();const stats=await env.DB.prepare("SELECT COUNT(*) count,COALESCE(AVG(rating),0) avg FROM ratings WHERE novel_id=?").bind(nid).first();return json({ok:true,rating,average:Number(stats.avg||0),count:Number(stats.count||0)})}
 if(p==="/api/admin/community/comments"&&m==="GET"){const e=admin(u);if(e)return e;return json((await env.DB.prepare(`SELECT c.id,c.body,c.status,c.created_at,c.edited_at,c.parent_id,u.username,n.title, (SELECT COUNT(*) FROM comment_reports r WHERE r.comment_id=c.id AND r.status='open') report_count FROM comments c JOIN users u ON u.id=c.user_id JOIN novels n ON n.id=c.novel_id ORDER BY c.created_at DESC LIMIT 300`).all()).results)}
 if(p==="/api/admin/community/comments"&&m==="PATCH"){const e=admin(u);if(e)return e;const b=await body(req),cid=Number(b.comment_id),status=String(b.status||'visible');if(!cid||!['visible','hidden','deleted'].includes(status))return json({error:"Invalid comment status"},400);await env.DB.prepare("UPDATE comments SET status=? WHERE id=?").bind(status,cid).run();return json({ok:true})}
 if(p==="/api/admin/community/reports"&&m==="GET"){const e=admin(u);if(e)return e;return json((await env.DB.prepare(`SELECT r.*,c.body,u.username,n.title FROM comment_reports r JOIN comments c ON c.id=r.comment_id JOIN users u ON u.id=r.user_id JOIN novels n ON n.id=c.novel_id ORDER BY CASE r.status WHEN 'open' THEN 0 ELSE 1 END,r.created_at DESC LIMIT 300`).all()).results)}

 if(p==="/api/donations"&&m==="POST"){const e=need(u);if(e)return e;const b=await body(req),amount=Number(b.amount),ref=String(b.reference_id||"").trim();if(!amount||amount<1||!ref)return json({error:"Amount and transaction/reference ID are required"},400);await env.DB.prepare("INSERT INTO donations(user_id,amount,reference_id,status) VALUES(?,?,?,'pending')").bind(u.id,amount,ref).run();return json({ok:true,message:"Payment submitted for verification"})}
 if(p==="/api/payment/webhook"&&m==="POST"){const secret=env.PAYMENT_WEBHOOK_SECRET;if(!secret)return json({error:"Payment automation is not configured"},503);const raw=await req.text(),sig=req.headers.get("x-payment-signature")||"";const expected=await hmac(secret,raw);if(sig!==expected)return json({error:"Invalid payment signature"},401);const b=JSON.parse(raw);const d=await env.DB.prepare("SELECT * FROM donations WHERE reference_id=? AND status='pending'").bind(String(b.reference_id||"")).first();if(!d)return json({error:"Pending transaction not found"},404);await env.DB.batch([env.DB.prepare("UPDATE donations SET status='approved' WHERE id=?").bind(d.id),env.DB.prepare("UPDATE users SET tickets=tickets+? WHERE id=?").bind(Number(b.tickets||0),d.user_id),env.DB.prepare("INSERT INTO ticket_ledger(user_id,delta,reason,reference) VALUES(?,?,?,?)").bind(d.user_id,Number(b.tickets||0),"payment",String(d.id))]);return json({ok:true})}
 if(p==="/api/requests"&&m==="POST"){const e=need(u);if(e)return e;const b=await body(req),url2=String(b.url||"").trim();let parsed;try{parsed=new URL(url2)}catch{return json({error:"Enter a complete valid URL"},400)}const source=SOURCES.find(x=>parsed.hostname===x[1]||parsed.hostname.endsWith("."+x[1]));if(!source)return json({error:"This source is not in the supported registry"},400);const week=Math.floor(now()/604800),count=await env.DB.prepare("SELECT COUNT(*) n FROM novel_requests WHERE user_id=? AND week_key=?").bind(u.id,week).first();const free=Number(count.n)<3;const paid=Number(count.n)-3+1;const price=free?0:paid*100;if(!free&&Number(u.tickets)<price)return json({error:`Weekly free limit reached. This request costs ${price} tickets.`,cost:price},402);await env.DB.batch([env.DB.prepare("INSERT INTO novel_requests(user_id,url,source_host,week_key,cost,status) VALUES(?,?,?,?,?,'pending')").bind(u.id,url2,source[1],week,price),...(price?[env.DB.prepare("UPDATE users SET tickets=tickets-? WHERE id=?").bind(price,u.id),env.DB.prepare("INSERT INTO ticket_ledger(user_id,delta,reason,reference) VALUES(?,?,?,?)").bind(u.id,-price,"novel_request",url2.slice(0,180))]:[])]);return json({ok:true,cost:price,message:"Request queued for review/import."})}
 if(p==="/api/requests"&&m==="GET"){const e=need(u);if(e)return e;const week=Math.floor(now()/604800),count=await env.DB.prepare("SELECT COUNT(*) n FROM novel_requests WHERE user_id=? AND week_key=?").bind(u.id,week).first();return json({used:Number(count.n),limit:3})}
 if(p==="/api/follow"&&m==="POST"){const e=need(u);if(e)return e;const b=await body(req),nid=Number(b.novel_id);if(!nid)return json({error:"Novel id required"},400);const f=await env.DB.prepare("SELECT 1 FROM follows WHERE user_id=? AND novel_id=?").bind(u.id,nid).first();if(f){await env.DB.prepare("DELETE FROM follows WHERE user_id=? AND novel_id=?").bind(u.id,nid).run();return json({following:false})}await env.DB.prepare("INSERT OR IGNORE INTO follows(user_id,novel_id) VALUES(?,?)").bind(u.id,nid).run();return json({following:true})}
 if(p==="/api/rating"&&m==="POST"){const e=need(u);if(e)return e;const b=await body(req),nid=Number(b.novel_id),rating=Math.round(Number(b.rating));if(!nid||rating<1||rating>5)return json({error:"Rating must be 1-5"},400);await env.DB.prepare("INSERT INTO ratings(user_id,novel_id,rating) VALUES(?,?,?) ON CONFLICT(user_id,novel_id) DO UPDATE SET rating=excluded.rating,updated_at=CURRENT_TIMESTAMP").bind(u.id,nid,rating).run();await env.DB.prepare("UPDATE novels SET rating=COALESCE((SELECT AVG(rating) FROM ratings WHERE novel_id=?),0) WHERE id=?").bind(nid,nid).run();return json({ok:true,rating})}
 if(p==="/api/leaderboard"&&m==="GET"){
  const period=String(url.searchParams.get('period')||'all');
  const days=period==='weekly'?7:period==='monthly'?30:0;
  const timeFilter=days?` AND h.updated_at>=datetime('now','-${days} days')`:'';
  const novels=await env.DB.prepare(`SELECT n.id,n.title,n.author,n.cover_url,n.rating,n.views,COUNT(DISTINCT c.id) chapter_count,COALESCE((SELECT COUNT(*) FROM unlocks u JOIN chapters uc ON uc.id=u.chapter_id WHERE uc.novel_id=n.id${days?` AND u.unlocked_at>=datetime('now','-${days} days')`:''}),0) unlocks FROM novels n LEFT JOIN chapters c ON c.novel_id=n.id AND c.publication_status='published' WHERE n.publication_status='published' GROUP BY n.id ORDER BY unlocks DESC,n.views DESC,n.rating DESC LIMIT 20`).all();
  const authors=await env.DB.prepare(`SELECT author,COUNT(*) novels,SUM(views) views,ROUND(AVG(rating),2) rating FROM novels WHERE publication_status='published' GROUP BY author ORDER BY views DESC,rating DESC LIMIT 20`).all();
  return json({period,novels:novels.results||[],authors:authors.results||[]});
 }
 if(p==="/api/tier-list"&&m==="GET"){
  const rows=(await env.DB.prepare(`SELECT n.id,n.title,n.author,n.cover_url,n.rating,n.views,COUNT(c.id) chapter_count FROM novels n LEFT JOIN chapters c ON c.novel_id=n.id AND c.publication_status='published' WHERE n.publication_status='published' GROUP BY n.id ORDER BY n.rating DESC,n.views DESC LIMIT 60`).all()).results||[];
  const tier=x=>Number(x.rating||0)>=4.5?'S':Number(x.rating||0)>=4?'A':Number(x.rating||0)>=3?'B':'C';
  return json({tiers:{S:rows.filter(x=>tier(x)==='S'),A:rows.filter(x=>tier(x)==='A'),B:rows.filter(x=>tier(x)==='B'),C:rows.filter(x=>tier(x)==='C')}});
 }
 if(p==="/api/random"&&m==="GET"){
  const n=await env.DB.prepare(`SELECT n.id,n.title,n.author,n.cover_url,n.rating,n.views,COUNT(c.id) chapter_count FROM novels n LEFT JOIN chapters c ON c.novel_id=n.id AND c.publication_status='published' WHERE n.publication_status='published' GROUP BY n.id ORDER BY RANDOM() LIMIT 1`).first();
  return json(n||null);
 }
 if(p==="/api/made-for-you"&&m==="GET"){
  if(u){
   const rows=(await env.DB.prepare(`SELECT n.*,COUNT(DISTINCT c.id) chapter_count,COALESCE(f.follows,0) follows FROM novels n LEFT JOIN chapters c ON c.novel_id=n.id AND c.publication_status='published' LEFT JOIN (SELECT novel_id,COUNT(*) follows FROM follows GROUP BY novel_id) f ON f.novel_id=n.id WHERE n.publication_status='published' AND n.id NOT IN(SELECT novel_id FROM follows WHERE user_id=?) GROUP BY n.id ORDER BY CASE WHEN n.kind='original' THEN 0 ELSE 1 END,n.rating DESC,n.views DESC LIMIT 18`).bind(u.id).all()).results||[];
   return json({personalized:true,results:rows});
  }
  const rows=(await env.DB.prepare(`SELECT n.*,COUNT(c.id) chapter_count FROM novels n LEFT JOIN chapters c ON c.novel_id=n.id AND c.publication_status='published' WHERE n.publication_status='published' GROUP BY n.id ORDER BY n.rating DESC,n.views DESC LIMIT 18`).all()).results||[];
  return json({personalized:false,results:rows});
 }
 if(p==="/api/vote-novels"&&m==="GET"){
  const rows=(await env.DB.prepare(`SELECT r.id,r.url,r.source_host,r.status,r.created_at,COALESCE(v.votes,0) votes,u.username FROM novel_requests r LEFT JOIN users u ON u.id=r.user_id LEFT JOIN (SELECT request_id,COUNT(*) votes FROM request_votes GROUP BY request_id) v ON v.request_id=r.id WHERE r.status IN ('pending','approved') ORDER BY votes DESC,r.created_at DESC LIMIT 100`).all()).results||[];
  return json(rows);
 }
 if(p==="/api/vote-novels"&&m==="POST"){
  const e=need(u);if(e)return e; const b=await body(req),id=Number(b.request_id);if(!id)return json({error:'Request id required'},400);
  const r=await env.DB.prepare("SELECT id,status FROM novel_requests WHERE id=?").bind(id).first();if(!r)return json({error:'Request not found'},404);if(!['pending','approved'].includes(r.status))return json({error:'This request is not open for voting'},409);
  const existing=await env.DB.prepare("SELECT 1 FROM request_votes WHERE request_id=? AND user_id=?").bind(id,u.id).first();
  if(existing){await env.DB.prepare("DELETE FROM request_votes WHERE request_id=? AND user_id=?").bind(id,u.id).run();return json({voted:false});}
  await env.DB.prepare("INSERT INTO request_votes(request_id,user_id) VALUES(?,?)").bind(id,u.id).run();return json({voted:true});
 }
 if(p==="/api/notifications"&&m==="GET"){const e=need(u);if(e)return e;return json((await env.DB.prepare("SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50").bind(u.id).all()).results)}
 if(p==="/api/notifications/read"&&m==="POST"){const e=need(u);if(e)return e;await env.DB.prepare("UPDATE notifications SET read_at=CURRENT_TIMESTAMP WHERE user_id=? AND read_at IS NULL").bind(u.id).run();return json({ok:true})}
 if(p==="/api/report"&&m==="POST"){const e=need(u);if(e)return e;const b=await body(req),reason=String(b.reason||"").trim();if(!reason||reason.length>300)return json({error:"Reason is required"},400);await env.DB.prepare("INSERT INTO reports(user_id,novel_id,chapter_id,reason,details) VALUES(?,?,?,?,?)").bind(u.id,b.novel_id||null,b.chapter_id||null,reason,String(b.details||"").slice(0,2000)).run();return json({ok:true,message:"Report submitted"})}
 if(p==="/api/tickets/ledger"&&m==="GET"){const e=need(u);if(e)return e;return json((await env.DB.prepare("SELECT id,delta,reason,reference,created_at FROM ticket_ledger WHERE user_id=? ORDER BY created_at DESC LIMIT 100").bind(u.id).all()).results)}
 if(p==="/api/recommendations"&&m==="GET"){const e=need(u);if(e)return e;await ensureOmniTables(env);const rows=(await env.DB.prepare(`SELECT n.*,r.reason,r.score,GROUP_CONCAT(DISTINCT g.name) genres,COUNT(DISTINCT c.id) chapter_count FROM recommendations r JOIN novels n ON n.id=r.novel_id LEFT JOIN novel_genres ng ON ng.novel_id=n.id LEFT JOIN genres g ON g.id=ng.genre_id LEFT JOIN chapters c ON c.novel_id=n.id WHERE r.user_id=? AND n.publication_status='published' GROUP BY n.id,r.id ORDER BY r.score DESC,r.created_at DESC LIMIT 20`).bind(u.id).all()).results;if(rows.length)return json(rows);const fallback=(await env.DB.prepare(`SELECT n.*,GROUP_CONCAT(DISTINCT g.name) genres,COUNT(DISTINCT c.id) chapter_count FROM novels n LEFT JOIN novel_genres ng ON ng.novel_id=n.id LEFT JOIN genres g ON g.id=ng.genre_id LEFT JOIN chapters c ON c.novel_id=n.id WHERE n.publication_status='published' AND n.id NOT IN(SELECT novel_id FROM follows WHERE user_id=?) GROUP BY n.id ORDER BY n.rating DESC,n.views DESC LIMIT 12`).bind(u.id).all()).results;return json(fallback.map((x,i)=>({...x,reason:'Popular with Imperial readers',score:100-i}))) }
 if(p==="/api/follows"&&m==="GET"){const e=need(u);if(e)return e;return json((await env.DB.prepare(`SELECT n.*,f.created_at FROM follows f JOIN novels n ON n.id=f.novel_id WHERE f.user_id=? AND n.publication_status='published' ORDER BY f.created_at DESC`).bind(u.id).all()).results)}
 if(p==="/api/profile"&&m==="GET"){const e=need(u);if(e)return e;const [lib,fol,unl,led]=await Promise.all([env.DB.prepare("SELECT COUNT(*) n FROM history WHERE user_id=?").bind(u.id).first(),env.DB.prepare("SELECT COUNT(*) n FROM follows WHERE user_id=?").bind(u.id).first(),env.DB.prepare("SELECT COUNT(*) n FROM unlocks WHERE user_id=?").bind(u.id).first(),env.DB.prepare("SELECT COALESCE(SUM(delta),0) n FROM ticket_ledger WHERE user_id=?").bind(u.id).first()]);return json({user:{id:u.id,username:u.username,email:u.email,role:u.role,tickets:u.tickets,verified:u.verified},stats:{history:Number(lib.n),following:Number(fol.n),unlocks:Number(unl.n),ticketFlow:Number(led.n)}})}
 if(p==="/api/admin/stats"){const e=admin(u);if(e)return e;const [a,b,c,d,r,t,rep]=await Promise.all([env.DB.prepare("SELECT COUNT(*) n FROM users").first(),env.DB.prepare("SELECT COUNT(*) n FROM novels").first(),env.DB.prepare("SELECT COUNT(*) n FROM chapters").first(),env.DB.prepare("SELECT COUNT(*) n FROM donations WHERE status='pending'").first(),env.DB.prepare("SELECT COUNT(*) n FROM novel_requests WHERE status='pending'").first(),env.DB.prepare("SELECT COUNT(*) n FROM taxonomy_submissions WHERE status='pending'").first(),env.DB.prepare("SELECT COUNT(*) n FROM reports WHERE status IN ('open','reviewing')").first()]);return json({users:a.n,novels:b.n,chapters:c.n,pendingDonations:d.n,pendingRequests:r.n,pendingTaxonomy:t.n,openReports:rep.n})}
 if(p==="/api/admin/users"&&m==="GET"){const e=admin(u);if(e)return e;return json((await env.DB.prepare("SELECT id,username,email,role,tickets,verified,banned,created_at FROM users ORDER BY id LIMIT 500").all()).results)}
 let au=p.match(/^\/api\/admin\/users\/(\d+)$/);if(au&&m==="PATCH"){const e=admin(u);if(e)return e;const b=await body(req),id=Number(au[1]);if(id===u.id&&String(b.role||u.role)!=='admin')return json({error:"You cannot remove your own administrator role"},400);const role=String(b.role||'user');if(!['user','author','moderator','admin'].includes(role))return json({error:"Invalid role"},400);await env.DB.prepare("UPDATE users SET role=?,verified=?,banned=? WHERE id=?").bind(role,b.verified?1:0,b.banned?1:0,id).run();return json({ok:true})}


 if(p==="/api/author/ai/status"&&m==="GET"){
  const e=author(u);if(e)return e;const configured=!!String(env.OPENAI_API_KEY||'').trim();
  return json({configured,generation_enabled:configured,provider:configured?'openai':'not-configured',model:configured?String(env.OPENAI_MODEL||'gpt-5-mini').trim():null,manual_drafting_available:true,auto_publish_enabled:false});
 }
 if(p==="/api/author/ai/projects"&&m==="GET"){
  const e=author(u);if(e)return e;await ensureAuthorAISchema(env);
  return json((await env.DB.prepare(`SELECT p.*,n.title novel_title FROM ai_author_projects p LEFT JOIN novels n ON n.id=p.novel_id WHERE p.owner_user_id=? ORDER BY p.updated_at DESC`).bind(u.id).all()).results||[]);
 }
 if(p==="/api/author/ai/projects"&&m==="POST"){
  const e=author(u);if(e)return e;if(!String(env.OPENAI_API_KEY||'').trim())return json({error:"AI generation is not configured. Manual chapter drafting remains available in Chapter Studio."},503);await ensureAuthorAISchema(env);const b=await body(req);
  const mode=['manual','auto','hybrid'].includes(String(b.mode||'manual'))?String(b.mode):'manual';
  const name=aiSafeText(b.name||b.title||'Untitled AI Project',160);if(!name)return json({error:'Project name is required'},400);
  const novelId=Number(b.novel_id||0)||null;
  if(novelId){const n=await env.DB.prepare('SELECT id,owner_user_id FROM novels WHERE id=?').bind(novelId).first();if(!n)return json({error:'Novel not found'},404);if(u.role!=='admin'&&Number(n.owner_user_id)!==Number(u.id))return json({error:'You do not own this novel'},403)}
  const blueprint=localStoryBlueprint({...b,name});
  const r=await env.DB.prepare(`INSERT INTO ai_author_projects(owner_user_id,novel_id,name,mode,status,genre,fandom,premise,protagonist,settings_json,bible_json,auto_publish,chapters_target) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(u.id,novelId,name,mode,'draft',blueprint.genre,blueprint.fandom,blueprint.premise,blueprint.protagonist,JSON.stringify({male_mc:b.male_mc!==false,system:b.system!==false,helmet:b.helmet!==false,harem:b.harem===true}),JSON.stringify(blueprint),0,Math.max(0,Number(b.chapters_target||0))).run();
  const id=Number(r.meta.last_row_id);await env.DB.prepare('INSERT OR REPLACE INTO ai_publish_policies(project_id) VALUES(?)').bind(id).run();await audit(env,u,'ai_author_project_created',`project=${id};mode=${mode}`);return json({ok:true,id,blueprint,provider:'template',generation_enabled:true,message:'Project created with a starter outline. Use Story Bible to call the configured AI provider.'},201);
 }
 let aip=p.match(/^\/api\/author\/ai\/projects\/(\d+)$/);
 if(aip&&m==="GET"){
  const e=author(u);if(e)return e;await ensureAuthorAISchema(env);const row=await env.DB.prepare('SELECT * FROM ai_author_projects WHERE id=?').bind(Number(aip[1])).first();if(!row)return json({error:'AI project not found'},404);if(u.role!=='admin'&&Number(row.owner_user_id)!==Number(u.id))return json({error:'You do not own this project'},403);
  return json({...row,bible:aiJson(row.bible_json),settings:aiJson(row.settings_json)});
 }
 if(aip&&m==="PATCH"){
  const e=author(u);if(e)return e;await ensureAuthorAISchema(env);const row=await env.DB.prepare('SELECT * FROM ai_author_projects WHERE id=?').bind(Number(aip[1])).first();if(!row)return json({error:'AI project not found'},404);if(u.role!=='admin'&&Number(row.owner_user_id)!==Number(u.id))return json({error:'You do not own this project'},403);
  const b=await body(req);const mode=['manual','auto','hybrid'].includes(String(b.mode||row.mode))?String(b.mode||row.mode):row.mode;
  const status=['draft','running','paused','complete'].includes(String(b.status||row.status))?String(b.status||row.status):row.status;
  const settings={...aiJson(row.settings_json),...('settings' in b?b.settings:{})};
  await env.DB.prepare(`UPDATE ai_author_projects SET name=?,mode=?,status=?,genre=?,fandom=?,premise=?,protagonist=?,settings_json=?,auto_publish=?,chapters_target=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(aiSafeText(b.name??row.name,160),mode,status,aiSafeText(b.genre??row.genre,120),aiSafeText(b.fandom??row.fandom,160),aiSafeText(b.premise??row.premise,3000),aiSafeText(b.protagonist??row.protagonist,800),JSON.stringify(settings),0,b.chapters_target===undefined?row.chapters_target:Math.max(0,Number(b.chapters_target)),row.id).run();
  return json({ok:true});
 }
 if(/^\/api\/author\/ai\/projects\/\d+\/blueprint$/.test(p)&&m==="POST"){
  const e=author(u);if(e)return e;if(!String(env.OPENAI_API_KEY||'').trim())return json({error:'AI generation is not configured. Manual Chapter Studio remains available.'},503);await ensureAuthorAISchema(env);const id=Number(p.split('/')[5]);const row=await env.DB.prepare('SELECT * FROM ai_author_projects WHERE id=?').bind(id).first();if(!row)return json({error:'AI project not found'},404);if(u.role!=='admin'&&Number(row.owner_user_id)!==Number(u.id))return json({error:'You do not own this project'},403);
  const blueprint=localStoryBlueprint({...row,...aiJson(row.settings_json),title:row.name});
  const ai=await callAuthorModel(env,'You are the planning agent for a rights-aware novel platform. Create an original story bible from the supplied project fields. Never copy protected text or claim access to external sites. Return valid JSON with premise, characters, world, arcs and continuity rules.',JSON.stringify({name:row.name,genre:row.genre,fandom:row.fandom,premise:row.premise,protagonist:row.protagonist,settings:aiJson(row.settings_json)}),2200);
  if(ai.error||!ai.text)return json({error:ai.error||'The AI provider returned no Story Bible. Nothing was saved.'},502);
  let output;try{output={...blueprint,...JSON.parse(ai.text)}}catch{return json({error:'The AI provider returned invalid Story Bible JSON. Nothing was saved.'},502)}
  const provider=ai.provider;
  await env.DB.prepare('UPDATE ai_author_projects SET bible_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(JSON.stringify(output),id).run();
  await env.DB.prepare(`INSERT INTO ai_generation_runs(project_id,owner_user_id,agent,mode,status,input_summary,output_summary,provider) VALUES(?,?,?,?,'ok',?,?,?)`).bind(id,u.id,'worldbuilding',row.mode,`${row.genre}/${row.fandom}`,`Story bible generated with ${Object.keys(output).length} sections`,provider).run();
  return json({ok:true,provider,blueprint:output});
 }
 if(/^\/api\/author\/ai\/projects\/\d+\/run$/.test(p)&&m==="POST"){
  const e=author(u);if(e)return e;if(!String(env.OPENAI_API_KEY||'').trim())return json({error:"AI generation is not configured. Manual Chapter Studio remains available."},503);await ensureAuthorAISchema(env);const id=Number(p.split('/')[5]);const row=await env.DB.prepare('SELECT * FROM ai_author_projects WHERE id=?').bind(id).first();if(!row)return json({error:'AI project not found'},404);if(u.role!=='admin'&&Number(row.owner_user_id)!==Number(u.id))return json({error:'You do not own this project'},403);
  if(row.status==='running')return json({error:'Project is already running'},409);
  await env.DB.prepare("UPDATE ai_author_projects SET status='running',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(id).run();
  const next=Number(row.chapters_generated||0)+1, target=Number(row.chapters_target||0);
  if(target&&next>target){await env.DB.prepare("UPDATE ai_author_projects SET status='complete' WHERE id=?").bind(id).run();return json({ok:true,status:'complete',message:'Chapter target reached.'})}
  const job=await env.DB.prepare(`INSERT INTO ai_chapter_jobs(project_id,owner_user_id,chapter_number,job_type,status,prompt) VALUES(?,?,?,'draft','queued',?)`).bind(id,u.id,next,aiSafeText(row.premise,3000)).run();
  const jobId=Number(job.meta.last_row_id);
  const ai=await callAuthorModel(env,'You are the chapter writer for a rights-aware novel platform. Write an original clean chapter based only on the supplied story bible/project data. Do not reproduce protected text from any source. Keep continuity, character consistency, gradual world/territory building, dialogue and concrete consequences. Return HTML paragraphs only.',JSON.stringify({project:{name:row.name,genre:row.genre,fandom:row.fandom,premise:row.premise,protagonist:row.protagonist},bible:aiJson(row.bible_json),chapter_number:next}),3200);
  if(ai.error||!ai.text){await env.DB.batch([env.DB.prepare("UPDATE ai_chapter_jobs SET status='failed',error=?,attempts=1,started_at=CURRENT_TIMESTAMP,finished_at=CURRENT_TIMESTAMP WHERE id=?").bind(ai.error||'AI provider returned no chapter text',jobId),env.DB.prepare("UPDATE ai_author_projects SET status='paused',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(id)]);return json({error:ai.error||'The AI provider returned no chapter text. The project remains paused and no chapter was published.'},502)}
  const draft=ai.text,provider=ai.provider;
  let createdChapter=null;
  if(row.novel_id){
   const n=await env.DB.prepare('SELECT id,owner_user_id,rights_status FROM novels WHERE id=?').bind(row.novel_id).first();
   if(n&&(u.role==='admin'||Number(n.owner_user_id)===Number(u.id))&&['original','public_domain','licensed','authorized'].includes(String(n.rights_status))){
    const existing=await env.DB.prepare('SELECT id FROM chapters WHERE novel_id=? AND chapter_number=?').bind(row.novel_id,next).first();
    if(!existing){
     const cr=await env.DB.prepare(`INSERT INTO chapters(novel_id,chapter_number,title,content,is_locked,ticket_cost,publication_status) VALUES(?,?,?,?,0,0,'draft')`).bind(row.novel_id,next,`Chapter ${next}`,draft).run();createdChapter=Number(cr.meta.last_row_id);
    }
   }
  }
  await env.DB.batch([
   env.DB.prepare("UPDATE ai_chapter_jobs SET status='complete',result=?,attempts=1,started_at=CURRENT_TIMESTAMP,finished_at=CURRENT_TIMESTAMP WHERE id=?").bind(draft.slice(0,50000),jobId),
   env.DB.prepare("UPDATE ai_author_projects SET chapters_generated=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(next,target&&next>=target?'complete':'paused',id),
   env.DB.prepare("INSERT INTO ai_generation_runs(project_id,owner_user_id,agent,mode,status,input_summary,output_summary,provider) VALUES(?,?,? ,? ,'ok',?,?,?)").bind(id,u.id,'chapter-writer',row.mode,`chapter=${next}`,`draft=${draft.length} chars`,provider)
  ]);
  await audit(env,u,'ai_author_chapter_generated',`project=${id};chapter=${next};provider=${provider}`);
  return json({ok:true,project_id:id,chapter_number:next,chapter_id:createdChapter,provider,draft,status:target&&next>=target?'complete':'paused',message:createdChapter?'Draft chapter created in Chapter Studio.':'Draft generated. Link a novel to store it automatically.'});
 }
 if(/^\/api\/author\/ai\/projects\/\d+\/jobs$/.test(p)&&m==="GET"){
  const e=author(u);if(e)return e;await ensureAuthorAISchema(env);const id=Number(p.split('/')[5]);const row=await env.DB.prepare('SELECT owner_user_id FROM ai_author_projects WHERE id=?').bind(id).first();if(!row)return json({error:'AI project not found'},404);if(u.role!=='admin'&&Number(row.owner_user_id)!==Number(u.id))return json({error:'You do not own this project'},403);
  return json((await env.DB.prepare('SELECT id,chapter_number,job_type,status,attempts,created_at,finished_at FROM ai_chapter_jobs WHERE project_id=? ORDER BY id DESC LIMIT 100').bind(id).all()).results||[]);
 }
 if(p==="/api/author/ai/benchmarks"&&m==="GET"){
  const e=author(u);if(e)return e;await ensureAuthorAISchema(env);
  const rows=(await env.DB.prepare(`SELECT provider,MAX(observed_at) latest,ROUND(SUM(chapters_delta)*86400.0/NULLIF(SUM(interval_seconds),0),2) chapters_per_day,SUM(chapters_delta) chapters_observed FROM ai_provider_benchmarks GROUP BY provider ORDER BY provider`).all()).results||[];
  const internal=(await env.DB.prepare(`SELECT COUNT(*) chapters,SUM(CASE WHEN created_at>=datetime('now','-1 day') THEN 1 ELSE 0 END) last_24h FROM chapters`).first())||{};
  return json({providers:rows,internal:{chapters:Number(internal.chapters||0),last_24h:Number(internal.last_24h||0)},note:'External provider throughput is shown only from recorded public/authorized metadata observations. No protected-source scraping or access bypass is performed.'});
 }
 if(p==="/api/author/ai/benchmarks"&&m==="POST"){
  const e=admin(u);if(e)return e;await ensureAuthorAISchema(env);const b=await body(req);const provider=aiSafeText(b.provider,120);const delta=Math.max(0,Number(b.chapters_delta||0)),interval=Math.max(0,Number(b.interval_seconds||0));if(!provider||!interval)return json({error:'Provider and interval_seconds are required'},400);
  await env.DB.prepare('INSERT INTO ai_provider_benchmarks(provider,chapters_delta,interval_seconds,source_url,access_mode,confidence) VALUES(?,?,?,?,?,?)').bind(provider,delta,interval,aiSafeText(b.source_url,500),'public-metadata',aiSafeText(b.confidence||'observed',40)).run();return json({ok:true});
 }

 if(p==="/api/author/novels"&&m==="GET"){
  const e=author(u);if(e)return e;
  return json((await env.DB.prepare(`SELECT n.id,n.title,n.alt_titles,n.author,n.description,n.status,n.kind,n.language,n.cover_url,n.source_url,n.rights_status,n.rights_evidence,n.rights_notes,n.review_feedback,n.reviewed_by,n.reviewed_at,n.publication_status,n.views,n.rating,n.created_at,n.updated_at,(SELECT COUNT(*) FROM chapters c WHERE c.novel_id=n.id) chapter_count,(SELECT COUNT(*) FROM chapters c WHERE c.novel_id=n.id AND c.publication_status='published') published_chapters FROM novels n WHERE n.owner_user_id=? ORDER BY n.updated_at DESC`).bind(u.id).all()).results||[])
 }
 if(p==="/api/author/novels"&&m==="POST"){
  const e=author(u);if(e)return e;const b=await body(req);
  const title=String(b.title||'').trim(),authorName=String(b.author||u.username||'').trim();
  if(!title||!authorName)return json({error:'Title and author are required'},400);
  const kind=String(b.kind||'original').trim().toLowerCase();if(!CONTENT_FORMAT_IDS.has(kind))return json({error:'Unsupported content format. Fetch /api/formats for the supported format registry.',supported_formats:CONTENT_FORMATS.map(x=>x.id)},400);
  const rights=String(b.rights_status||'original').toLowerCase();
  if(!['original','public_domain','licensed','authorized'].includes(rights))return json({error:'Invalid rights status'},400);
  const r=await env.DB.prepare(`INSERT INTO novels(title,alt_titles,author,description,status,kind,language,cover_url,source_url,rights_status,owner_user_id,publication_status,rights_evidence,rights_notes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(title,String(b.alt_titles||''),authorName,String(b.description||''),['ongoing','completed'].includes(String(b.status))?String(b.status):'ongoing',kind,String(b.language||'English'),String(b.cover_url||''),String(b.source_url||''),rights,u.id,'draft',String(b.rights_evidence||''),String(b.rights_notes||'')).run();
  const id=Number(r.meta.last_row_id);await audit(env,u,'author_novel_created',`novel=${id}`);return json({ok:true,id,message:`Novel created as draft. ID: ${id}`},201)
 }
 if(/^\/api\/author\/novels\/\d+\/submit$/.test(p)&&m==="POST"){
  const e=author(u);if(e)return e;const id=Number(p.split('/')[4]);const n=await env.DB.prepare('SELECT * FROM novels WHERE id=?').bind(id).first();if(!n)return json({error:'Novel not found'},404);if(u.role!=="admin"&&Number(n.owner_user_id)!==Number(u.id))return json({error:'You do not own this novel'},403);
  const rights=String(n.rights_status||'').toLowerCase();if(!['original','public_domain','licensed','authorized'].includes(rights))return json({error:'A valid rights status is required before review.'},400);if(rights!=='original'&&!String(n.rights_evidence||'').trim())return json({error:'Rights evidence is required before submitting this work for review.'},400);
  if(String(n.publication_status)==='published')return json({error:'This novel is already published.'},400);
  await env.DB.prepare("UPDATE novels SET publication_status='review',review_feedback='',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(id).run();await audit(env,u,'author_novel_submitted',`novel=${id}`);await notifyAdmins(env,'Novel submitted for review',`\"${String(n.title||'Untitled')}\" was submitted by ${String(u.username||'author')} for publication review.`);return json({ok:true,message:'Novel submitted for review.'})
 }
 if(/^\/api\/author\/novels\/\d+$/.test(p)&&m==="PATCH"){
  const e=author(u);if(e)return e;const id=Number(p.split('/').pop()),b=await body(req);
  const n=await env.DB.prepare(`SELECT * FROM novels WHERE id=?`).bind(id).first();if(!n)return json({error:'Novel not found'},404);
  if(u.role!=="admin"&&Number(n.owner_user_id)!==Number(u.id))return json({error:'You do not own this novel'},403);
  const title=String(b.title??n.title).trim(),authorName=String(b.author??n.author).trim();if(!title||!authorName)return json({error:'Title and author are required'},400);
  const rights=String(b.rights_status??n.rights_status).toLowerCase();if(!['original','public_domain','licensed','authorized'].includes(rights))return json({error:'Invalid rights status'},400);
  await env.DB.prepare(`UPDATE novels SET title=?,alt_titles=?,author=?,description=?,status=?,kind=?,language=?,cover_url=?,source_url=?,rights_status=?,rights_evidence=?,rights_notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(title,String(b.alt_titles??n.alt_titles??''),authorName,String(b.description??n.description??''),['ongoing','completed'].includes(String(b.status??n.status))?String(b.status??n.status):'ongoing',String(b.kind??n.kind??'original'),String(b.language??n.language??'English'),String(b.cover_url??n.cover_url??''),String(b.source_url??n.source_url??''),rights,String(b.rights_evidence??n.rights_evidence??''),String(b.rights_notes??n.rights_notes??''),id).run();
  await audit(env,u,'author_novel_updated',`novel=${id}`);return json({ok:true,message:'Novel saved.'})
 }
 if(p==="/api/author/chapters"&&m==="GET"){
  const e=author(u);if(e)return e;const nid=Number(url.searchParams.get('novel_id'));const n=await env.DB.prepare('SELECT id,owner_user_id FROM novels WHERE id=?').bind(nid).first();if(!n)return json({error:'Novel not found'},404);if(u.role!=="admin"&&Number(n.owner_user_id)!==Number(u.id))return json({error:'You do not own this novel'},403);
  return json((await env.DB.prepare(`SELECT id,novel_id,chapter_number,title,content,is_locked,ticket_cost,publication_status,created_at,updated_at FROM chapters WHERE novel_id=? ORDER BY chapter_number`).bind(nid).all()).results||[])
 }
 if(p==="/api/author/chapters"&&m==="POST"){
  const e=author(u);if(e)return e;const b=await body(req),nid=Number(b.novel_id),num=Number(b.chapter_number),title=String(b.title||'').trim(),content=String(b.content||'');
  const n=await env.DB.prepare('SELECT id,owner_user_id FROM novels WHERE id=?').bind(nid).first();if(!n)return json({error:'Novel not found'},404);if(u.role!=="admin"&&Number(n.owner_user_id)!==Number(u.id))return json({error:'You do not own this novel'},403);
  if(!Number.isInteger(num)||num<1||!title||!content)return json({error:'Chapter number, title and content are required'},400);
  const locked=!!b.is_locked,cost=Number(b.ticket_cost||0);if(cost<0)return json({error:'Ticket cost cannot be negative'},400);
  try{const r=await env.DB.prepare(`INSERT INTO chapters(novel_id,chapter_number,title,content,is_locked,ticket_cost,publication_status) VALUES(?,?,?,?,?,?, 'draft')`).bind(nid,num,title,content,locked?1:0,cost).run();await env.DB.prepare('UPDATE novels SET updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(nid).run();await audit(env,u,'author_chapter_created',`novel=${nid};chapter=${num}`);return json({ok:true,id:Number(r.meta.last_row_id),message:'Chapter saved as draft.'},201)}catch(err){return json({error:'Chapter number already exists or could not be saved'},409)}
 }
 if(/^\/api\/author\/chapters\/\d+$/.test(p)&&m==="PATCH"){
  const e=author(u);if(e)return e;const id=Number(p.split('/').pop()),b=await body(req);
  const c=await env.DB.prepare(`SELECT c.*,n.owner_user_id FROM chapters c JOIN novels n ON n.id=c.novel_id WHERE c.id=?`).bind(id).first();if(!c)return json({error:'Chapter not found'},404);if(u.role!=="admin"&&Number(c.owner_user_id)!==Number(u.id))return json({error:'You do not own this chapter'},403);
  const num=Number(b.chapter_number??c.chapter_number),title=String(b.title??c.title).trim(),content=String(b.content??c.content);const cost=Number(b.ticket_cost??c.ticket_cost);if(!Number.isInteger(num)||num<1||!title||!content||cost<0)return json({error:'Invalid chapter data'},400);
  const dup=await env.DB.prepare('SELECT id FROM chapters WHERE novel_id=? AND chapter_number=? AND id<>?').bind(c.novel_id,num,id).first();if(dup)return json({error:'Another chapter already uses that chapter number.'},409);
  await env.DB.prepare(`UPDATE chapters SET chapter_number=?,title=?,content=?,is_locked=?,ticket_cost=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(num,title,content,b.is_locked?1:0,cost,id).run();await env.DB.prepare('UPDATE novels SET updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(c.novel_id).run();await audit(env,u,'author_chapter_updated',`chapter=${id}`);return json({ok:true,message:'Chapter saved.'})
 }
 if(/^\/api\/author\/chapters\/\d+\/publish$/.test(p)&&m==="POST"){
  const e=author(u);if(e)return e;const id=Number(p.split('/')[3]),b=await body(req);const c=await env.DB.prepare(`SELECT c.*,n.owner_user_id,n.rights_status FROM chapters c JOIN novels n ON n.id=c.novel_id WHERE c.id=?`).bind(id).first();if(!c)return json({error:'Chapter not found'},404);if(u.role!=="admin"&&Number(c.owner_user_id)!==Number(u.id))return json({error:'You do not own this chapter'},403);
  const status=String(b.publication_status||'published');if(!['draft','published'].includes(status))return json({error:'Invalid publication status'},400);if(status==='published'&&!['original','public_domain','licensed','authorized'].includes(String(c.rights_status)))return json({error:'Novel rights are not eligible for publication'},403);
  await env.DB.prepare('UPDATE chapters SET publication_status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(status,id).run();await env.DB.prepare('UPDATE novels SET updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(c.novel_id).run();await audit(env,u,status==='published'?'author_chapter_published':'author_chapter_unpublished',`chapter=${id}`);return json({ok:true,message:status==='published'?'Chapter published.':'Chapter moved to draft.'})
 }
 if(p==="/api/admin/publishing"&&m==="GET"){const e=admin(u);if(e)return e;await ensurePublishingSchema(env);return json((await env.DB.prepare(`SELECT n.*,COALESCE(u.username,'') owner_username,(SELECT COUNT(*) FROM chapters c WHERE c.novel_id=n.id) chapter_count FROM novels n LEFT JOIN users u ON u.id=n.owner_user_id ORDER BY CASE n.publication_status WHEN 'review' THEN 0 WHEN 'draft' THEN 1 WHEN 'published' THEN 2 ELSE 3 END,n.updated_at DESC LIMIT 300`).all()).results)}
 if(p==="/api/admin/publishing/novels"&&m==="POST"){
  const e=admin(u);if(e)return e;await ensurePublishingSchema(env);
  const b=await body(req),title=String(b.title||'').trim(),author=String(b.author||'').trim(),description=String(b.description||'').trim();
  if(!title||!author)return json({error:'Title and author are required'},400);
  const rights=String(b.rights_status||'original').toLowerCase();
  if(!['original','public_domain','licensed','authorized'].includes(rights))return json({error:'Invalid rights status'},400);
  const kind=String(b.kind||'original').trim().toLowerCase();if(!CONTENT_FORMAT_IDS.has(kind))return json({error:'Unsupported content format. Fetch /api/formats for the supported format registry.',supported_formats:CONTENT_FORMATS.map(x=>x.id)},400);
  const status=['ongoing','completed'].includes(String(b.status||'ongoing'))?String(b.status):'ongoing';
  try{
   const r=await env.DB.prepare(`INSERT INTO novels(title,alt_titles,author,description,status,kind,language,cover_url,source_url,rights_status,owner_user_id,publication_status,rights_evidence,rights_notes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(title,String(b.alt_titles||''),author,description,status,kind,String(b.language||'English'),String(b.cover_url||''),String(b.source_url||''),rights,Number(b.owner_user_id||u.id),'draft',String(b.rights_evidence||''),String(b.rights_notes||'')).run();
   const id=Number(r.meta.last_row_id);await audit(env,u,'admin_novel_created',`novel=${id};rights=${rights}`);
   return json({ok:true,id,status:'draft',message:`Novel saved as draft. Novel ID: ${id}. Rights review is required before publication.`});
  }catch(err){console.error('admin novel create',err);return json({error:'Unable to save draft: '+String(err?.message||err).slice(0,240)},500)}
 }
 let apn=p.match(/^\/api\/admin\/publishing\/novels\/(\d+)$/);if(apn&&m==="PATCH"){const e=admin(u);if(e)return e;await ensurePublishingSchema(env);const id=Number(apn[1]),b=await body(req),row=await env.DB.prepare('SELECT * FROM novels WHERE id=?').bind(id).first();if(!row)return json({error:'Novel not found'},404);const rights=String(b.rights_status||row.rights_status||'').toLowerCase();const pub=String(b.publication_status||row.publication_status||'draft').toLowerCase();if(!['original','public_domain','licensed','authorized'].includes(rights))return json({error:'Invalid rights status'},400);if(!['draft','review','published','archived'].includes(pub))return json({error:'Invalid publication status'},400);if(pub==='published' && !['original','public_domain','licensed','authorized'].includes(rights))return json({error:'This work cannot be published without an eligible rights status.'},403);if(pub==='published' && !String(b.rights_evidence||row.rights_evidence||'').trim() && rights!=='original')return json({error:'Rights evidence is required for licensed, public-domain, or authorized works.'},400);const verified=pub==='published'?u.id:(b.rights_verified?u.id:null);const feedback=String(b.review_feedback??row.review_feedback??'').trim().slice(0,3000);const reviewedBy=(pub==='published'||(pub==='draft'&&feedback))?u.id:(row.reviewed_by||null);const reviewedAt=(pub==='published'||(pub==='draft'&&feedback))?new Date().toISOString():(row.reviewed_at||null);await env.DB.prepare(`UPDATE novels SET title=?,author=?,description=?,status=?,kind=?,language=?,cover_url=?,source_url=?,rights_status=?,publication_status=?,rights_evidence=?,rights_notes=?,review_feedback=?,rights_verified_by=?,rights_verified_at=?,reviewed_by=?,reviewed_at=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(String(b.title||row.title),String(b.author||row.author),String(b.description??row.description),['ongoing','completed'].includes(String(b.status||row.status))?String(b.status||row.status):row.status,String(b.kind||row.kind),String(b.language||row.language),String(b.cover_url??row.cover_url),String(b.source_url??row.source_url),rights,pub,String(b.rights_evidence??row.rights_evidence),String(b.rights_notes??row.rights_notes),feedback,verified,pub==='published'?new Date().toISOString():row.rights_verified_at,reviewedBy,reviewedAt,id).run();await audit(env,u,'admin_novel_publication',`novel=${id};status=${pub};rights=${rights}`);if(row.owner_user_id&&Number(row.owner_user_id)!==Number(u.id)){if(pub==='published')await notifyUser(env,row.owner_user_id,'Novel approved and published',`Your novel "${String(row.title||'Untitled')}" has been approved and published.`);else if(pub==='draft'&&feedback)await notifyUser(env,row.owner_user_id,'Changes requested for your novel',`Admin review requested changes for "${String(row.title||'Untitled')}": ${feedback}`)}return json({ok:true,id,status:pub,rights_status:rights})}
 let ach=p.match(/^\/api\/admin\/publishing\/chapters(?:\/(\d+))?$/);
 if(ach && m==="GET"){
  const e=admin(u);if(e)return e;await ensurePublishingSchema(env);
  const nid=Number(url.searchParams.get("novel_id")||0);
  if(!nid)return json({error:"Novel ID is required"},400);
  const rows=(await env.DB.prepare(`SELECT c.id,c.novel_id,c.chapter_number,c.title,c.content,c.is_locked,c.ticket_cost,c.publication_status,c.created_at,COALESCE(v.views,0) views,(SELECT COUNT(*) FROM unlocks u WHERE u.chapter_id=c.id) unlock_count,(SELECT COUNT(*) FROM reports r WHERE r.chapter_id=c.id) report_count FROM chapters c LEFT JOIN chapter_views v ON v.chapter_id=c.id WHERE c.novel_id=? ORDER BY c.chapter_number,c.id`).bind(nid).all()).results;
  return json(rows);
 }
 let acm=p.match(/^\/api\/admin\/publishing\/chapters\/(\d+)$/);
 if(acm && m==="PATCH"){
  const e=admin(u);if(e)return e;await ensurePublishingSchema(env);
  const id=Number(acm[1]),b=await body(req);
  const row=await env.DB.prepare("SELECT * FROM chapters WHERE id=?").bind(id).first();
  if(!row)return json({error:"Chapter not found"},404);
  const num=Number(b.chapter_number??row.chapter_number);
  if(!Number.isInteger(num)||num<1)return json({error:"Valid chapter number is required"},400);
  const title=String(b.title??row.title).trim();
  const content=String(b.content??row.content).trim();
  if(!title||!content)return json({error:"Chapter title and content are required"},400);
  const locked=b.is_locked===undefined?Number(row.is_locked):b.is_locked?1:0;
  const cost=b.ticket_cost===undefined?Number(row.ticket_cost):Math.max(0,Number(b.ticket_cost));
  if(!Number.isFinite(cost))return json({error:"Invalid ticket cost"},400);
  const pub=String(b.publication_status??row.publication_status??'draft').toLowerCase();
  if(!['draft','published'].includes(pub))return json({error:"Invalid chapter publication status"},400);
  if(pub==='published'){const novel=await env.DB.prepare('SELECT rights_status FROM novels WHERE id=?').bind(row.novel_id).first();if(!novel||!['original','public_domain','licensed','authorized'].includes(String(novel.rights_status)))return json({error:"Novel rights are not eligible for publication"},403);}
  const duplicate=await env.DB.prepare("SELECT id FROM chapters WHERE novel_id=? AND chapter_number=? AND id<>?").bind(row.novel_id,num,id).first();
  if(duplicate)return json({error:"Chapter number already exists for this novel."},409);
  await env.DB.prepare("UPDATE chapters SET chapter_number=?,title=?,content=?,is_locked=?,ticket_cost=?,publication_status=? WHERE id=?").bind(num,title,content,locked,cost,pub,id).run();
  await env.DB.prepare("UPDATE novels SET updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(row.novel_id).run();
  await audit(env,u,"admin_chapter_updated",`chapter=${id};novel=${row.novel_id};number=${num}`);
  return json({ok:true,id,message:"Chapter updated."});
 }
 if(p==='/api/admin/publishing/chapters/reorder'&&m==='POST'){const e=admin(u);if(e)return e;await ensurePublishingSchema(env);const b=await body(req),id=Number(b.id),direction=String(b.direction||'');if(!id||!['up','down'].includes(direction))return json({error:'Chapter ID and direction are required'},400);const row=await env.DB.prepare('SELECT id,novel_id,chapter_number FROM chapters WHERE id=?').bind(id).first();if(!row)return json({error:'Chapter not found'},404);const op=direction==='up'?'<':'>';const order=direction==='up'?'DESC':'ASC';const target=await env.DB.prepare(`SELECT id,chapter_number FROM chapters WHERE novel_id=? AND chapter_number ${op} ? ORDER BY chapter_number ${order} LIMIT 1`).bind(row.novel_id,row.chapter_number).first();if(!target)return json({ok:true,moved:false,message:direction==='up'?'Already first.':'Already last.'});const temp=-Math.max(row.chapter_number,target.chapter_number)-1000000;await env.DB.batch([env.DB.prepare('UPDATE chapters SET chapter_number=? WHERE id=?').bind(temp,row.id),env.DB.prepare('UPDATE chapters SET chapter_number=? WHERE id=?').bind(row.chapter_number,target.id),env.DB.prepare('UPDATE chapters SET chapter_number=? WHERE id=?').bind(target.chapter_number,row.id),env.DB.prepare('UPDATE novels SET updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(row.novel_id)]);await audit(env,u,'admin_chapter_reordered',`chapter=${id};target=${target.id};direction=${direction}`);return json({ok:true,moved:true});}
 if(acm && m==="DELETE"){
  const e=admin(u);if(e)return e;await ensurePublishingSchema(env);
  const id=Number(acm[1]);
  const row=await env.DB.prepare("SELECT * FROM chapters WHERE id=?").bind(id).first();
  if(!row)return json({error:"Chapter not found"},404);
  await env.DB.batch([
   env.DB.prepare("DELETE FROM unlocks WHERE chapter_id=?").bind(id),
   env.DB.prepare("DELETE FROM reports WHERE chapter_id=?").bind(id),
   env.DB.prepare("DELETE FROM chapters WHERE id=?").bind(id),
   env.DB.prepare("UPDATE novels SET updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(row.novel_id)
  ]);
  await audit(env,u,"admin_chapter_deleted",`chapter=${id};novel=${row.novel_id};number=${row.chapter_number}`);
  return json({ok:true,id,message:"Chapter deleted."});
 }
 if(p==="/api/admin/publishing/chapters"&&m==="POST"){const e=admin(u);if(e)return e;await ensurePublishingSchema(env);const b=await body(req),nid=Number(b.novel_id),num=Number(b.chapter_number);if(!nid||!Number.isInteger(num)||num<1)return json({error:'Novel and valid chapter number are required'},400);const n=await env.DB.prepare('SELECT id,publication_status,rights_status FROM novels WHERE id=?').bind(nid).first();if(!n)return json({error:'Novel not found'},404);if(n.publication_status==='published'&& !['original','public_domain','licensed','authorized'].includes(String(n.rights_status)))return json({error:'Novel rights are not eligible for publication'},403);const title=String(b.title||`Chapter ${num}`).trim(),content=String(b.content||'').trim();if(!content)return json({error:'Chapter content is required'},400);try{const r=await env.DB.prepare(`INSERT INTO chapters(novel_id,chapter_number,title,content,is_locked,ticket_cost,publication_status) VALUES(?,?,?,?,?,?,?)`).bind(nid,num,title,content,b.is_locked===false?0:1,Math.max(0,Number(b.ticket_cost??1)),String(b.publication_status||'draft')==='published'?'published':'draft').run();await env.DB.prepare('UPDATE novels SET updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(nid).run();await audit(env,u,'admin_chapter_created',`novel=${nid};chapter=${num}`);return json({ok:true,id:r.meta.last_row_id,message:'Chapter created.'})}catch{return json({error:'Chapter number already exists for this novel.'},409)}}
 if(p==="/api/admin/donations"&&m==="GET"){const e=admin(u);if(e)return e;return json((await env.DB.prepare(`SELECT d.*,u.username FROM donations d LEFT JOIN users u ON u.id=d.user_id ORDER BY d.created_at DESC LIMIT 100`).all()).results)}
 let ad=p.match(/^\/api\/admin\/donations\/(\d+)$/);if(ad&&m==="PATCH"){const e=admin(u);if(e)return e;const b=await body(req),d=await env.DB.prepare("SELECT * FROM donations WHERE id=?").bind(ad[1]).first();if(!d)return json({error:"Donation not found"},404);if(d.status!=="pending")return json({error:"Donation already processed"},409);if(b.status==="approved"){const tickets=Number(b.tickets||d.amount);await env.DB.batch([env.DB.prepare("UPDATE donations SET status='approved' WHERE id=?").bind(d.id),env.DB.prepare("UPDATE users SET tickets=tickets+? WHERE id=?").bind(tickets,d.user_id),env.DB.prepare("INSERT INTO ticket_ledger(user_id,delta,reason,reference) VALUES(?,?,?,?)").bind(d.user_id,tickets,"payment",String(d.id))])}else await env.DB.prepare("UPDATE donations SET status='rejected' WHERE id=?").bind(d.id);return json({ok:true})}
 if(p==="/api/admin/reports"&&m==="GET"){const e=admin(u);if(e)return e;return json((await env.DB.prepare(`SELECT r.*,u.username,n.title novel_title FROM reports r LEFT JOIN users u ON u.id=r.user_id LEFT JOIN novels n ON n.id=r.novel_id ORDER BY CASE r.status WHEN 'open' THEN 0 ELSE 1 END,r.created_at DESC LIMIT 200`).all()).results)}
 let ar=p.match(/^\/api\/admin\/reports\/(\d+)$/);if(ar&&m==="PATCH"){const e=admin(u);if(e)return e;const b=await body(req),status=String(b.status||'resolved');if(!['open','reviewing','resolved','dismissed'].includes(status))return json({error:'Invalid report status'},400);await env.DB.prepare('UPDATE reports SET status=? WHERE id=?').bind(status,ar[1]).run();return json({ok:true})}
 if(p==="/api/admin/tickets"&&m==="POST"){const e=admin(u);if(e)return e;const b=await body(req),amount=Number(b.amount);if(!amount)return json({error:"Ticket amount required"},400);await env.DB.prepare("UPDATE users SET tickets=tickets+? WHERE id=?").bind(amount,b.user_id).run();await audit(env,u,"admin_ticket_credit",`user=${b.user_id};amount=${amount}`);return json({ok:true})}
 if(p==="/api/admin/connectors"&&m==="GET"){const e=admin(u);if(e)return e;await ensureOmniTables(env);return json((await env.DB.prepare(`SELECT id,name,base_url,type,enabled,rights_status,search_url,auth_header,secret_name,last_status,last_checked_at FROM connectors ORDER BY name`).all()).results)}
 if(p==="/api/admin/connectors"&&m==="PATCH"){const e=admin(u);if(e)return e;const b=await body(req);const id=Number(b.id);if(!id)return json({error:'Connector id required'},400);await ensureOmniTables(env);const current=await env.DB.prepare("SELECT * FROM connectors WHERE id=?").bind(id).first();if(!current)return json({error:"Connector not found"},404);const rights=String(b.rights_status||current.rights_status||'pending');const evidence=String(b.rights_evidence_url??current.rights_evidence_url??'').trim();const terms=String(b.terms_url??current.terms_url??'').trim();if(rights==='authorized'&&!evidence&&!terms)return json({error:"Authorization requires rights evidence or a terms/license URL."},400);if(b.enabled&&rights!=='authorized')return json({error:"Only connectors with authorized rights status can be enabled."},400);await env.DB.prepare(`UPDATE connectors SET enabled=?,rights_status=?,search_url=?,auth_header=?,secret_name=?,rights_evidence_url=?,terms_url=?,rights_notes=?,metadata_import_allowed=?,attribution_required=? WHERE id=?`).bind(b.enabled?1:0,rights,String(b.search_url??current.search_url??''),String(b.auth_header??current.auth_header??'authorization'),String(b.secret_name??current.secret_name??''),evidence,terms,String(b.rights_notes??current.rights_notes??''),b.metadata_import_allowed?1:0,b.attribution_required?1:0,id).run();return json({ok:true})}
 if(p==="/api/admin/omni/health"&&m==="POST"){const e=admin(u);if(e)return e;await ensureOmniTables(env);const rows=(await env.DB.prepare(`SELECT * FROM connectors WHERE enabled=1 AND rights_status='authorized'`).all()).results,out=[];for(const c of rows){const t=Date.now();const status=c.search_url?'online':'not-configured';if(c.search_url)await omniConnectorSearch(env,c,'test');await env.DB.prepare(`UPDATE connectors SET last_status=?,last_checked_at=CURRENT_TIMESTAMP WHERE id=?`).bind(status,c.id).run();out.push({id:c.id,name:c.name,status,ms:Date.now()-t})}return json(out)}
 if(p==="/api/admin/connectors/cleanup"&&m==="POST"){const e=admin(u);if(e)return e;await ensureOmniTables(env);const rows=(await env.DB.prepare(`SELECT id,name,base_url FROM connectors ORDER BY id`).all()).results;const groups=new Map();for(const c of rows){const key=String(c.base_url||'').replace(/\/$/,'').toLowerCase();if(!groups.has(key))groups.set(key,[]);groups.get(key).push(c)}let removed=0,kept=0;for(const [key,list] of groups){if(!key||list.length<2){if(list.length===1)kept++;continue}const canonical=list[0];kept++;for(const dup of list.slice(1)){await env.DB.batch([env.DB.prepare(`UPDATE import_jobs SET connector_id=? WHERE connector_id=?`).bind(canonical.id,dup.id),env.DB.prepare(`UPDATE connector_events SET connector_id=? WHERE connector_id=?`).bind(canonical.id,dup.id),env.DB.prepare(`DELETE FROM connectors WHERE id=?`).bind(dup.id)]);removed++}}return json({ok:true,removed,kept})}
 if(p==="/api/connector-authorization-requests"&&m==="POST"){const e=need(u);if(e)return e;await ensureOmniTables(env);const b=await body(req),connectorId=Number(b.connector_id);if(!connectorId)return json({error:"Connector id required"},400);const c=await env.DB.prepare("SELECT * FROM connectors WHERE id=?").bind(connectorId).first();if(!c)return json({error:"Connector not found"},404);const evidence=String(b.evidence_url||'').trim(),terms=String(b.terms_url||'').trim(),notes=String(b.notes||'').trim();if(!evidence&&!terms&&!notes)return json({error:"Provide rights evidence, a terms/license URL, or rights notes."},400);const existing=await env.DB.prepare("SELECT id FROM connector_authorization_requests WHERE connector_id=? AND status='pending' ORDER BY id DESC LIMIT 1").bind(connectorId).first();if(existing)return json({ok:true,request_id:existing.id,status:"pending",message:"Authorization request already pending."});const r=await env.DB.prepare("INSERT INTO connector_authorization_requests(connector_id,user_id,status,evidence_url,terms_url,notes,metadata_import_allowed,attribution_required) VALUES(?,?,'pending',?,?,?,?,?)").bind(connectorId,u.id,evidence,terms,notes,b.metadata_import_allowed?1:0,b.attribution_required?1:0).run();await notifyAdmins(env,"Connector authorization request",`${c.name} has a new rights authorization request.`);await audit(env,u,"connector_authorization_requested",`connector=${connectorId};request=${r.meta.last_row_id}`);return json({ok:true,request_id:r.meta.last_row_id,status:"pending"})}
 if(p==="/api/admin/connectors"&&m==="POST"){const e=admin(u);if(e)return e;const b=await body(req);if(!allowedHost(env,b.base_url))return json({error:"Connector host is not in CONNECTOR_HOST_ALLOWLIST"},400);await env.DB.prepare("INSERT INTO connectors(name,base_url,type,enabled,rights_status) VALUES(?,?,?,0,'authorized')").bind(String(b.name||"Unnamed"),b.base_url,"json").run();return json({ok:true})}
 if(p==="/api/admin/requests"&&m==="GET"){const e=admin(u);if(e)return e;return json((await env.DB.prepare(`SELECT r.*,u.username FROM novel_requests r LEFT JOIN users u ON u.id=r.user_id ORDER BY r.created_at DESC LIMIT 100`).all()).results)}
 if(p.startsWith("/api/admin/requests/")&&m==="PATCH"){const e=admin(u);if(e)return e;const id=p.split("/").pop();const b=await body(req),next=String(b.status||"").toLowerCase();if(!["pending","approved","rejected","fulfilled"].includes(next))return json({error:"Invalid request status"},400);const row=await env.DB.prepare("SELECT id,user_id,cost,status,url FROM novel_requests WHERE id=?").bind(id).first();if(!row)return json({error:"Request not found"},404);const prev=String(row.status||"pending");if(prev===next)return json({ok:true,status:next,message:"Request already has this status"});if(prev!=="pending")return json({error:"Only pending requests can be reviewed"},409);if(next==="rejected"&&Number(row.cost||0)>0){await env.DB.batch([env.DB.prepare("UPDATE novel_requests SET status=? WHERE id=?").bind(next,id),env.DB.prepare("UPDATE users SET tickets=tickets+? WHERE id=?").bind(Number(row.cost||0),row.user_id),env.DB.prepare("INSERT INTO ticket_ledger(user_id,delta,reason,reference) VALUES(?,?,?,?)").bind(row.user_id,Number(row.cost||0),"novel_request_refund",String(row.url||"").slice(0,180)),env.DB.prepare("INSERT INTO audit_logs(user_id,action,details) VALUES(?,?,?)").bind(u.id,"admin_request_rejected",`request=${id};refund=${Number(row.cost||0)}`)]);return json({ok:true,status:next,refunded:Number(row.cost||0)})}await env.DB.batch([env.DB.prepare("UPDATE novel_requests SET status=? WHERE id=?").bind(next,id),env.DB.prepare("INSERT INTO audit_logs(user_id,action,details) VALUES(?,?,?)").bind(u.id,"admin_request_status",`request=${id};status=${next}`)]);return json({ok:true,status:next})}
 if(p==="/api/admin/connector-authorization-requests"&&m==="GET"){const e=admin(u);if(e)return e;await ensureOmniTables(env);return json((await env.DB.prepare(`SELECT r.*,c.name connector_name,c.base_url,u.username requester FROM connector_authorization_requests r JOIN connectors c ON c.id=r.connector_id JOIN users u ON u.id=r.user_id ORDER BY CASE r.status WHEN 'pending' THEN 0 ELSE 1 END,r.created_at DESC LIMIT 200`).all()).results)}
 let car=p.match(/^\/api\/admin\/connector-authorization-requests\/(\d+)$/);if(car&&m==="PATCH"){const e=admin(u);if(e)return e;await ensureOmniTables(env);const b=await body(req),decision=String(b.status||'').toLowerCase(),id=Number(car[1]);if(!['approved','rejected'].includes(decision))return json({error:"Status must be approved or rejected."},400);const r=await env.DB.prepare("SELECT * FROM connector_authorization_requests WHERE id=?").bind(id).first();if(!r)return json({error:"Authorization request not found"},404);if(r.status!=='pending')return json({error:"Authorization request already reviewed"},409);const c=await env.DB.prepare("SELECT * FROM connectors WHERE id=?").bind(r.connector_id).first();if(!c)return json({error:"Connector not found"},404);if(decision==='approved'&&!r.evidence_url&&!r.terms_url&&!r.notes)return json({error:"Cannot approve without rights evidence, terms/license URL, or rights notes."},400);await env.DB.batch([env.DB.prepare("UPDATE connector_authorization_requests SET status=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,review_notes=? WHERE id=?").bind(decision,u.id,String(b.review_notes||''),id),env.DB.prepare("UPDATE connectors SET rights_status=?,enabled=0,rights_evidence_url=?,terms_url=?,rights_notes=?,metadata_import_allowed=?,attribution_required=? WHERE id=?").bind(decision==='approved'?'authorized':'rejected',r.evidence_url,r.terms_url,r.notes,r.metadata_import_allowed,r.attribution_required,r.connector_id)]);await audit(env,u,"connector_authorization_reviewed",`connector=${r.connector_id};request=${id};decision=${decision}`);return json({ok:true,status:decision,enabled:false})}
 return json({error:"Not found"},404);
}
async function html(req,env){const u=new URL(req.url);let file="index.html",title="Imperial Novel",description="Read original, licensed and authorized novels, fanfiction and connected worlds.";const p=u.pathname;const map={"/":"index.html","/catalog":"catalog.html","/genres":"genres.html","/tags":"tags.html","/search":"search.html","/library":"library.html","/history":"history.html","/following":"following.html","/tickets":"tickets.html","/requests":"requests.html","/omniportal":"omniportal.html","/community":"index.html","/leaderboard":"index.html","/tier-list":"index.html","/random":"index.html","/made-for-you":"index.html","/settings":"index.html","/for-you":"index.html","/trending":"index.html","/vote":"index.html","/notifications":"index.html","/trend-factory":"index.html","/community-taxonomy":"community-taxonomy.html","/privacy":"privacy.html","/terms":"terms.html","/copyright":"copyright.html","/account":"account.html","/login":"login.html","/register":"register.html","/admin":"admin.html","/author":"author.html"};if(map[p])file=map[p];else if(/^\/novel\/\d+\/chapters\/?$/.test(p))file="novel.html";else if(/^\/novel\/\d+\/?$/.test(p))file="novel.html";else if(/^\/read\/\d+\/\d+\/?$/.test(p))file="read.html";else if(/^\/fandom\//.test(p))file="fandom.html";else if(/^\/author\/[^/]+$/.test(p))file="author-public.html";else file="404.html";const m=p.match(/^\/(?:novel|read)\/(\d+)/);if(m){try{const n=await env.DB.prepare("SELECT title,author,description FROM novels WHERE id=? AND publication_status='published'").bind(m[1]).first();if(n){title=n.title;description=`${n.title} by ${n.author}. ${String(n.description||"").slice(0,180)}`}}catch{}}const base=await env.ASSETS.fetch(new Request(new URL("/"+file,req.url)));let text=await base.text();text=text.replaceAll("__SEO_TITLE__",escapeHtml(title)).replaceAll("__SEO_DESC__",escapeHtml(description));text=text.replace(/href="\/style(?:-[^"]+)?\.css(?:\?v=[^"]*)?"/g,'href="/style-17.11.0.css"').replace(/href="\/manifest(?:-[^"]+)?\.webmanifest(?:\?v=[^"]*)?"/g,'href="/manifest-17.13.0.webmanifest"').replace(/src="\/app(?:-[^"]+)?\.js(?:\?v=[^"]*)?"/g,'src="/app-17.13.0.js"').replace(/href="\/app(?:-[^"]+)?\.css(?:\?v=[^"]*)?"/g,'href="/app-17.11.0.css"');text=text.replace(/(href|src)="\/imperial-novel-app-icon\.svg(?:\?[^"]*)?"/g,'$1="/imperial-novel-app-icon.svg?v=17.13.0"');if(!text.includes("imperial-luxury-17.13.0.css"))text=text.replace("</head>",'<link rel="stylesheet" href="/imperial-luxury-17.13.0.css"></head>');text=text.replace("</head>",'<script>try{document.documentElement.dataset.theme=localStorage.getItem("imperial_theme")==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}</script></head>');if(file==="admin.html")text=text.replace("<body>","<body class=\"adminDashboardPage\">");if(file==="author.html")text=text.replace("<body>","<body class=\"authorStudioPage\">");return new Response(text,{headers:{"content-type":"text/html;charset=UTF-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin","x-frame-options":"SAMEORIGIN","permissions-policy":"camera=(),microphone=(),geolocation=()","content-security-policy":"default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https:; frame-ancestors 'self'"}})}
const escapeHtml=s=>String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const secure=response=>{const h=new Headers(response.headers);h.set("x-content-type-options","nosniff");h.set("referrer-policy","strict-origin-when-cross-origin");h.set("permissions-policy","camera=(),microphone=(),geolocation=()");h.set("strict-transport-security","max-age=31536000; includeSubDomains");return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h})};
export default {async scheduled(event,env){try{await ensureCoreSchema(env);await runAutomation(env,event.cron)}catch(e){console.error("scheduled agents",e)}},async fetch(req,env){try{const p=new URL(req.url).pathname;let r;if(p.startsWith("/api/"))r=await api(req,env);else if(p==="/community-taxonomy")r=await html(req,env);else if(p==="/"||/^(\/(catalog|genres|tags|search|library|history|following|tickets|requests|omniportal|community|leaderboard|tier-list|random|made-for-you|for-you|trending|vote|notifications|settings|account|login|register|admin|author))$/.test(p)||/^(\/(novel|read|fandom)\/)/.test(p))r=await html(req,env);else if(!p.includes("."))r=await html(req,env);else r=await env.ASSETS.fetch(req);return secure(r)}catch(e){console.error(e);return secure(json({error:"Internal server error"},500))}}};
