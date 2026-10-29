# Imperial Novel format-aware comic chapter payload

This optional representation supports licensed or creator-owned illustrated chapters. Existing plain-text chapter content remains supported.

## Payload

Store the following JSON as the chapter content string:

    {
      "type": "imperial_comic_chapter",
      "version": 1,
      "pages": [
        { "src": "/media/authorized-work/chapter-001/page-001.webp", "alt": "A city skyline at dawn", "caption": "" },
        { "src": "https://cdn.example.org/authorized-work/chapter-001/page-002.webp", "alt": "The protagonist enters the city", "caption": "" }
      ]
    }

## Reader behavior

- Manga, manhwa, manhua, webtoon, comic, and graphic-novel chapters can use image pages.
- Continuous vertical scroll is the default for mobile-friendly reading.
- Readers can switch to single-page mode with previous/next controls.
- Images use lazy loading after the first page, responsive sizing, and descriptive alt text.
- Unsupported payloads fall back to safely escaped text. Invalid image addresses render a warning.
- Other formats keep the existing text reader. Anime and cartoon entries remain catalog records, not a promise of playback.

## Rights and security

Only upload images the publisher or creator is authorized to distribute. Prefer same-origin media paths or HTTPS URLs for a verified rights-cleared CDN. Frontend address validation does not grant content rights. Do not use this format to ingest scraped chapter images or bypass a publisher's access controls.

## Current limitation

This is a reader presentation contract, not an image-upload pipeline or individual-page rights-management workflow. Those must be implemented and reviewed separately before public creator uploads are enabled.
