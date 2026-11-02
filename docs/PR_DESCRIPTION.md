Prepare the K-Crown inventory MVP for an isolated, browser-operable Demo Preview and authenticated staging validation.

Users can browse/create catalogue-based SKUs, receive stock, reserve orders, partially ship them and see on-hand, reserved, shipped, outstanding and available quantities. Demo operations now persist per browser rather than writing to the server filesystem, so a Vercel Preview needs only APP_MODE=demo and never touches business data.

Authenticated mode now denies access unless a verified Supabase user UUID is explicitly approved. Server-derived workspace keys separate each user's data; PostgreSQL transactions serialize stock changes and deduplicate request IDs. A migration enables RLS and revokes direct anon/authenticated table access. This release has private per-user workspaces, not shared company stock or team roles.

Validation completed locally: 8 unit/PostgreSQL tests; 6 Chromium/API tests (including auth protocol mocks and two-user isolation); TypeScript and production build. Gitleaks scans of all Git history and staged changes found no matching secrets. Auth mocks do not establish real Supabase login readiness.

No cloud credentials, business data writes, main merge or production deployment were performed. Real Supabase login, cloud migration, Vercel Preview and hosted CI remain pending; see docs/DEPLOYMENT.md and docs/VALIDATION.md. Preview instructions deliberately avoid --prod and do not require main to be merged.
