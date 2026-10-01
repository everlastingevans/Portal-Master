import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/notifications';

// Public endpoint for the landing-page contact form (rate limited by middleware)
const ROLES = ['Employer', 'Recruiter or agency', 'Job seeker', 'Training partner'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const clean = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = clean(body.name, 120);
    const email = clean(body.email, 200);
    const phone = clean(body.phone, 40);
    const company = clean(body.company, 160);
    const message = clean(body.message, 4000);
    const role = ROLES.includes(body.role) ? body.role : 'Unspecified';

    if (!name || !message) {
      return NextResponse.json({ error: 'Please add your name and a message.' }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const rows = [
      ['Name', name],
      ['Email', email],
      ['Phone', phone || '—'],
      [role === 'Job seeker' ? 'Studied at' : 'Company', company || '—'],
      ['Enquiry type', role],
    ]
      .map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;color:#64748b;">${k}</td><td style="padding:6px 0;color:#0A1B3D;font-weight:600;">${escape(v)}</td></tr>`)
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background:#0A1B3D;padding:18px 24px;color:#ffffff;font-weight:bold;letter-spacing:2px;">LAUNCHPATH · NEW ENQUIRY</div>
        <div style="padding:24px;">
          <table style="font-size:14px;border-collapse:collapse;">${rows}</table>
          <div style="margin-top:20px;padding:16px;background:#f8fafc;border-left:4px solid #A6F23C;border-radius:8px;color:#334155;font-size:14px;line-height:1.6;">
            ${escape(message).replace(/\n/g, '<br />')}
          </div>
          <p style="margin-top:20px;font-size:12px;color:#94a3b8;">Reply directly to ${escape(email)}.</p>
        </div>
      </div>`;

    const sent = await sendEmail({
      to: process.env.CONTACT_EMAIL || 'hello@launchpath.co.za',
      subject: `New ${role.toLowerCase()} enquiry from ${name}`,
      html,
      text: `${role} enquiry from ${name} <${email}> ${phone}\n${company}\n\n${message}`,
    });

    if (!sent) {
      return NextResponse.json({ error: 'We couldn’t send your message right now.' }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Contact form] error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
