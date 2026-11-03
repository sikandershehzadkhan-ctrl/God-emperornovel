# Phase 01N.8 — Worker API Authorization and Test Evidence Matrix (Initial)

Status: inspected the Worker API dispatcher and relevant helper/handler source. This is a verified initial matrix for authentication, taxonomy and selected admin endpoint families, not a complete audit of every API used by all 40 routes.

Repository: `sikandershehzadkhan-ctrl/God-emperornovel`
Branch: `architecture/phase-01n-master-route-registry`
Worker source: `src/index.js`, blob `13874ee0fde4e31e04a652c5169776c3b6f95c38`
Package version: `17.23.0`

## 1. Shared authorization helpers

| Helper | Source behavior | Result |
|---|---|---|
| `admin(u)` | Returns null only when `u?.role === 'admin'`; otherwise HTTP 403 | Explicit role gate |
| `author(u)` | Allows admin or author role; otherwise HTTP 403 | Explicit role gate |
| `getUser(req, env)` | Called before authenticated API dispatch | Session identity source |

Important: these helpers prove role gating only where the handler actually calls them. They do not prove object ownership, audit logging, CSRF defenses, or correctness of every mutation.

## 2. Confirmed endpoint contracts

| Endpoint | Method | Authorization observed | Contract / validation evidence |
|---|---|---|---|
| `/api/me` | GET | Optional session | Returns current user summary or null |
| `/api/auth/register` | POST | Public + IP rate limit | Username 3–24 allowed characters; email shape; password 8–1024; password hash; duplicate returns 409 |
| `/api/auth/login` | POST | Public + IP and email rate limits | Password verification; legacy hash upgrade; creates 30-day session; HttpOnly, Secure, SameSite=Lax cookie |
| `/api/auth/logout` | POST | Session cookie if present | Deletes session token hash and clears cookie |
| `/api/taxonomy` | GET | Public approved vocabulary only | type must be genre/tag; only approved status is public |
| `/api/taxonomy` | POST | Public proposal | type allow-list; normalized name 2–80; duplicate official/submission checks; inserts pending |
| `/api/admin/taxonomy` | GET | `admin(u)` | Pending-first submissions, capped at 300 |
| `/api/admin/taxonomy` | POST | `adminTaxonomy()` calls `admin(u)` | approve/reject only; pending-only transition; reviewer recorded |
| `/api/admin/stats` | GET | `admin(u)` | Aggregate counts; no user-specific payload |
| `/api/admin/users` | GET | `admin(u)` | User list capped at 500 |
| `/api/admin/users/:id` | PATCH | `admin(u)` | Role allow-list; prevents self-demotion; user status updates |
| `/api/admin/author-applications` | GET | `admin(u)` | Status allow-list; capped at 100; application review fields |
| `/api/admin/author-applications/:id` | PATCH | `admin(u)` | Pending-only review; validates decision; approval updates role in batch; audits and notifies |
| `/api/admin/publishing` | GET | `admin(u)` | Publishing queue capped at 300 |
| `/api/admin/publishing/novels` | POST | `admin(u)` | Validates rights status and format registry; creates draft; audits |
| `/api/admin/publishing/novels/:id` | PATCH | `admin(u)` | Validates rights/publication status; evidence required for non-original; publication quality gate; audit + owner notification |
| `/api/admin/publishing/chapters?novel_id=:id` | GET | `admin(u)` | Requires novel ID; returns chapter management fields |
| `/api/admin/publishing/chapters/:id` | PATCH | `admin(u)` | Validates chapter number/title/content/cost/status; duplicate chapter number check; rights check before publish; audit |
| `/api/admin/tickets` | POST | `admin(u)` | Whole-number amount 1–1,000,000; atomic balance/ledger batch; audit |
| `/api/admin/connectors` | GET/PATCH/POST | `admin(u)` in inspected handlers | Connector allow-list and rights evidence checks; authorized-only enablement |
| `/api/admin/omni/health` | POST | `admin(u)` | Health checks for enabled, authorized connectors |
| `/api/admin/requests` | GET/PATCH | `admin(u)` | Status allow-list; pending-only review; rejection refund uses conditional batch and ledger |
| `/api/admin/connector-authorization-requests` | GET/PATCH | `admin(u)` | Pending-only review; rights evidence required to approve; connector remains disabled after decision |
| `/api/admin/community/comments` | GET/PATCH | `admin(u)` | Moderation status allow-list |
| `/api/admin/community/reports` | GET/PATCH | `admin(u)` | Report status allow-list |

