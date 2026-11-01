# Imperial Novel | Phase 01M.4: Commerce, Crowns & Payments

**Brand:** Read • Create • Conquer  
**Branch:** architecture/phase-01m-screen-blueprint  
**Status:** Architecture specification only. No payment provider is activated.

## 1. Trust rules

- A submitted payment reference is pending until verified against authoritative provider evidence or a secure, validated provider callback.
- Never claim money was received or Crowns credited before the ledger transaction commits.
- EasyPaisa must remain unavailable or explicitly setup-pending until merchant onboarding, provider terms, secure credentials, callback verification, reconciliation and test transactions are approved.
- Requested pack price points are PKR 10, 25, 50 and 100. They are not proof of an active merchant integration or approved Crown exchange rate.
- Purchases, donations, promotional credits and staff adjustments are separate accounting categories.
- Use integer minor currency units and integer Crown units. Never use floating-point arithmetic for balances.
- Every balance movement has a unique immutable ledger entry. Corrections use compensating entries.
- Chapter unlocks are idempotent and atomic with the debit.
- Legal, finance and provider-terms review is required before launch.

## 2. Repository evidence (read-only)

Inspection of src/index.js on this branch found:
- POST /api/donations requires authentication, rejects duplicate transaction references and creates a pending donation record.
- POST /api/payment/webhook currently returns 503 and states automated confirmation is disabled pending provider-specific verification and replay protections.
- GET /api/admin/donations is admin-gated.
- GET /api/tickets/ledger returns the signed-in user's ledger history.
- POST /api/admin/tickets validates whole-number Crown adjustments and writes a ledger entry.
- POST /api/chapters/:id/unlock and POST /api/novels/:id/batch-unlock check authentication and balance, create unlock records and record ticket debits. Existing unlocks are handled without charging again.
- Batch unlock sizes currently accepted are 10, 25, 50 and 100 chapters. These are quantities, not PKR pack prices.
- An earlier inspected /api/config response reported payments disabled pending approved merchant integration.

This does not prove production parity, EasyPaisa activation, automated purchases, refunds or payouts. No live payment test or production configuration inspection was performed.

## 3. User screen registry

| ID | Route proposal | Screen |
|---|---|---|
| COM-001 | /tickets | Crown Vault and balance |
| COM-002 | /tickets/packs | Pack selection |
| COM-003 | /tickets/checkout | Order review and payment method |
| COM-004 | /tickets/payment/:orderId | Instructions and reference submission |
| COM-005 | /tickets/payment/:orderId/status | Payment/credit status |
| COM-006 | /tickets/history | Purchase history |
| COM-007 | /tickets/ledger | Crown ledger |
| COM-008 | /tickets/receipt/:transactionId | Receipt |
| COM-009 | /tickets/help | Payment help |
| COM-010 | /tickets/refunds | Refund policy |
| COM-011 | /tickets/refund-requests | User refund cases |
| COM-012 | /tickets/refund-requests/:id | Refund case detail |
| COM-013 | /account/balance | Account balance |
| COM-014 | /account/transactions | Categorized transaction history |
| COM-015 | /checkout/return | Safe provider return landing |

Keep existing /tickets compatible. Route aliases and canonical paths must be reconciled before implementation.

Crown Vault shows balance, last-updated time, eligible uses, ledger access and payment availability. Pack selection shows exact PKR total, Crown quantity, fees/taxes and price version. No fabricated “best value” savings or urgency timers. Checkout snapshots the approved pack price server-side and requires explicit confirmation.

Payment instructions show verified payee details, exact amount, unique reference and expiry only for an approved method. Reference submission remains pending. Status history shows timestamps and reviewer/provider outcome. A browser return URL is never proof of payment.

## 4. Staff and finance screen registry

| ID | Route proposal | Screen | Permission |
|---|---|---|---|
| FIN-001 | /admin/finance | Finance overview | finance.read |
| FIN-002 | /admin/finance/orders | Orders | finance.orders.read |
| FIN-003 | /admin/finance/orders/:id | Order review | finance.orders.review |
| FIN-004 | /admin/finance/payments | Verification queue | finance.payments.review |
| FIN-005 | /admin/finance/payments/:id | Payment evidence and decision | finance.payments.verify |
| FIN-006 | /admin/finance/donations | Donations | finance.donations.read |
| FIN-007 | /admin/finance/donations/:id | Donation review | finance.donations.review |
| FIN-008 | /admin/finance/ledger | Ledger search | finance.ledger.read |
| FIN-009 | /admin/finance/refunds | Refund queue | finance.refunds.review |
| FIN-010 | /admin/finance/refunds/:id | Refund decision | finance.refunds.approve |
| FIN-011 | /admin/finance/providers | Provider configuration | finance.providers.manage |
| FIN-012 | /admin/finance/reconciliation | Settlement reconciliation | finance.reconciliation.run |
| FIN-013 | /admin/finance/pricing | Pack price versions | finance.pricing.manage |
| FIN-014 | /admin/finance/audit | Financial audit | finance.audit.read |
| FIN-015 | /admin/finance/adjustments | Compensating adjustments | finance.adjustments.approve |
| FIN-016 | /admin/finance/reports | Finance reports | finance.reports.read |

Support, payment review, provider configuration, adjustment approval and audit are separate duties. High-risk credits, refunds, pricing changes and provider changes require dual approval and step-up authentication.

## 5. EasyPaisa activation gate

