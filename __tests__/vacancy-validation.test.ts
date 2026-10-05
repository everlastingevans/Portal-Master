import { MIN_FILL_MS, looksLikeSpam, validateVacancyInput } from '@/lib/hire/vacancy';

const NOW = new Date('2026-10-05T10:00:00Z');

const validBody = () => ({
  companyName: '  Acme Trading (Pty) Ltd ',
  contactName: 'Naledi Khumalo',
  workEmail: 'Naledi@Acme.co.za',
  phone: '082 123 4567',
  roleTitle: 'Junior Sales Consultant',
  roleCategory: 'SALES',
  location: 'Sandton, Johannesburg',
  workArrangement: 'HYBRID',
  salaryMin: '12 000',
  salaryMax: 'R16,000',
  employmentType: 'PERMANENT',
  requiredExperience: 'UP_TO_1',
  keySkills: 'Cold calling, CRM, cold calling, Excel',
  startDate: '2026-11-01',
  description: 'Calling inbound leads, booking demos and keeping the CRM up to date for a growing team.',
  submissionKey: '3f1c2b9e-8a4d-4c6e-9b2a-1d2e3f4a5b6c',
});

describe('validateVacancyInput', () => {
  it('accepts and normalises a valid submission', () => {
    const r = validateVacancyInput(validBody(), NOW);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.companyName).toBe('Acme Trading (Pty) Ltd');
    expect(r.data.workEmail).toBe('naledi@acme.co.za');
    expect(r.data.phone).toBe('+27821234567');
    expect(r.data.salaryMin).toBe(12000);
    expect(r.data.salaryMax).toBe(16000);
    expect(r.data.keySkills).toEqual(['Cold calling', 'CRM', 'Excel']);
    expect(r.data.startDate?.toISOString()).toBe('2026-11-01T00:00:00.000Z');
    expect(r.data.roleCategoryOther).toBeNull();
  });

  it('treats a blank start date as flexible', () => {
    const r = validateVacancyInput({ ...validBody(), startDate: '' }, NOW);
    expect(r.ok && r.data.startDate).toBeNull();
  });

  it('reports every missing required field', () => {
    const r = validateVacancyInput({}, NOW);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    for (const k of ['companyName', 'contactName', 'workEmail', 'phone', 'roleTitle', 'roleCategory', 'location', 'workArrangement', 'salaryMin', 'salaryMax', 'employmentType', 'requiredExperience', 'keySkills', 'description', 'form']) {
      expect(r.errors).toHaveProperty(k);
    }
  });

  it('rejects bad values', () => {
    const bad = (patch: object) => validateVacancyInput({ ...validBody(), ...patch }, NOW);
    expect(bad({ workEmail: 'not-an-email' }).ok).toBe(false);
    expect(bad({ salaryMin: '20000', salaryMax: '15000' }).ok).toBe(false);
    expect(bad({ roleCategory: 'ASTRONAUT' }).ok).toBe(false);
    expect(bad({ startDate: '2026-01-01' }).ok).toBe(false); // past
    expect(bad({ phone: '123' }).ok).toBe(false);
    expect(bad({ description: 'Too short' }).ok).toBe(false);
    expect(bad({ submissionKey: 'abc' }).ok).toBe(false);
  });

  it('requires a description of the role when the category is Other', () => {
    expect(validateVacancyInput({ ...validBody(), roleCategory: 'OTHER' }, NOW).ok).toBe(false);
    const r = validateVacancyInput({ ...validBody(), roleCategory: 'OTHER', roleCategoryOther: 'Logistics' }, NOW);
    expect(r.ok && r.data.roleCategoryOther).toBe('Logistics');
  });
});

describe('looksLikeSpam', () => {
  const now = 1_000_000_000;
  it('flags a filled honeypot or a too-fast submission', () => {
    expect(looksLikeSpam({ website: 'http://spam', formStartedAt: now - 60_000 }, now)).toBe(true);
    expect(looksLikeSpam({ website: '', formStartedAt: now - (MIN_FILL_MS - 1) }, now)).toBe(true);
    expect(looksLikeSpam({ website: '' }, now)).toBe(true);
  });
  it('passes a normal human submission', () => {
    expect(looksLikeSpam({ website: '', formStartedAt: now - 90_000 }, now)).toBe(false);
  });
});
