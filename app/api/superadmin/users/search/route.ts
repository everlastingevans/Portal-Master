import { NextResponse } from 'next/server';
import { checkRole } from '@/lib/auth';
import db from '@/lib/db';

// Staff lookup of employer accounts to add to a company. Results are for an explicit staff choice;
// nobody is ever added automatically because their email or domain matches. SUPERADMIN only.
export async function GET(req: Request) {
  const auth = await checkRole(['SUPERADMIN']);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const q = (new URL(req.url).searchParams.get('q') || '').trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ users: [] });
  const users = await db.user.findMany({
    where: { role: { in: ['CLIENT', 'EMPLOYER'] }, OR: [{ email: { contains: q, mode: 'insensitive' } }, { name: { contains: q, mode: 'insensitive' } }] },
    select: { id: true, name: true, email: true },
    take: 15,
  });
  return NextResponse.json({ users });
}
