/**
 * Send-once email ledger: missing credentials, provider failures, retries and concurrency never
 * produce duplicate notifications or false "sent" states.
 */
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/notifications', () => ({ isEmailConfigured: jest.fn(() => true), sendEmail: jest.fn(async () => true) }));
jest.mock('@/lib/db', () => {
  const { createFakeDb } = require('../test-utils/fake-db');
  const db = createFakeDb();
  return { __esModule: true, default: db, prisma: db };
});

import db from '@/lib/db';
import { isEmailConfigured, sendEmail } from '@/lib/notifications';
import { sendOnce, sendVacancyEmails } from '@/lib/hire/email-ledger';
import { runVacancyAction } from '@/lib/hire/ops';
import { DEFAULT_HIRE_TERMS } from '@/lib/hire/terms';
import { renderEmployerShortlistReady, renderEmployerVacancyConfirmation } from '@/lib/hire/emails';
import { POST as submitVacancy } from '@/app/api/vacancies/route';
import { jsonRequest, signedInAs, vacancyBody } from '../test-utils/session';

const fdb = db as any;
const configured = isEmailConfigured as jest.Mock;
const send = sendEmail as jest.Mock;
const ctx = { actorId: 7, terms: DEFAULT_HIRE_TERMS };
const email = { subject: 'Hi', html: '<p>Hi</p>', text: 'Hi' };

async function vacancy() {
  const res = await submitVacancy(jsonRequest('http://localhost/api/vacancies', vacancyBody()));
  return (await res.json()).reference as number;
}

