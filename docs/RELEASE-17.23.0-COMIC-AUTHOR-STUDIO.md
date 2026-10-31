# Imperial Novel 17.23.0: Comic Author Studio

## Included

- Author Studio now presents a page-sequence composer for manga, manhwa, manhua, webtoon, comic and graphic-novel chapters.
- Creators can add page URLs, alternative text and captions, reorder pages, remove pages, and save the ordered page payload as a comic chapter draft.
- The editor is mobile-first and limits each draft to 80 pages and 95 KB of serialized chapter data.
- The Worker validates comic payload structure, HTTPS image URLs, host restrictions, page count and text lengths before accepting a new comic chapter.
- Regression tests cover malformed payloads, non-HTTPS URLs, credentialed URLs, local/IP hosts, unsupported ports, page count and field bounds.

## Explicit limitations

- This release does not implement binary image uploads, storage, CDN delivery, image transcoding, or rights verification for an image URL. The interface states this clearly. Creators must use direct HTTPS image links to artwork they own or are licensed to publish.
- Existing reader functionality remains vertical-scroll and single-page navigation. No advanced RTL manga double-page spread, panel-by-panel reading, offline comic caching, or image optimization is claimed.
- The editor is source work only until CI passes, production D1 schema readiness is confirmed, and a separately approved release is deployed.

## Security notes

Comic image URLs are rendered by the reader's browser, not fetched by the Worker. The server rejects credentials, IP-literal hosts, local/internal hostnames, non-HTTPS schemes and nonstandard ports. This does not prove the remote image host is trustworthy or that the creator owns the artwork; rights review remains required.
