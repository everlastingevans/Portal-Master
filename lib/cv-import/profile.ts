/**
 * CV import: turns the AI's structured reading of a CV into validated candidate profile fields.
 * Pure module (no database, AI or storage), so it is safe to import from client components for the
 * review form and is unit-tested directly. Everything the AI returns is treated as untrusted input.
 */
import { CANDIDATE_LOCATIONS } from '@/lib/talent';
import { normalizeSaMobile } from '@/lib/phone';

export const SOURCE_KINDS = [
  { value: 'SCHOOL', label: 'School' },
  { value: 'UNIVERSITY', label: 'University' },
  { value: 'COLLEGE', label: 'College or TVET' },
  { value: 'TRAINING_PROVIDER', label: 'Training provider' },
  { value: 'BOOTCAMP', label: 'Bootcamp or academy' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const PROFILE_EXPERIENCE_LEVELS = ['Junior', 'Mid-Level', 'Senior', 'Lead', 'Executive'] as const;

export const IMPORT_STATUSES = [
  { value: 'CREATED', label: 'Profile created' },
  { value: 'EXISTING', label: 'Already on LaunchPath' },
  { value: 'NEEDS_REVIEW', label: 'Needs review' },
  { value: 'FAILED', label: 'Failed' },
] as const;

/** A CV reading failure with a message that is safe and useful to show staff. */
export class CvReadError extends Error {}

export const MAX_CV_BYTES = 4 * 1024 * 1024; // Vercel caps request bodies at 4.5 MB
export const MAX_BULK_FILES = 200;

/** Imported CVs without an email get a unique, undeliverable placeholder so the account can exist. */
const PLACEHOLDER_DOMAIN = 'no-email.launchpath.invalid';
export const isPlaceholderEmail = (email?: string | null) => Boolean(email?.toLowerCase().endsWith(`@${PLACEHOLDER_DOMAIN}`));
export const placeholderEmail = (token: string) => `cv-import-${token}@${PLACEHOLDER_DOMAIN}`;

/** The fields a CV import writes to a candidate (all User columns). */
export interface ImportedProfile {
  name: string | null;
  email: string | null;
  phone: string | null;
  professional_title: string | null;
  experience_level: string | null;
  location: string | null;
  skills: string | null;
  qualifications: string | null;
  study_institution: string | null;
  study_specialisation: string | null;
  work_experience: string | null;
  seeking_roles: string | null;
  bio: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
}

export const PROFILE_FIELDS: (keyof ImportedProfile)[] = [
  'name',
  'email',
  'phone',
  'professional_title',
  'experience_level',
  'location',
  'skills',
  'qualifications',
  'study_institution',
  'study_specialisation',
  'work_experience',
  'seeking_roles',
  'bio',
  'linkedin_url',
  'github_url',
  'portfolio_url',
];

const MAX_LEN: Record<keyof ImportedProfile, number> = {
  name: 120,
  email: 200,
  phone: 30,
  professional_title: 120,
  experience_level: 20,
  location: 40,
  skills: 1000,
  qualifications: 1500,
  study_institution: 200,
  study_specialisation: 200,
  work_experience: 4000,
  seeking_roles: 300,
  bio: 600,
  linkedin_url: 300,
  github_url: 300,
  portfolio_url: 300,
};

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;

const text = (v: unknown, max: number): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v)
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (!s || /^(n\/?a|none|unknown|not (provided|specified|stated))$/i.test(s)) return null;
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
};

const list = (v: unknown, maxItems: number, maxEach = 120): string[] => {
  const raw = Array.isArray(v) ? v : typeof v === 'string' ? v.split(/[,;\n]+/) : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const s = text(item, maxEach);
    if (s && !seen.has(s.toLowerCase())) {
      seen.add(s.toLowerCase());
      out.push(s);
    }
    if (out.length >= maxItems) break;
  }
  return out;
};

export function normaliseEmail(v: unknown): string | null {
  const s = text(v, MAX_LEN.email)?.replace(/^mailto:/i, '').toLowerCase() ?? null;
  return s && EMAIL_RE.test(s) && !isPlaceholderEmail(s) ? s : null;
}

