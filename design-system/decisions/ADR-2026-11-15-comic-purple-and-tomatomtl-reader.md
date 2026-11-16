# Imperial Novel visual identity expansion and reader-settings benchmark

- Date: 2026-11-15
- Status: Proposed product direction, pending design-token implementation and visual QA
- Canonical implementation lane: design-system 18.0.0 / PR #295
- Scope: brand palette family and Reader settings; no runtime behavior changed by this ADR

## 1. Brand direction

The product owner has requested a comic-book purple-led identity, paired with pure warm white, black, and supporting colors. The purple family is intentionally broad and expressive:

- Tyrian
- Royal
- Amethyst
- Electric
- Imperial
- Galaxy
- Lavender
- Plum
- Byzantine

These are semantic brand shades, not nine competing primary colors. Establish a controlled ramp with role assignments:

- Imperial Purple: primary brand/action anchor
- Tyrian and Byzantine: deep editorial/authority accents
- Royal and Amethyst: secondary emphasis and selected states
- Electric: rare high-energy CTA/focus accent, never body text on a dark surface without contrast validation
- Galaxy: cosmic/deep-surface accent
- Lavender: soft tint, selected backgrounds and reader highlights
- Plum: depth, gradients and decorative details

Warm white is the preferred light reading canvas; black/near-black anchors dark themes. Keep the palette premium and comic-inspired rather than rainbow-like. Use gradients sparingly and only as decorative enhancement.

### Proposed starting swatches (must be checked against final semantic pairs)

| Name | Starting hex | Intended use |
|---|---|---|
| Tyrian | #63003C | Deep authority accent |
| Royal Purple | #7851A9 | Secondary brand shade |
| Amethyst | #9966CC | Soft saturated purple |
| Electric Purple | #BF00FF | Rare high-energy accent |
| Imperial Purple | #6A0DAD | Primary brand anchor |
| Galaxy | #2B145A | Cosmic/deep accent |
| Lavender | #B57EDC | Soft accent and tint source |
| Plum | #673147 | Warm deep purple |
| Byzantine | #7B1FA2 | Rich secondary purple |
| Pure warm white | #FFFDF7 | Reading canvas |
| Obsidian black | #0B0A10 | Dark canvas / ink foundation |

These are design proposals, not yet approved production token values. Contrast must be tested for each foreground/background pairing; saturated purple shades must not automatically become text colors.

## 2. Semantic role rules

- Warm white and paper neutrals own long-form reading surfaces.
- Obsidian/black own dark application surfaces.
- Imperial Purple owns the primary brand action.
- Other purple shades provide hierarchy, emphasis and decorative depth.
- Blue/cyan, green, amber, red and neutral grays remain available as supporting semantic colors for links, information, success, warning, danger and metadata. Status meaning must never be conveyed by purple alone.
- Preserve six distinct global themes already defined by the design-system contract; do not collapse global themes into reader themes.
- Reader themes remain independently selectable and independently persisted.

## 3. TomatoMTL benchmark: verified scope

Research performed against TomatoMTL public pages on 2026-11-15:

- `/settings` visibly exposes a translation-language selector with a broad language list, including Urdu, Arabic and Persian.
- It exposes user-provided translation models (OpenAI-compatible LLM or DeepLX endpoint), described by TomatoMTL as encrypted and stored in that browser, with add/export/import controls and an explicit warning that exported JSON may contain plain API keys.
- It exposes text-to-speech engine selection: Browser SpeechSynthesis, Bing TTS, Google TTS and TikTok TTS.
- Voice selection is available for the selected engines; speech speed and tone controls and a test-speech action are visible.
- The public chapter page currently requires login to view chapter content. Its accessible HTML shell includes a translation box with a replacement-after-translation action, a speak-current-line action, and a background-settings modal placeholder. The actual logged-in chapter controls and modal contents could not be verified without an authenticated session.

Do not claim that TomatoMTL's public settings page provides font size, line spacing, reading width, brightness or auto-scroll controls; those were not visible in the fetched settings page.

## 4. Imperial Novel Reader settings target

Keep reader controls separate from account/global appearance settings. Deliver these controls in a compact mobile-first reader toolbar plus an expanded settings sheet:

### Reading appearance
- Reader theme: Paper, Dark, Midnight, Sepia, Imperial, Cosmic; allow user-defined accent only if it preserves readable paper/ink contrast.
- Warmth/brightness control where supported by the theme; do not use brightness to make text fail contrast.
- Font family: readable serif and sans-serif system choices, with script-aware fallbacks for Urdu, Arabic and Persian.
- Font size, line height, paragraph spacing and reading-column width.
- Text alignment and direction; auto-detect chapter direction while allowing manual override. Creator text language and reader UI language remain independent.
- Persistent preferences, preview, reset-to-default and per-device/account sync behavior clearly explained.

### Reading behavior
- Continuous scroll and paginated/page-turn mode where technically reliable.
- Auto-scroll with start/pause, speed control and a persistent stop control.
- Immersive/fullscreen mode and hide/show reader chrome.
- Reduced motion and animation intensity, respecting system preferences.
- Previous/next chapter, chapter list, reading progress and resume position.
- Bookmark current chapter and optional passage bookmarks/notes; comments remain separate from personal notes.

### Audio and translation (TomatoMTL-inspired, not a copy)
- Text-to-speech with browser-native engine as a zero-cost baseline; show only voices actually available on the device.
- Speech speed, pitch/tone only where the selected engine supports them, voice preview, play/pause/stop and current-line playback.
- Translation language preference separate from UI language and original chapter language.
- Translation action must be explicit and rights-aware; never silently replace creator-authored chapter text.
- Optional bring-your-own translation provider may be considered later. Never store API keys in plaintext exports; use an explicit security model and warn about third-party provider data handling before enabling.
- Glossary/term lookup can be a separate reader tool.

## 5. Acceptance criteria

- All reader controls work on a real chapter, not merely on a settings mockup.
- Settings persist across chapter navigation and reload; account sync behavior is explicit.
- Urdu/Arabic/Persian use correct RTL direction and script-appropriate typography without forcing the entire UI into RTL.
- Keyboard and screen-reader operation, visible focus, 44px touch targets, reduced motion and WCAG 2.2 AA contrast are tested.
- Mobile performance is validated on lower-powered Android devices; no required blur, animation or remote font download.
- Reader preferences remain backward-compatible with existing saved preference keys.
- TomatoMTL is used as a feature benchmark only. Do not copy its branding, text, code, content or visual layout.

## 6. Release status

This ADR records direction and benchmark findings only. No application code, reader behavior, account preference, database schema or production deployment is changed by this document. Implementation must be split into testable reader feature slices and integrated through the existing design-system PR #295.
