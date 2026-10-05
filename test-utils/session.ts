import { cookies } from 'next/headers';

/** jest.setup.js mocks jose so a session token is base64 JSON; this sets the auth cookie for getSession(). */
export function signedInAs(role: string | null, userId = 7) {
  (cookies as any).mockReturnValue({
    get: (name: string) => (name === 'auth-token' && role ? { value: Buffer.from(JSON.stringify({ userId, role })).toString('base64') } : undefined),
    set: () => undefined,
    delete: () => undefined,
  });
}

let keyCounter = 0;
export const uuid = () => `3f1c2b9e-8a4d-4c6e-9b2a-${String(++keyCounter).padStart(12, '0')}`;
let ipCounter = 0;
export const nextIp = () => `10.0.${Math.floor(++ipCounter / 250)}.${ipCounter % 250}`;

export const vacancyBody = (patch: object = {}) => ({
  companyName: 'Acme Trading',
  contactName: 'Naledi Khumalo',
  workEmail: 'naledi@acme.co.za',
  phone: '0821234567',
  roleTitle: 'Junior Sales Consultant',
  roleCategory: 'SALES',
  location: 'Sandton',
  workArrangement: 'HYBRID',
  salaryMin: '12000',
  salaryMax: '16000',
  employmentType: 'PERMANENT',
  requiredExperience: 'UP_TO_1',
  keySkills: 'Cold calling, CRM',
  startDate: new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10),
  description: 'Calling inbound leads, booking demos and keeping the CRM up to date.',
  submissionKey: uuid(),
  website: '',
  formStartedAt: Date.now() - 60_000,
  ...patch,
});

export const jsonRequest = (url: string, body: unknown, init: RequestInit = {}) =>
  new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': nextIp(), ...(init.headers || {}) },
    body: typeof body === 'string' ? body : JSON.stringify(body),
    ...init,
  });
