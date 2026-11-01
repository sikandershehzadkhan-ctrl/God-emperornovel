# Imperial Novel | Phase 01M.6: Localization, Accessibility & Legal Experience

**Brand:** Read • Create • Conquer  
**Branch:** architecture/phase-01m-screen-blueprint  
**Status:** Architecture specification only.

## 1. Product objective

Imperial Novel should feel coherent across languages, writing systems, reading directions, assistive technologies and jurisdictions. Localization is not a dropdown that translates a few navigation labels. It is a product-wide content, layout, typography, date/number, search, accessibility and legal system.

Principles:
- Preserve the author's original work. UI localization must not silently translate novel/chapter content.
- Separate interface language, preferred reading language, content language and authoring language.
- Never claim a locale is fully supported because a language appears in a selector or a few labels are translated.
- Never use machine translation as a substitute for human-reviewed legal, payment, safety or rights copy.
- Support right-to-left layout as a complete layout mode, not merely text alignment.
- Meet WCAG 2.2 AA as a target; measure and test before claiming conformance.
- Respect reduced motion, text scaling, contrast preferences, keyboard and screen-reader use.

## 2. Read-only repository evidence

Inspection of `public/app.js` found a client-side language dictionary with interface labels for English, Urdu, Hindi, Simplified Chinese, Traditional Chinese, Spanish, French, Indonesian, Japanese, Korean, Brazilian Portuguese, Arabic, Vietnamese and Persian. The language switch updates document language and sets RTL direction for Urdu and Arabic.

This demonstrates a starting translation layer and locale list, not complete translation coverage. The inspected dictionary primarily covers navigation and common interface labels. Full-page translation coverage, plural rules, date/number/currency formatting, fallback behavior, translated metadata, RTL component correctness and locale-specific search behavior were not verified.

The server HTML route map includes `/privacy`, `/terms` and `/copyright`. Their existence does not establish legal adequacy, translation quality, cookie-consent implementation or jurisdictional compliance.

No accessibility audit, screen-reader test, keyboard test, RTL device test or legal review was performed in this increment.

## 3. Locale model

### 3.1 Independent preferences

Store distinct preferences:
- `ui_locale`: interface language.
- `reading_locale_preferences[]`: preferred novel/chapter languages, ordered.
- `content_locale`: language of an individual novel or chapter.
- `authoring_locale`: language used in creator tools.
- `region`: optional user-selected region for date, number and policy display.
- `time_zone`: explicit IANA time-zone identifier when available.

Do not infer a user's ethnicity, nationality, religion or legal residence from language choice. Region must be user-selected or otherwise transparently sourced.

### 3.2 Initial locale registry

The current client list provides a starting inventory:
- English (en)
- Urdu (ur)
- Hindi (hi)
- Simplified Chinese (zh-CN)
- Traditional Chinese (zh-TW)
- Spanish (es)
- French (fr)
- Indonesian (id)
- Japanese (ja)
- Korean (ko)
- Brazilian Portuguese (pt-BR)
- Arabic (ar)
- Vietnamese (vi)
- Persian (fa)

Each locale requires a registry entry: native name, English name, script, direction, plural rules, date/number formats, supported fonts, fallback locale, translation completion state, reviewer and release version. Do not mark “complete” until every required route and critical workflow passes locale QA.

### 3.3 Locale coverage tiers

- **Tier 0 — Discovery:** locale appears in roadmap only.
- **Tier 1 — Navigation:** core navigation and shell labels translated.
- **Tier 2 — Core journey:** authentication, discovery, novel detail, reader and account journeys translated.
- **Tier 3 — Full product:** creator, community, tickets, notifications, help and settings translated.
- **Tier 4 — Reviewed:** human-reviewed critical/legal/safety copy, typography, search and accessibility validated.

Display a truthful “partially translated” label where coverage is incomplete. Missing strings fall back to the chosen fallback locale without blank labels or untranslated key names.

## 4. Localization screen registry

| ID | Route | Screen |
|---|---|---|
| LOC-001 | /settings/language | Interface language |
| LOC-002 | /settings/reading-languages | Preferred reading languages |
| LOC-003 | /settings/region | Region and formats |
| LOC-004 | /settings/time-zone | Time zone |
| LOC-005 | /settings/translation | Translation coverage and fallback |
| LOC-006 | /settings/accessibility | Accessibility preferences |
| LOC-007 | /settings/reading-display | Reader typography and display |
| LOC-008 | /help/languages | Language and translation help |
| LOC-009 | /help/accessibility | Accessibility help |
| LOC-010 | /legal/language-notice | Legal-language precedence notice |

