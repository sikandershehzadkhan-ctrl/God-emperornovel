# ADR-0028: Separate interface locale direction from reader content direction

- **Date:** 2026-11-20
- **Status:** Accepted
- **Related:** ADR-0025, ADR-0027, and `IMPERIAL-ROUTE-REGISTRY-01N.json`

## Context

The interface supports 14 language choices, including Urdu, Arabic, and Persian. Previously, document direction was set to RTL only for Urdu and Arabic. The reader content container did not independently set direction from the work language, so an English interface could force an RTL chapter into an LTR reading context.

## Decision

The interface direction is now determined by the selected UI language through a direction resolver. The reader content container independently derives its `dir` attribute from the novel/work language. RTL recognition includes language codes and common language names for Arabic, Persian/Farsi, and Urdu.

This preserves the distinction between the creator/reader interface locale and the language of the story being read.

## Validation

The route-registry test verifies the 14 UI language choices against the manifest, checks the RTL language set, confirms the UI direction resolver is used, and confirms the reader content container uses the work language.

## Evidence boundary

The current reader data model supplies language at the novel/work level. Mixed-language chapters within one novel would need a chapter-level language field and override. Visual RTL rendering still requires browser testing with real Urdu, Arabic, and Persian chapter samples. No database schema or production deployment is changed.