## 3. High-value security findings

- Admin page's client-side role check is not the security boundary. The inspected Worker handlers call `admin(u)` for the listed protected endpoint families.
- Author application approval uses a guarded batch: the application must still be pending and the target account must still be a non-banned user; role assignment is conditional on the application transition.
- Taxonomy submissions remain pending until a separate admin decision. Public GET returns approved entries only.
- Publishing checks rights evidence and a publication quality gate before a novel is made public. Chapter publication checks parent novel rights eligibility.
- Admin Crown credits use a database batch to update the user's balance and write the ledger entry, with change-count checks.
- Request rejection refunds are conditional on the request still being pending and record a matching ledger credit.
- Connector management checks rights authorization and allowlisted HTTPS hosts in the inspected handlers.

## 4. Remaining API audit risks

1. Finish the full 40-route API-to-Worker mapping, including every request method and response field.
2. Verify object ownership for author novel/chapter mutations and every reader-specific bookmark/history/progress/ledger endpoint.
3. Inspect all admin mutation handlers for consistent audit logging, idempotency, concurrency and self-protection.
4. Verify CSRF posture for cookie-authenticated state-changing requests and whether origin checks or same-site protections are sufficient.
5. Inspect request body size limits, schema validation and unknown-field handling.
6. Confirm all personalized/private endpoints send non-public cache policy.
7. Verify method-not-allowed behavior and unknown API routes.
8. Add/execute negative tests using reader, author, banned user and unrelated second account identities.

## 5. Existing test assets discovered

The repository contains focused test scripts including:

- `test-admin-crown-credit.mjs`
- `test-auth-password.mjs`
- `test-author-application-policy.mjs`
- `test-author-application-ui.mjs`
- `test-author-applications.py`
- `test-comic-author-ui.mjs`
- `test-connector-url-policy.mjs`
- `test-content-quality-policy.mjs`
- `test-omni-connector-policy.mjs`
- `test-production-deploy-gates.mjs`

The package build script chains these and additional tests, then performs JavaScript syntax checks, public-entry checks, content-format checks, release-version checks and design-system validation.

**Execution status:** tests were identified in source but were not executed in this GitHub-only inspection. Do not interpret their presence as passing.

## 6. Source excerpts reviewed

```text
Lines 372-373: 372: const admin=u=>u?.role==="admin"?null:json({error:"Administrator access required"},403);
373: const author=u=>(u?.role==="admin"||u?.role==="author")?null:json({error:"Author access required"},403);
```

