from pathlib import Path

source = Path("src/index.js").read_text(encoding="utf-8")
patch_start = source.index('if(/^\\/api\\/author\\/chapters\\/\\d+$/.test(p)&&m==="PATCH"){')
publish_start = source.index('if(/^\\/api\\/author\\/chapters\\/\\d+\\/publish$/.test(p)&&m==="POST"){', patch_start)
patch = source[patch_start:publish_start]
publish_end = source.index('if(p==="/api/admin/publishing"&&m==="GET")', publish_start)
publish = source[publish_start:publish_end]
admin_start = source.index('let acm=p.match(/^\\/api\\/admin\\/publishing\\/chapters\\/(\\d+)$/);')
admin_end = source.index("if(p==='/api/admin/publishing/chapters/reorder'", admin_start)
admin_patch = source[admin_start:admin_end]
admin_create_start = source.index('if(p==="/api/admin/publishing/chapters"&&m==="POST"){')
admin_create_end = source.index('if(p==="/api/admin/donations"&&m==="GET")', admin_create_start)
admin_create = source[admin_create_start:admin_create_end]
checks = {
    "chapter updates load novel format and chapter publication state": "n.kind" in patch and "c.publication_status" in patch,
    "published chapters cannot be edited through the author API": 'c.publication_status!=="draft"' in patch and "Move this chapter to draft" in patch,
    "comic chapter updates use the strict comic content policy": "validateComicChapterContent(content)" in patch,
    "managed comic pages cannot be replaced by arbitrary chapter content": "SELECT media_asset_id,alt_text,caption FROM comic_chapter_pages" in patch and "Edit its page sequence through Comic Page Manager" in patch,
    "comic chapter publishing checks processed and rights-approved media": "a.status='ready' AND a.rights_status='approved'" in publish,
    "comic chapters cannot publish without a managed private page": "Comic chapters require at least one processed, rights-approved private page" in publish,
    "author comic publication query includes novel kind": "n.kind FROM chapters c JOIN novels n" in publish,
    "admin chapter updates load novel kind and rights": "n.kind,n.rights_status" in admin_patch,
    "admin cannot replace managed comic pages with raw content": "Edit its page sequence through Comic Page Manager" in admin_patch,
    "admin comic publishing requires ready approved private pages": "a.status='ready' AND a.rights_status='approved'" in admin_patch,
    "admin-created comic chapters are forced to draft": "isComic?'draft':requestedStatus" in admin_create,
    "admin cannot directly create published comic chapters": "Create comic chapters as drafts" in admin_create,
}
for label, ok in checks.items():
    print(("PASS" if ok else "FAIL") + ": " + label)
if not all(checks.values()):
    raise SystemExit(1)
