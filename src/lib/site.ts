/** Site-wide identity, contact and footer links. Single source of truth, the
 *  way projects.ts is for projects. */

/** The registered business behind the aeryx brand. Used for the copyright
 *  line, which names the entity, not the mark. */
export const legalName = 'Aeryx Industries LLC';

/** Support address, kept as parts so the joined form is built only where it is
 *  rendered. Unlike the old personal address this one is a role account and is
 *  meant to be public; Cloudflare Scrape Shield obfuscates it at the edge. */
export const supportEmail = { user: 'support', domain: 'aeryx.ai' } as const;

export function supportAddress(): string {
  return `${supportEmail.user}@${supportEmail.domain}`;
}

/** Where new work comes in. Kept apart from support@ so the address on the
 *  App Store listings and the privacy policy stays a support channel. */
export const contactEmail = { user: 'hello', domain: 'aeryx.ai' } as const;

export function contactAddress(): string {
  return `${contactEmail.user}@${contactEmail.domain}`;
}

export interface SiteLink {
  label: string;
  href: string;
  /** opens off-site, so the anchor needs target and rel */
  external?: boolean;
}

export const footerLinks: SiteLink[] = [
  { label: 'privacy', href: '/privacy' },
  { label: 'support', href: `mailto:${supportAddress()}` },
  { label: 'github', href: 'https://github.com/guygrigsby', external: true },
];

/** Apps whose App Store listing points at /privacy. The policy is written by
 *  hand, so this list is what keeps it from going stale: site.test.ts fails if
 *  an app lands here without being named in the page. */
export const apps: string[] = ['loggit', 'Just Next'];

/** The date the current privacy policy took effect. */
export const policyEffective = '13 August 2026';
