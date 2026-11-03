from pathlib import Path

source = Path("src/index.js").read_text(encoding="utf-8")
start = source.index('if(/^\\/api\\/author\\/chapters\\/\\d+\\/pages$/.test(p)&&m==="GET"){')
end = source.index('if(/^\\/api\\/author\\/chapters\\/\\d+$/.test(p)&&m==="PATCH"){', start)
routes = source[start:end]
checks = {
    "comic page routes require an authenticated author": "author(u)" in routes,
    "comic page reads verify chapter ownership": "chapter.owner_user_id" in routes and "You do not own this chapter" in routes,
    "comic page reads omit private object keys": "object_key" not in routes,
    "comic page reader URLs use the private delivery API": 'src:"/api/media/"+x.media_asset_id' in routes,
    "comic page writes require same-origin requests": 'req.headers.get("origin")!==url.origin' in routes,
    "comic page writes are rate limited": 'consumeAuthRateLimit(env,"comic-pages-write",String(u.id),30,3600)' in routes,
    "comic page writes are limited to draft chapters": 'chapter.publication_status!=="draft"' in routes,
    "comic page writes require comic-format novels": 'chapter.kind||""' in routes and '"graphic_novel"' in routes,
    "comic page writes cap the page count": "pages.length>300" in routes,
    "comic page writes reject duplicate or invalid asset IDs": "seen.has(assetId)" in routes and "Number.isSafeInteger(assetId)" in routes,
    "comic page writes bound alt text and captions": "alt.length>300||caption.length>500" in routes,
    "comic page writes require novel-owner media that is ready and rights-approved": "owner_user_id=? AND status='ready' AND rights_status='approved'" in routes and "bind(chapter.owner_user_id,...ids)" in routes,
    "comic page writes rely on database triggers and a batched replacement": "env.DB.batch(statements)" in routes and "DELETE FROM comic_chapter_pages" in routes,
    "comic page save updates reader content in the same batch": 'const comicContent=JSON.stringify({type:"imperial_comic_chapter",version:1,pages:normalized.map(x=>({src:"/api/media/"+x.assetId,alt:x.alt,caption:x.caption}))})' in routes and 'UPDATE chapters SET content=?,updated_at=CURRENT_TIMESTAMP' in routes,
    "comic page writes audit the saved page count": "comic_chapter_pages_saved" in routes,
    "failed page replacement returns a safe conflict": "Existing page order was preserved." in routes,
}
for label, ok in checks.items():
    print(("PASS" if ok else "FAIL") + ": " + label)
if not all(checks.values()):
    raise SystemExit(1)
