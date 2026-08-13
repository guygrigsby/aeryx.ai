# aeryx.ai

Studio site for aeryx.ai / grigsby.dev, plus the privacy policy the App Store listings point at. Astro, static, deployed to Cloudflare Pages.

## Develop

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests (Vitest)
npm run check    # type-check (astro check)
npm run build    # static build to dist/
```

## Deploy (Cloudflare Pages)

1. Push to the connected GitHub repo.
2. In Cloudflare Pages, create a project from the repo.
3. Build command: `npm run build`. Output directory: `dist`.
4. Add custom domains `aeryx.ai` and `grigsby.dev` in the Pages project (Cloudflare is the registrar, so DNS is one click).
5. Scrape Shield (email obfuscation) is on by default; leave it on.

## Notes

- Project data lives in `src/lib/projects.ts`, contact and footer links in `src/lib/site.ts` (single sources of truth).
- Contact is the `support@aeryx.ai` role address, in plain markup so a policy link works without JS. Cloudflare Scrape Shield obfuscates it at the edge. `src/lib/email-guard.test.ts` keeps the personal address from coming back.
- `/privacy` covers the site and the iOS apps listed in `site.ts`. Adding an app to that list fails the tests until the policy names it.
- All motion respects `prefers-reduced-motion`.
- The 404 page hides a boids flock easter egg.
