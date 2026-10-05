/**
 * Role pages (/hire/<category>/<role>). Deliberately limited to roles with enough distinct content to
 * be useful, to avoid thin duplicate pages. Describes the role and our screening approach only: no
 * salary figures, placement statistics or outcome claims.
 */
export interface RolePage {
  categorySlug: string;
  slug: string;
  title: string;
  summary: string;
  responsibilities: string[];
  screening: string[];
  faqs: { q: string; a: string }[];
}

export const ROLE_PAGES: RolePage[] = [
  {
    categorySlug: 'sales',
    slug: 'sales-development-representative',
    title: 'Sales Development Representative',
    summary: 'Junior SDRs open conversations with potential customers by phone, email and LinkedIn, qualify interest and book meetings for account executives.',
    responsibilities: ['Outbound calls and emails to target prospects', 'Qualifying leads against agreed criteria', 'Booking meetings for senior sellers', 'Keeping activity and notes up to date in the CRM'],
    screening: ['A short call to hear how they handle a cold conversation', 'Comfort with activity targets and rejection', 'Written follow-up quality', 'Basic CRM and spreadsheet use'],
    faqs: [
      { q: 'Do your SDR candidates have sales experience?', a: 'Some do and some are new to sales. We agree the level with you at calibration and screen for it, and every card says how much experience the candidate has.' },
      { q: 'Can you screen for commission-based roles?', a: 'Yes. Tell us how the role is paid at calibration and we check that candidates are comfortable with the basic and commission split.' },
    ],
  },
  {
    categorySlug: 'sales',
    slug: 'inside-sales-consultant',
    title: 'Inside Sales Consultant',
    summary: 'Inside sales consultants handle inbound enquiries, quote and close smaller deals remotely, and keep existing customers buying.',
    responsibilities: ['Responding to inbound leads quickly', 'Preparing quotes and following up', 'Closing straightforward deals by phone and email', 'Logging pipeline and outcomes'],
    screening: ['Phone manner and clarity', 'Following up in writing', 'Product-learning attitude', 'Familiarity with quoting or order systems where relevant'],
    faqs: [
      { q: 'What’s the difference between an SDR and an inside sales consultant?', a: 'An SDR mainly books meetings for others; an inside sales consultant usually closes deals themselves. We confirm which you need when we calibrate the role.' },
      { q: 'Can candidates start on our product quickly?', a: 'We check availability and how quickly candidates pick up new information, and note it on each card. Your onboarding still matters.' },
    ],
  },
  {
    categorySlug: 'marketing',
    slug: 'social-media-coordinator',
    title: 'Social Media Coordinator',
    summary: 'Social media coordinators plan, create and post content, reply to the community and report on what’s working.',
    responsibilities: ['Planning and scheduling posts', 'Creating simple graphics and short video', 'Responding to comments and messages', 'Monthly reporting on reach and engagement'],
    screening: ['Examples of accounts or content they have run', 'Writing in your brand’s tone', 'Familiarity with the platforms you use', 'Organisation and consistency'],
    faqs: [
      { q: 'Will I see examples of their work?', a: 'Where candidates have examples we ask for them during screening and mention them on the card.' },
      { q: 'Can you test for a specific platform?', a: 'Yes. Tell us at calibration and we can include a short, relevant task in screening.' },
    ],
  },
  {
    categorySlug: 'marketing',
    slug: 'marketing-coordinator',
    title: 'Marketing Assistant or Coordinator',
    summary: 'Marketing coordinators keep campaigns and events on track, manage suppliers and handle day-to-day marketing admin.',
    responsibilities: ['Coordinating campaign tasks and deadlines', 'Briefing and following up with suppliers', 'Updating the website and email tools', 'Supporting events and launches'],
    screening: ['Organisation and follow-through', 'Written communication', 'Comfort with common marketing tools', 'Attention to detail'],
    faqs: [
      { q: 'Is this a creative or an admin role?', a: 'It varies by company. We confirm the balance with you at calibration and screen for that mix.' },
      { q: 'Do candidates need a marketing qualification?', a: 'Not always. If you need one, tell us and we screen for it; otherwise we focus on the skills the role uses day to day.' },
    ],
  },
  {
    categorySlug: 'business-operations',
    slug: 'customer-service-agent',
    title: 'Customer Service Agent',
    summary: 'Customer service agents resolve customer queries by phone, email or chat and keep accurate records of every interaction.',
    responsibilities: ['Answering customer queries across channels', 'Logging and following up on cases', 'Escalating issues to the right team', 'Meeting service and quality targets'],
    screening: ['Spoken and written communication', 'Patience and problem-solving', 'Typing and system use', 'Availability for your shifts and location'],
    faqs: [
      { q: 'Can you hire for shift work or weekends?', a: 'Yes. We confirm shift patterns at calibration and check every candidate’s availability for them.' },
      { q: 'Can you hire several agents at once?', a: 'Yes. For several hires, talk to us about running it as one search so the candidates are screened together.' },
    ],
  },
  {
    categorySlug: 'business-operations',
    slug: 'office-administrator',
    title: 'Operations or Office Administrator',
    summary: 'Office and operations administrators keep a business running: scheduling, records, suppliers and the admin in between.',
    responsibilities: ['Managing diaries, bookings and records', 'Supplier orders and follow-up', 'Preparing documents and simple reports', 'Supporting the team with day-to-day admin'],
    screening: ['Accuracy and attention to detail', 'Spreadsheet and office software skills', 'Organisation and follow-through', 'Reliability and location'],
    faqs: [
      { q: 'Can you screen for specific software?', a: 'Yes. Tell us which systems the role uses and we check candidates’ familiarity during screening.' },
      { q: 'What if the role mixes admin and customer work?', a: 'Many do. We ask what a normal week looks like at calibration so we screen for the actual work.' },
    ],
  },
  {
    categorySlug: 'technology',
    slug: 'junior-software-developer',
    title: 'Junior Software Developer',
    summary: 'Junior developers build and maintain features with guidance from senior developers, in your team’s stack.',
    responsibilities: ['Building and fixing features', 'Writing tests and reviewing code with the team', 'Learning the codebase and tools', 'Documenting their work'],
    screening: ['Practical skills in your stack', 'A short, relevant task where agreed with you', 'How they explain their work and decisions', 'Portfolio, GitHub or project examples where available'],
    faqs: [
      { q: 'Do you run a technical test?', a: 'Where you agree to it at calibration, we include a short task relevant to your stack and note the result on the card as a LaunchPath assessment.' },
      { q: 'Will you look at their GitHub or projects?', a: 'Yes, where candidates have them. We mention what we reviewed on the card.' },
    ],
  },
  {
    categorySlug: 'technology',
    slug: 'it-support-technician',
    title: 'IT Support or Service Desk Technician',
    summary: 'IT support technicians help users with devices, accounts and first-line troubleshooting, and escalate what they can’t fix.',
    responsibilities: ['Logging and resolving support tickets', 'Setting up devices and accounts', 'Troubleshooting common hardware and software issues', 'Escalating and documenting fixes'],
    screening: ['Troubleshooting approach', 'Explaining technical issues simply', 'Familiarity with the systems you support', 'Availability and location for on-site work'],
    faqs: [
      { q: 'Can you screen for certifications?', a: 'If the role needs a specific certification, tell us at calibration and we ask candidates for it.' },
      { q: 'Is on-site availability checked?', a: 'Yes. We confirm location, transport and working hours for every candidate.' },
    ],
  },
  {
    categorySlug: 'finance',
    slug: 'accounts-clerk',
    title: 'Accounts Clerk or Bookkeeper',
    summary: 'Accounts clerks capture transactions, reconcile accounts and keep the books accurate and up to date.',
    responsibilities: ['Capturing invoices and payments', 'Bank and account reconciliations', 'Supplier and customer statements', 'Supporting month-end'],
    screening: ['Numeracy and accuracy', 'Spreadsheet skills', 'Familiarity with your accounting software', 'Relevant studies for the role'],
    faqs: [
      { q: 'Can you screen for Sage, Xero or Pastel?', a: 'Yes. Tell us which system you use and we check candidates’ familiarity with it.' },
      { q: 'Do you check qualifications?', a: 'We ask about relevant studies and note them on the card. Tell us if the role needs a specific qualification.' },
    ],
  },
  {
    categorySlug: 'finance',
    slug: 'credit-controller',
    title: 'Credit Controller',
    summary: 'Credit controllers manage debtors, make collection calls and agree payment arrangements while keeping customer relationships intact.',
    responsibilities: ['Monitoring debtors and ageing reports', 'Collection calls and emails', 'Agreeing and tracking payment arrangements', 'Updating accounts and reporting'],
    screening: ['Confident, respectful phone manner', 'Accuracy with figures', 'Spreadsheet skills', 'Familiarity with your accounting system'],
    faqs: [
      { q: 'Is this more of a phone role or an accounts role?', a: 'Both. We confirm the balance at calibration and screen for the phone and the numbers side.' },
      { q: 'Can you screen for collections experience?', a: 'Yes, where you need it. Each card says how much relevant experience the candidate has.' },
    ],
  },
];

/** Shared, verified service facts used on every role page FAQ. */
export const SERVICE_FAQS = [
  { q: 'How much does it cost?', a: 'Nothing upfront. Submitting a vacancy and receiving your shortlist are free; you pay a placement fee only if you hire.' },
  { q: 'How quickly will I see candidates?', a: 'For serviceable roles, our target is a shortlist of 3–5 screened candidates within five working days of calibrating the role with you.' },
];

export const rolePagesFor = (categorySlug: string) => ROLE_PAGES.filter((r) => r.categorySlug === categorySlug);
export const rolePage = (categorySlug: string, slug: string) => ROLE_PAGES.find((r) => r.categorySlug === categorySlug && r.slug === slug) ?? null;
