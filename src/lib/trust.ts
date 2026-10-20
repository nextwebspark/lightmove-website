/**
 * Privacy and security facts shown on the home page and in the footer. Each one must stay true and
 * point at the published page that backs it; never "GDPR certified" or "compliant" (no such
 * certification exists, and the legal pages are drafts until counsel signs them off).
 */
export interface TrustItem {
  label: string;
  href: string;
  /** An icon name from src/components/site/Icon.astro. */
  icon: 'shield' | 'globe' | 'lock' | 'file' | 'trash';
}

export const TRUST_ITEMS: readonly TrustItem[] = [
  { label: 'Built for GDPR', href: '/privacy', icon: 'shield' },
  { label: 'Hosted in the EU', href: '/subprocessors', icon: 'globe' },
  {
    label: 'Encrypted in transit and at rest',
    href: '/privacy#9-security-and-transfers',
    icon: 'lock',
  },
  { label: 'DPA available', href: '/dpa', icon: 'file' },
  { label: 'Automatic data deletion', href: '/privacy#7-how-long-we-keep-it', icon: 'trash' },
];
