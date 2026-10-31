from pathlib import Path

source = Path("src/index.js").read_text(encoding="utf-8")

def section(start, end):
    a = source.index(start)
    b = source.index(end, a)
    return source[a:b]

media_list = section('if(p==="/api/author/media"&&m==="GET"){', 'const assetId=Number(p.split("/").pop());')
media_delete = section('const assetId=Number(p.split("/").pop());', 'if(p==="/api/author/media/upload"&&m==="POST"){')
upload = section('if(p==="/api/author/media/upload"&&m==="POST"){', 'let mediaMatch=p.match(')
review = section('const e=admin(u);if(e)return e;\\n  if(req.headers.get("origin")!==url.origin)', 'if(p==="/api/agents"&&m==="GET"){')
delivery = section('if(mediaMatch&&m==="GET"){', 'if(p==="/api/admin/media/review-queue"&&m==="GET"){')

checks = {
    "creator media library requires author access": "author(u)" in media_list,
    "creator media library scopes assets to the authenticated owner": "WHERE owner_user_id=?" in media_list,
    "creator media library reports bounded storage usage": "SUM(size_bytes)" in media_list and "limit=104857600" in media_list,
    "creator media library does not expose private object keys": "object_key" not in media_list,
    "asset deletion requires author access and same-origin request": "author(u)" in media_delete and 'req.headers.get("origin")!==url.origin' in media_delete,
    "asset deletion checks creator ownership": "WHERE id=? AND owner_user_id=?" in media_delete,
    "asset deletion atomically refuses attached comic pages": "NOT EXISTS (SELECT 1 FROM comic_chapter_pages WHERE media_asset_id=?)" in media_delete,
    "asset deletion reserves quota before removing private storage": "status='processing',deleted_at=COALESCE(deleted_at,CURRENT_TIMESTAMP)" in media_delete,
    "asset deletion marks deleted only after R2 deletion": "env.MEDIA_BUCKET.delete(asset.object_key)" in media_delete and "status='deleted',deleted_at=CURRENT_TIMESTAMP" in media_delete,
    "asset deletion restores state if private storage deletion fails": "status=?,deleted_at=?" in media_delete,
    "upload requires author authentication": "author(u)" in upload,
    "upload rejects cross-origin requests": 'requestOrigin!==url.origin' in upload,
    "upload is rate-limited per creator": 'consumeAuthRateLimit(env,"media-upload",String(u.id),10,3600)' in upload,
    "upload requires a bounded Content-Length": "requestLength" in upload and "20*1024*1024+65536" in upload,
    "upload validates image metadata and bytes": "validateMediaUploadMetadata" in upload and "validateImageBytes" in upload,
    "upload requires private R2 binding": 'env.MEDIA_BUCKET.put' in upload,
    "upload does not self-approve or mark media ready": "rights_status='approved'" not in upload and "status='ready'" not in upload,
    "failed upload cleanup deletes confirmed objects and retains quota if deletion fails": "status='deleted',deleted_at=CURRENT_TIMESTAMP" in upload and "status='rejected'" in upload and "MEDIA_BUCKET.delete(objectKey)" in upload,
    "rights review requires administrator role": "admin(u)" in review,
    "rights review rejects cross-origin requests": 'req.headers.get("origin")!==url.origin' in review,
    "rights approval records reviewer and decision atomically": "media_asset_reviews" in review and "reviewed_by_user_id" in review and "env.DB.batch" in review,
    "reader delivery requires ready and approved media": "a.status='ready' AND a.rights_status='approved'" in delivery,
    "reader delivery requires published chapter and novel": "c.publication_status='published' AND n.publication_status='published'" in delivery,
    "locked reader delivery checks unlocks": "unlocks WHERE user_id=? AND chapter_id=?" in delivery,
    "reader delivery fetches only the stored private object key": "env.MEDIA_BUCKET.get(published.object_key)" in delivery,
    "reader delivery does not redirect to bucket URL": "return new Response(object.body" in delivery,
}
for label, passed in checks.items():
    print(("PASS" if passed else "FAIL") + ": " + label)
if not all(checks.values()):
    raise SystemExit(1)
