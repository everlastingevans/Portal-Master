import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword, hashResetToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { token, email, newPassword } = await req.json();

    if (!token || !email || !newPassword || typeof token !== 'string' || typeof email !== 'string') {
      return NextResponse.json({ error: 'Token, email, and new password are required' }, { status: 400 });
    }
    if (String(newPassword).length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: {
        email: email.trim(),
        reset_token: hashResetToken(token.trim()),
        reset_token_expiry: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    // Same scrypt format as registration, so login's verifyPassword accepts it
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashPassword(String(newPassword)),
        reset_token: null,
        reset_token_expiry: null,
      },
    });

    return NextResponse.json({ message: 'Password has been reset successfully' });
  } catch (error: any) {
    console.error('Reset password error:', error?.message);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
