from pathlib import Path

app = Path("public/app.js").read_text(encoding="utf-8")
versioned = Path("public/app-17.23.0.js").read_text(encoding="utf-8")
checks = {
    "administrator link is only inserted after admin role check": "if(d.user?.role==='admin')" in app,
    "administrator link appears in desktop navigation": "class=\"adminLink\"" in app,
    "administrator link appears in mobile drawer": "class=\"menuDrawerAdmin\"" in app and "Command Center</span>" in app,
    "command center checks the current user role": "me.user?.role!=='admin'" in app,
    "command center loads the administrator review queue": "/api/admin/media/review-queue" in app,
    "command center displays private storage health": "adminMediaStorage" in app and "api('/api/admin/media/storage')" in app,
    "rights approval requires explicit confirmation": "Confirm that you checked the rights holder" in app,
    "rights decision is sent to the administrator review endpoint": "/api/admin/media/" in app and "/review" in app,
    "versioned runtime matches the primary browser bundle": versioned == app,
}
for label, ok in checks.items():
    print(("PASS" if ok else "FAIL") + ": " + label)
if not all(checks.values()):
    raise SystemExit(1)
