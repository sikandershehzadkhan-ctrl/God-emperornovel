# Imperial Novel URL, Canonical and Locale Policy

**Status:** Foundation policy, enforced in the route registry and Worker.  
**Last reviewed:** 2026-11-19.

## Canonical path rules

- Registered page URLs use slashless paths, except the root path `/`.
- A known registered page requested with one or more trailing slashes receives a permanent `308` redirect to its slashless path.
- Query parameters are preserved during trailing-slash normalization.
- Public indexable HTML pages receive a canonical link using the request origin and canonical pathname. Query parameters are excluded from that canonical link.
- Exact private and utility paths retain both the HTML `noindex,nofollow` meta tag and the `X-Robots-Tag` response header. Noindex is not an authorization control.
- Unknown extensionless paths continue to use the HTML 404 shell. File-like paths continue to the asset handler unless explicitly registered as page routes.

## Legacy fandom route

- `/fandom/{path}` is a legacy tag shortcut, not a dedicated indexable screen.
- The Worker now returns a permanent `308` redirect to `/catalog?tag={last-path-segment}`.
- Query parameters already present on the incoming URL are preserved; the `tag` value is set using URLSearchParams.
- Malformed percent-encoding is rejected with HTTP 400 rather than producing a broken redirect.

## Locale and text direction

- Locale-prefixed routes are **not implemented**. Do not introduce `/en/`, `/ur/`, or other locale prefixes until a separate locale-routing contract defines canonical URLs, redirects, alternate-language links, and sitemap behavior.
- The selected UI language is independent of the URL path for the current foundation.
- Chapter content direction is independent of UI language. Urdu, Arabic, and Persian chapter bodies must be allowed to render RTL without forcing the surrounding creator or reader interface into RTL.
- Do not infer language or direction from author account locale; use chapter/content metadata and text direction handling.

## Sitemap invariants

- Static sitemap entries use the canonical slashless route paths.
- Private and personalized utility paths remain excluded.
- Novel and chapter entries remain conditional on published status and eligible rights.
- Redirect-only legacy paths are not added as static sitemap entries.
