# ADR-0035: Explicit method contracts for OmniPortal read endpoints

- **Status:** Proposed
- **Date:** 2026-11-20
- **Scope:** GET /api/omni/status, GET /api/omni/search, GET /api/omni/jobs, and GET /api/recommendations

## Context

These endpoints are read operations. Before this change, their route branches did not consistently constrain the HTTP method, allowing unsupported methods to enter GET-style handlers rather than receiving a clear method response.

## Decision

Declare GET as the only supported method for the four read endpoints. Return HTTP 405 with an Allow: GET response header for every other method. Keep the existing authentication boundary for private import-job and recommendation reads.

## Consequences

- Clients receive an explicit method error rather than a read response to POST/PUT/PATCH/DELETE.
- Private read endpoints remain authenticated.
- This decision covers only the four named endpoints; it is not a complete API-wide method matrix.

## Validation

scripts/test-omni-read-method-contracts.mjs is included in the build gate and checks the 405/Allow guards. CI and runtime request tests remain required before merge.
