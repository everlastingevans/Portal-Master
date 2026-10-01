import db from '@/lib/db';
import { checkRole } from '@/lib/auth';

type Access =
  | { ok: true; userId: number; isAdmin: boolean; application: { id: number; job: { id: number; title: string; employer_id: number | null; tenant_id: number | null } } }
  | { ok: false; status: number; error: string };

/**
 * Employer-side access to an application: the job's owner, an employer user in the same company
 * tenant (the hiring team), or a superadmin. Candidates never pass, whatever application they target.
 */
export async function getEmployerApplicationAccess(applicationId: number): Promise<Access> {
  const auth = await checkRole(['EMPLOYER', 'CLIENT']);
  if (!auth.authorized || !auth.session) return { ok: false, status: auth.status, error: auth.error || 'Unauthorized' };
  const { userId, realRole } = auth.session;
  const isAdmin = realRole === 'SUPERADMIN';

  if (!Number.isInteger(applicationId) || applicationId <= 0) return { ok: false, status: 400, error: 'Invalid application.' };

  const application = await db.jobApplication.findUnique({
    where: { id: applicationId },
    select: { id: true, job: { select: { id: true, title: true, employer_id: true, tenant_id: true } } },
  });
  if (!application) return { ok: false, status: 404, error: 'Application not found.' };

  if (isAdmin || application.job.employer_id === userId) return { ok: true, userId, isAdmin, application };

  if (application.job.tenant_id) {
    const me = await db.user.findUnique({ where: { id: userId }, select: { tenant_id: true, role: true } });
    const isEmployer = ['EMPLOYER', 'CLIENT'].includes(String(me?.role).toUpperCase());
    if (isEmployer && me?.tenant_id === application.job.tenant_id) return { ok: true, userId, isAdmin, application };
  }

  // 404 rather than 403 so application ids can't be probed
  return { ok: false, status: 404, error: 'Application not found.' };
}
