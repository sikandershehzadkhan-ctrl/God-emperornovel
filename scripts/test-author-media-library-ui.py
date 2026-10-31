from pathlib import Path

app = Path("public/app.js").read_text(encoding="utf-8")
versioned = Path("public/app-17.23.0.js").read_text(encoding="utf-8")
checks = {
    "Author Studio includes a creator media library": "authorMediaPanel" in app,
    "media library reads the authenticated creator API": "api('/api/author/media')" in app,
    "media library displays the storage allowance": "quota.limit_bytes" in app and "quotaTrack" in app,
    "media library displays per-asset rights and processing states": "a.rights_status" in app and "a.status" in app,
    "media library clearly disables operations without private storage": "Private storage is not configured. Uploads and deletion are safely disabled." in app,
    "asset deletion requires an explicit confirmation": "Permanently delete this private image?" in app,
    "asset deletion calls the owner-scoped API": "api('/api/author/media/'+id,{method:'DELETE'" in app,
    "media values are escaped before rendering": "esc(a.rights_holder" in app and "esc(a.mime_type)" in app,
    "versioned browser runtime matches the primary application": versioned == app,
}
for label, ok in checks.items():
    print(("PASS" if ok else "FAIL") + ": " + label)
if not all(checks.values()):
    raise SystemExit(1)
