# Imperial Novel Unslop overrides

Read this file before any Unslop audit or edit in this repository. These product-specific rules override generic examples in the upstream skill where they conflict.

## Five-line direction
- **Product:** Imperial Novel helps readers discover and read stories and helps creators build and publish original worlds.
- **Character:** imperial, literary, cultivated, futuristic.
- **World:** a celestial imperial library with black-sun architecture, open gates, botanical gardens, natural landscapes and contemporary couture-level editorial craft.
- **Moments:** immersive story-world artwork and beautifully typeset reading/authoring surfaces; rich color belongs in meaningful covers, scenes, illustrations and selected visualizations.
- **Signature:** the black-sun crest and open-gate motif, used sparingly and consistently.

## Brand and palette
- Brand: **Imperial Novel**, motto **Read • Create • Conquer**. Repository and deployment names are infrastructure, never brand copy.
- Preserve the broad purple universe: Tyrian, royal, amethyst, electric, imperial, galaxy, cosmic, lavender, plum and Byzantine. Purple is a recognizable brand family, not a mandate to tint every surface.
- Core neutrals: warm reading paper #FDFBF7, pure white #FFFFFF, obsidian #0B1215, deep night #05070C, raised dark surface #151F24.
- Accents: imperial purple #6A0DAD, sapphire #0F52BA, emerald/green and restrained gold #C5A253.
- Rich purple, sapphire, green and gold may coexist in real story artwork where each color belongs to the subject. UI chrome stays calm.
- Text contrast must meet WCAG AA. Use accessible darker accent shades or neutral text where necessary.
- No generic purple-blue gradients, gradient text, neon glows, glass fog, decorative blobs, crypto-casino styling or rainbow accents.

## Product craft
- Reader surfaces are calm, low-glare, adjustable and content-first. Prioritize comfortable line length, font size, line height and paragraph spacing.
- Homepage is a literary world and discovery gateway, not a generic SaaS dashboard.
- Author Studio is a professional publishing atelier, not ornamental imperial chrome.
- Nature, architecture and modern fashion imagery must reinforce a real story, author identity or brand moment. No random scenery filler.
- Keep the black-sun crest and open-gate motif. Do not invent competing logo marks.
- Preserve real features, content order, routing, data, rights rules and workflows. Never invent features, metrics, testimonials, ratings or content.
- Do not add runtime dependencies just to apply this skill. Prefer existing components, tokens and icon systems.

## Accessibility, internationalization and devices
- WCAG 2.2 AA contrast, visible keyboard focus, reduced-motion support, semantic HTML and accessible names.
- Primary mobile controls target at least 44px.
- Preserve Urdu and Arabic RTL as first-class layouts: logical CSS properties, mirrored directional controls, mixed-script isolation and appropriate fonts. Read references/rtl.md before RTL work.
- Mobile performance matters, including lower-end Android. Avoid expensive blur, large animated layers, unnecessary shadows and layout animation.

## Workflow
- Audit the actual screen and source before editing. Do not assume a defect from code alone when a render is available.
- Keep working features and section order. Do not redesign a good screen just to make it different.
- Work one focused screen/component at a time, complete each pass, then verify.
- Report exactly what changed and what was tested. A build pass is not visual QA; a branch commit is not production deployment.
