import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import db from '@/lib/db';
import { checkRole } from '@/lib/auth';
import { AVAILABILITY_VALUES, CANDIDATE_LOCATIONS, parseSkills, TalentCandidate, TalentPoolResponse } from '@/lib/talent';

const PAGE_SIZE = 12;

// A profile counts as "active" once the candidate has given us something to match on
const ACTIVE_PROFILE: Prisma.UserWhereInput = {
  role: 'CANDIDATE',
  OR: [{ resume_text: { not: null } }, { skills: { not: null } }, { professional_title: { not: null } }],
};

const insensitive = (value: string) => ({ contains: value, mode: 'insensitive' as const });

/**
 * GET /api/employer/candidates
 * Query params: q, location (repeatable), skill (repeatable), availability (repeatable), minScore, page
 * Contact details (email, phone, CV/LinkedIn URLs) are deliberately never returned.
 */
export async function GET(req: NextRequest) {
  const auth = await checkRole(['EMPLOYER', 'CLIENT']);
  if (!auth.authorized || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const employerId = auth.session.userId;

  try {
    const params = req.nextUrl.searchParams;
    const q = (params.get('q') || '').trim().slice(0, 100);
    const locations = params.getAll('location').filter((l) => (CANDIDATE_LOCATIONS as readonly string[]).includes(l));
    const skills = params.getAll('skill').map((s) => s.trim()).filter(Boolean).slice(0, 10);
    const availability = params.getAll('availability').filter((a) => AVAILABILITY_VALUES.includes(a));
    const minScore = Math.min(100, Math.max(0, parseInt(params.get('minScore') || '0', 10) || 0));
    const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);

    const filters: Prisma.UserWhereInput[] = [ACTIVE_PROFILE];

    // Every search term must appear in the name, title, skills or bio
    for (const term of q.split(/\s+/).filter(Boolean).slice(0, 6)) {
      filters.push({
        OR: [{ name: insensitive(term) }, { professional_title: insensitive(term) }, { skills: insensitive(term) }, { bio: insensitive(term) }],
      });
    }
    // Candidates must have every selected skill
    for (const skill of skills) filters.push({ skills: insensitive(skill) });
    if (locations.length) filters.push({ location: { in: locations } });
    if (availability.length) filters.push({ availability: { in: availability } });
    if (minScore > 0) {
      filters.push({ video_interviews: { some: { status: 'COMPLETED', score: { gte: minScore } } } });
    }

    const where: Prisma.UserWhereInput = { AND: filters };

    const [total, rows, skillRows, openRoles] = await Promise.all([
      db.user.count({ where }),
      db.user.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          name: true,
          professional_title: true,
          experience_level: true,
          location: true,
          availability: true,
          bio: true,
          skills: true,
          qualifications: true,
          study_institution: true,
          study_specialisation: true,
          seeking_roles: true,
          career_direction: true,
          work_experience: true,
          interests: true,
          // Presence checks only; the values themselves are never sent to employers
          resume_text: true,
          police_clearance_url: true,
          certificates_url: true,
          linkedin_url: true,
          portfolio_url: true,
          github_url: true,
          video_interviews: {
            where: { status: 'COMPLETED', score: { gt: 0 } },
            select: { score: true },
          },
        },
      }),
      // Skill facets across the whole pool (not just the current filter)
      db.user.findMany({ where: { ...ACTIVE_PROFILE, skills: { not: null } }, select: { skills: true }, take: 3000 }),
      db.job.findMany({
        where: { employer_id: employerId, status: 'ACTIVE' },
        select: { id: true, title: true, location: true },
        orderBy: { id: 'desc' },
      }),
    ]);

    const ids = rows.map((r) => r.id);
    const [invites, applications] = ids.length
      ? await Promise.all([
          db.jobInvitation.findMany({ where: { employer_id: employerId, candidate_id: { in: ids } }, select: { candidate_id: true, job_id: true } }),
          db.jobApplication.findMany({
            where: { candidate_id: { in: ids }, job: { employer_id: employerId } },
            select: { candidate_id: true, job_id: true },
          }),
        ])
      : [[], []];

    const candidates: TalentCandidate[] = rows.map((r) => {
      const scores = r.video_interviews.map((v) => v.score);
      return {
        id: r.id,
        name: r.name || 'LaunchPath candidate',
        title: r.professional_title,
        experienceLevel: r.experience_level,
        location: r.location,
        availability: r.availability,
        bio: r.bio,
        skills: parseSkills(r.skills),
        readinessScore: scores.length ? Math.max(...scores) : null,
        education: { institution: r.study_institution, specialisation: r.study_specialisation, qualifications: r.qualifications },
        seekingRoles: r.seeking_roles,
        careerDirection: r.career_direction,
        workExperience: r.work_experience,
        interests: r.interests,
        credentials: {
          cvOnFile: Boolean(r.resume_text?.trim()),
          videoAssessed: scores.length > 0,
          policeClearance: Boolean(r.police_clearance_url),
          certificates: Boolean(r.certificates_url),
          linkedin: Boolean(r.linkedin_url),
          portfolio: Boolean(r.portfolio_url || r.github_url),
        },
        invitedJobIds: invites.filter((i) => i.candidate_id === r.id).map((i) => i.job_id),
        appliedJobIds: applications.filter((a) => a.candidate_id === r.id).map((a) => a.job_id),
      };
    });

    const skillCounts = new Map<string, { name: string; count: number }>();
    for (const row of skillRows) {
      for (const skill of parseSkills(row.skills)) {
        const key = skill.toLowerCase();
        const entry = skillCounts.get(key) || { name: skill, count: 0 };
        entry.count++;
        skillCounts.set(key, entry);
      }
    }

    const body: TalentPoolResponse = {
      candidates,
      total,
      page,
      pageSize: PAGE_SIZE,
      facets: { skills: Array.from(skillCounts.values()).sort((a, b) => b.count - a.count).slice(0, 30) },
      openRoles,
    };
    return NextResponse.json(body);
  } catch (error) {
    console.error('[Talent pool] query failed:', error);
    return NextResponse.json({ error: 'Could not load the talent pool.' }, { status: 500 });
  }
}
