import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { NextResponse } from 'next/server';
import sanitizeHtml from 'sanitize-html';
import { PayfastService } from '@/services/integrations/payfast.service';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'CLIENT' && session.role !== 'EMPLOYER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const job = await db.job.findUnique({
      where: { id: Number(jobId) }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.employer_id !== session.userId) {
      return NextResponse.json({ error: 'Forbidden. You do not own this job post.' }, { status: 403 });
    }

    const origin = new URL(req.url).origin;

    const payfastData = PayfastService.generatePaymentData(
      `JOB_${job.id}`,
      1499,
      `LaunchPath Job Posting: ${job.title}`,
      `${origin}/employer/payment/success?jobId=${job.id}`,
      `${origin}/employer/payment?jobId=${job.id}`,
      `${origin}/api/webhooks/payfast`
    );

    return NextResponse.json({ success: true, job, payfast: payfastData });
  } catch (error) {
    console.error('Error fetching checkout data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'CLIENT' && session.role !== 'EMPLOYER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      title, 
      company, 
      location, 
      description,
      years_experience,
      mandatory_skills,
      tech_stack,
      salary_min,
      salary_max
    } = await req.json();

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const sanitizedDescription = sanitizeHtml(description, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2']),
      allowedAttributes: false,
    });

    // Parse skills and tools cleanly
    const parseStringArray = (val: any): string[] => {
      if (!val) return [];
      if (Array.isArray(val)) {
        return val.map(s => String(s).trim()).filter(Boolean);
      }
      if (typeof val === 'string') {
        return val.split(',').map(s => s.trim()).filter(Boolean);
      }
      return [];
    };

    const yearsExp = years_experience ? String(years_experience).trim() : null;
    const mandatorySkillsArr = parseStringArray(mandatory_skills);
    const techStackArr = parseStringArray(tech_stack);

    const salaryMinVal = salary_min && !isNaN(parseInt(String(salary_min), 10)) ? parseInt(String(salary_min), 10) : null;
    const salaryMaxVal = salary_max && !isNaN(parseInt(String(salary_max), 10)) ? parseInt(String(salary_max), 10) : null;

    // Create the job with status PENDING so it requires payment activation
    const job = await db.job.create({
      data: {
        title,
        company: company || 'My Company',
        location: location || 'Remote',
        description: sanitizedDescription,
        employer_id: session.userId,
        status: 'PENDING',
        years_experience: yearsExp,
        mandatory_skills: mandatorySkillsArr,
        tech_stack: techStackArr,
        salary_min: salaryMinVal,
        salary_max: salaryMaxVal
      }
    });

    return NextResponse.json({ success: true, bypassed: false, jobId: job.id });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
