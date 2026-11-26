# Imperial Novel: original design language

- **Status:** Foundation specification, not a claim that every screen has been implemented.
- **Product:** Imperial Novel
- **Motto:** Read • Create • Conquer
- **Purpose:** Define a recognisable visual and interaction language authored for Imperial Novel.

## 1. Originality boundary

This system must be designed and implemented as Imperial Novel's own expression. Competitor products may be studied only to understand broad usability problems and common user expectations. Do not reproduce another product's page composition, distinctive component styling, iconography, illustrations, copy, animation, or visual identity. Do not trace screenshots or use competitor assets as templates.

The names below describe our own design concepts. They are not permission to copy any existing crest, seal, palace, book platform, game interface, or luxury brand.

## 2. Brand character

Imperial Novel should feel like a contemporary literary institution with a confident digital craft:

- **Authoritative:** clear hierarchy, deliberate spacing, restrained visual emphasis.
- **Literary:** generous reading measure, calm surfaces, typography that serves long-form text.
- **Futuristic:** precise geometry and useful motion, never ornamental dashboard clutter.
- **Welcoming:** approachable language, visible discovery paths, no gatekeeping tone.
- **Reader-first:** reading comfort overrides decorative brand treatment.

The brand voice is concise, vivid, respectful, and internationally understandable. Avoid inflated claims, fake popularity, manipulative urgency, and generic fantasy boilerplate.

## 3. Original visual motif

Develop a bespoke **Open Archive** visual grammar: a central aperture or open-gate form framed by asymmetric orbital/arch geometry. It represents a world opening through reading and creation. The motif must be drawn as original vector geometry and tested at favicon, app-icon, and large editorial sizes.

A black-sun / empty-throne direction may be explored as an original abstract symbol, but no historical coat of arms, royal seal, religious mark, game emblem, or third-party logo may be traced or approximated. The final mark requires a separate originality review and small-size legibility test. Until approved, existing marks are not automatically certified as original.

## 4. Core colour tokens

These are initial product tokens, not a guarantee that every existing page already uses them. Components must consume semantic tokens rather than hard-coded brand colours.

| Token | Value | Intended role |
| --- | --- | --- |
| `--in-obsidian` | `#0B1215` | Core dark surface |
| `--in-white` | `#FFFFFF` | Clean light surface |
| `--in-purple` | `#6A0DAD` | Authoring / creative emphasis |
| `--in-sapphire` | `#0F52BA` | Discovery / navigation emphasis |
| `--in-reading-paper` | `#FDFBF7` | Warm long-form reading surface |
| `--in-dark-card` | `#151F24` | Elevated dark surface |
| `--in-dark-text` | `#E8EDEF` | Primary text on dark |
| `--in-dark-purple` | `#C08AFF` | Accessible dark-theme creative accent |
| `--in-dark-blue` | `#6AA5FF` | Accessible dark-theme discovery accent |

### Semantic roles

Every theme must define, at minimum: page, surface, surface-raised, surface-sunken, text, text-muted, border, primary, primary-foreground, secondary, focus, success, warning, danger, and disabled. Semantic status must never be conveyed by colour alone.

## 5. Theme behaviour

The product may expose Light, Dark, Midnight, Sepia, Imperial, and Cosmic themes. Each theme must be a complete semantic-token map, not a collection of scattered overrides.

- **Light:** neutral white application surfaces; warm paper is reserved for reading.
- **Dark:** softened obsidian surfaces with legible cool-white text.
- **Midnight:** deeper low-glare surfaces, with carefully restrained blue/violet accents.
- **Sepia:** warm low-contrast reading atmosphere while preserving text clarity.
- **Imperial:** signature purple/sapphire accents used sparingly and consistently.
- **Cosmic:** a dark reading-safe palette; no animated starfield or high-energy background by default.

Theme changes must not alter content meaning, reading progress, language direction, or keyboard focus. Persisted preference must have a safe default and must not cause a flash of unreadable text.

## 6. Typography and reading

- Use a small, documented type family set with verified licences and reliable fallbacks.
- Separate interface typography from long-form reading typography where that improves comfort.
- Provide adjustable reader font size, line height, content width, paragraph spacing, and reading background.
- Use a comfortable line length and avoid dense full-width paragraphs on phones.
- Urdu, Arabic, and Persian chapter content must support RTL independently of the interface language; mixed-direction punctuation and inline Latin text must be tested.
- Never use typography as a substitute for semantic HTML or accessible labels.

## 7. Layout and component grammar

Use a consistent spacing scale, a restrained radius scale, clear borders, and predictable responsive breakpoints. Avoid arbitrary per-page values.

Core component families to standardise include:
- Global navigation and mobile navigation
- Search and discovery filters
- Story cards and editorial shelves
- Chapter reader and reader controls
- Author profile and creator workspace
- Forms, validation, dialogs, alerts, and toasts
- Tables, moderation queues, and admin controls

Each component specification must define purpose, anatomy, variants, states, responsive behaviour, keyboard interaction, accessible name, and empty/error/loading states. Shared components must not contain page-specific business logic.

## 8. Motion and interaction

Motion is functional feedback, not decoration. Prefer short, restrained transitions for state changes. Respect `prefers-reduced-motion`; never make essential information depend on animation. Touch targets should be at least 44 by 44 CSS pixels where practical, with visible focus and clear disabled states.

## 9. Accessibility and verification

- Meet WCAG 2.2 AA contrast requirements for text and controls.
- Test keyboard-only navigation, visible focus, screen-reader names, zoom/reflow, forced-colours mode, and reduced motion.
- Test phone widths first, then tablet and desktop.
- Verify English LTR and Urdu/Arabic RTL, including mixed-direction chapter content.
- Capture real screenshots from the running application before calling a visual release complete.
- Do not claim a design is implemented, accessible, original, or production-ready based only on this specification.

## 10. Original asset and ownership workflow

Every bespoke mark, illustration, icon, animation, and marketing visual must have an identifiable creator and source file. Record creation date, author, source/provenance, modifications, and any third-party inputs. Third-party libraries and assets remain subject to their own licences and notices. Creator-submitted fiction and artwork remain subject to the creator agreement; this design specification does not transfer their rights to the platform.

## 11. Release gate

A screen may be labelled **Imperial Novel design-system compliant** only after:
1. It uses the approved semantic tokens and shared component grammar.
2. Its visual assets have documented provenance and licence status.
3. It passes responsive, keyboard, contrast, and RTL checks relevant to that screen.
4. A real-browser visual review has been recorded.
5. No protected third-party expression has been copied or traced.

Until those checks are recorded, label the work as a draft or implementation candidate.
