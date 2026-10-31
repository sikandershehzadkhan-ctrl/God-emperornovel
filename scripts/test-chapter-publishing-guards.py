from pathlib import Path

source = Path("src/index.js").read_text(encoding="utf-8")
patch_start = source.index('if(/^\\/api\\/author\\/chapters\\/\\d+$/.test(p)&&m==="PATCH"){')
publish_start = source.index('if(/^\\/api\\/author\\/chapters\\/\\d+\\/publish$/.test(p)&&m==="POST"){', patch_start)
patch = source[patch_start:publish_start]
publish_end = source.index('if(p==="/api/admin/publishing"&&m==="GET")', publish_start)
publish = source[publish_start:publish_end]
checks = {
    "chapter updates load novel format and chapter publication state": "n.kind" in patch and "c.publication_status" in patch,
    "published chapters cannot be edited through the author API": 'c.publication_status!=="draft"' in patch and "Move this chapter to draft" in patch,
    "comic chapter updates use the strict comic content policy": "validateComicChapterContent(content)" in patch,
    "managed comic pages cannot be replaced by arbitrary chapter content": "SELECT media_asset_id,alt_text,caption FROM comic_chapter_pages" in patch and "Edit its page sequence through Comic Page Manager" in patch,
    "comic chapter publishing checks processed and rights-approved media": "a.status='ready' AND a.rights_status='approved'" in publish,
    "comic chapters cannot publish without a managed private page": "Comic chapters require at least one processed, rights-approved private page" in publish,
}
for label, ok in checks.items():
    print(("PASS" if ok else "FAIL") + ": " + label)
if not all(checks.values()):
    raise SystemExit(1)
