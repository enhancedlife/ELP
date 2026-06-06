/**
 * Public URL for a CMS FAQ / landing slug (matches dashboard “View on site” helper).
 * e.g. faq-aquila → /faq/aquila
 */
export function faqPagePublicHref(slug: string): string {
  if (slug === 'faq') return '/faq';
  const seg = slug.startsWith('faq-') ? slug.slice(4) : slug;
  return `/faq/${encodeURIComponent(seg)}`;
}
