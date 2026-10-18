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

By hand, after `npm test && npm run check && npm run build`:

```bash
npx wrangler deploy
```

That uploads `dist/` to the `aeryx` Worker, which serves aeryx.ai, aeryx.dev, aeryx.io, aeryx.org and their www names as static assets. Wrangler reads `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` from the environment.

## Notes

- The logo kit, colors, spacing rules and export instructions live in [brand/README.md](brand/README.md). View the asset sheet at `/brand/` during development. Run `npm run brand:export` after editing the SVG masters.

- Project data lives in `src/lib/projects.ts`, contact and footer links in `src/lib/site.ts` (single sources of truth).
- Contact is the `support@aeryx.ai` role address, in plain markup so a policy link works without JS. Cloudflare Scrape Shield obfuscates it at the edge. `src/lib/email-guard.test.ts` keeps the personal address from coming back.
- `/privacy` covers the site and the iOS apps listed in `site.ts`. Adding an app to that list fails the tests until the policy names it.
- Sock's pages live at joinsock.com. `public/_redirects` sends the old `/sock` URLs there; `src/lib/sock.test.ts` keeps the mapping.
- All motion respects `prefers-reduced-motion`.
- The 404 page hides a boids flock easter egg.
