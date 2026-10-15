# Aeryx brand kit

The circle is the human. The equally sized rounded square is the agent. One smooth arch connects them as equal partners, with a subtle A-like silhouette. Use the approved geometry without adding crossing strokes, ribbons, birds, feathers or wings.

## Choose an asset

The editable source is in [`masters/mark.svg`](masters/mark.svg) and [`masters/wordmark.svg`](masters/wordmark.svg). Both contain ordinary named SVG paths; the wordmark is outlined. Ready-to-use assets are in [`../public/brand/`](../public/brand/). Browse the visual sheet at `/brand/` on the development server.

| Asset stem | SVG canvas | Transparent PNG widths | Use |
| --- | --- | --- | --- |
| `aeryx-icon-*` | 576 × 576 | 256, 512, 1024 | Standalone mark, avatar |
| `aeryx-wordmark-*` | 576 × 160 | 512, 1024 | Name alone |
| `aeryx-horizontal-*` | 1184 × 320 | 512, 1024 | Header, signature, narrow space |
| `aeryx-stacked-*` | 576 × 528 | 512, 1024 | Approved mark-above-name arrangement |

Every stem comes in five variants: `lavender` (primary), `on-light` (deep purple), `on-dark` (pale lavender), `black` and `white`. All SVGs and the PNGs above have transparent backgrounds. PNG filenames append the width, for example `aeryx-stacked-lavender-1024.png`.

| Browser / sharing asset | Location and dimensions |
| --- | --- |
| SVG favicon | `public/favicon.svg`, square dark tile, optically strengthened arch |
| ICO fallback | `public/favicon.ico`, embedded 16, 32 and 48 px PNG frames |
| PNG favicons | `public/favicon-16x16.png`, `public/favicon-32x32.png`, `public/favicon-48x48.png` |
| Apple touch icon | `public/apple-touch-icon.png`, 180 × 180 |
| App / shortcut icons | `public/icon-192.png`, `public/icon-512.png` |
| Maskable icon | `public/icon-maskable-512.png`, 512 × 512, safe-zone inset |
| Browser manifest | `public/site.webmanifest`, browser display mode; no service worker required |
| Social preview | `public/brand/social-preview.{svg,png}`, 1200 × 630, dark background |

The browser, app and social images intentionally have opaque near-black backgrounds. Let the platform round or mask the app icons; do not bake rounded corners into them. Sock pages keep their own emblem, wordmark and metadata.

## Color

| Color | Hex | Role |
| --- | --- | --- |
| Lavender | `#A98FD6` | Primary logo and accent; preferred on near-black |
| Pale lavender | `#EDE4FA` | Light logo on dark backgrounds |
| Deep purple | `#73548F` | Logo on white or pale backgrounds |
| Near-black | `#08090B` | Site ground and dark monochrome logo |
| White | `#FFFFFF` | Reversed monochrome logo |

Use a single flat fill for the entire lockup. Choose `on-light` or `black` for a light background, and `lavender`, `on-dark` or `white` for a dark one. Do not add gradients, texture, glow, outlines or shadows to the master logo. The favicon's small optical adjustment is only for browser sizes. Site color tokens remain owned by the separate aeryx-brand repository; this kit uses the existing palette without editing vendored CSS.

## Spacing and size

Let **D** be the circle's diameter, equal to the square's width (88 units in the mark master). Keep at least **D/2** of clear space around the visible artwork. The SVG canvas includes an alignment inset, not the entire required exclusion area. Preserve the viewBox proportions and the mark-to-name spacing in each lockup. Do not independently resize a terminal or move the lettering.

Minimum screen widths: standalone icon **32 px**, horizontal lockup **200 px**, stacked lockup **128 px**, name alone **120 px**. Prefer larger sizes when possible. The dedicated favicon is the exception at **16 px**; use it without the wordmark. For print, use at least **12 mm** for the icon, **40 mm** for horizontal, **25 mm** for stacked and **24 mm** for the name alone. SVG is preferred for print and high-density displays.

## Lettering, license and exports

The clean geometric lowercase wordmark is custom outlined lettering reconstructed from the approved concept, not live text or a redistributed typeface. No font installation or third-party font license is needed for these logo files. Logo source and exports follow this repository's declared MIT license. The website's Hack heading font is separate; its bundled license remains at `public/fonts/LICENSE.md`. Body copy continues to use the system sans stack.

After `npm ci`, run:

```sh
npm run brand:export
```

The script reads only the two SVG masters and regenerates the variants, PNGs, ICO, touch/app icons and social card with Sharp. Edit the masters, never individual generated variants. The kit is intentionally static: no external images, fonts or scripts are required to render a logo.
