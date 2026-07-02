import { checkRole } from '@/lib/auth';
import { sendEmail, sendSMS, sendWhatsApp } from '@/lib/notifications';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const auth = await checkRole(['SUPERADMIN']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const { channel, to, subject, body, html } = await req.json();

    if (!channel || !to || !body) {
      return NextResponse.json({ error: 'Missing required parameters: channel, to, and body' }, { status: 400 });
    }

    let success = false;
    let logMessage = '';

    if (channel === 'email') {
      const emailSubject = subject || 'LaunchPath - Brevo Test Email';
      const emailHtml = html || `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #334155;">
          <h2 style="color: #7145FF; margin-top: 0;">Brevo Email Integration Active</h2>
          <p>Hello,</p>
          <p>This is a successful transactional test email dispatched from the LaunchPath Superadmin Dashboard.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7145FF; font-family: monospace;">
            <strong>Test Payload:</strong><br />
            ${body}
          </div>
          <p style="font-size: 11px; color: #94a3b8; margin-bottom: 0;">Launched with confidence by Brevo Dispatcher</p>
        </div>
      `;

      success = await sendEmail({
        to,
        subject: emailSubject,
        html: emailHtml,
        text: body,
      });
      logMessage = success ? 'Test email sent successfully via Brevo' : 'Failed to send test email. Check server console logs for details.';
    } else if (channel === 'sms') {
      success = await sendSMS({
        to,
        body,
      });
      logMessage = success ? 'Test SMS sent successfully via Brevo' : 'Failed to send test SMS. Check server console logs for details.';
    } else if (channel === 'whatsapp') {
      success = await sendWhatsApp({
        to,
        body,
      });
      logMessage = success ? 'Test WhatsApp sent successfully via Brevo' : 'Failed to send test WhatsApp. Check server console logs for details.';
    } else {
      return NextResponse.json({ error: 'Invalid notification channel specified' }, { status: 400 });
    }

    // Check if real Brevo variables are missing and we are in fallback/mock mode
    const apiKey = process.env.BREVO_API_KEY;
    const isMock = !apiKey;

    return NextResponse.json({
      success,
      isMock,
      message: logMessage,
      details: {
        channel,
        recipient: to,
        body,
      }
    });
  } catch (error: any) {
    console.error('[Test Notification Route Error]:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