```text
Lines 401-428: 401: async function communityTaxonomy(req,env){
402:  const u=new URL(req.url), method=req.method;
403:  if(method==='GET'){
404:   const type=String(u.searchParams.get('type')||'').toLowerCase();
405:   if(!['genre','tag'].includes(type)) return json({error:'type must be genre or tag'},400);
406:   // Public discovery exposes approved vocabulary only. Pending/rejected proposals and
407:   // submitter details belong exclusively to the authenticated moderation endpoint.
408:   const status=String(u.searchParams.get('status')||'approved').toLowerCase();
409:   if(status!=='approved') return json({error:'Only approved taxonomy entries are public'},403);
410:   const r=await env.DB.prepare(
411:    'SELECT id,type,name,slug,description,created_at FROM taxonomy_submissions WHERE type=? AND status=? ORDER BY name COLLATE NOCASE LIMIT 500'
412:   ).bind(type,'approved').all();
413:   return json(r.results||[]);
414:  }
415:  if(method==='POST'){
416:   const b=await body(req),type=String(b.type||'').toLowerCase(),name=String(b.name||'').trim().replace(/\s+/g,' ');
417:   if(!['genre','tag'].includes(type)) return json({error:'type must be genre or tag'},400);
418:   if(name.length<2||name.length>80)return json({error:'Name must be 2-80 characters'},400);
419:   const s=slug(name),table=type==='genre'?'genres':'tags';
420:   if(await env.DB.prepare(`SELECT id FROM ${table} WHERE slug=? LIMIT 1`).bind(s).first())return json({error:'Already exists in official taxonomy'},409);
421:   const existing=await env.DB.prepare('SELECT id,status FROM taxonomy_submissions WHERE type=? AND slug=? LIMIT 1').bind(type,s).first();
422:   if(existing) return json({error:'Already submitted',id:existing.id,status:existing.status},409);
423:   try{const r=await env.DB.prepare(`INSERT INTO taxonomy_submissions(type,name,slug,description,creator_id,creator_name,status) VALUES(?,?,?,?,?,?,?)`).bind(type,name,s,String(b.description||'').slice(0,500),b.creator_id||null,String(b.creator_name||'').slice(
424:  }
425:  return json({error:'Method not allowed'},405);
426: }
427: async function adminTaxonomy(req,env,u){
428:  const e=admin(u);if(e)return e;const b=await body(req),id=Number(b.id||0),decision=String(b.decision||'').toLowerCase();
```

```text
Lines 454-463: 454:  if(p==="/api/admin/agents"&&m==="GET"){const e=admin(u);if(e)return e;return json((await env.DB.prepare(`SELECT id,slug,name,role,icon,mode,status,enabled,last_run_at,last_result FROM agents ORDER BY id`).all()).results)}
455:  if(p==="/api/admin/agents/run"&&m==="POST"){const e=admin(u);if(e)return e;const b=await body(req);const slug=String(b.slug||'');if(slug)return json(await runAgent(env,slug,'admin'));return json(await runAutomation(env))}
456:  if(p==="/api/taxonomy")return communityTaxonomy(req,env);
457:  if(p==="/api/admin/taxonomy"&&m==='GET'){const e=admin(u);if(e)return e;return json((await env.DB.prepare("SELECT * FROM taxonomy_submissions ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END,created_at DESC LIMIT 300").all()).results||[])}
458:  if(p==="/api/admin/taxonomy"&&m==='POST')return adminTaxonomy(req,env,u);
459:  if(p==="/api/health"){let db=true;try{await env.DB.prepare("SELECT 1").first()}catch{db=false}return json({ok:db,service:env.SITE_NAME||"Imperial Novel",version:env.APP_VERSION||"5.0.0",database:db,time:new Date().toISOString()})}
460:  if(p==="/api/auth/register"&&m==="POST"){const ip=String(req.headers.get("cf-connecting-ip")||"unknown").trim().slice(0,128);const limited=await consumeAuthRateLimit(env,"register-ip",ip,5,3600);if(limited)return limited;const b=await body(req),username=Strin
461:  if(p==="/api/auth/login"&&m==="POST"){const ip=String(req.headers.get("cf-connecting-ip")||"unknown").trim().slice(0,128);const ipLimited=await consumeAuthRateLimit(env,"login-ip",ip,30,900);if(ipLimited)return ipLimited;const b=await body(req),email=String(b
462:  if(p==="/api/auth/logout"&&m==="POST"){const c=cookies(req.headers.get("cookie"));if(c.session)await env.DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await digest(c.session)).run();return json({ok:true},200,{"set-cookie":"session=; Path=/; HttpO
463:  if(p==="/api/me")return json({user:u?{id:u.id,username:u.username,email:u.email,role:u.role,tickets:u.tickets,verified:u.verified}:null});
```

