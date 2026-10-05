/**
 * Vacancy form options, pipeline statuses and server-side validation for the public
 * "Find Candidates" form. Pure module: safe to import from client components for labels.
 */
import { normalizeSaMobile } from '@/lib/phone';

export const ROLE_CATEGORIES = [
  { value: 'SALES', label: 'Sales' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'BUSINESS_OPERATIONS', label: 'Business Operations' },
  { value: 'TECHNOLOGY', label: 'Technology' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'OTHER', label: 'Other (we’ll review it manually)' },
] as const;

export const WORK_ARRANGEMENTS = [
  { value: 'ON_SITE', label: 'On-site' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'REMOTE', label: 'Remote' },
] as const;

export const EMPLOYMENT_TYPES = [
  { value: 'PERMANENT', label: 'Permanent' },
  { value: 'FIXED_TERM', label: 'Fixed-term contract' },
  { value: 'INTERNSHIP', label: 'Internship or learnership' },
  { value: 'PART_TIME', label: 'Part-time' },
] as const;

export const EXPERIENCE_LEVELS = [
  { value: 'NONE', label: 'No experience needed' },
  { value: 'UP_TO_1', label: 'Up to 1 year' },
  { value: '1_TO_2', label: '1–2 years' },
  { value: '2_TO_3', label: '2–3 years' },
  { value: 'OVER_3', label: 'More than 3 years' },
] as const;

/** Pipeline order. Ops may move a vacancy to any status manually in v1. */
export const VACANCY_STATUSES = [
  { value: 'NEW_VACANCY', label: 'New Vacancy' },
  { value: 'ROLE_CALIBRATION', label: 'Role Calibration' },
  { value: 'SOURCING', label: 'Sourcing' },
  { value: 'SCREENING', label: 'Screening' },
  { value: 'SHORTLIST_READY', label: 'Shortlist Ready' },
  { value: 'SHORTLIST_SENT', label: 'Shortlist Sent' },
  { value: 'INTERVIEWING', label: 'Interviewing' },
  { value: 'OFFER', label: 'Offer' },
  { value: 'HIRED', label: 'Hired' },
  { value: 'CHECK_30', label: '30-Day Check' },
  { value: 'CHECK_60', label: '60-Day Check' },
  { value: 'CHECK_90', label: '90-Day Check' },
  { value: 'CLOSED_NO_HIRE', label: 'Closed – No Hire' },
  { value: 'CLOSED_EMPLOYER', label: 'Closed – Employer' },
  { value: 'CLOSED_LAUNCHPATH', label: 'Closed – LaunchPath' },
] as const;

export const INVOICE_STATUSES = [
  { value: 'NOT_INVOICED', label: 'Not invoiced' },
  { value: 'INVOICED', label: 'Invoiced' },
  { value: 'PAID', label: 'Paid' },
  { value: 'WAIVED', label: 'Waived' },
  { value: 'CREDITED', label: 'Credited' },
] as const;

/** Recruiter judgement of fit against the agreed brief. Shown to employers as a recruiter assessment. */
export const MATCH_LEVELS = [
  { value: 'STRONG', label: 'Strong match' },
  { value: 'GOOD', label: 'Good match' },
  { value: 'PARTIAL', label: 'Partial match' },
] as const;

export const INTERVIEW_OUTCOMES = [
  { value: 'ADVANCED', label: 'Progressed' },
  { value: 'NOT_PROGRESSED', label: 'Not progressed' },
  { value: 'CANDIDATE_WITHDREW', label: 'Candidate withdrew' },
] as const;

export const OFFER_STATUSES = [
  { value: 'OFFERED', label: 'Offer made' },
  { value: 'ACCEPTED', label: 'Offer accepted' },
  { value: 'DECLINED', label: 'Offer declined' },
  { value: 'WITHDRAWN', label: 'Offer withdrawn' },
] as const;