Language selection must be keyboard operable, searchable by native and English names, and preserve the current route when switching locale. A change must not reset reading position, unsaved drafts or checkout state. Confirm before navigating away if unsaved work would be lost.

## 5. RTL and script layout contract

Urdu, Arabic and Persian require full RTL support. Use semantic direction at document and component boundaries, with CSS logical properties rather than left/right assumptions.

- Mirror navigation order, drawer placement, breadcrumbs, pagination and directional icons where meaning is directional.
- Do not mirror logos, book covers, numerals, media controls or non-directional artwork.
- Keep mixed-direction text (URLs, email addresses, ISBNs, code, usernames and Latin titles) isolated with correct bidirectional handling.
- Search input, clear buttons, validation messages and caret placement must behave correctly in RTL.
- Reader page-turn controls must retain logical previous/next meaning and provide labels, not rely on icon direction alone.
- Tables, charts and timeline order must remain understandable; data chronology does not reverse.
- Validate Urdu Nastaliq/Naskh font fallbacks, Arabic shaping, Persian characters, punctuation and line wrapping.
- Never force RTL on an entire page merely because one user-generated paragraph is RTL.

## 6. Translation architecture and content workflow

- Use stable translation keys, not English copy as database keys.
- Separate source strings, locale catalogs and user-generated content.
- Support interpolation with named variables, pluralization, gender-neutral phrasing and locale-aware formatting.
- Avoid concatenating translated fragments to form sentences.
- Provide translators with context, screenshots, character limits and glossary terms.
- Maintain a product glossary for names such as Imperial Novel, Imperial Crowns, OmniPortal and Trend Factory. Brand/product names should not be machine-translated inconsistently.
- Translation changes are versioned and reviewed. Critical strings require a second reviewer.
- Do not pass user private content to an external translation provider without explicit policy, lawful basis and disclosure.
- Machine-translated novel content must be clearly labeled, opt-in, rights-safe and separately reviewed. Original text remains available.
- Search supports original titles, author-provided aliases and locale-specific normalization without overwriting canonical source text.

## 7. Locale-aware formatting

Use standards-based locale APIs and IANA time zones:
- Format dates and times according to selected locale and time zone.
- Store timestamps in UTC; never store localized display strings as source timestamps.
- Use locale-aware decimal/group separators and currency formatting.
- PKR payment amounts remain explicitly labeled PKR and use the approved currency precision.
- Do not convert prices using an assumed exchange rate.
- Use locale-aware collation for names and titles while preserving canonical identifiers.
- Support non-Latin input, Unicode normalization and safe search tokenization.
- Avoid hard-coded English month names, weekday abbreviations or plural suffixes.

## 8. Accessibility screen and component contract

Accessibility settings include:
- text size and reader line spacing;
- font selection and dyslexia-friendly options only where properly tested;
- high-contrast mode;
- reduced motion;
- persistent focus visibility;
- screen-reader-friendly reader controls;
- captions/transcripts for audio/video where offered;
- keyboard shortcuts with discoverable help and no conflict with assistive technology.

All product screens must:
- use semantic landmarks and heading hierarchy;
- have accessible names for icon-only controls;
- associate labels and validation messages with inputs;
- announce async status and errors appropriately;
- preserve focus after dialogs, route changes and form submission;
- support keyboard-only completion of primary journeys;
- avoid color-only status communication;
- provide text alternatives for charts and meaningful images;
- respect zoom/text enlargement without clipping;
- meet contrast requirements under all six reader themes;
- avoid motion that can cause discomfort and honor reduced-motion settings.

Target WCAG 2.2 AA. This is a target, not a conformance claim until audited.

## 9. Legal, privacy and rights screen registry

