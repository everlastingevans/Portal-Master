/** Canonical site origin for metadata, sitemap and structured data. */
export const siteUrl = () => (process.env.NEXT_PUBLIC_APP_URL || 'https://launchpath.co.za').replace(/\/$/, '');

/** schema.org BreadcrumbList for visible breadcrumbs. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: `${siteUrl()}${it.path}` })),
  };
}

/** schema.org FAQPage. Only for questions and answers that are visible on the same page. */
export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

/** Safe JSON for a <script type="application/ld+json"> tag. */
export const jsonLd = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, '\\u003c') });
