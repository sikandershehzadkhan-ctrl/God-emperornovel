# Imperial Novel: Sustainable Revenue Model

## Purpose

Imperial Novel is intended to become a sustainable business that can eventually generate income for its owner and fair compensation for participating creators. Revenue is a product requirement, not an afterthought. This document defines a conservative, zero-upfront-budget path. It is a planning and engineering policy, not a promise of earnings or legal advice.

## Non-negotiable safeguards

- Earn only from content, services, placements, and intellectual property that Imperial Novel has the right to use commercially.
- A creator must explicitly opt in to monetization and accept clear terms before their work is monetized.
- Never imply that views, uploads, or participation guarantee income.
- Never collect reader funds until a real payment provider, merchant onboarding, refunds, dispute handling, reconciliation, and applicable compliance checks are ready.
- Never expose a personal phone number, wallet, bank account, API key, or payment credential in public code.
- Keep creator balances, platform revenue, refunds, chargebacks, and pending funds distinct in accounting.
- Do not promise creator payouts until a lawful, reliable payout route exists and has been tested.
- Display prices, taxes/fees where applicable, renewal terms, refund rules, and what a purchase unlocks before checkout.
- No paid APIs, subscriptions, ad-free trial dependencies, or hidden recurring costs as part of the zero-budget launch.
- Obtain qualified advice on Pakistan's applicable business, tax, consumer, privacy, advertising, and payment obligations, and other jurisdictions where the service operates, before commercial launch.

## Revenue streams, in priority order

### 1. Contextual advertising on eligible pages

Potential first revenue stream once the site has sufficient genuine traffic and an ad provider accepts the site.

- Apply only to pages with lawful, commercially usable content and a compliant user experience.
- Clearly label advertisements; never disguise ads as chapter controls, recommendations, or creator content.
- Do not place ads where accidental taps are likely, over comic panels, or in ways that interrupt reading excessively.
- Do not encourage invalid clicks, self-clicks, artificial traffic, traffic exchanges, or misleading placements.
- Review provider eligibility, prohibited-content rules, privacy/consent requirements, payout thresholds, and Pakistan availability before integration.
- Ad income is variable and may be zero until eligibility, traffic, and payout conditions are met.

### 2. Creator-approved premium chapters and tickets

A future model for authorized creators who choose to sell access to eligible chapters.

- Keep ordinary free reading available; do not make the platform unusable without payment.
- Show exact ticket price and chapter access before purchase.
- Use a server-side ledger with immutable transaction references, idempotent payment callbacks, refund/reversal entries, and audit logs.
- Split gross receipts into provider fees, taxes/withholding where applicable, creator share, platform share, and refundable/pending amounts.
- Never credit tickets based only on a browser response or client-side request.
- Launch only after an approved merchant integration and tested payment/refund workflow exists.

### 3. Optional reader membership

A future subscription may offer clearly described benefits such as an ad-light/ad-free experience, reading organization, or optional community features. Do not sell access to content unless the platform has the relevant rights. No subscription should be activated until renewal, cancellation, refunds, taxes, and payment support are implemented and disclosed.

### 4. Reader support and creator tips

Optional support for creators or the platform may be introduced only through a supported, compliant provider. Distinguish donations/tips from purchases, disclose fees and refund treatment, and never imply that a tip buys rights to copyrighted content.

### 5. Sponsorships and disclosed affiliate links

Potential later streams include clearly labelled sponsorships and relevant affiliate links. Require written permission for sponsored use of creator work, disclose commercial relationships, verify partner terms, and do not let sponsorship purchase rankings or fake reviews.

## Phased plan

### Phase 0: Build trust before monetization

- Publish original or expressly licensed works.
- Establish content ownership and licence records.
- Build transparent community rules, copyright reporting, moderation, privacy and security.
- Measure real active readers and reading quality without inventing statistics.
- Keep payment endpoints and purchase controls disabled.

### Phase 1: Audience and ad readiness

- Review the chosen ad provider's current eligibility and terms.
- Add consent/privacy controls only as required by the applicable provider and law.
- Place limited, clearly labelled ads only after approval.
- Track page performance, ad complaints, and real revenue separately from traffic estimates.

### Phase 2: Creator economy foundation

- Creator onboarding and identity/rights declarations.
- Creator commercial terms and revenue-share schedule, shown before opt-in.
- Double-entry or equivalently auditable ledger design, payment event verification, refunds, chargebacks, and payout reconciliation.
- Admin review and dispute workflows.
- Provider and legal approval before accepting funds.

### Phase 3: Paid reader features

- Enable premium chapter tickets or memberships only for rights-cleared content and after end-to-end payment testing.
- Publish transparent pricing, creator shares, fees, cancellation, and refund policies.
- Start with a limited pilot and reconcile every transaction before wider rollout.

## Business metrics

Report only measured values, with date ranges and definitions:

- Monthly active readers and returning readers.
- Reading sessions and completed chapters.
- Rights-cleared published works and active creators.
- Ad impressions, fill rate, estimated revenue, finalized revenue, and payout status (kept distinct).
- Gross merchandise value, provider fees, refunds, chargebacks, creator payable, and platform net revenue.
- Hosting/operating cost and net operating result.

Never present projected revenue as money earned. Never fabricate readership, sales, creator earnings, ratings, or conversion rates.

## Current implementation boundary

The current application exposes a payment configuration that is disabled and explicitly says no approved merchant integration is configured. Preserve that safe state. This document does not activate payments, ads, subscriptions, ticket purchases, creator payouts, or any revenue stream. Each requires separate implementation, testing, provider approval, and legal review.

## Owner-income reality

Platform revenue is not automatically personal take-home income. Provider fees, refunds, taxes, operating costs, creator shares, and legal obligations must be accounted for first. There is no guaranteed income, especially at launch. The first objective is to build a trustworthy product and genuine readership without spending money the owner does not have.
