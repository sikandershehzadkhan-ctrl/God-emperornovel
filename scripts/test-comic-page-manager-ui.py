from pathlib import Path

app = Path("public/app.js").read_text(encoding="utf-8")
runtime = Path("public/app-17.23.0.js").read_text(encoding="utf-8")
css = Path("public/style-17.23.0.css").read_text(encoding="utf-8")
checks = {
    "creator story cards expose comic page management": "data-open-comic-manager" in app and "Manage comic pages" in app,
    "manager is restricted to comic-format story cards": "COMIC_FORMATS.has(String(n.kind||'').toLowerCase())" in app,
    "manager loads chapters through the author API": "/api/author/chapters?novel_id=" in app,
    "manager only offers ready and rights-approved private assets": "x.status==='ready'&&x.rights_status==='approved'" in app,
    "manager loads existing ordered pages through the private page API": "'/api/author/chapters/'+Number(chapter.id)+'/pages'" in app,
    "manager saves page ordering through the protected PUT endpoint": "method:'PUT',body:JSON.stringify({pages})" in app,
    "manager supports reorder and removal controls": "data-managed-move" in app and "data-managed-remove" in app,
    "manager blocks editing chapters outside draft": "chapter.publication_status!=='draft'" in app,
    "manager escapes page labels and titles": "esc(p.alt_text||'Alt text not provided')" in app and "esc(x.title)" in app,
    "manager gives a truthful unavailable-storage message": "Private image storage is not configured" in app,
    "versioned browser runtime matches its source": app == runtime,
    "comic page manager has responsive styles": ".comicChapterManager" in css and "@media(max-width:680px)" in css,
}
for label, ok in checks.items():
    print(("PASS" if ok else "FAIL") + ": " + label)
if not all(checks.values()):
    raise SystemExit(1)