```text
Lines 716-747: 716:  if(p==="/api/admin/author-applications"&&m==="GET"){
717:   const e=admin(u);if(e)return e;
718:   const filter=String(url.searchParams.get("status")||"pending");
719:   if(!["pending","approved","rejected","withdrawn","all"].includes(filter))return json({error:"Invalid application status filter."},400);
720:   const rows=(await env.DB.prepare("SELECT a.id,a.user_id,a.display_name,a.bio,a.experience,a.portfolio_url,a.sample_work,a.preferred_formats,a.rights_confirmed,a.status,a.review_notes,a.created_at,a.reviewed_at,u.username,u.email,u.role user_role,u.banned FRO
721:   return json(rows.map(row=>{let formats=[];try{formats=JSON.parse(row.preferred_formats||"[]")}catch{}return {...row,preferred_formats:Array.isArray(formats)?formats:[]}}));
722:  }
723:  const authorApplicationReviewId=p.startsWith("/api/admin/author-applications/")?Number(p.slice("/api/admin/author-applications/".length)):0;
724:  if(authorApplicationReviewId>0&&Number.isSafeInteger(authorApplicationReviewId)&&m==="PATCH"){
725:   const e=admin(u);if(e)return e;
726:   const id=authorApplicationReviewId,b=await body(req),checked=validateAuthorApplicationDecision(b);
727:   if(!checked.ok)return json({error:checked.error},400);
728:   const application=await env.DB.prepare("SELECT id,user_id,status FROM author_applications WHERE id=?").bind(id).first();
729:   if(!application)return json({error:"Author application not found."},404);
730:   if(application.status!=="pending")return json({error:"This application has already been reviewed."},409);
731:   if(checked.value.status==="approved"){
732:    const results=await env.DB.batch([
733:     env.DB.prepare("UPDATE author_applications SET status='approved',review_notes=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending' AND EXISTS(SELECT 1 FROM users WHERE id=author_applications.user_id AND
734:     env.DB.prepare("UPDATE users SET role='author' WHERE id=? AND role='user' AND banned=0 AND EXISTS(SELECT 1 FROM author_applications WHERE id=? AND status='approved' AND reviewed_by=?)").bind(application.user_id,id,u.id)
735:    ]);
736:    if(Number(results?.[0]?.meta?.changes||0)!==1||Number(results?.[1]?.meta?.changes||0)!==1)return json({error:"The application could not be approved. The applicant may be banned or their account role has changed."},409);
737:   }else{
738:    const result=await env.DB.prepare("UPDATE author_applications SET status='rejected',review_notes=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'").bind(checked.value.review_notes,u.id,id).run();
739:    if(Number(result.meta.changes||0)!==1)return json({error:"This application has already been reviewed."},409);
740:   }
741:   await audit(env,u,"author_application_"+checked.value.status,"application="+id+";applicant="+application.user_id);
742:   await notifyUser(env,application.user_id,checked.value.status==="approved"?"Author application approved":"Author application needs changes",checked.value.status==="approved"?"Your author application was approved. Author Studio is now unlocked.":"Your author 
743:   return json({ok:true,status:checked.value.status,message:checked.value.status==="approved"?"Application approved. Author access has been granted.":"Application rejected with feedback."});
744:  }
745:  if(p==="/api/admin/stats"){const e=admin(u);if(e)return e;const [a,b,c,d,r,t,rep,authorApps]=await Promise.all([env.DB.prepare("SELECT COUNT(*) n FROM users").first(),env.DB.prepare("SELECT COUNT(*) n FROM novels").first(),env.DB.prepare("SELECT COUNT(*) n FR
746:  if(p==="/api/admin/users"&&m==="GET"){const e=admin(u);if(e)return e;return json((await env.DB.prepare("SELECT id,username,email,role,tickets,verified,banned,created_at FROM users ORDER BY id LIMIT 500").all()).results)}
747:  let au=p.match(/^\/api\/admin\/users\/(\d+)$/);if(au&&m==="PATCH"){const e=admin(u);if(e)return e;const b=await body(req),id=Number(au[1]);if(id===u.id&&String(b.role||u.role)!=='admin')return json({error:"You cannot remove your own administrator role"},400);
```

