/**
 * Results / case studies. ONLY verified content may be published.
 *
 * A case study appears on the website only if `isPublishable()` passes:
 *  - status is "published";
 *  - `verification` records who confirmed the figures against LaunchPath records, when, and the evidence;
 *  - if the employer is named or quoted, `employerApproval` records who approved publication and when.
 *
 * No case studies are published yet. To add one, copy CASE_STUDY_TEMPLATE into CASE_STUDIES, fill in
 * real values, and set status to "published" only after verification and approval are recorded.
 */
export interface CaseStudy {
  slug: string;
  status: 'draft' | 'published';
  /** Named employer or partner, e.g. "Acme Trading". Use anonymisedEmployer instead if they prefer. */
  employer: string | null;
  /** e.g. "A Johannesburg logistics SME" when the employer prefers not to be named */
  anonymisedEmployer: string | null;
  /** Role hired or programme run, e.g. "Junior Sales Consultants" or "2026 graduate intake" */
  roleOrProgramme: string;
  /** Candidates shortlisted or learners in the programme */
  candidatesOrLearners: number | null;
  /** Working days from vacancy to shortlist, only when measured */
  workingDaysToShortlist: number | null;
  hiredOrPlaced: number | null;
  /** One factual sentence about the outcome. No unmeasured claims. */
  result: string;
  quote: { text: string; name: string; title: string } | null;
  verification: { confirmedBy: string; confirmedOn: string; evidence: string } | null;
  employerApproval: { approvedBy: string; approvedOn: string; covers: 'name' | 'name_and_quote' } | null;
}

/** Copy, fill in and move into CASE_STUDIES. Never published as-is. */
export const CASE_STUDY_TEMPLATE: CaseStudy = {
  slug: 'employer-role-year',
  status: 'draft',
  employer: null,
  anonymisedEmployer: null,
  roleOrProgramme: '',
  candidatesOrLearners: null,
  workingDaysToShortlist: null,
  hiredOrPlaced: null,
  result: '',
  quote: null,
  verification: null,
  employerApproval: null,
};

export const CASE_STUDIES: CaseStudy[] = [];

export function isPublishable(c: CaseStudy): boolean {
  if (c.status !== 'published') return false;
  if (!c.result.trim() || !c.roleOrProgramme.trim()) return false;
  if (!c.employer && !c.anonymisedEmployer) return false;
  if (!c.verification?.confirmedBy || !c.verification.confirmedOn || !c.verification.evidence) return false;
  if (c.employer && !c.employerApproval) return false;
  if (c.quote && c.employerApproval?.covers !== 'name_and_quote') return false;
  return true;
}

export function publishedCaseStudies(list: CaseStudy[] = CASE_STUDIES): CaseStudy[] {
  return list.filter(isPublishable);
}
