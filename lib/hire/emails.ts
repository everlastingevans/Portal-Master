/**
 * LaunchPath Hire transactional email templates. Pure render functions (used for sending, retries and
 * the admin development preview). Wording describes timelines as targets, never guarantees.
 */
import { EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, ROLE_CATEGORIES, WORK_ARRANGEMENTS, labelFor } from './vacancy';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || 'https://launchpath.co.za';
export const OPS_EMAIL = () => process.env.VACANCY_ALERT_EMAIL || process.env.CONTACT_EMAIL || 'hello@launchpath.co.za';
const REPLY_EMAIL = 'hello@launchpath.co.za';

const escape = (value: string) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rand = (n: number) => `R${n.toLocaleString('en-ZA').replace(/\s/g, ',')}`;
const fmtDate = (d: Date) => new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Johannesburg' }).format(d);
const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

function shell(title: string, body: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background:#0A1B3D;padding:18px 24px;color:#ffffff;font-weight:bold;letter-spacing:2px;">${title}</div>
      <div style="padding:24px;color:#334155;font-size:14px;line-height:1.6;">${body}</div>
      <div style="padding:16px 24px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;">LaunchPath · launchpath.co.za · We process personal information in line with POPIA.</div>
    </div>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:24px 0;"><a href="${href}" style="display:inline-block;background:#A6F23C;color:#0A1B3D;font-weight:bold;text-decoration:none;padding:12px 22px;border-radius:999px;">${label}</a></p>`;

const table = (rows: [string, string][]) =>
  `<table style="border-collapse:collapse;">${rows
    .map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;color:#64748b;vertical-align:top;">${k}</td><td style="padding:6px 0;color:#0A1B3D;font-weight:600;">${escape(v)}</td></tr>`)
    .join('')}</table>`;

export interface VacancyEmailData {
  id: number;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  role_title: string;
  role_category: string;
  role_category_other: string | null;
  location: string;
  work_arrangement: string;
  salary_min: number;
  salary_max: number;
  employment_type: string;
  required_experience: string;
  key_skills: string[];
  start_date: Date | null;
  description: string;
}

export function renderEmployerVacancyConfirmation(v: Pick<VacancyEmailData, 'id' | 'contact_name' | 'role_title' | 'company_name'>): RenderedEmail {
  const name = firstName(v.contact_name);
  const subject = `We’ve received your ${v.role_title} vacancy (ref #${v.id})`;
  const html = shell(
    'LAUNCHPATH · VACANCY RECEIVED',
    `<p>Hi ${escape(name)},</p>
     <p>Thanks for telling us about your <strong>${escape(v.role_title)}</strong> role at ${escape(v.company_name)}. Your reference is <strong>#${v.id}</strong>.</p>
     <p style="margin-top:20px;"><strong>What happens next</strong></p>
     <ol style="padding-left:18px;margin:8px 0;">
       <li style="margin-bottom:8px;"><strong>Role calibration.</strong> Someone from LaunchPath will contact you, usually by phone, to agree what success looks like in the role, the must-have skills and anything that would rule a candidate out.</li>
       <li style="margin-bottom:8px;"><strong>Your shortlist.</strong> Once the role is calibrated, our target for serviceable roles is 3–5 screened candidates within five working days. If the role is harder to fill, we’ll tell you and agree a realistic timeline.</li>
       <li><strong>Interviews and hiring.</strong> You choose who to meet. You only pay a placement fee if you hire.</li>
     </ol>
     <p>There is no charge to submit a vacancy or to receive your shortlist.</p>
     <p>If you didn’t submit this request, reply to this email and let us know.</p>
     <p>The LaunchPath team</p>`,
  );
  const text = `Hi ${name},

Thanks for telling us about your ${v.role_title} role at ${v.company_name}. Your reference is #${v.id}.

What happens next
1. Role calibration: someone from LaunchPath will contact you, usually by phone, to agree what success looks like, the must-have skills and anything that would rule a candidate out.
2. Your shortlist: once the role is calibrated, our target for serviceable roles is 3-5 screened candidates within five working days. If the role is harder to fill, we'll tell you and agree a realistic timeline.
3. Interviews and hiring: you choose who to meet. You only pay a placement fee if you hire.

There is no charge to submit a vacancy or to receive your shortlist.
If you didn't submit this request, reply to this email and let us know.

The LaunchPath team`;
  return { subject, html, text };
}

