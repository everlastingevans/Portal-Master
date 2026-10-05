import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { checkRole } from '@/lib/auth';
import { getHireTerms, saveHireTerms } from '@/lib/hire/settings';
import { validateHireTerms } from '@/lib/hire/terms';

// LaunchPath Hire pricing and guarantee settings. SUPERADMIN only.
export async function GET() {
  const auth = await checkRole(['SUPERADMIN']);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return NextResponse.json({ terms: await getHireTerms() });
}

export async function PUT(req: Request) {
  const auth = await checkRole(['SUPERADMIN']);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const result = validateHireTerms(body);
  if (!result.ok) {
    return NextResponse.json({ error: Object.values(result.errors)[0], errors: result.errors }, { status: 400 });
  }

  try {
    const terms = await saveHireTerms(result.value, auth.session?.userId ?? null);
    // Marketing pages show these terms; existing vacancies keep their snapshotted terms
    revalidatePath('/');
    revalidatePath('/find-candidates');
    return NextResponse.json({ success: true, terms });
  } catch (error) {
    console.error('[Hire terms] save failed:', error);
    return NextResponse.json({ error: 'Could not save the settings.' }, { status: 500 });
  }
}
