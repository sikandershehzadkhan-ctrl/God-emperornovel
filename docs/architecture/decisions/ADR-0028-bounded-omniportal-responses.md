# ADR-0028: Bounded OmniPortal connector responses

- Status: proposed for canonical integration
- Date: 2026-11-05
- Owner: platform-kernel

## Context

OmniPortal searches only enabled connectors with an authorized rights status and an allowlisted HTTPS search URL. The request already has a timeout and manual redirect handling, but the Worker previously called \`Response.json()\` directly. That buffers an external response without an application-enforced body-size limit or a strict JSON content-type check.

A connector can therefore return an unexpectedly large body, non-JSON content, or malformed data. The search query and number of external providers also need explicit bounds to prevent avoidable work amplification.

## Decision

1. Parse external connector responses through \`readBoundedJsonResponse\`.
2. Accept only JSON media types, including vendor \`+json\` types.
3. Enforce a 1 MiB maximum using both the declared content length and streamed byte count.
4. Decode UTF-8 strictly and reject malformed JSON.
5. Limit search text to 120 characters and fan out to at most eight enabled, rights-authorized connectors per request.
6. Treat an invalid, failed, or oversized provider response as unavailable; preserve the local catalog result and do not persist the external response.
7. Keep the existing connector HTTPS allowlist, authorization status, timeout, redirect policy, result normalization and deduplication.

## Consequences

- External provider response memory use is bounded per connector.
- One malformed provider cannot make the Worker parse an unbounded response.
- Provider fan-out and query input have explicit limits.
- No database table, migration, secret, payment, chapter-body ingestion or production data change is introduced.
- The limit is a per-provider response limit, not a promise that the total request uses only 1 MiB across all providers.

## Verification

The mandatory build tests JSON media types, successful status, declared and streamed size limits, missing bodies, strict UTF-8 decoding, malformed JSON, query length, provider fan-out and preservation of the rights-authorization filter.
