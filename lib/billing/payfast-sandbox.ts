import { createHash, randomUUID } from 'crypto';
import { isFeatureEnabled } from '@/lib/features';

/**
 * Hiring Partner subscriptions on the PayFast SANDBOX only.
 *
 * - Uses dedicated PAYFAST_SANDBOX_* credentials and NEVER the PAYFAST_MERCHANT_* values used by the
 *   existing job-posting checkout (configured for production in this project).
 * - Host is hard-coded to sandbox.payfast.co.za. Live charging is not implemented: if
 *   PARTNER_BILLING_LIVE is set, every entry point refuses to run.
 * - Notifications (ITN) are verified by signature, merchant id, amount and PayFast's validate
 *   endpoint, and applied idempotently via BillingEvent.event_key.
 */
export const SANDBOX_HOST = 'https://sandbox.payfast.co.za';

export function sandboxConfig() {
  if (process.env.PARTNER_BILLING_LIVE) throw new Error('Live Hiring Partner billing is not implemented. Remove PARTNER_BILLING_LIVE.');
  if (!isFeatureEnabled('PARTNER_BILLING_SANDBOX')) throw new Error('PayFast sandbox billing is disabled (FEATURE_PARTNER_BILLING_SANDBOX).');
  return {
    // PayFast's public sandbox test merchant unless you configure your own sandbox account
    merchantId: process.env.PAYFAST_SANDBOX_MERCHANT_ID || '10000100',
    merchantKey: process.env.PAYFAST_SANDBOX_MERCHANT_KEY || '46f0cd694581a',
    passphrase: process.env.PAYFAST_SANDBOX_PASSPHRASE || '',
    processUrl: `${SANDBOX_HOST}/eng/process`,
    validateUrl: `${SANDBOX_HOST}/eng/query/validate`,
  };
}

/** PayFast encoding: URL-encode, spaces as "+", uppercase hex (as PHP urlencode). */
export const pfEncode = (v: string) =>
  encodeURIComponent(v.trim())
    .replace(/%20/g, '+')
    .replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

export function pfSignature(pairs: [string, string][], passphrase: string, skipEmpty: boolean) {
  const parts = pairs.filter(([k, v]) => k !== 'signature' && (!skipEmpty || v !== '')).map(([k, v]) => `${k}=${pfEncode(v)}`);
  if (passphrase) parts.push(`passphrase=${pfEncode(passphrase)}`);
  return createHash('md5').update(parts.join('&')).digest('hex');
}

const amount = (rand: number) => rand.toFixed(2);

/**
 * Signed form fields for a monthly subscription checkout. Field order follows PayFast's documented
 * order, which the signature depends on.
 */
export function buildSubscriptionCheckout(input: {
  checkoutRef: string;
  monthlyPrice: number;
  itemName: string;
  email?: string | null;
  firstName?: string | null;
  billingDate: Date;
  appUrl: string;
}) {
  const cfg = sandboxConfig();
  const fields: [string, string][] = [
    ['merchant_id', cfg.merchantId],
    ['merchant_key', cfg.merchantKey],
    ['return_url', `${input.appUrl}/admin/partner?checkout=return`],
    ['cancel_url', `${input.appUrl}/admin/partner?checkout=cancel`],
    ['notify_url', `${input.appUrl}/api/webhooks/payfast-subscriptions`],
    ['name_first', input.firstName || ''],
    ['email_address', input.email || ''],
    ['m_payment_id', input.checkoutRef],
    ['amount', amount(input.monthlyPrice)],
    ['item_name', input.itemName.slice(0, 100)],
    ['subscription_type', '1'],
    ['billing_date', input.billingDate.toISOString().slice(0, 10)],
    ['recurring_amount', amount(input.monthlyPrice)],
    ['frequency', '3'], // monthly
    ['cycles', '0'], // until cancelled
  ];
  const present = fields.filter(([, v]) => v !== '');
  present.push(['signature', pfSignature(present, cfg.passphrase, true)]);
  return { action: cfg.processUrl, fields: present };
}

type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ ok: boolean; text(): Promise<string> }>;

export interface ItnResult {
  status: number;
  outcome: 'APPLIED' | 'IGNORED' | 'REJECTED' | 'DUPLICATE';
  detail: string;
}

const addMonths = (d: Date, n: number) => {
  const x = new Date(d);
  x.setUTCMonth(x.getUTCMonth() + n);
  return x;
};

