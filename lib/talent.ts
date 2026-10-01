// Shared talent-pool vocabulary used by the API, the employer directory and the candidate profile.

/** Locations a candidate can choose on their profile. */
export const CANDIDATE_LOCATIONS = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Remote',
] as const;

/** Locations offered as filters in the employer directory. */
export const LOCATION_FILTERS = [
  { value: 'Gauteng', label: 'Gauteng' },
  { value: 'Western Cape', label: 'Western Cape' },
  { value: 'KwaZulu-Natal', label: 'KZN' },
  { value: 'Remote', label: 'Remote' },
] as const;

export const AVAILABILITY_OPTIONS = [
  { value: 'IMMEDIATE', label: 'Available immediately', short: 'Immediately' },
  { value: 'TWO_WEEKS', label: 'Available in 2 weeks', short: '2 weeks' },
  { value: 'ONE_MONTH', label: 'Available in 1 month', short: '1 month' },
] as const;

export type Availability = (typeof AVAILABILITY_OPTIONS)[number]['value'];

export const AVAILABILITY_VALUES = AVAILABILITY_OPTIONS.map((a) => a.value) as string[];

export function availabilityLabel(value?: string | null, short = false) {
  const opt = AVAILABILITY_OPTIONS.find((a) => a.value === value);
  return opt ? (short ? opt.short : opt.label) : null;
}

/**
 * Validates talent-pool profile fields from a request body. Only keys present in the body are returned,
 * so partial updates leave other fields untouched. Empty strings clear a field.
 */
export function sanitizeTalentFields(body: { location?: unknown; availability?: unknown; bio?: unknown }) {
  const data: { location?: string | null; availability?: string | null; bio?: string | null } = {};
  if (body.location !== undefined) {
    const v = String(body.location || '');
    data.location = (CANDIDATE_LOCATIONS as readonly string[]).includes(v) ? v : null;
  }
  if (body.availability !== undefined) {
    const v = String(body.availability || '');
    data.availability = AVAILABILITY_VALUES.includes(v) ? v : null;
  }
  if (body.bio !== undefined) {
    const v = String(body.bio || '').trim().slice(0, 600);
    data.bio = v || null;
  }
  return data;
}

/** Candidates store skills as free text; split on commas, semicolons, pipes, bullets and new lines. */
export function parseSkills(raw?: string | null): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,;|\n•·]+/)) {
    const skill = part.replace(/^[-*\s]+/, '').trim();
    const key = skill.toLowerCase();
    if (skill && skill.length <= 40 && !seen.has(key)) {
      seen.add(key);
      out.push(skill);
    }
  }
  return out;
}

/** Shape returned by GET /api/employer/candidates. Contact details are never included. */
export interface TalentCandidate {
  id: number;
  name: string;
  title: string | null;
  experienceLevel: string | null;
  location: string | null;
  availability: string | null;
  bio: string | null;
  skills: string[];
  readinessScore: number | null;
  education: { institution: string | null; specialisation: string | null; qualifications: string | null };
  seekingRoles: string | null;
  careerDirection: string | null;
  workExperience: string | null;
  interests: string | null;
  credentials: {
    cvOnFile: boolean;
    videoAssessed: boolean;
    policeClearance: boolean;
    certificates: boolean;
    linkedin: boolean;
    portfolio: boolean;
  };
  /** The requesting employer's job ids this candidate was invited to / applied to. */
  invitedJobIds: number[];
  appliedJobIds: number[];
}

export interface TalentPoolResponse {
  candidates: TalentCandidate[];
  total: number;
  page: number;
  pageSize: number;
  facets: { skills: { name: string; count: number }[] };
  openRoles: { id: number; title: string; location: string | null }[];
}
