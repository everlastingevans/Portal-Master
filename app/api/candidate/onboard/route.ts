import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sanitizeTalentFields } from '@/lib/talent';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'CANDIDATE') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, professional_title, experience_level, linkedin_url, github_url, phone } = body;
    await db.user.update({
      where: { id: session.userId },
      data: {
        name,
        professional_title,
        experience_level,
        linkedin_url,
        github_url,
        phone,
        ...sanitizeTalentFields(body),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
