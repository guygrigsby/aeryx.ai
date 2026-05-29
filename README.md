# aeryx.ai

Single-page studio site for aeryx.ai / grigsby.dev. Astro, static, deployed to Cloudflare Pages.

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

- Project data lives in `src/lib/projects.ts` (single source of truth).
- The email address is never in static HTML; it is assembled in JS at runtime.
- All motion respects `prefers-reduced-motion`.
- The 404 page hides a boids flock easter egg.
