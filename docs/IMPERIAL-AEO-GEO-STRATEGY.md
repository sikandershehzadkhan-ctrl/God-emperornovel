# Imperial Novel AEO & GEO Strategy

**Status:** Implemented foundation, phased rollout  
**Date:** 31 October 2026  
**Principle:** Make the real platform and its original, authorized works easy for people and machines to understand. Never manufacture answers, authorship, popularity, reviews, citations or rights claims.

## 1. Definitions and outcome

- **SEO:** Search engine discovery, crawlability, indexability and useful search snippets.
- **AEO:** Clear, trustworthy answers to specific user questions, with visible context and attributable sources.
- **GEO:** Clear entity relationships and source material that generative search systems can retrieve, understand and cite.

These are overlapping practices, not three separate ranking algorithms. No implementation guarantees inclusion, citations, rankings or traffic.

## 2. Verified guidance

Google's current AI-search documentation says its AI features use the existing Search index and foundational SEO requirements. Pages must be indexed and eligible for snippets. It recommends crawlable content, helpful original material, internal links, good page experience, visible textual content and structured data that matches what users can see. Google explicitly says there is no special AEO/GEO schema, no need for llms.txt for Google Search, no need to split content into artificial chunks, and no need to rewrite pages for AI systems.

OpenAI documents separate crawler controls:
- OAI-SearchBot controls discovery for ChatGPT Search.
- GPTBot controls potential use of crawled content for training.
- These controls are independent. A site can permit search discovery while declining training crawler access.

Sources:
- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- https://developers.openai.com/api/docs/bots
- https://developers.google.com/search/docs/appearance/structured-data/book

## 3. Implemented technical foundation

- OAI-SearchBot is explicitly allowed by default, while private routes and query-parameter URLs remain disallowed.
- GPTBot and Google-Extended are disallowed by default as a conservative creator-content protection setting. This does not block OAI-SearchBot search discovery.
- Worker environment switches provide explicit control:
  - ALLOW_AI_SEARCH=false opts OAI-SearchBot out.
  - ALLOW_AI_TRAINING=true opts GPTBot and Google-Extended in.
  - Defaults are search allowed and model-training access disallowed.
- Dynamic sitemap includes only published, rights-cleared novels and public author profiles.
- Page-specific title, description, canonical, Open Graph, Twitter card and safe cover preview metadata.
- JSON-LD graph identifies the platform, website and current page. Novel pages add Book, chapter pages add Chapter, and public author pages add ProfilePage/Person entities from live database records.
- Unknown and unpublished/unauthorized novel, chapter and author routes return 404 rather than indexable empty shells.
- Build-integrated regression tests cover crawler controls, metadata escaping, canonical routes, dynamic sitemap filtering and structured data.

## 4. Page architecture for answerability

Every indexable public page should have:
1. One clear page purpose and one descriptive H1.
2. A concise, human-written opening that answers what the page is about.
3. Visible facts with clear labels: author, language, format, genre, publication status, rights/availability, and last updated where those fields genuinely exist.
4. A logical heading hierarchy and semantic HTML (main, article, nav, headings, lists, tables where appropriate).
5. Crawlable internal links to related novels, authors, genres, formats and editorial explainers.
6. Accurate page-level metadata and structured data matching visible content.
7. A useful next action for a human reader, not content created solely to attract bots.

Do not expose locked chapter text, private profile data, moderation notes, unpublished drafts, ticket balances or admin information to crawlers.

## 5. AEO content program

Create useful, maintained public explainers for questions users genuinely ask:
- What is Imperial Novel?
- How can a reader discover and follow a novel?
- How does an author publish a story?
- Which content formats and languages are supported?
- How do tickets and payment approvals work?
- What content is permitted and how are copyright reports handled?
- How are ratings, rankings and catalog counts calculated?

Each answer must be concise, accurate, dated when policies can change, linked to its detailed policy/source, and reviewed by the responsible platform owner. FAQ markup is not a shortcut to rich results; visible, useful answers are the goal.

## 6. GEO and entity quality

- Maintain one canonical identity for Imperial Novel across site title, organization metadata, logo, social profiles and public policy pages.
- Give each published novel a stable canonical URL and a consistent entity record: title, author, synopsis, language and format only when verified.
- Give each public author a stable profile with authored works and only verified external identity links.
- Preserve provenance: distinguish author-supplied synopsis, editorial description and platform-generated metadata.
- Do not fabricate external citations, awards, author credentials, ratings, review counts, translations or AI-recommended endorsements.
- Encourage legitimate references from authors' own websites, publisher pages and genuine community coverage. Never buy or manufacture mentions.

## 7. International and multilingual discovery

- Give each genuinely translated page its own stable URL and correct lang attribute.
- Add hreflang only when alternate language pages are real equivalents and reciprocal links are in place.
- Keep original-language metadata distinct from translated metadata.
- Do not claim a novel is translated merely because browser UI has been localized.
- Use language names/codes consistently and preserve author-provided titles.

## 8. Measurement and quality gates

After an approved production release:
- Verify domain ownership in Google Search Console and submit the sitemap.
- Inspect representative homepage, catalog, novel, chapter and author URLs.
- Validate JSON-LD syntax and confirm all structured fields are visible and accurate.
- Monitor indexing, crawl errors, canonical selection, Web search performance and available generative-AI reporting.
- Check server/CDN logs for verified crawler requests and unexpected 404/5xx rates.
- Measure referral visits and reader actions, not only impressions.
- Re-audit after changes to robots policy, URL structure, rights policy or rendering.

## 9. Explicit non-goals

- No promise of ranking or AI citations.
- No keyword stuffing, fake FAQ pages, mass-generated landing pages or artificial query-chunk pages.
- No llms.txt added as a supposed Google ranking factor.
- No blanket opening of private or paid chapter content.
- No training-crawler access by default.
- No Google Book Actions claim: those require a dedicated compliant book feed and access/offer semantics, not merely adding Book JSON-LD.

## 10. Remaining work

1. Complete browser-based visual and rendered-HTML QA on a preview or approved production release.
2. Add verified content-language and alternate-language metadata after checking the actual locale routing.
3. Build public help/policy answer pages from authoritative product rules.
4. Add content-quality eligibility rules for indexable works, avoiding thin or empty pages.
5. Add Search Console and crawl-health reporting after domain verification and deployment.
