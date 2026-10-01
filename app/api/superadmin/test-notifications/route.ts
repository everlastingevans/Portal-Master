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
      const emailSubject = subject || 'LaunchPath test email';
      const safeBody = String(body)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br />');
      const emailHtml = html || `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; color: #334155;">
          <div style="background-color: #0A1B3D; padding: 20px 24px;">
            <span style="color: #ffffff; font-size: 16px; font-weight: bold; letter-spacing: 2px;">LAUNCHPATH</span>
          </div>
          <div style="padding: 24px;">
            <h2 style="color: #0A1B3D; margin-top: 0; font-size: 18px;">Test email</h2>
            <p>This test message was sent from the LaunchPath admin console.</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #A6F23C;">
              ${safeBody}
            </div>
            <p style="font-size: 11px; color: #94a3b8; margin-bottom: 0;">Sent via Brevo</p>
          </div>
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
