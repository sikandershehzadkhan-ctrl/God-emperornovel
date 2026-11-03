from pathlib import Path

app = Path("public/app.js").read_text(encoding="utf-8")
checks = {
    "comic reader renders chapter content as an ordered page sequence": "function renderChapterContent(raw,kind)" in app and "payload.pages.slice(0,300)" in app,
    "comic reader accepts same-origin private media paths and HTTPS legacy links": "src.startsWith('/')&&!src.startsWith('//')" in app and "/^https:" in app,
    "comic reader escapes alt text and captions": "esc(String(page?.alt||('Comic page '+(i+1))).slice(0,300))" in app and "esc(caption)" in app,
    "comic viewer provides vertical and single-page modes": "function initComicViewer()" in app and "Switch to single-page mode" in app,
    "single-page viewer supports keyboard arrow navigation": "event.key==='ArrowLeft'" in app and "event.key==='ArrowRight'" in app,
    "single-page viewer supports horizontal touch swipes": "viewer.addEventListener('touchstart'" in app and "Math.abs(dx)>=48" in app,
    "comic reader exposes keyboard instructions and focus": "viewer.tabIndex=0" in app and "aria-keyshortcuts" in app,
}
for label, ok in checks.items():
    print(("PASS" if ok else "FAIL") + ": " + label)
if not all(checks.values()):
    raise SystemExit(1)
