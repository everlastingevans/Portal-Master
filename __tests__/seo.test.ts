import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
import { ROLE_PAGES, SERVICE_FAQS } from '@/lib/content/role-pages';
import { TALENT_CATEGORIES } from '@/lib/content/talent-categories';
import { faqJsonLd, jsonLd } from '@/lib/seo';

describe('sitemap and robots', () => {
  afterEach(() => delete process.env.FEATURE_BULK_ENQUIRY_PUBLIC);

  it('lists public marketing pages only', () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain('https://launchpath.co.za/find-candidates');
    for (const r of ROLE_PAGES) expect(urls).toContain(`https://launchpath.co.za/hire/${r.categorySlug}/${r.slug}`);
    for (const bad of ['/shortlist', '/admin', '/employer', '/candidate', '/api', '/results', '/hire/bulk']) expect(urls.some((u) => u.includes(bad))).toBe(false);
    process.env.FEATURE_BULK_ENQUIRY_PUBLIC = 'true';
    expect(sitemap().map((e) => e.url)).toContain('https://launchpath.co.za/hire/bulk');
  });

  it('keeps private areas out of crawling and points to the sitemap', () => {
    const r = robots();
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rule.disallow).toEqual(expect.arrayContaining(['/api/', '/admin', '/employer', '/candidate']));
    expect(r.sitemap).toBe('https://launchpath.co.za/sitemap.xml');
  });
});

describe('role pages', () => {
  it('belong to existing categories, are unique and substantial', () => {
    const keys = ROLE_PAGES.map((r) => `${r.categorySlug}/${r.slug}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (const r of ROLE_PAGES) {
      expect(TALENT_CATEGORIES.some((c) => c.slug === r.categorySlug)).toBe(true);
      expect(r.responsibilities.length).toBeGreaterThanOrEqual(3);
      expect(r.screening.length).toBeGreaterThanOrEqual(3);
      expect(r.faqs.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('make no salary, statistic or guarantee claims', () => {
    const text = JSON.stringify([ROLE_PAGES, SERVICE_FAQS]);
    expect(text).not.toMatch(/R\s?\d|\d+\s?%|guarantee|placed \d|hired \d|best|#1|leading/i);
  });

  it('emits safe structured data', () => {
    const html = jsonLd(faqJsonLd([{ q: 'Q </script><script>alert(1)</script>', a: 'A' }])).__html;
    expect(html).not.toContain('</script>');
    expect(JSON.parse(html.replace(/\\u003c/g, '<'))['@type']).toBe('FAQPage');
  });
});