beforeEach(() => {
  fdb.reset();
  jest.clearAllMocks();
  configured.mockReturnValue(true);
  send.mockResolvedValue(true);
  signedInAs(null);
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('sendOnce', () => {
  it('sends once and never again for the same key', async () => {
    const a = await sendOnce(fdb, { dedupeKey: 'k:1', template: 't', to: 'a@b.co', email });
    const b = await sendOnce(fdb, { dedupeKey: 'k:1', template: 't', to: 'a@b.co', email });
    expect([a.outcome, b.outcome]).toEqual(['SENT', 'ALREADY_SENT']);
    expect(send).toHaveBeenCalledTimes(1);
    expect(fdb._tables.emailLog).toHaveLength(1);
    expect(fdb._tables.emailLog[0]).toMatchObject({ status: 'SENT', attempts: 1 });
  });

  it('records NOT_CONFIGURED without calling the provider, then sends on retry once configured', async () => {
    configured.mockReturnValue(false);
    expect((await sendOnce(fdb, { dedupeKey: 'k:2', template: 't', to: 'a@b.co', email })).outcome).toBe('NOT_CONFIGURED');
    expect(send).not.toHaveBeenCalled();
    configured.mockReturnValue(true);
    expect((await sendOnce(fdb, { dedupeKey: 'k:2', template: 't', to: 'a@b.co', email })).outcome).toBe('SENT');
    expect(fdb._tables.emailLog).toHaveLength(1);
  });

  it('marks provider rejections and exceptions as FAILED with the reason, and retries cleanly', async () => {
    send.mockResolvedValueOnce(false);
    expect((await sendOnce(fdb, { dedupeKey: 'k:3', template: 't', to: 'a@b.co', email })).outcome).toBe('FAILED');
    expect(fdb._tables.emailLog[0].last_error).toMatch(/rejected/);
    send.mockRejectedValueOnce(new Error('network down'));
    expect((await sendOnce(fdb, { dedupeKey: 'k:3', template: 't', to: 'a@b.co', email })).outcome).toBe('FAILED');
    expect(fdb._tables.emailLog[0].last_error).toBe('network down');
    expect((await sendOnce(fdb, { dedupeKey: 'k:3', template: 't', to: 'a@b.co', email })).outcome).toBe('SENT');
    expect(fdb._tables.emailLog[0]).toMatchObject({ status: 'SENT', attempts: 3, last_error: null });
  });

  it('lets only one of two concurrent senders deliver', async () => {
    let release!: () => void;
    send.mockImplementationOnce(() => new Promise((r) => (release = () => r(true))));
    const first = sendOnce(fdb, { dedupeKey: 'k:4', template: 't', to: 'a@b.co', email });
    await new Promise((r) => setTimeout(r, 0));
    const second = await sendOnce(fdb, { dedupeKey: 'k:4', template: 't', to: 'a@b.co', email });
    release();
    expect(second.outcome).toBe('IN_PROGRESS');
    expect((await first).outcome).toBe('SENT');
    expect(send).toHaveBeenCalledTimes(1);
  });
});

describe('vacancy emails and staff retries', () => {
  it('a failed confirmation can be retried by staff without re-sending the ops alert', async () => {
    send.mockImplementation(async ({ to }: any) => to !== 'naledi@acme.co.za'); // employer address fails
    const id = await vacancy();
    const failed = fdb._tables.emailLog.find((e: any) => e.template === 'vacancy_confirmation');
    expect(failed.status).toBe('FAILED');
    expect(send).toHaveBeenCalledTimes(2);

    send.mockResolvedValue(true);
    const retry = await runVacancyAction(fdb, id, 'RETRY_EMAIL', { emailLogId: failed.id }, ctx);
    expect(retry.body.outcome).toBe('SENT');
    expect(send).toHaveBeenCalledTimes(3);
    expect(send.mock.calls[2][0].to).toBe('naledi@acme.co.za');

    // Retrying again, or re-running the submission's email step, sends nothing new
    await runVacancyAction(fdb, id, 'RETRY_EMAIL', { emailLogId: failed.id }, ctx);
    await sendVacancyEmails(fdb, id);
    expect(send).toHaveBeenCalledTimes(3);
  });

  it('refuses to retry an email that belongs to another vacancy, or a one-time shortlist email', async () => {
    const a = await vacancy();
    const b = await submitVacancy(jsonRequest('http://localhost/api/vacancies', vacancyBody({ roleTitle: 'Other' }))).then((r) => r.json());
    const logA = fdb._tables.emailLog.find((e: any) => e.vacancy_id === a);
    expect((await runVacancyAction(fdb, b.reference, 'RETRY_EMAIL', { emailLogId: logA.id }, ctx)).status).toBe(400);

    await runVacancyAction(fdb, a, 'CREATE_SHORTLIST', {}, ctx);
    await runVacancyAction(fdb, a, 'ADD_CANDIDATE', { shortlistId: 1, display_name: 'Lerato M' }, ctx);
    send.mockResolvedValueOnce(false);
    const sent = await runVacancyAction(fdb, a, 'SEND_SHORTLIST', { shortlistId: 1 }, ctx);
    expect(sent.body.email).toBe('FAILED');
    expect(sent.body.url).toContain('/shortlist#t='); // staff can still copy the link
    const shortlistLog = fdb._tables.emailLog.find((e: any) => e.template === 'shortlist_ready');
    const retry = await runVacancyAction(fdb, a, 'RETRY_EMAIL', { emailLogId: shortlistLog.id }, ctx);
    expect(retry.status).toBe(400);
    expect(retry.body.error).toMatch(/new link/);
  });
});

describe('templates', () => {
  it('describe the shortlist timeline as a target and never include a guarantee of results', () => {
    const c = renderEmployerVacancyConfirmation({ id: 9, contact_name: 'Naledi Khumalo', role_title: 'SDR', company_name: 'Acme' });
    expect(c.text).toContain('our target for serviceable roles is 3-5 screened candidates within five working days');
    expect(c.text).toContain('calibrat');
    expect(c.html).toContain('ref');
    const s = renderEmployerShortlistReady({ vacancyId: 9, contactName: 'Naledi', roleTitle: 'SDR', companyName: 'Acme', url: 'https://x/shortlist#t=abc', expiresAt: new Date('2026-10-19'), candidateCount: 4 });
    expect(s.text).toContain('4 screened candidates');
    expect(s.text).toContain('expires on');
  });

  it('escape submitted values in HTML', () => {
    const c = renderEmployerVacancyConfirmation({ id: 9, contact_name: '<script>x</script>', role_title: '<b>SDR</b>', company_name: 'A&B' });
    expect(c.html).not.toContain('<script>');
    expect(c.html).toContain('&lt;b&gt;SDR&lt;/b&gt;');
  });
});
