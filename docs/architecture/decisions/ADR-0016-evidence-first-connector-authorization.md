# ADR-0016: Evidence-first connector authorization

- **Status:** Accepted for the foundation branch, pending PR review
- **Date:** 2026-11-19

## Context

The admin connector creation endpoint marked new connectors as authorized immediately, while the admin interface and connector authorization request workflow required rights evidence, terms, and an explicit review decision before enabling a provider. This allowed the initial registration path to bypass the platform's stated rights-first policy.

## Decision

New connector registrations are created disabled with `rights_status='pending'`. Registration is not authorization. A connector may become authorized only through an explicit admin rights update with evidence or terms recorded, or through the authorization-request review flow after evidence, terms, or rights notes are submitted and reviewed. Authorization still does not enable the connector automatically.

## Consequences

- New connectors cannot be used for search/import until separately enabled after rights review.
- Existing connector records are not rewritten by this change.
- The application can validate the presence of evidence references, but a human administrator remains responsible for verifying the source's actual license and permitted uses.
- The build includes a regression contract for pending-first registration and evidence-gated approval.