```text
Lines 935-1008: 935:  if(p==="/api/admin/publishing"&&m==="GET"){const e=admin(u);if(e)return e;await ensurePublishingSchema(env);return json((await env.DB.prepare(`SELECT n.*,COALESCE(u.username,'') owner_username,(SELECT COUNT(*) FROM chapters c WHERE c.novel_id=n.id) chapter_co
936:  if(p==="/api/admin/publishing/novels"&&m==="POST"){
937:   const e=admin(u);if(e)return e;await ensurePublishingSchema(env);
938:   const b=await body(req),title=String(b.title||'').trim(),author=String(b.author||'').trim(),description=String(b.description||'').trim();
939:   if(!title||!author)return json({error:'Title and author are required'},400);
940:   const rights=String(b.rights_status||'original').toLowerCase();
941:   if(!['original','public_domain','licensed','authorized'].includes(rights))return json({error:'Invalid rights status'},400);
942:   const kind=String(b.kind||'original').trim().toLowerCase();if(!CONTENT_FORMAT_IDS.has(kind))return json({error:'Unsupported content format. Fetch /api/formats for the supported format registry.',supported_formats:CONTENT_FORMATS.map(x=>x.id)},400);
943:   const status=['ongoing','completed'].includes(String(b.status||'ongoing'))?String(b.status):'ongoing';
944:   try{
945:    const r=await env.DB.prepare(`INSERT INTO novels(title,alt_titles,author,description,status,kind,language,cover_url,source_url,rights_status,owner_user_id,publication_status,rights_evidence,rights_notes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(title,Stri
946:    const id=Number(r.meta.last_row_id);await audit(env,u,'admin_novel_created',`novel=${id};rights=${rights}`);
947:    return json({ok:true,id,status:'draft',message:`Novel saved as draft. Novel ID: ${id}. Rights review is required before publication.`});
948:   }catch(err){console.error('admin novel create',err);return json({error:'Unable to save draft: '+String(err?.message||err).slice(0,240)},500)}
949:  }
950:  let apn=p.match(/^\/api\/admin\/publishing\/novels\/(\d+)$/);if(apn&&m==="PATCH"){const e=admin(u);if(e)return e;await ensurePublishingSchema(env);const id=Number(apn[1]),b=await body(req),row=await env.DB.prepare('SELECT * FROM novels WHERE id=?').bind(id).f
951:  let ach=p.match(/^\/api\/admin\/publishing\/chapters(?:\/(\d+))?$/);
952:  if(ach && m==="GET"){
953:   const e=admin(u);if(e)return e;await ensurePublishingSchema(env);
954:   const nid=Number(url.searchParams.get("novel_id")||0);
955:   if(!nid)return json({error:"Novel ID is required"},400);
956:   const rows=(await env.DB.prepare(`SELECT c.id,c.novel_id,c.chapter_number,c.title,c.content,c.is_locked,c.ticket_cost,c.publication_status,c.created_at,COALESCE(v.views,0) views,(SELECT COUNT(*) FROM unlocks u WHERE u.chapter_id=c.id) unlock_count,(SELECT CO
957:   return json(rows);
958:  }
959:  let acm=p.match(/^\/api\/admin\/publishing\/chapters\/(\d+)$/);
960:  if(acm && m==="PATCH"){
961:   const e=admin(u);if(e)return e;await ensurePublishingSchema(env);
962:   const id=Number(acm[1]),b=await body(req);
963:   const row=await env.DB.prepare("SELECT * FROM chapters WHERE id=?").bind(id).first();
964:   if(!row)return json({error:"Chapter not found"},404);
965:   const num=Number(b.chapter_number??row.chapter_number);
966:   if(!Number.isInteger(num)||num<1)return json({error:"Valid chapter number is required"},400);
967:   const title=String(b.title??row.title).trim();
968:   const content=String(b.content??row.content).trim();
969:   if(!title||!content)return json({error:"Chapter title and content are required"},400);
970:   const locked=b.is_locked===undefined?Number(row.is_locked):b.is_locked?1:0;
971:   const cost=b.ticket_cost===undefined?Number(row.ticket_cost):Math.max(0,Number(b.ticket_cost));
972:   if(!Number.isFinite(cost))return json({error:"Invalid ticket cost"},400);
973:   const pub=String(b.publication_status??row.publication_status??'draft').toLowerCase();
974:   if(!['draft','published'].includes(pub))return json({error:"Invalid chapter publication status"},400);
975:   if(pub==='published'){const novel=await env.DB.prepare('SELECT rights_status FROM novels WHERE id=?').bind(row.novel_id).first();if(!novel||!['original','public_domain','licensed','authorized'].includes(String(novel.rights_status)))return json({error:"Novel 
976:   const duplicate=await env.DB.prepare("SELECT id FROM chapters WHERE novel_id=? AND chapter_number=? AND id<>?").bind(row.novel_id,num,id).first();
977:   if(duplicate)return json({error:"Chapter number already exists for this novel."},409);
978:   await env.DB.prepare("UPDATE chapters SET chapter_number=?,title=?,content=?,is_locked=?,ticket_cost=?,publication_status=? WHERE id=?").bind(num,title,content,locked,cost,pub,id).run();
979:   await env.DB.prepare("UPDATE novels SET updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(row.novel_id).run();
980:   await audit(env,u,"admin_chapter_updated",`chapter=${id};novel=${row.novel_id};number=${num}`);
981:   return json({ok:true,id,message:"Chapter updated."});
982:  }
983:  if(p==='/api/admin/publishing/chapters/reorder'&&m==='POST'){const e=admin(u);if(e)return e;await ensurePublishingSchema(env);const b=await body(req),id=Number(b.id),direction=String(b.direction||'');if(!id||!['up','down'].includes(direction))return json({err
984:  if(acm && m==="DELETE"){
985:   const e=admin(u);if(e)return e;await ensurePublishingSchema(env);
986:   const id=Number(acm[1]);
987:   const row=await env.DB.prepare("SELECT * FROM chapters WHERE id=?").bind(id).first();
988:   if(!row)return json({error:"Chapter not found"},404);
989:   await env.DB.batch([
990:    env.DB.prepare("DELETE FROM unlocks WHERE chapter_id=?").bind(id),
991:    env.DB.prepare("DELETE FROM reports WHERE chapter_id=?").bind(id),
992:    env.DB.prepare("DELETE FROM chapters WHERE id=?").bind(id),
993:    env.DB.prepare("UPDATE novels SET updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(row.novel_id)
994:   ]);
995:   await audit(env,u,"admin_chapter_deleted",`chapter=${id};novel=${row.novel_id};number=${row.chapter_number}`);
996:   return json({ok:true,id,message:"Chapter deleted."});
997:  }
998:  if(p==="/api/admin/publishing/chapters"&&m==="POST"){const e=admin(u);if(e)return e;await ensurePublishingSchema(env);const b=await body(req),nid=Number(b.novel_id),num=Number(b.chapter_number);if(!nid||!Number.isInteger(num)||num<1)return json({error:'Novel 
999:  if(p==="/api/admin/donations"&&m==="GET"){const e=admin(u);if(e)return e;return json((await env.DB.prepare(`SELECT d.*,u.username FROM donations d LEFT JOIN users u ON u.id=d.user_id ORDER BY d.created_at DESC LIMIT 100`).all()).results)}
1000:  let ad=p.match(/^\/api\/admin\/donations\/(\d+)$/);if(ad&&m==="PATCH"){const e=admin(u);if(e)return e;const b=await body(req),d=await env.DB.prepare("SELECT * FROM donations WHERE id=?").bind(ad[1]).first();if(!d)return json({error:"Donation not found"},404);
1001:  if(p==="/api/admin/reports"&&m==="GET"){const e=admin(u);if(e)return e;return json((await env.DB.prepare(`SELECT r.*,u.username,n.title novel_title FROM reports r LEFT JOIN users u ON u.id=r.user_id LEFT JOIN novels n ON n.id=r.novel_id ORDER BY CASE r.status
1002:  let ar=p.match(/^\/api\/admin\/reports\/(\d+)$/);if(ar&&m==="PATCH"){const e=admin(u);if(e)return e;const b=await body(req),status=String(b.status||'resolved');if(!['open','reviewing','resolved','dismissed'].includes(status))return json({error:'Invalid report
1003:  if(p==="/api/admin/tickets"&&m==="POST"){const e=admin(u);if(e)return e;const b=await body(req),amount=Number(b.amount),userId=Number(b.user_id);if(!Number.isSafeInteger(userId)||userId<1)return json({error:"A valid user account is required."},400);if(!Number
1004:  if(p==="/api/admin/connectors"&&m==="GET"){const e=admin(u);if(e)return e;await ensureOmniTables(env);return json((await env.DB.prepare(`SELECT id,name,base_url,type,enabled,rights_status,search_url,auth_header,secret_name,last_status,last_checked_at FROM con
1005:  if(p==="/api/admin/connectors"&&m==="PATCH"){const e=admin(u);if(e)return e;const b=await body(req);const id=Number(b.id);if(!Number.isSafeInteger(id)||id<1)return json({error:'Connector id required'},400);await ensureOmniTables(env);const current=await env.D
1006:  if(p==="/api/admin/omni/health"&&m==="POST"){const e=admin(u);if(e)return e;await ensureOmniTables(env);const rows=(await env.DB.prepare(`SELECT * FROM connectors WHERE enabled=1 AND rights_status='authorized'`).all()).results,out=[];for(const c of rows){cons
1007:  if(p==="/api/admin/connectors/cleanup"&&m==="POST"){
1008:   const e=admin(u);if(e)return e;await ensureOmniTables(env);
```

```text
Lines 1028-1031: 1028:  if(p==="/api/admin/connectors"&&m==="POST"){const e=admin(u);if(e)return e;const b=await body(req);if(!allowedHost(env,b.base_url))return json({error:"Connector host is not in CONNECTOR_HOST_ALLOWLIST"},400);await env.DB.prepare("INSERT INTO connectors(name,b
1029:  if(p==="/api/admin/requests"&&m==="GET"){const e=admin(u);if(e)return e;return json((await env.DB.prepare(`SELECT r.*,u.username FROM novel_requests r LEFT JOIN users u ON u.id=r.user_id ORDER BY r.created_at DESC LIMIT 100`).all()).results)}
1030:  if(p.startsWith("/api/admin/requests/")&&m==="PATCH"){const e=admin(u);if(e)return e;const id=Number(p.split("/").pop());if(!Number.isSafeInteger(id)||id<1)return json({error:"Invalid request id"},400);const b=await body(req),next=String(b.status||"").toLower
1031:  if(p==="/api/admin/connector-authorization-requests"&&m==="GET"){const e=admin(u);if(e)return e;await ensureOmniTables(env);return json((await env.DB.prepare(`SELECT r.*,c.name connector_name,c.base_url,u.username requester FROM connector_authorization_reques
```

## 7. Phase 01N.8 disposition

- [x] Verify shared admin/author role helper behavior.
- [x] Inspect authentication, session issuance and rate limiting.
- [x] Inspect public taxonomy proposal and admin moderation.
- [x] Inspect admin publishing, author application, Crown credit and connector handler gates.
- [x] Identify relevant existing automated test scripts.
- [ ] Complete all endpoint request/response schemas.
- [ ] Complete per-object ownership matrix.
- [ ] Verify cache/CSRF/body-size/method handling.
- [ ] Execute tests in a runnable checkout and record logs.
- [ ] Add missing route and negative authorization tests.

No runtime code, database migration, secrets, Worker configuration or production deployment changed.
