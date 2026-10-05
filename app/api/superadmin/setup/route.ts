import { NextResponse } from 'next/server';
import { checkRole } from '@/lib/auth';
import { PENDING_DECISIONS, featureStatus } from '@/lib/features';
import { isEmailConfigured } from '@/lib/notifications';

// Commercial setup status: feature flags, pending decisions and which credentials are present.
// Never returns secret values. SUPERADMIN only.
export async function GET() {
  const auth = await checkRole(['SUPERADMIN']);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const present = (k: string) => Boolean(process.env[k]);
  return NextResponse.json({
    features: featureStatus(),
    decisions: PENDING_DECISIONS,
    credentials: [
      { key: 'BREVO_API_KEY', present: isEmailConfigured(), purpose: 'Transactional email' },
      { key: 'NEXT_PUBLIC_APP_URL', present: present('NEXT_PUBLIC_APP_URL'), purpose: 'Absolute links in emails, shortlist links, PayFast return/notify URLs, canonical URLs' },
      { key: 'PAYFAST_SANDBOX_MERCHANT_ID', present: present('PAYFAST_SANDBOX_MERCHANT_ID'), purpose: 'Your PayFast sandbox merchant (otherwise PayFast’s public test merchant is used)' },
      { key: 'PAYFAST_SANDBOX_MERCHANT_KEY', present: present('PAYFAST_SANDBOX_MERCHANT_KEY'), purpose: 'PayFast sandbox merchant key' },
      { key: 'PAYFAST_SANDBOX_PASSPHRASE', present: present('PAYFAST_SANDBOX_PASSPHRASE'), purpose: 'PayFast sandbox passphrase (must match the sandbox account setting)' },
      { key: 'PARTNER_BILLING_LIVE', present: present('PARTNER_BILLING_LIVE'), purpose: 'Not supported: live Hiring Partner billing is not implemented. Must be absent.' },
    ],
    liveBilling: { implemented: false, note: 'Live subscription charging is intentionally not implemented until the pending Hiring Partner decisions are resolved.' },
  });
}
