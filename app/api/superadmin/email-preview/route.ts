import { NextResponse } from 'next/server';
import { checkRole } from '@/lib/auth';
import { EMAIL_TEMPLATES, previewEmail } from '@/lib/hire/emails';
import { isEmailConfigured } from '@/lib/notifications';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Development preview of transactional emails using fictional sample data. Sends nothing. SUPERADMIN only.
export async function GET(req: Request) {
  const auth = await checkRole(['SUPERADMIN']);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const params = new URL(req.url).searchParams;
  const template = params.get('template');
  if (!template) return NextResponse.json({ templates: EMAIL_TEMPLATES, providerConfigured: isEmailConfigured() });

  const email = previewEmail(template);
  if (!email) return NextResponse.json({ error: 'Unknown template.' }, { status: 404 });
  if (params.get('format') === 'text') {
    return new NextResponse(`Subject: ${email.subject}\n\n${email.text}`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  const page = `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>${esc(email.subject)}</title><body style="background:#f1f5f9;padding:24px"><p style="font-family:Arial;color:#64748b;font-size:13px">Preview only, nothing was sent. Subject: <strong>${esc(email.subject)}</strong></p>${email.html}</body>`;
  return new NextResponse(page, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
