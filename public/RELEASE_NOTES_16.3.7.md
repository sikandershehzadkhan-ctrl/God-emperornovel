# Imperial Novel 16.3.7

Stability + Legal Publishing Fix

- Optimized cold-start database seeding by batching taxonomy, agent, and connector registry writes.
- Reduced repeated schema/agent setup work on every API request.
- Fixed Legal Publishing draft creation feedback and refresh behavior.
- Draft creation now returns and displays the Novel ID immediately.
- Preserved rights-safe publication workflow: original/owned, public-domain, licensed, or authorized works only.
- Preserved the existing reader, catalog, authentication, tickets, requests, admin, taxonomy, and connector safeguards.
- No unauthorized scraping, paywall bypass, CAPTCHA bypass, or access-control bypass.