export const INTERVIEW_REQUEST_STATUSES = [
  { value: 'NEW', label: 'New' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

/** Follow-up outcomes. No value stored = not yet checked. */
export const RETENTION_OUTCOMES = [
  { value: 'RETAINED', label: 'Still employed' },
  { value: 'LEFT_VOLUNTARY', label: 'Left voluntarily' },
  { value: 'DISMISSED_PERFORMANCE', label: 'Dismissed for performance' },
  { value: 'LEFT_OTHER', label: 'Left (other reason)' },
  { value: 'UNREACHABLE', label: 'Could not confirm' },
] as const;
export const DEPARTED_OUTCOMES = ['LEFT_VOLUNTARY', 'DISMISSED_PERFORMANCE', 'LEFT_OTHER'];
export const FOLLOW_UP_DAYS = [30, 60, 90] as const;

export const HIRE_EVENT_TYPES = [
  'ROLE_CALIBRATION',
  'SHORTLIST_SENT',
  'INTERVIEW_REQUESTED',
  'OFFER_MADE',
  'OFFER_ACCEPTED',
  'OFFER_DECLINED',
  'HIRE_COMPLETED',
  'FEE_INVOICED',
  'FEE_PAID',
] as const;
export type HireEventType = (typeof HIRE_EVENT_TYPES)[number];

export type VacancyStatus = (typeof VACANCY_STATUSES)[number]['value'];

/** Index in the pipeline; closed statuses sort after everything. */
export const statusIndex = (s: string) => VACANCY_STATUSES.findIndex((o) => o.value === s);

/** Moves a vacancy forward to `target` only if it hasn't already passed it and isn't closed. */
export function advanceStatus(current: string, target: VacancyStatus): VacancyStatus | null {
  if ((CLOSED_STATUSES as string[]).includes(current)) return null;
  return statusIndex(current) < statusIndex(target) ? target : null;
}
export const CLOSED_STATUSES: VacancyStatus[] = ['CLOSED_NO_HIRE', 'CLOSED_EMPLOYER', 'CLOSED_LAUNCHPATH'];
export const PLACED_STATUSES: VacancyStatus[] = ['HIRED', 'CHECK_30', 'CHECK_60', 'CHECK_90'];

const values = <T extends readonly { value: string }[]>(list: T) => list.map((o) => o.value) as string[];
export const labelFor = (list: readonly { value: string; label: string }[], value?: string | null) =>
  list.find((o) => o.value === value)?.label ?? value ?? '—';

export interface VacancyInput {
  companyName: string;
  contactName: string;
  workEmail: string;
  phone: string;
  roleTitle: string;
  roleCategory: string;
  roleCategoryOther: string | null;
  location: string;
  workArrangement: string;
  salaryMin: number;
  salaryMax: number;
  employmentType: string;
  requiredExperience: string;
  keySkills: string[];
  startDate: Date | null;
  description: string;
  submissionKey: string;
}

export type VacancyErrors = Partial<Record<keyof VacancyInput | 'form', string>>;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const text = (v: unknown, max: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const longText = (v: unknown, max: number) => String(v ?? '').replace(/\r\n/g, '\n').trim().slice(0, max);

function toRand(v: unknown): number | null {
  if (v === '' || v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[\sR,]/gi, ''));
  return Number.isFinite(n) ? Math.round(n) : null;
}

function parseSkills(v: unknown): string[] {
  const list = Array.isArray(v) ? v : String(v ?? '').split(/[,\n;]/);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const s = text(item, 50);
    if (s && !seen.has(s.toLowerCase())) {
      seen.add(s.toLowerCase());
      out.push(s);
    }
  }
  return out;
}

/** Validates and normalises a raw form body. `now` is injectable for tests. */
export function validateVacancyInput(body: unknown, now = new Date()): { ok: true; data: VacancyInput } | { ok: false; errors: VacancyErrors } {
  const raw = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const errors: VacancyErrors = {};

  const companyName = text(raw.companyName, 160);
  const contactName = text(raw.contactName, 120);
  const workEmail = text(raw.workEmail, 200).toLowerCase();
  const phoneRaw = text(raw.phone, 40);
  const roleTitle = text(raw.roleTitle, 120);
  const roleCategory = text(raw.roleCategory, 40);
  const roleCategoryOther = text(raw.roleCategoryOther, 80);
  const location = text(raw.location, 120);
  const workArrangement = text(raw.workArrangement, 20);
  const salaryMin = toRand(raw.salaryMin);
  const salaryMax = toRand(raw.salaryMax);
  const employmentType = text(raw.employmentType, 20);
  const requiredExperience = text(raw.requiredExperience, 20);
  const keySkills = parseSkills(raw.keySkills);
  const description = longText(raw.description, 3000);
  const submissionKey = text(raw.submissionKey, 64);

  if (companyName.length < 2) errors.companyName = 'Please enter your company name.';
  if (contactName.length < 2) errors.contactName = 'Please enter your name.';
  if (!EMAIL_RE.test(workEmail)) errors.workEmail = 'Please enter a valid work email address.';

  // SA mobiles are normalised; other numbers (landlines, international) are accepted if plausible
  const phone = normalizeSaMobile(phoneRaw) ?? phoneRaw;
  const digits = phoneRaw.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15 || /[^\d\s()+-]/.test(phoneRaw)) errors.phone = 'Please enter a valid phone number.';

  if (roleTitle.length < 2) errors.roleTitle = 'Please enter the role title.';
  if (!values(ROLE_CATEGORIES).includes(roleCategory)) errors.roleCategory = 'Please choose a role category.';
  else if (roleCategory === 'OTHER' && roleCategoryOther.length < 2) errors.roleCategoryOther = 'Please tell us what kind of role this is.';
  if (location.length < 2) errors.location = 'Please enter the location.';
  if (!values(WORK_ARRANGEMENTS).includes(workArrangement)) errors.workArrangement = 'Please choose on-site, hybrid or remote.';

  if (salaryMin === null || salaryMin < 1000 || salaryMin > 500_000) errors.salaryMin = 'Enter a monthly amount between R1,000 and R500,000.';
  if (salaryMax === null || salaryMax < 1000 || salaryMax > 500_000) errors.salaryMax = 'Enter a monthly amount between R1,000 and R500,000.';
  else if (salaryMin !== null && !errors.salaryMin && salaryMax < salaryMin) errors.salaryMax = 'The maximum can’t be lower than the minimum.';

  if (!values(EMPLOYMENT_TYPES).includes(employmentType)) errors.employmentType = 'Please choose an employment type.';
  if (!values(EXPERIENCE_LEVELS).includes(requiredExperience)) errors.requiredExperience = 'Please choose the experience required.';
  if (keySkills.length === 0) errors.keySkills = 'Add at least one key skill.';
  else if (keySkills.length > 15) errors.keySkills = 'Please list no more than 15 key skills.';

  let startDate: Date | null = null;
  const startRaw = text(raw.startDate, 10);
  if (startRaw) {
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(startRaw) ? new Date(`${startRaw}T00:00:00.000Z`) : null;
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    if (!parsed || Number.isNaN(parsed.getTime())) errors.startDate = 'Please enter a valid date.';
    else if (parsed.getTime() < today) errors.startDate = 'The start date can’t be in the past.';
    else if (parsed.getTime() > today + 730 * 86_400_000) errors.startDate = 'Please choose a date within the next two years.';
    else startDate = parsed;
  }

  if (description.length < 30) errors.description = 'Please describe the role in at least 30 characters.';
  if (!UUID_RE.test(submissionKey)) errors.form = 'Please refresh the page and try again.';

  if (Object.keys(errors).length) return { ok: false, errors };

  return {
    ok: true,
    data: {
      companyName,
      contactName,
      workEmail,
      phone,
      roleTitle,
      roleCategory,
      roleCategoryOther: roleCategory === 'OTHER' ? roleCategoryOther : null,
      location,
      workArrangement,
      salaryMin: salaryMin as number,
      salaryMax: salaryMax as number,
      employmentType,
      requiredExperience,
      keySkills,
      startDate,
      description,
      submissionKey,
    },
  };
}

/** Minimum time (ms) a human takes to fill the form; faster submissions are treated as bots. */
export const MIN_FILL_MS = 3000;

/** Basic bot signals: a filled honeypot field or an implausibly fast submission. */
export function looksLikeSpam(body: unknown, now = Date.now()): boolean {
  const raw = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  if (String(raw.website ?? '').trim() !== '') return true;
  const started = Number(raw.formStartedAt);
  if (!Number.isFinite(started) || started <= 0) return true;
  const elapsed = now - started;
  return elapsed < MIN_FILL_MS || elapsed > 24 * 60 * 60 * 1000;
}
