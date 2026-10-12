import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import db from '@/lib/db';
import { hashResetToken } from '@/lib/auth';
import { isEmailConfigured, sendEmail } from '@/lib/notifications';

const GENERIC_MESSAGE = 'If that email is registered, we have sent a password reset code.';
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: email.trim() } });

    // Same response whether or not the account exists, so emails can't be enumerated
    if (!user) {
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    // Only a hash is stored; the code itself goes to the user's inbox and nowhere else
    const resetToken = randomBytes(32).toString('hex');
    await db.user.update({
      where: { id: user.id },
      data: {
        reset_token: hashResetToken(resetToken),
        reset_token_expiry: new Date(Date.now() + RESET_TTL_MS),
      },
    });

    await sendEmail({
      to: user.email,
      subject: 'Your LaunchPath password reset code',
      html: `
        <div style="font-family: sans-serif; line-height: 1.5; color: #1e293b;">
          <p>Hi${user.name ? ` ${escapeHtml(user.name)}` : ''},</p>
          <p>We received a request to reset your LaunchPath password. Paste this code into the reset form. It expires in 1 hour.</p>
          <p style="font-family: monospace; font-size: 15px; background: #f1f5f9; padding: 12px; border-radius: 6px; word-break: break-all;">${resetToken}</p>
          <p>If you didn't ask for this, you can ignore this email. Your password won't change.</p>
        </div>`,
      text: `Your LaunchPath password reset code (expires in 1 hour): ${resetToken}\n\nIf you didn't ask for this, ignore this email.`,
    });

    // Local development without an email provider: hand the code to the UI so the flow can be tested
    const devToken = process.env.NODE_ENV === 'development' && !isEmailConfigured() ? { _devToken: resetToken } : {};
    return NextResponse.json({ message: GENERIC_MESSAGE, ...devToken });
  } catch (error: any) {
    console.error('Forgot password error:', error?.message);
    return NextResponse.json({ error: 'Failed to process forgot password request' }, { status: 500 });
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
