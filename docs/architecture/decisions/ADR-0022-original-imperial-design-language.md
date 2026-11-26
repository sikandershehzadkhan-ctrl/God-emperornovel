# ADR-0022: Establish an original Imperial Novel design language

- **Status:** Proposed
- **Date:** 2026-11-26
- **Decision owners:** Design-system owner and frontend platform owner

## Context

Imperial Novel needs a coherent and recognisable product identity across discovery, long-form reading, creator tools, community, and administration. Existing design notes describe individual release directions, but the product needs one explicit originality boundary and a durable specification that distinguishes brand expression from general usability conventions.

The platform also serves long-form multilingual fiction, including RTL chapter content, on mobile devices. Visual identity must not compromise reading comfort, accessibility, or performance.

## Decision

Adopt `design-system/IMPERIAL-NOVEL-ORIGINAL-DESIGN-LANGUAGE.md` as the foundation specification for original product design. The specification defines an Imperial Novel-authored visual grammar, semantic theme tokens, typography and reading controls, component requirements, motion principles, RTL support, and evidence-based release gates.

Competitor research may inform broad usability lessons only. It must not be used to reproduce protected expression, distinctive layouts, illustrations, icons, copy, or brand identity. Existing assets are not presumed original or licensed; they require separate provenance review.

## Consequences

- New screens should use semantic design tokens and documented shared components.
- The bespoke Open Archive motif is a direction for original design work, not a completed or legally cleared logo.
- Each theme and component requires implementation-level accessibility and responsive testing.
- Visual release claims require real-browser evidence; a written specification or successful build is not visual QA.
- Third-party libraries/assets retain their own licence and attribution requirements. Creator-submitted works remain governed by creator agreements and are not transferred by this design decision.

## Release boundary

This ADR and the accompanying design specification establish policy and design direction only. They do not change runtime code, public assets, database schema, Worker configuration, secrets, or production deployment.