Do not invent API endpoints, credentials or callback formats. Enable EasyPaisa only after:
1. Merchant/business onboarding and settlement account approval.
2. Official merchant documentation and terms review.
3. Production credentials stored as Cloudflare secrets, never source, plaintext D1 or browser code.
4. Authenticated server-to-server verification or signed callback.
5. Signature, timestamp, merchant/order identity, amount, currency and unique event validation.
6. Replay protection, idempotency and callback recovery.
7. Settlement reconciliation, refund/dispute process and support ownership.
8. Sandbox and low-value production tests with audit evidence.

If any gate is unmet, the UI says unavailable/setup pending, not “Pay with EasyPaisa”.

## 6. Conceptual transaction and ledger model

These are conceptual entities, not migration instructions:
- CommerceProduct and PriceVersion: pack, amount, currency, Crown quantity, effective dates and approval.
- CommerceOrder: user, product snapshot, amount, currency, status and idempotency key.
- PaymentAttempt and PaymentEvent: provider, external reference, event identity, signature result and processing outcome.
- PaymentEvidence: restricted evidence reference, uploader, hash and retention.
- CrownLedgerEntry: immutable integer delta, reason, unique reference and actor/source.
- ChapterEntitlement: user, chapter, order/ledger reference and entitlement state.
- RefundRequest, RefundEvent, SettlementBatch, ReconciliationItem and FinancialAuditEvent.

A unique event/order reference prevents duplicate credit. Ledger and materialized balance must reconcile. Balance, ledger and entitlement changes must be atomic where applicable. A mismatch pauses automatic credit and creates a reconciliation case. Secrets never belong in ordinary D1 rows.

## 7. Purchase, unlock and donation workflows

Purchase: select pack → server snapshots approved price → create order and unique payment attempt → provider payment → verify authoritative evidence → mark payment verified → write one idempotent Crown credit → mark order credited → issue receipt → reconcile settlement.

Unlock: show chapter/batch cost → server recalculates cost and balance → verify no existing entitlement → atomically debit and grant entitlement → serve protected chapter. Concurrent requests cannot overspend; repeated requests cannot charge twice.

Donations remain separate from purchases. A donation that grants Crowns is a paid-benefit product, not a pure donation. Donation submissions remain pending until verified. Duplicate references are rejected. Decisions record reviewer, timestamp, evidence and reason.

Refund eligibility depends on applicable law, provider rules, product delivery and published policy. Refund flow: user request → eligibility check → staff review → provider refund → provider confirmation → compensating ledger entry where applicable → status/receipt. Never delete original payment or ledger evidence. Reports distinguish gross sales, provider fees, refunds, net settlement, donations and outstanding Crown liability.

## 8. Proposed API families (not existing-route claims)

- GET /api/v1/commerce/packs and /api/v1/commerce/prices
- POST /api/v1/commerce/orders and GET /api/v1/commerce/orders/:id
- POST /api/v1/commerce/orders/:id/payment-attempts
- POST /api/v1/commerce/providers/:provider/events
- GET /api/v1/crowns/balance and /api/v1/crowns/ledger
- POST /api/v1/commerce/refund-requests
- Staff APIs for payment/donation review, reconciliation, refunds, pricing, provider configuration and audit.

Financial writes require server authorization, strict validation, CSRF protection for cookie sessions, rate limits, idempotency, audit and state validation. Provider callbacks authenticate server-to-server. A browser redirect cannot mark an order paid.

## 9. Status freshness

Payment status is request-time or bounded polling until push is implemented. Responses include server timestamp and state. Polling pauses for hidden tabs and backs off. Persisted order state is authoritative after reconnect. “Paid” appears only after verification; “Crowns added” appears only after ledger confirmation. Delayed provider response means awaiting confirmation, not assumed success or failure.

## 10. Acceptance tests

1. Pending manual reference never credits Crowns.
2. Duplicate order/idempotency key creates one order.
3. Duplicate provider event cannot credit twice.
4. Wrong signature, amount, currency or order identity is rejected.
5. Replayed callback cannot change a completed order.
6. Browser redirect cannot mark payment paid.
7. Concurrent credit cannot duplicate ledger entries or create negative balances.
8. Ledger/balance consistency survives transaction-boundary failures.
9. Users cannot read another user's order, evidence or receipt.
10. Staff cannot self-approve restricted high-risk actions.
11. Refunds use compensating events; original ledger entries remain immutable.
12. Batch unlock price is recalculated server-side and cannot overspend.
13. Existing entitlement is not charged again.
14. Missing provider configuration keeps the method unavailable.
15. EasyPaisa is not advertised active before merchant and callback tests pass.
16. Reports separate sales, fees, refunds, net settlement, donations and Crown liability.

## 11. Decisions and implementation gates

Approve Crown quantity per pack, expiry, fees and tax; verify EasyPaisa merchant onboarding and official integration contract; decide whether manual wallet/bank verification is permitted; approve refund/dispute policy; define finance thresholds and reconciliation cadence; inspect historical D1 migrations and production configuration; verify donation review handlers and ledger schema; reconcile all relevant feature-branch routes against production.

## 12. Completion and evidence boundary

Commerce screens, Crown purchase/ledger contracts, manual payment boundaries and EasyPaisa activation gates are specified. EasyPaisa, automated purchases, refunds and payouts are not verified operational. No payment, donation, balance, ledger entry, D1 schema, secret, application source or deployment was changed. Documentation only.
