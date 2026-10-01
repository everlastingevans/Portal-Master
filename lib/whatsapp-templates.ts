// Recruiter WhatsApp outreach templates, shared by the drawer (preview / wa.me fallback) and the API (actual send).
// The server always rebuilds the message from the template id, so clients can't send arbitrary text.

export type OutreachTemplateId = 'INTERVIEW_INVITE' | 'PORTFOLIO_REQUEST' | 'STATUS_CHECK';

export interface OutreachParams {
  candidateName: string;
  jobTitle: string;
  company: string;
  recruiterName?: string | null;
  /** ISO date-time, interview invitations only. */
  proposedTime?: string | null;
}

export interface OutreachTemplate {
  id: OutreachTemplateId;
  label: string;
  description: string;
  /** Env var holding the Meta-approved Brevo WhatsApp template id for this message (optional). */
  brevoTemplateEnv: string;
  build: (p: OutreachParams) => string;
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] || 'there';

export function formatInterviewTime(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Johannesburg' });
}

const signOff = (p: OutreachParams) => `${p.recruiterName ? `${p.recruiterName}, ` : ''}${p.company} (via LaunchPath)`;

export const OUTREACH_TEMPLATES: OutreachTemplate[] = [
  {
    id: 'INTERVIEW_INVITE',
    label: 'Schedule interview invitation',
    description: 'Invite them to an interview, with a proposed time if you have one.',
    brevoTemplateEnv: 'BREVO_WA_TEMPLATE_INTERVIEW',
    build: (p) => {
      const when = formatInterviewTime(p.proposedTime);
      return [
        `Hi ${firstName(p.candidateName)}, thanks for applying for the ${p.jobTitle} role at ${p.company}.`,
        when
          ? `We'd like to invite you to an interview on ${when}. Please reply to confirm, or suggest another time that suits you.`
          : `We'd like to invite you to an interview. Please reply with two or three times this week that suit you.`,
        `– ${signOff(p)}`,
      ].join('\n\n');
    },
  },
  {
    id: 'PORTFOLIO_REQUEST',
    label: 'Request portfolio / GitHub link',
    description: 'Ask for work samples before you shortlist.',
    brevoTemplateEnv: 'BREVO_WA_TEMPLATE_PORTFOLIO',
    build: (p) =>
      [
        `Hi ${firstName(p.candidateName)}, we're reviewing your application for ${p.jobTitle} at ${p.company}.`,
        `Could you share a link to your portfolio, GitHub or any recent work you're proud of? It'll help us move your application forward.`,
        `– ${signOff(p)}`,
      ].join('\n\n'),
  },
  {
    id: 'STATUS_CHECK',
    label: 'Quick status check',
    description: 'Check they’re still interested and available.',
    brevoTemplateEnv: 'BREVO_WA_TEMPLATE_STATUS',
    build: (p) =>
      [
        `Hi ${firstName(p.candidateName)}, a quick check-in about your application for ${p.jobTitle} at ${p.company}.`,
        `Are you still interested in the role and available to start soon? A quick yes or no is perfect.`,
        `– ${signOff(p)}`,
      ].join('\n\n'),
  },
];

export const getOutreachTemplate = (id: string) => OUTREACH_TEMPLATES.find((t) => t.id === id);
