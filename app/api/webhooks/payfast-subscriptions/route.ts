import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { isFeatureEnabled } from '@/lib/features';
import { processSubscriptionItn } from '@/lib/billing/payfast-sandbox';

// PayFast SANDBOX notifications (ITN) for Hiring Partner subscriptions. Public (PayFast calls it), so
// every notification is verified by signature, merchant, amount and PayFast's validate endpoint, and
// applied at most once. Disabled unless FEATURE_PARTNER_BILLING_SANDBOX is on.
export async function POST(req: Request) {
  if (!isFeatureEnabled('PARTNER_BILLING_SANDBOX') || process.env.PARTNER_BILLING_LIVE) {
    return new NextResponse('Not found', { status: 404 });
  }
  const raw = await req.text();
  try {
    const result = await processSubscriptionItn(db, raw);
    if (result.outcome === 'REJECTED') console.warn(`[PayFast sandbox ITN] rejected: ${result.detail}`);
    return new NextResponse(result.outcome, { status: result.status });
  } catch (error) {
    console.error('[PayFast sandbox ITN] failed:', (error as Error).message);
    // Non-200 so PayFast retries; nothing was recorded as processed
    return new NextResponse('Error', { status: 500 });
  }
}