export function renderOpsNewVacancy(v: VacancyEmailData): RenderedEmail {
  const category = v.role_category === 'OTHER' ? `Other: ${v.role_category_other}` : labelFor(ROLE_CATEGORIES, v.role_category);
  const rows: [string, string][] = [
    ['Company', v.company_name],
    ['Contact', v.contact_name],
    ['Email', v.contact_email],
    ['Phone', v.contact_phone],
    ['Role', v.role_title],
    ['Category', category],
    ['Location', `${v.location} · ${labelFor(WORK_ARRANGEMENTS, v.work_arrangement)}`],
    ['Salary (monthly)', `${rand(v.salary_min)} – ${rand(v.salary_max)}`],
    ['Employment type', labelFor(EMPLOYMENT_TYPES, v.employment_type)],
    ['Experience', labelFor(EXPERIENCE_LEVELS, v.required_experience)],
    ['Key skills', v.key_skills.join(', ')],
    ['Start date', v.start_date ? v.start_date.toISOString().slice(0, 10) : 'Flexible'],
  ];
  const link = `${APP_URL()}/admin/vacancies/${v.id}`;
  return {
    subject: `New vacancy #${v.id}: ${v.role_title} at ${v.company_name}`,
    html: shell(
      `LAUNCHPATH · NEW VACANCY #${v.id}`,
      `${table(rows)}
       <div style="margin-top:20px;padding:16px;background:#f8fafc;border-left:4px solid #A6F23C;border-radius:8px;">${escape(v.description).replace(/\n/g, '<br />')}</div>
       ${button(link, 'Open in admin')}
       <p style="color:#64748b;">Contact details are as submitted and unverified. Next step: assign an owner and book the calibration call.</p>`,
    ),
    text: `New vacancy #${v.id}\n${rows.map(([k, val]) => `${k}: ${val}`).join('\n')}\n\n${v.description}\n\nOpen in admin: ${link}`,
  };
}

export interface ShortlistEmailData {
  vacancyId: number;
  contactName: string;
  roleTitle: string;
  companyName: string;
  url: string;
  expiresAt: Date;
  candidateCount: number;
}

export function renderEmployerShortlistReady(d: ShortlistEmailData): RenderedEmail {
  const name = firstName(d.contactName);
  const people = d.candidateCount === 1 ? '1 screened candidate' : `${d.candidateCount} screened candidates`;
  return {
    subject: `Your shortlist for ${d.roleTitle} is ready (ref #${d.vacancyId})`,
    html: shell(
      'LAUNCHPATH · YOUR SHORTLIST',
      `<p>Hi ${escape(name)},</p>
       <p>Your shortlist for <strong>${escape(d.roleTitle)}</strong> at ${escape(d.companyName)} is ready: ${people}, each with a short recruiter note.</p>
       ${button(d.url, 'View your shortlist')}
       <p>Use <strong>Request interview</strong> on any candidate you’d like to meet and we’ll arrange it with them.</p>
       <p style="color:#64748b;">This private link is for you and your hiring team. It expires on ${fmtDate(d.expiresAt)}. Please don’t forward it outside your organisation. If it stops working, reply to this email and we’ll send a new one.</p>
       <p>The LaunchPath team</p>`,
    ),
    text: `Hi ${name},

Your shortlist for ${d.roleTitle} at ${d.companyName} is ready: ${people}, each with a short recruiter note.

View your shortlist: ${d.url}

Use "Request interview" on any candidate you'd like to meet and we'll arrange it with them.

This private link is for you and your hiring team and expires on ${fmtDate(d.expiresAt)}. Please don't forward it outside your organisation. If it stops working, reply to this email and we'll send a new one.

The LaunchPath team`,
  };
}

export interface InterviewRequestEmailData {
  requestId: number;
  vacancyId: number;
  roleTitle: string;
  companyName: string;
  candidateName: string;
  source: string;
  requesterName: string | null;
  preferredTimes: string | null;
  message: string | null;
}

export function renderOpsInterviewRequest(d: InterviewRequestEmailData): RenderedEmail {
  const rows: [string, string][] = [
    ['Vacancy', `#${d.vacancyId} · ${d.roleTitle} at ${d.companyName}`],
    ['Candidate', d.candidateName],
    ['Requested via', d.source === 'EMPLOYER_LINK' ? 'Shortlist link' : d.source === 'EMPLOYER_DASHBOARD' ? 'Employer dashboard' : 'Recorded by staff'],
    ['Requested by', d.requesterName || '—'],
    ['Preferred times', d.preferredTimes || '—'],
  ];
  const link = `${APP_URL()}/admin/vacancies/${d.vacancyId}`;
  return {
    subject: `Interview requested: ${d.candidateName} for ${d.roleTitle} (#${d.vacancyId})`,
    html: shell(
      'LAUNCHPATH · INTERVIEW REQUESTED',
      `${table(rows)}
       ${d.message ? `<div style="margin-top:20px;padding:16px;background:#f8fafc;border-left:4px solid #A6F23C;border-radius:8px;">${escape(d.message).replace(/\n/g, '<br />')}</div>` : ''}
       ${button(link, 'Open in admin')}
       <p style="color:#64748b;">Next step: contact the candidate and the employer to schedule, then update the request status.</p>`,
    ),
    text: `Interview requested\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${d.message || ''}\n\nOpen in admin: ${link}`,
  };
}

