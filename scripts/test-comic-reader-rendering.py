from pathlib import Path

app = Path("public/app.js").read_text(encoding="utf-8")
checks = {
    "comic reader renders chapter content as an ordered page sequence": "function renderChapterContent(raw,kind)" in app and "payload.pages.slice(0,300)" in app,
    "comic reader accepts only same-origin private media paths or HTTPS legacy links": "src.startsWith('/')&&!src.startsWith('//')&&!src.includes('\\\\')" in app and "/^https:\\/\\/[^\\s\"'<>]+$/i" in app,
    "comic reader escapes alt text and captions": "esc(String(page?.alt||('Comic page '+(i+1))).slice(0,300))" in app and "esc(caption)" in app,
    "comic viewer provides vertical and single-page modes": "function initComicViewer()" in app and "Switch to single-page mode" in app,
}
for label, ok in checks.items():
    print(("PASS" if ok else "FAIL") + ": " + label)
if not all(checks.values()):
    raise SystemExit(1)
