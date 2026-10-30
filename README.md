# Imperial Novel

**Read • Create • Conquer**

Imperial Novel is being developed as a mobile-first, international home for serialized fiction and visual storytelling: novels, light novels, manga, manhwa, webtoons, and other formats that the platform has the legal right to publish.

The product name is **Imperial Novel**. The repository and Cloudflare Worker identifier `God-emperornovel` are infrastructure names only and are not the public brand.

## Product standard

Imperial Novel is intended to be a serious, polished publishing and reading platform, not a disposable demo or a template site. Product decisions should prioritize:

- A distinctive, restrained visual identity: Imperial Purple, Pure White, Sapphire Blue, and Obsidian Black.
- Excellent mobile usability, fast loading, accessible controls, readable typography, and support for right-to-left languages.
- A comfortable, configurable reader with clear progress, bookmarks, and reading preferences.
- Useful discovery, search, rankings, libraries, creator tools, and community features.
- Trustworthy moderation, account security, transparent platform rules, and accurate public metrics.
- Maintainable architecture, automated checks, and careful production releases.

## Content and rights

Only content that Imperial Novel has the right to host or distribute may be published. This includes original work, properly licensed work, public-domain work, and other material whose permissions explicitly allow the intended use.

A work being free to read, visible on another website, or discoverable through a search engine does **not** grant permission to copy, translate, mirror, hotlink, or monetize it. Manga, manhwa, webtoon pages, covers, and other visual material require the same rights checks as written chapters. Record provenance, licence terms, attribution, and any restrictions before adding third-party assets or content.

See [Free Asset Policy](docs/FREE-ASSET-POLICY.md). See [Sustainable Revenue Model](docs/SUSTAINABLE-REVENUE-MODEL.md) for the staged, rights-first business plan.

## Technology and operating constraints

- Production target: Cloudflare Workers with D1.
- The application currently uses a vanilla JavaScript Worker-served application with incrementally added React islands.
- React assets are built locally and served from the same origin; avoid adding unnecessary runtime CDNs.
- Keep dependencies lean and compatible with the project's zero-budget operating constraint.
- Do not introduce paid APIs, paid stock assets, trial-dependent services, or hidden recurring costs.
- Optimize for real mobile devices and constrained networks. Avoid large decorative assets, unnecessary JavaScript, layout shifts, and blocking third-party requests.

## Development and release discipline

- Make changes in focused branches and reviewable pull requests.
- Run the repository's build, release, content-format, and Cloudflare-readiness checks.
- Treat passing CI, a successful deployment, and verified production behavior as three different milestones.
- Do not describe a feature as live until the production deployment and the relevant behavior have been verified.
- Do not invent catalogue totals, ratings, usage metrics, or feature availability.
- Keep payment integrations disabled until a legitimate provider integration and required merchant approval are in place. Never expose personal payment details.

## Current implementation

The repository contains a Cloudflare Worker application, D1-backed features, and incrementally mounted React components for novel reactions, comments, and ratings. This is an evolving implementation, not a claim that every part of the broader product vision is already complete.

## Brand

**Imperial Novel**  
**Read • Create • Conquer**
