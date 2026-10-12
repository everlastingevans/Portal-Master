import { pfEncode, pfSignature } from '@/lib/billing/payfast-sandbox';

/**
 * Verification for the job-board PayFast notifications (ITN) sent to /api/webhooks/payfast.
 * Same checks as the Hiring Partner sandbox flow: signature, merchant id, expected amount, and
 * PayFast's own validate endpoint. Nothing is applied unless all of them pass.
 */

/** What each payment reference is for and what it must cost (ZAR). Anything else is rejected. */
export const JOB_BOARD_PRICES = {
  JOB: 1999, // publish a role (jobs/checkout)
  UNLOCK_JOB: 499, // unlock a role's candidate pipeline (employer/unlock)
} as const;

export type JobBoardPurpose = keyof typeof JOB_BOARD_PRICES;

export function jobBoardPayfastConfig() {
  const live = process.env.PAYFAST_ENV === 'production';
  const host = live ? 'https://www.payfast.co.za' : 'https://sandbox.payfast.co.za';
  const merchantId = process.env.PAYFAST_MERCHANT_ID || (live ? '' : '10000100'); // public sandbox merchant outside production
  return { live, merchantId, passphrase: process.env.PAYFAST_PASSPHRASE || '', validateUrl: `${host}/eng/query/validate` };
}

/**
 * Who may activate or unlock a job without a verified PayFast payment: a real SUPERADMIN account and
 * anyone on a local dev server. Never a regular employer.
 */
export function paymentBypassAllowed(session: { realRole?: string } | null): boolean {
  if (session?.realRole === 'SUPERADMIN') return true;
  return process.env.NODE_ENV === 'development';
}

/** "JOB_12" -> JOB / 12, "UNLOCK_JOB_12" -> UNLOCK_JOB / 12. */
export function parsePaymentRef(ref: string | undefined): { purpose: JobBoardPurpose; jobId: number } | null {
  const m = /^(JOB|UNLOCK_JOB)_(\d+)$/.exec(ref || '');
  return m ? { purpose: m[1] as JobBoardPurpose, jobId: Number(m[2]) } : null;
}

type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ ok: boolean; text(): Promise<string> }>;

export type VerifiedItn =
  | { ok: true; complete: boolean; purpose: JobBoardPurpose; jobId: number; data: Record<string, string> }
  | { ok: false; status: number; detail: string };

/** Checks one raw ITN body without touching the database; the caller applies the result. */
export async function verifyJobBoardItn(rawBody: string, opts: { fetchImpl?: FetchLike } = {}): Promise<VerifiedItn> {
  const cfg = jobBoardPayfastConfig();
  const pairs = Array.from(new URLSearchParams(rawBody).entries());
  const data = Object.fromEntries(pairs);
  const reject = (detail: string, status = 400): VerifiedItn => ({ ok: false, status, detail });

  if (!cfg.merchantId) return reject('PAYFAST_MERCHANT_ID is not configured.', 500);
  // 1. Signature over all received fields in order, plus the passphrase
  if (!data.signature || pfSignature(pairs, cfg.passphrase, false) !== data.signature) return reject('Signature mismatch.');
  // 2. Our merchant account
  if (data.merchant_id !== cfg.merchantId) return reject('Unexpected merchant id.');
  // 3. A reference we issue, for the price we charge
  const ref = parsePaymentRef(data.m_payment_id);
  if (!ref) return reject('Unknown payment reference.');
  const complete = data.payment_status === 'COMPLETE';
  if (complete && Math.round(Number(data.amount_gross) * 100) !== JOB_BOARD_PRICES[ref.purpose] * 100) {
    return reject(`Amount ${data.amount_gross} does not match R${JOB_BOARD_PRICES[ref.purpose]}.`);
  }
  // 4. Confirm with PayFast that it sent this notification
  const paramString = pairs
    .filter(([k]) => k !== 'signature')
    .map(([k, v]) => `${k}=${pfEncode(v)}`)
    .join('&');
  try {
    const fetchImpl: FetchLike = opts.fetchImpl ?? (fetch as unknown as FetchLike);
    const res = await fetchImpl(cfg.validateUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: paramString });
    if (!res.ok || (await res.text()).trim() !== 'VALID') return reject('PayFast did not confirm the notification.');
  } catch {
    // Not applied, so PayFast's retry can succeed later
    return reject('Could not reach PayFast to validate.', 503);
  }

  return { ok: true, complete, purpose: ref.purpose, jobId: ref.jobId, data };
}
