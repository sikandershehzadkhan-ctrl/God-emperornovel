# Design foundation integration QA

Integration branch: `integration/design-foundation-ssr-17-60`
Base: homepage SSR candidate `45f5b9e2d8143da207bdb73885fecc30ec2a8f76`

## Integrated source

- Shared stylesheet: `public/imperial-design-foundation.css`
- Public HTML templates: 25
- Global themes: light, dark, sepia, midnight, imperial, cosmic
- Persistent accessibility preferences: reduced motion, high contrast, compact cards
- Author Studio and Admin action controls enforce 44px minimum height
- Saved global theme initializes the mounted navigation toggle's icon and accessible label
- Runtime parity: `public/app.js` and `public/app-17.23.0.js`
- Regression suite: `scripts/test-design-foundation-isolated.mjs`
- Gates: `npm run build` and `npm run check:cloudflare-readiness`

## Required release QA

1. Run the full Cloudflare Source Validation workflow.
2. Confirm the design regression suite passes, including 44px author/admin targets and saved-theme toggle initialization.
3. Inspect desktop and mobile layouts at 1440px and 390px.
4. Inspect Urdu and Arabic RTL layouts.
5. Confirm all six themes apply and persist after reload.
6. Confirm reduced-motion, high-contrast and compact-card preferences persist.
7. Confirm author/admin scoped styling does not leak into unrelated routes.
8. Confirm homepage SSR and private-route noindex behavior remain intact.

No production deployment or D1 migration is part of this integration branch.
