# aeryx.ai

Studio site for aeryx.ai / grigsby.dev, plus the privacy policy the App Store listings point at. Astro, static, deployed as a Cloudflare Worker with static assets.

## Develop

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests (Vitest)
npm run check    # type-check (astro check)
npm run build    # static build to dist/
```

## Deploy

A push to `main` runs `.github/workflows/deploy.yml`: test, type-check, build, then `wrangler deploy` to the `aeryx` Worker, which serves `dist/` as static assets on aeryx.ai, aeryx.dev, aeryx.io, aeryx.org and their www names. The workflow's `CLOUDFLARE_API_TOKEN` secret is scoped to Workers Scripts Write and Account Settings Read; `CLOUDFLARE_ACCOUNT_ID` is a repo variable.

## Notes

- Project data lives in `src/lib/projects.ts`, contact and footer links in `src/lib/site.ts` (single sources of truth).
- Contact is the `support@aeryx.ai` role address, in plain markup so a policy link works without JS. Cloudflare Scrape Shield obfuscates it at the edge. `src/lib/email-guard.test.ts` keeps the personal address from coming back.
- `/privacy` covers the site and the iOS apps listed in `site.ts`. Adding an app to that list fails the tests until the policy names it.
- Sock has accounts and a server, so its policy, terms and support pages live under `/sock` (`src/pages/sock`), with `sock.termsVersion` in `site.ts` matching the version the app and server require. `src/lib/sock.test.ts` holds them to Apple's requirements.
- All motion respects `prefers-reduced-motion`.
- The 404 page hides a boids flock easter egg.