/** Verifies and applies one PayFast ITN. Safe to call repeatedly with the same notification. */
export async function processSubscriptionItn(db: any, rawBody: string, opts: { fetchImpl?: FetchLike; now?: Date } = {}): Promise<ItnResult> {
  const cfg = sandboxConfig();
  const now = opts.now ?? new Date();
  const pairs = Array.from(new URLSearchParams(rawBody).entries());
  const data = Object.fromEntries(pairs);

  const reject = async (detail: string, subscriptionId: number | null = null): Promise<ItnResult> => {
    await db.billingEvent
      .create({
        data: {
          provider: 'PAYFAST_SANDBOX',
          event_key: `rejected:${randomUUID()}`,
          subscription_id: subscriptionId,
          payment_status: data.payment_status ?? null,
          provider_payment_id: data.pf_payment_id ?? null,
          verified: false,
          outcome: 'REJECTED',
          detail,
        },
      })
      .catch(() => undefined);
    return { status: 400, outcome: 'REJECTED', detail };
  };

  // 1. Signature over all received fields in order (empty values included), plus passphrase
  if (!data.signature || pfSignature(pairs, cfg.passphrase, false) !== data.signature) return reject('Signature mismatch.');
  // 2. Intended merchant
  if (data.merchant_id !== cfg.merchantId) return reject('Unexpected merchant id.');
  // 3. Known subscription
  const sub = data.m_payment_id ? await db.partnerSubscription.findUnique({ where: { checkout_ref: data.m_payment_id } }) : null;
  if (!sub) return reject('Unknown subscription reference.');
  if (sub.billing_mode !== 'PAYFAST_SANDBOX') return reject('Subscription is not on sandbox billing.', sub.id);
  // 4. Amount matches the agreed monthly price
  const gross = Math.round(Number(data.amount_gross) * 100);
  if (data.payment_status === 'COMPLETE' && gross !== sub.monthly_price * 100) return reject(`Amount ${data.amount_gross} does not match the agreed R${sub.monthly_price}.`, sub.id);
  // 5. Confirm with PayFast
  const paramString = pairs
    .filter(([k]) => k !== 'signature')
    .map(([k, v]) => `${k}=${pfEncode(v)}`)
    .join('&');
  try {
    const fetchImpl: FetchLike = opts.fetchImpl ?? (fetch as unknown as FetchLike);
    const res = await fetchImpl(cfg.validateUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: paramString });
    const text = (await res.text()).trim();
    if (!res.ok || text !== 'VALID') return reject('PayFast did not confirm the notification.', sub.id);
  } catch {
    // Not recorded as processed, so PayFast's retry can succeed later
    return { status: 503, outcome: 'REJECTED', detail: 'Could not reach PayFast to validate.' };
  }

  // 6. Idempotent application
  const eventKey = `payfast:${data.pf_payment_id || 'none'}:${data.payment_status || 'none'}`;
  const existing = await db.billingEvent.findUnique({ where: { event_key: eventKey } });
  if (existing) return { status: 200, outcome: 'DUPLICATE', detail: 'Already processed.' };

  let update: Record<string, unknown> | null = null;
  let outcome: 'APPLIED' | 'IGNORED' = 'APPLIED';
  let detail = '';
  switch (data.payment_status) {
    case 'COMPLETE':
      if (sub.status === 'CANCELLED') {
        outcome = 'IGNORED';
        detail = 'Payment received for a cancelled subscription; needs manual review.';
      } else {
        const base = sub.current_period_end && sub.current_period_end > now ? sub.current_period_end : now;
        update = { status: 'ACTIVE', provider_token: data.token || sub.provider_token, current_period_end: addMonths(base, 1) };
        detail = 'Payment complete.';
      }
      break;
    case 'CANCELLED':
      update = { status: 'CANCELLED', cancelled_at: now };
      detail = 'Subscription cancelled at PayFast.';
      break;
    case 'FAILED':
      if (sub.status === 'ACTIVE') update = { status: 'PAST_DUE' };
      detail = 'Payment failed; marked past due. Overdue handling is a pending decision.';
      break;
    default:
      outcome = 'IGNORED';
      detail = `Unhandled payment status ${data.payment_status ?? '(none)'}.`;
  }

  try {
    await db.$transaction(async (tx: any) => {
      await tx.billingEvent.create({
        data: {
          provider: 'PAYFAST_SANDBOX',
          event_key: eventKey,
          subscription_id: sub.id,
          payment_status: data.payment_status ?? null,
          amount_cents: Number.isFinite(gross) ? gross : null,
          provider_payment_id: data.pf_payment_id ?? null,
          verified: true,
          outcome,
          detail,
        },
      });
      if (update) await tx.partnerSubscription.update({ where: { id: sub.id }, data: update });
    });
  } catch (e: any) {
    if (e?.code === 'P2002') return { status: 200, outcome: 'DUPLICATE', detail: 'Already processed.' };
    throw e;
  }
  return { status: 200, outcome, detail };
}
