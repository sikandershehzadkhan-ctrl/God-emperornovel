from pathlib import Path

source = Path("src/index.js").read_text(encoding="utf-8")

def section(start, end):
    a = source.index(start)
    b = source.index(end, a)
    return source[a:b]

upload = section('if(p==="/api/author/media/upload"&&m==="POST"){', 'let mediaMatch=p.match(')
review = section('if(/^\\/api\\/admin\\/media\\/\\d+\\/review$/.test(p)&&m==="POST"){', 'if(p==="/api/agents"&&m==="GET"){')
delivery = section('if(mediaMatch&&m==="GET"){', 'if(p==="/api/admin/media/review-queue"&&m==="GET"){')

checks = {
    "upload requires author authentication": "author(u)" in upload,
    "upload rejects cross-origin requests": 'requestOrigin!==url.origin' in upload,
    "upload is rate-limited per creator": 'consumeAuthRateLimit(env,"media-upload",String(u.id),10,3600)' in upload,
    "upload requires a bounded Content-Length": "requestLength" in upload and "20*1024*1024+65536" in upload,
    "upload validates image metadata and bytes": "validateMediaUploadMetadata" in upload and "validateImageBytes" in upload,
    "upload requires private R2 binding": 'env.MEDIA_BUCKET.put' in upload,
    "upload does not self-approve or mark media ready": "rights_status='approved'" not in upload and "status='ready'" not in upload,
    "failed upload cleanup rejects pending and uploaded records": "status IN ('pending_upload','uploaded')" in upload and "MEDIA_BUCKET.delete(objectKey)" in upload,
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
