/**
 * Content for the talent category pages (/hire/<slug>). Describes the roles we recruit for (at every level) and
 * what our screening covers. Keep this factual: no placement statistics, speed or outcome claims unless
 * they are measured and verified.
 */
export interface TalentCategory {
  slug: string;
  /** Matches ROLE_CATEGORIES in lib/hire/vacancy.ts; used to preselect the vacancy form */
  code: 'SALES' | 'MARKETING' | 'BUSINESS_OPERATIONS' | 'TECHNOLOGY' | 'FINANCE';
  name: string;
  headline: string;
  intro: string;
  roles: { title: string; summary: string }[];
  screening: string[];
  goodToKnow: string;
}

export const TALENT_CATEGORIES: TalentCategory[] = [
  {
    slug: 'sales',
    code: 'SALES',
    name: 'Sales',
    headline: 'Hire sales talent who are ready to pick up the phone.',
    intro: 'Sales people at every level, from first-time SDRs to experienced closers, for teams that need to book meetings, win deals and look after customers.',
    roles: [
      { title: 'Sales Development Representative', summary: 'Prospecting, outbound calls and emails, and booking meetings for the sales team.' },
      { title: 'Inside Sales Consultant', summary: 'Handling inbound enquiries, quoting and closing smaller deals by phone and email.' },
      { title: 'Account Executive', summary: 'Managing a book of accounts, running the sales cycle and closing deals.' },
      { title: 'Telesales Agent', summary: 'Structured outbound calling against targets, often in a contact-centre setting.' },
      { title: 'Customer Success Associate', summary: 'Onboarding and supporting existing customers, renewals and upsell conversations.' },
      { title: 'Sales Administrator', summary: 'Quotes, orders, CRM updates and reporting that keep a sales team running.' },
    ],
    screening: [
      'Phone and spoken communication',
      'Resilience and comfort with targets and rejection',
      'Basic CRM, email and spreadsheet use',
      'Commission and salary expectations',
      'Location, transport and working hours',
      'Your must-haves from role calibration',
    ],
    goodToKnow: 'Tell us how the role is paid (basic, commission, or both) and what a realistic first-month target is. It helps us screen for the right people.',
  },
  {
    slug: 'marketing',
    code: 'MARKETING',
    name: 'Marketing',
    headline: 'Hire marketers who can write, create and keep campaigns moving.',
    intro: 'Marketing people at every level for teams that need content, social media, campaigns and coordination.',
    roles: [
      { title: 'Marketing Assistant or Coordinator', summary: 'Supporting campaigns, events, suppliers and day-to-day marketing admin.' },
      { title: 'Social Media Coordinator', summary: 'Planning, posting and reporting on social channels, and responding to the community.' },
      { title: 'Content Writer or Copywriter', summary: 'Writing website, email, social and sales copy in your brand’s voice.' },
      { title: 'Digital Marketing Assistant', summary: 'Supporting paid ads, email campaigns, SEO basics and reporting.' },
      { title: 'Content or Graphic Designer', summary: 'Creating social and marketing assets with tools such as Canva or Adobe.' },
    ],
    screening: [
      'Written communication, with a sample where relevant',
      'Portfolio or examples of past work',
      'Familiarity with the platforms you use',
      'Attention to detail and organisation',
      'Salary expectations and availability',
      'Your must-haves from role calibration',
    ],
    goodToKnow: 'If the role is hands-on with a specific tool or channel, tell us during calibration and we can include a short, relevant task in screening.',
  },
  {
    slug: 'business-operations',
    code: 'BUSINESS_OPERATIONS',
    name: 'Business Operations',
    headline: 'Hire reliable people who keep the business running.',
    intro: 'Administrators, coordinators, support staff and team leads for operations, customer service and back-office teams.',
    roles: [
      { title: 'Operations or Office Administrator', summary: 'Scheduling, records, suppliers and the admin that keeps an office running.' },
      { title: 'Customer Service Agent', summary: 'Resolving customer queries by phone, email or chat.' },
      { title: 'Data Capturer', summary: 'Accurate data entry, checking and maintaining records.' },
      { title: 'Procurement or Logistics Assistant', summary: 'Purchase orders, stock, deliveries and supplier follow-up.' },
      { title: 'HR Assistant', summary: 'Recruitment admin, onboarding paperwork and employee records.' },
      { title: 'Personal or Executive Assistant', summary: 'Diary, travel, meeting and correspondence support for a manager.' },
    ],
    screening: [
      'Accuracy and attention to detail',
      'Spreadsheet and office software skills',
      'Organisation and follow-through',
      'Written and spoken communication',
      'Reliability, location and working hours',
      'Your must-haves from role calibration',
    ],
    goodToKnow: 'Operations roles vary a lot. During calibration we’ll ask what a normal week looks like so we screen for the work, not just the job title.',
  },
  {
    slug: 'technology',
    code: 'TECHNOLOGY',
    name: 'Technology',
    headline: 'Hire tech talent with skills you can see.',
    intro: 'Developers, testers, analysts and support technicians at every level, for teams that need practical skills from day one.',
    roles: [
      { title: 'Software Developer', summary: 'Designing, building and maintaining features, from graduate to senior level.' },
      { title: 'Web Developer', summary: 'Websites and front-end work in the stack your team uses.' },
      { title: 'IT Support or Service Desk Technician', summary: 'User support, devices, accounts and first-line troubleshooting.' },
      { title: 'QA or Software Tester', summary: 'Testing releases, writing test cases and reporting defects clearly.' },
      { title: 'Data Analyst', summary: 'Cleaning data, building reports and dashboards, and answering business questions.' },
    ],
    screening: [
      'Practical skills in the tools and stack you need',
      'A short, role-relevant task where agreed with you',
      'Problem-solving and how they explain their work',
      'Portfolio, GitHub or project examples where available',
      'Salary expectations and availability',
      'Your must-haves from role calibration',
    ],
    goodToKnow: 'Tell us your stack and the level you need. A developer at a five-person start-up and at a bank are different hires, even with the same job title.',
  },
  {
    slug: 'finance',
    code: 'FINANCE',
    name: 'Finance',
    headline: 'Hire finance staff who are accurate and dependable.',
    intro: 'Clerks, administrators, analysts and accountants at every level for finance teams and accounting practices.',
    roles: [
      { title: 'Accounts Clerk or Bookkeeper', summary: 'Capturing transactions, reconciliations and keeping the books up to date.' },
      { title: 'Accounts Payable or Receivable Clerk', summary: 'Supplier payments, invoicing, statements and follow-up.' },
      { title: 'Credit Controller', summary: 'Managing debtors, collections calls and payment arrangements.' },
      { title: 'Payroll Administrator', summary: 'Preparing payroll inputs, leave records and related admin.' },
      { title: 'Financial Analyst', summary: 'Budgets, forecasts, management reports and financial analysis.' },
    ],
    screening: [
      'Numeracy and accuracy',
      'Spreadsheet skills',
      'Familiarity with the accounting software you use',
      'Relevant studies for the role',
      'Salary expectations and availability',
      'Your must-haves from role calibration',
    ],
    goodToKnow: 'Let us know which accounting or payroll system you use and whether the role needs a specific qualification, and we’ll screen for it.',
  },
];

export const categoryBySlug = (slug: string) => TALENT_CATEGORIES.find((c) => c.slug === slug) ?? null;
export const categoryByCode = (code: string) => TALENT_CATEGORIES.find((c) => c.code === code) ?? null;
