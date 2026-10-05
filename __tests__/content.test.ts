import { CASE_STUDIES, CASE_STUDY_TEMPLATE, CaseStudy, isPublishable, publishedCaseStudies } from '@/lib/content/case-studies';
import { TALENT_CATEGORIES } from '@/lib/content/talent-categories';
import { ROLE_CATEGORIES } from '@/lib/hire/vacancy';

const verified: CaseStudy = {
  ...CASE_STUDY_TEMPLATE,
  slug: 'example',
  status: 'published',
  employer: 'Example Ltd',
  roleOrProgramme: 'Junior Sales Consultants',
  hiredOrPlaced: 2,
  result: 'Two junior sales consultants hired from one shortlist.',
  verification: { confirmedBy: 'Ops lead', confirmedOn: '2026-10-01', evidence: 'Vacancy #12 placements' },
  employerApproval: { approvedBy: 'Example Ltd MD', approvedOn: '2026-10-02', covers: 'name' },
};

describe('case studies', () => {
  it('publish nothing until real, verified entries exist', () => {
    expect(publishedCaseStudies()).toEqual([]);
    expect(CASE_STUDIES.every(isPublishable)).toBe(true); // any entry added must pass the rules
    expect(isPublishable(CASE_STUDY_TEMPLATE)).toBe(false);
  });

  it('require verification, employer approval for names, and quote approval for quotes', () => {
    expect(isPublishable(verified)).toBe(true);
    expect(isPublishable({ ...verified, status: 'draft' })).toBe(false);
    expect(isPublishable({ ...verified, verification: null })).toBe(false);
    expect(isPublishable({ ...verified, employerApproval: null })).toBe(false);
    expect(isPublishable({ ...verified, employer: null, anonymisedEmployer: 'A Gauteng SME', employerApproval: null })).toBe(true);
    expect(isPublishable({ ...verified, quote: { text: 'Great', name: 'A', title: 'MD' } })).toBe(false);
    expect(isPublishable({ ...verified, quote: { text: 'Great', name: 'A', title: 'MD' }, employerApproval: { ...verified.employerApproval!, covers: 'name_and_quote' } })).toBe(true);
  });
});

describe('talent categories', () => {
  it('cover the five launch categories and map to vacancy form categories', () => {
    expect(TALENT_CATEGORIES.map((c) => c.code)).toEqual(['SALES', 'MARKETING', 'BUSINESS_OPERATIONS', 'TECHNOLOGY', 'FINANCE']);
    for (const c of TALENT_CATEGORIES) expect(ROLE_CATEGORIES.some((r) => r.value === c.code)).toBe(true);
  });

  it('make no numeric outcome claims', () => {
    const text = JSON.stringify(TALENT_CATEGORIES);
    expect(text).not.toMatch(/\d+\s?%|guarantee|placed \d|hired \d/i);
  });
});
