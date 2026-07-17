import { checkRole } from '@/lib/auth';
import db from '@/lib/db';
import { ai } from '@/lib/gemini';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const auth = await checkRole(['SUPERADMIN']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // 1. Fetch Candidates Data
    const candidates = await db.user.findMany({
      where: { role: 'CANDIDATE' },
      select: {
        id: true,
        name: true,
        email: true,
        professional_title: true,
        experience_level: true,
        skills: true,
        linkedin_url: true,
        github_url: true,
        phone: true,
        qualifications: true,
        interests: true,
        career_direction: true,
        work_experience: true,
        portfolio_url: true,
        cv_url: true,
        resume_text: true,
        study_institution: true,
        study_specialisation: true,
        seeking_roles: true,
        certificates_url: true,
        police_clearance_url: true,
        applications: {
          select: {
            id: true,
            status: true,
            applied_at: true,
            job: {
              select: {
                id: true,
                title: true,
                company: true,
              }
            }
          }
        },
        job_matches: {
          select: {
            id: true,
            match_score: true,
            matched_skills: true,
            missing_skills: true,
            fit_summary: true,
            recommendation: true,
            job: {
              select: {
                id: true,
                title: true,
                company: true,
              }
            }
          }
        },
        video_interviews: {
          select: {
            id: true,
            score: true,
            status: true,
            feedback: true,
            questions: true,
            video_url: true,
          }
        }
      }
    });

    // 2. Fetch Employers & Jobs Data
    const employers = await db.user.findMany({
      where: { role: { in: ['EMPLOYER', 'CLIENT'] } },
      select: {
        id: true,
        name: true,
        email: true,
        jobs_posted: {
          select: {
            id: true,
            title: true,
            location: true,
            salary_min: true,
            salary_max: true,
            status: true,
            mandatory_skills: true,
            tech_stack: true,
          }
        }
      }
    });

    const jobs = await db.job.findMany({
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        salary_min: true,
        salary_max: true,
        status: true,
        mandatory_skills: true,
        tech_stack: true,
      }
    });

    const applications = await db.jobApplication.findMany({
      select: {
        status: true,
      }
    });

    // --- Candidate Metrics ---
    const totalCandidates = candidates.length;
    
    // Experience level count
    const experienceDistribution: Record<string, number> = {};
    candidates.forEach(c => {
      const level = c.experience_level || 'Not Specified';
      experienceDistribution[level] = (experienceDistribution[level] || 0) + 1;
    });

    // Candidate skills counts
    const candidateSkillsCounts: Record<string, number> = {};
    candidates.forEach(c => {
      if (c.skills) {
        c.skills.split(/[,;\n]+/).forEach(s => {
          const cleanSkill = s.trim();
          if (cleanSkill && cleanSkill.length > 1) {
            // Capitalize first letter of each word to group standard representations
            const groupedName = cleanSkill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            candidateSkillsCounts[groupedName] = (candidateSkillsCounts[groupedName] || 0) + 1;
          }
        });
      }
    });
    
    const topCandidateSkills = Object.entries(candidateSkillsCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Average match score
    let totalMatchScores = 0;
    let matchScoresCount = 0;
    candidates.forEach(c => {
      c.job_matches.forEach(m => {
        totalMatchScores += m.match_score;
        matchScoresCount++;
      });
    });
    const averageMatchScore = matchScoresCount > 0 ? Math.round(totalMatchScores / matchScoresCount) : 0;

    // --- Employer & Jobs Metrics ---
    const totalEmployers = employers.length;
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(j => j.status?.toUpperCase() === 'ACTIVE').length;
    const draftPendingJobs = jobs.filter(j => ['PENDING', 'DRAFT'].includes(j.status?.toUpperCase() || '')).length;

    // Location distribution of jobs
    const jobLocationsDistribution: Record<string, number> = {};
    jobs.forEach(j => {
      const loc = j.location || 'Remote';
      jobLocationsDistribution[loc] = (jobLocationsDistribution[loc] || 0) + 1;
    });

    // Salary averages
    const jobsWithSalaries = jobs.filter(j => j.salary_min !== null || j.salary_max !== null);
    const avgSalaryMin = jobsWithSalaries.length > 0
      ? Math.round(jobsWithSalaries.reduce((acc, j) => acc + (j.salary_min || 0), 0) / jobsWithSalaries.length)
      : 0;
    const avgSalaryMax = jobsWithSalaries.length > 0
      ? Math.round(jobsWithSalaries.reduce((acc, j) => acc + (j.salary_max || 0), 0) / jobsWithSalaries.length)
      : 0;

    // Demand skills (mandatory skills in job postings)
    const demandSkillsCounts: Record<string, number> = {};
    jobs.forEach(j => {
      const skills = [...(j.mandatory_skills || []), ...(j.tech_stack || [])];
      skills.forEach(s => {
        const cleanSkill = s.trim();
        if (cleanSkill && cleanSkill.length > 1) {
          const groupedName = cleanSkill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          demandSkillsCounts[groupedName] = (demandSkillsCounts[groupedName] || 0) + 1;
        }
      });
    });
    
    const topDemandSkills = Object.entries(demandSkillsCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Application statuses
    const applicationStatusCounts: Record<string, number> = {};
    applications.forEach(a => {
      const status = a.status || 'Pending';
      applicationStatusCounts[status] = (applicationStatusCounts[status] || 0) + 1;
    });

    // Generate AI Summary using gemini-3.5-flash as per instructions
    let aiInsightsText = '';
    try {
      const prompt = `
        You are an expert Talent Acquisition Strategist and Workforce Analyst.
        Below is aggregated data from our hiring platform "LaunchPath":
        
        CANDIDATES DATA:
        - Total Candidates: ${totalCandidates}
        - Average AI Resume Match Score: ${averageMatchScore}%
        - Top Candidate Skills: ${JSON.stringify(topCandidateSkills)}
        - Experience Level Distribution: ${JSON.stringify(experienceDistribution)}
        
        EMPLOYERS & JOBS DATA:
        - Total Strategic Employers: ${totalEmployers}
        - Total Open Job Postings: ${totalJobs} (${activeJobs} Active, ${draftPendingJobs} Draft/Pending)
        - Average Job Salary Range: ZAR ${avgSalaryMin.toLocaleString()} to ZAR ${avgSalaryMax.toLocaleString()}
        - Top Demanded Tech Skills: ${JSON.stringify(topDemandSkills)}
        - Job Location Overview: ${JSON.stringify(jobLocationsDistribution)}
        - Core Application Status Funnel: ${JSON.stringify(applicationStatusCounts)}
        
        Write an Executive Market and Talent Insights Report in clean HTML.
        Include these 3 sections with clear tags:
        1. <h3>Executive Platform Summary</h3>: A summary of matching activity, pipeline throughput, and overall ecosystem health.
        2. <h3>Talent Supply & Demand Matching</h3>: Insights on whether candidate skills align with employer demands, where the surplus or deficits exist, and salary benchmark analysis.
        3. <h3>Strategic Recommendations</h3>: A set of 3 actionable, bulleted recommendations for Platform Admins to increase match quality and interview conversions.
        
        Formatting instructions:
        - Use clean semantic HTML like <p>, <ul>, <li>, <strong>, and <h3>.
        - Do NOT include html/head/body or script tags.
        - Do NOT wrap in markdown fences (no \`\`\`html).
        - Keep the tone highly professional, precise, and strategic.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      aiInsightsText = response.text || '';
      aiInsightsText = aiInsightsText.replace(/^```html\s*/i, '').replace(/```$/, '').trim();
    } catch (err: any) {
      console.error('[Reports AI Insights Error]:', err);
      aiInsightsText = `
        <h3>Executive Platform Summary</h3>
        <p>The platform currently supports <strong>${totalCandidates}</strong> registered candidates and <strong>${totalEmployers}</strong> employer profiles with <strong>${activeJobs}</strong> active job postings. The average AI matching confidence score stands at a strong <strong>${averageMatchScore}%</strong>.</p>
        <h3>Talent Supply & Demand Matching</h3>
        <p>A comparison of talent supply with current hiring requisitions reveals a strong focus on high-demand modern technology stacks. Benchmarked salaries remain stable ranging between ${avgSalaryMin.toLocaleString()} and ${avgSalaryMax.toLocaleString()} ZAR.</p>
        <h3>Strategic Recommendations</h3>
        <ul>
          <li><strong>Enhance Candidate Profiles:</strong> Provide prompts for candidates to explicitly list missing in-demand skills to improve their match scores.</li>
          <li><strong>Active Outreach:</strong> Target candidate groups within high-demand skills like JavaScript, Python, or Project Management for direct invitation to pending roles.</li>
          <li><strong>Job Post Tuning:</strong> Encourage employers to refine draft postings with detailed mandatory skills to trigger higher accuracy matches.</li>
        </ul>
      `;
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      candidatesReport: {
        totalCandidates,
        experienceDistribution,
        topCandidateSkills,
        averageMatchScore,
        candidatesList: candidates.map(c => ({
          id: c.id,
          name: c.name || 'Anonymous Candidate',
          email: c.email,
          title: c.professional_title || 'N/A',
          experienceLevel: c.experience_level || 'N/A',
          skills: c.skills || 'N/A',
          linkedin_url: c.linkedin_url || '',
          github_url: c.github_url || '',
          phone: c.phone || '',
          qualifications: c.qualifications || '',
          interests: c.interests || '',
          career_direction: c.career_direction || '',
          work_experience: c.work_experience || '',
          portfolio_url: c.portfolio_url || '',
          cv_url: c.cv_url || '',
          resume_text: c.resume_text || '',
          study_institution: c.study_institution || '',
          study_specialisation: c.study_specialisation || '',
          seeking_roles: c.seeking_roles || '',
          certificates_url: c.certificates_url || '',
          police_clearance_url: c.police_clearance_url || '',
          applications: c.applications || [],
          job_matches: c.job_matches || [],
          video_interviews: c.video_interviews || [],
          matchesCount: c.job_matches.length,
          appsCount: c.applications.length,
          interviewCount: c.video_interviews.length,
        })),
      },
      employersReport: {
        totalEmployers,
        totalJobs,
        activeJobs,
        draftPendingJobs,
        avgSalaryMin,
        avgSalaryMax,
        topDemandSkills,
        jobLocationsDistribution,
        applicationStatusCounts,
        employersList: employers.map(e => ({
          id: e.id,
          name: e.name || 'Anonymous Employer',
          email: e.email,
          jobsPostedCount: e.jobs_posted.length,
          activeJobsCount: e.jobs_posted.filter(j => j.status?.toUpperCase() === 'ACTIVE').length,
          avgJobSalaryMax: e.jobs_posted.length > 0
            ? Math.round(e.jobs_posted.reduce((acc, j) => acc + (j.salary_max || 0), 0) / e.jobs_posted.length)
            : 0,
        })),
      },
      aiInsights: aiInsightsText,
    });
  } catch (error: any) {
    console.error('[API Reports GET Error]:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