/** Only absolute https links (adding https:// to bare domains), never javascript: or other schemes. */
export function normaliseUrl(v: unknown, host?: RegExp): string | null {
  let s = text(v, MAX_LEN.linkedin_url);
  if (!s) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = `https://${s.replace(/^\/+/, '')}`;
  try {
    const u = new URL(s);
    if (u.protocol === 'http:') u.protocol = 'https:';
    if (u.protocol !== 'https:' || !u.hostname.includes('.')) return null;
    if (host && !host.test(u.hostname)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Maps the AI's level (or years of experience when the level is missing or odd) to a profile level. */
export function normaliseExperienceLevel(level: unknown, years?: unknown): string | null {
  // Most senior first, so "Senior Team Lead" is a Lead and "Executive Director" an Executive
  const l = String(level ?? '').toLowerCase();
  if (/\b(exec|executive|director|c-?level|chief)\b/.test(l)) return 'Executive';
  if (/\b(lead|manager|head|principal)\b/.test(l)) return 'Lead';
  if (/\bsenior\b/.test(l)) return 'Senior';
  if (/\b(mid|mid-level|intermediate)\b/.test(l)) return 'Mid-Level';
  if (/\b(junior|entry|graduate)\b/.test(l)) return 'Junior';
  const y = Number(years);
  if (!Number.isFinite(y) || y < 0) return null;
  return y < 3 ? 'Junior' : y < 5 ? 'Mid-Level' : 'Senior';
}

const LOCATION_HINTS: [string, RegExp][] = [
  ['Gauteng', /gauteng|johannesburg|joburg|jhb|pretoria|tshwane|sandton|soweto|midrand|centurion|ekurhuleni|randburg|roodepoort|benoni|boksburg|germiston|kempton/],
  ['Western Cape', /western cape|cape town|stellenbosch|paarl|george|somerset west|bellville|khayelitsha|mitchells plain/],
  ['KwaZulu-Natal', /kwazulu|kzn|durban|pietermaritzburg|umhlanga|ballito|richards bay|newcastle|pinetown/],
  ['Eastern Cape', /eastern cape|gqeberha|port elizabeth|east london|mthatha|makhanda|grahamstown/],
  ['Free State', /free state|bloemfontein|welkom|sasolburg/],
  ['Limpopo', /limpopo|polokwane|thohoyandou|tzaneen|mokopane/],
  ['Mpumalanga', /mpumalanga|mbombela|nelspruit|witbank|emalahleni|secunda|middelburg/],
  ['North West', /north west|rustenburg|mahikeng|mafikeng|potchefstroom|klerksdorp/],
  ['Northern Cape', /northern cape|kimberley|upington/],
  ['Remote', /^remote$/],
];

export function normaliseLocation(v: unknown): string | null {
  const s = String(v ?? '').trim();
  const exact = CANDIDATE_LOCATIONS.find((l) => l.toLowerCase() === s.toLowerCase());
  if (exact) return exact;
  const lower = s.toLowerCase();
  return LOCATION_HINTS.find(([, re]) => re.test(lower))?.[0] ?? null;
}

type WorkEntry = { role?: unknown; company?: unknown; period?: unknown; summary?: unknown };

/** Work history is stored as readable text, one role per paragraph, like candidates type it. */
function formatWorkExperience(v: unknown): string | null {
  if (!Array.isArray(v)) return text(v, MAX_LEN.work_experience);
  const blocks = (v as WorkEntry[])
    .slice(0, 12)
    .map((e) => {
      const role = text(e?.role, 120);
      const company = text(e?.company, 120);
      const period = text(e?.period, 60);
      const summary = text(e?.summary, 500);
      const head = [role, company].filter(Boolean).join(', ');
      const line = [head, period && `(${period})`].filter(Boolean).join(' ');
      return [line, summary].filter(Boolean).join('\n');
    })
    .filter(Boolean);
  return text(blocks.join('\n\n'), MAX_LEN.work_experience);
}

/** Raw structured output from the AI CV reader (see lib/cv-import/extract.ts). */
export interface CvExtraction {
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  headline?: unknown;
  experienceLevel?: unknown;
  yearsOfExperience?: unknown;
  location?: unknown;
  skills?: unknown;
  qualifications?: unknown;
  studyInstitution?: unknown;
  studySpecialisation?: unknown;
  workExperience?: unknown;
  seekingRoles?: unknown;
  summary?: unknown;
  linkedinUrl?: unknown;
  githubUrl?: unknown;
  portfolioUrl?: unknown;
}

export function profileFromExtraction(x: CvExtraction): ImportedProfile {
  const phoneRaw = text(x.phone, MAX_LEN.phone);
  return {
    name: text(x.fullName, MAX_LEN.name),
    email: normaliseEmail(x.email),
    phone: normalizeSaMobile(phoneRaw) ?? phoneRaw,
    professional_title: text(x.headline, MAX_LEN.professional_title),
    experience_level: normaliseExperienceLevel(x.experienceLevel, x.yearsOfExperience),
    location: normaliseLocation(x.location),
    skills: text(list(x.skills, 40, 40).join(', '), MAX_LEN.skills),
    qualifications: text(list(x.qualifications, 15, 200).join('\n'), MAX_LEN.qualifications),
    study_institution: text(x.studyInstitution, MAX_LEN.study_institution),
    study_specialisation: text(x.studySpecialisation, MAX_LEN.study_specialisation),
    work_experience: formatWorkExperience(x.workExperience),
    seeking_roles: text(list(x.seekingRoles, 6, 60).join(', '), MAX_LEN.seeking_roles),
    bio: text(x.summary, MAX_LEN.bio),
    linkedin_url: normaliseUrl(x.linkedinUrl, /(^|\.)linkedin\.com$/i),
    github_url: normaliseUrl(x.githubUrl, /(^|\.)github\.com$/i),
    portfolio_url: normaliseUrl(x.portfolioUrl),
  };
}

/**
 * Validates a profile edited by staff in the review form (same rules as AI output, so a reviewer
 * can't save anything the importer wouldn't). Unknown keys are ignored.
 */
export function sanitiseReviewedProfile(raw: Record<string, unknown>): ImportedProfile {
  const phoneRaw = text(raw.phone, MAX_LEN.phone);
  const level = text(raw.experience_level, MAX_LEN.experience_level);
  return {
    name: text(raw.name, MAX_LEN.name),
    email: normaliseEmail(raw.email),
    phone: normalizeSaMobile(phoneRaw) ?? phoneRaw,
    professional_title: text(raw.professional_title, MAX_LEN.professional_title),
    experience_level: level && (PROFILE_EXPERIENCE_LEVELS as readonly string[]).includes(level) ? level : null,
    location: normaliseLocation(raw.location),
    skills: text(raw.skills, MAX_LEN.skills),
    qualifications: text(raw.qualifications, MAX_LEN.qualifications),
    study_institution: text(raw.study_institution, MAX_LEN.study_institution),
    study_specialisation: text(raw.study_specialisation, MAX_LEN.study_specialisation),
    work_experience: text(raw.work_experience, MAX_LEN.work_experience),
    seeking_roles: text(raw.seeking_roles, MAX_LEN.seeking_roles),
    bio: text(raw.bio, MAX_LEN.bio),
    linkedin_url: normaliseUrl(raw.linkedin_url, /(^|\.)linkedin\.com$/i),
    github_url: normaliseUrl(raw.github_url, /(^|\.)github\.com$/i),
    portfolio_url: normaliseUrl(raw.portfolio_url),
  };
}

/** Reasons a created profile should be checked by a person before it is relied on. */
export function reviewReasons(p: ImportedProfile): string[] {
  const reasons: string[] = [];
  if (!p.email) reasons.push('No email address found in the CV');
  if (!p.name) reasons.push('No name found');
  if (!p.professional_title && !p.skills) reasons.push('No headline or skills found');
  return reasons;
}

export const sourceKindLabel = (kind?: string | null) => SOURCE_KINDS.find((k) => k.value === kind)?.label ?? 'Other';

/** A safe, trimmed organisation name (collapsed whitespace), or null if empty. */
export const cleanSourceName = (v: unknown) => text(v, 120)?.replace(/\s+/g, ' ') ?? null;