export interface ProgrammeEnquiryEmailData {
  id: number;
  companyName: string;
  contactName: string;
  workEmail: string;
  phone: string | null;
  targetHires: number;
  categories: string[];
  locations: string | null;
  requirements: string;
}

export function renderOpsProgrammeEnquiry(d: ProgrammeEnquiryEmailData): RenderedEmail {
  const rows: [string, string][] = [
    ['Company', d.companyName],
    ['Contact', d.contactName],
    ['Email', d.workEmail],
    ['Phone', d.phone || '—'],
    ['Target hires', String(d.targetHires)],
    ['Categories', d.categories.map((c) => labelFor(ROLE_CATEGORIES, c)).join(', ') || '—'],
    ['Locations', d.locations || '—'],
  ];
  const link = `${APP_URL()}/admin/programmes/${d.id}`;
  return {
    subject: `Bulk hiring enquiry #${d.id}: ${d.targetHires} hires for ${d.companyName}`,
    html: shell(
      `LAUNCHPATH · BULK HIRING ENQUIRY #${d.id}`,
      `${table(rows)}
       <div style="margin-top:20px;padding:16px;background:#f8fafc;border-left:4px solid #A6F23C;border-radius:8px;">${escape(d.requirements).replace(/\n/g, '<br />')}</div>
       ${button(link, 'Open in admin')}
       <p style="color:#64748b;">Contact details are as submitted and unverified. Pricing is by agreement: record accepted terms on the programme.</p>`,
    ),
    text: `Bulk hiring enquiry #${d.id}\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${d.requirements}\n\nOpen in admin: ${link}`,
  };
}

/** Sample data for the admin development preview. Fictional; never real candidates. */
export function previewEmail(template: string): RenderedEmail | null {
  const vacancy: VacancyEmailData = {
    id: 1234,
    company_name: 'Example Trading (Pty) Ltd',
    contact_name: 'Alex Example',
    contact_email: 'alex@example.com',
    contact_phone: '+27 82 000 0000',
    role_title: 'Junior Sales Consultant',
    role_category: 'SALES',
    role_category_other: null,
    location: 'Sandton, Johannesburg',
    work_arrangement: 'HYBRID',
    salary_min: 12000,
    salary_max: 16000,
    employment_type: 'PERMANENT',
    required_experience: 'UP_TO_1',
    key_skills: ['Cold calling', 'CRM', 'Excel'],
    start_date: null,
    description: 'Example description: calling inbound leads, booking demos and keeping the CRM up to date.',
  };
  switch (template) {
    case 'vacancy_confirmation':
      return renderEmployerVacancyConfirmation(vacancy);
    case 'ops_new_vacancy':
      return renderOpsNewVacancy(vacancy);
    case 'shortlist_ready':
      return renderEmployerShortlistReady({
        vacancyId: 1234,
        contactName: 'Alex Example',
        roleTitle: vacancy.role_title,
        companyName: vacancy.company_name,
        url: `${APP_URL()}/shortlist#t=EXAMPLE-PREVIEW-TOKEN`,
        expiresAt: new Date(Date.now() + 14 * 86_400_000),
        candidateCount: 4,
      });
    case 'ops_interview_request':
      return renderOpsInterviewRequest({
        requestId: 1,
        vacancyId: 1234,
        roleTitle: vacancy.role_title,
        companyName: vacancy.company_name,
        candidateName: 'Example Candidate',
        source: 'EMPLOYER_LINK',
        requesterName: 'Alex Example',
        preferredTimes: 'Tuesday or Wednesday morning',
        message: 'Example message from the employer.',
      });
    case "ops_programme_enquiry":
      return renderOpsProgrammeEnquiry({ id: 77, companyName: vacancy.company_name, contactName: vacancy.contact_name, workEmail: vacancy.contact_email, phone: vacancy.contact_phone, targetHires: 12, categories: ["SALES", "BUSINESS_OPERATIONS"], locations: "Johannesburg, Durban", requirements: "Example: a contact-centre intake of 12 junior agents starting in February." });
    default:
      return null;
  }
}

export const EMAIL_TEMPLATES = ['vacancy_confirmation', 'ops_new_vacancy', 'shortlist_ready', 'ops_interview_request', 'ops_programme_enquiry'] as const;
export { REPLY_EMAIL };