| ID | Route | Screen |
|---|---|---|
| LEG-001 | /privacy | Privacy notice |
| LEG-002 | /terms | Terms of service |
| LEG-003 | /copyright | Copyright and rights policy |
| LEG-004 | /legal/community-guidelines | Community guidelines |
| LEG-005 | /legal/content-policy | Content and age policy |
| LEG-006 | /legal/payment-terms | Crown/payment terms |
| LEG-007 | /legal/refunds | Refund and dispute policy |
| LEG-008 | /legal/cookies | Cookie and storage notice |
| LEG-009 | /legal/data-requests | Privacy request information |
| LEG-010 | /legal/accessibility | Accessibility statement |
| LEG-011 | /legal/third-party-services | Connected services and processors |
| LEG-012 | /legal/notice-and-takedown | Copyright/rights notice process |
| LEG-013 | /legal/transparency | Transparency and enforcement reporting |
| LEG-014 | /help/contact | Contact and support routes |

Existing /privacy, /terms and /copyright routes must be preserved. Proposed additional routes require legal review and route reconciliation.

Legal content must identify effective date, version, responsible entity/contact, applicable scope, change summary and archived prior version. Do not copy another platform's terms and present them as legal advice. Obtain qualified review for Pakistan and any other target markets before launch.

## 10. Privacy and consent experience

- Explain what data is collected, why, legal basis where applicable, retention, processors, cross-border transfers and user choices.
- Separate essential session/security storage from optional analytics, personalization and advertising technologies.
- Do not make optional tracking a condition of basic reading where not required.
- Provide accessible consent choices, including reject/accept/manage where consent is required.
- Remember consent version, choice, timestamp and policy version; allow users to change preferences later.
- Do not use dark patterns, pre-ticked optional controls or misleading button hierarchy.
- Provide account data export, correction and deletion request journeys subject to legal retention and security obligations.
- Explain that deletion may be delayed or limited for legally required financial/audit records, with clear categories and retention basis.
- Do not claim that a browser preference alone constitutes legally valid consent in every jurisdiction.
- Avoid loading optional third-party scripts before the applicable consent decision.

## 11. Translation, legal and policy quality gates

Critical translations requiring human review:
- authentication, password recovery and account security;
- payment, pricing, refund and dispute instructions;
- copyright, rights authorization and takedown notices;
- community safety, reporting and appeal decisions;
- privacy, consent and data deletion;
- age/content warnings and safety controls.

Machine translation may assist internal drafts but cannot publish these strings without review. Legal-language precedence must be explicit and reviewed; translated versions must not silently contradict the authoritative version.

## 12. Proposed API and data contracts

Logical contracts only:
- GET /api/v1/locales
- GET /api/v1/locales/:locale/coverage
- GET/PATCH /api/v1/me/preferences/locale
- GET/PATCH /api/v1/me/preferences/accessibility
- GET /api/v1/legal/documents
- GET /api/v1/legal/documents/:slug/:version
- POST /api/v1/privacy/requests
- GET /api/v1/privacy/requests/:id
- GET/PATCH /api/v1/privacy/consent
- GET /api/v1/translations/coverage

Conceptual entities: LocaleRegistry, TranslationCatalogVersion, TranslationReview, UserLocalePreference, AccessibilityPreference, LegalDocumentVersion, ConsentRecord, PrivacyRequest and PolicyAcknowledgement. Inspect actual D1 migrations and existing preferences before proposing schema changes.

## 13. Acceptance tests

1. Locale selection preserves route, reading position and safe form state.
2. Unsupported strings fall back cleanly and never display translation keys.
3. Urdu, Arabic and Persian layouts pass RTL navigation, form, search and reader tests.
4. Mixed-script titles, URLs and identifiers render in correct reading order.
5. Locale-aware date, number and currency formatting is deterministic.
6. UI language does not silently change novel content language.
7. Critical payment/legal/safety translations have recorded human review.
8. Keyboard-only users can complete sign-in, search, reading, authoring and checkout.
9. Screen readers announce labels, errors, dialogs and asynchronous status.
10. Text enlargement and 320px viewport do not hide primary actions.
11. All six reader themes meet tested contrast targets.
12. Reduced-motion preference disables nonessential animation.
13. Consent choices are accessible, persisted with version and changeable.
14. Optional third-party scripts respect consent policy.
15. Privacy requests are owner-scoped, auditable and handled under retention rules.
16. Legal documents expose effective date and version history.

## 14. Completion boundary

Localization, RTL, accessibility, legal and privacy experience architecture is specified. The existing language dictionary is only partial evidence of coverage. No translation catalog, legal text, consent manager, accessibility implementation, application source, production data, D1 schema, secret or deployment was changed.
