# ADR-0039: Migrate OmniPortal Read Dependencies Before Removing GET Setup

- **Status:** Proposed
- **Date:** 2026-11-20
- **Scope:** OmniPortal connector events, import jobs, recommendations, and authorization requests

## Context

The former GET handlers called ensureOmniTables, which lazily created tables and connector columns during read requests. Removing those calls makes the endpoints side-effect-free, but only if every table queried by the GET routes exists independently of request execution.

## Decision

Provision connector_events, import_jobs, recommendations, and connector_authorization_requests through migration 0048. Use CREATE TABLE IF NOT EXISTS and CREATE INDEX IF NOT EXISTS so the migration safely handles databases where the previous lazy initializer already created these exact tables. Do not add connector columns in this migration because their presence in existing D1 environments must be verified by the read-only production audit before any column migration is designed.

The public OmniPortal status/search routes and authenticated jobs/recommendation routes remain read-only. Admin connector management may continue to initialize optional connector configuration columns and seed the connector registry behind its admin authorization boundary.

## Consequences

- Read routes no longer perform DDL or seed data.
- The base schema includes the tables those read routes query.
- Existing runtime-created support tables are not duplicated.
- Optional connector configuration column drift remains an explicit production audit item.

## Verification

scripts/test-omni-schema-migration.py verifies table/index presence and safe replay. The OmniPortal read-only and GET method contract tests verify that read handlers do not call schema setup and reject unsupported methods. Production D1 inventory remains required before release.
