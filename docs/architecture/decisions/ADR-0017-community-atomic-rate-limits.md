# ADR-0017: Atomic community quotas and published engagement boundaries

- **Status:** Proposed
- **Date:** 2026-11-05
- **Decision owners:** Community domain, platform kernel and platform data

## Context

The existing comment and report handlers use application-level count-then-insert checks. Concurrent requests can both observe a count below the limit and exceed the intended ceiling. Report duplicate checks have the same race. Numeric coercion also accepts some malformed identifier representations.

The current runtime feature schema is already at version 2 for reader progress. Community schema additions therefore require a monotonic version 3 upgrade, not reuse of version 2.

## Decision

1. Enforce the 10-per-user rolling-hour comment and report quotas with SQLite BEFORE INSERT triggers so the check and event write occur in the same database statement.
2. Serialize duplicate report claims with a primary key on `(user_id, comment_id)`; backfill existing reports with `INSERT OR IGNORE` before enabling the trigger.
3. Prune expired rate-limit events after both comment and report inserts. Every trigger must contain executable SQL; empty trigger bodies are forbidden.
4. Advance `runtime_feature_schema_version` from v1/v2 to v3 only after all additive tables, indexes, backfill and triggers are installed.
5. Accept only positive safe-integer identifiers (or digit-only strings) on comment, like, report and follow writes.
6. Require visible comments and published rights-eligible novels for public comment engagement targets.

## Consequences

- Concurrent writes cannot bypass the hourly quota by racing application-level count checks.
- Duplicate reports are fenced by a database uniqueness constraint.
- The v2-to-v3 upgrade is additive and preserves reading-position tables and existing comments/reports.
- No numbered migration is allocated; this feature uses the established runtime feature-schema bootstrap and its monotonic version marker.

## Validation

The JavaScript tests cover identifier and handler boundaries. The Python concurrency test executes the exact trigger SQL literals from the runtime schema source, verifies quota and duplicate-claim behavior, checks legacy backfill, and confirms event pruning. The runtime schema test explicitly covers v2-to-v3 upgrade.
