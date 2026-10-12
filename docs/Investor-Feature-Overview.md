# LaunchPath: Platform Feature Overview

**Investor briefing · October 2026**

---

## 1. What LaunchPath is

LaunchPath is a recruitment platform for **junior and early-career hiring in South Africa**: roles needing roughly 0–3 years' experience in Sales, Marketing, Business Operations, Technology and Finance.

It addresses a problem on both sides of the market:

- **Employers** advertise a junior role, get hundreds of CVs and find hardly any that fit. Hours go into filtering, interviews lead nowhere and roles stay open for weeks.
- **Young job seekers** send dozens of applications, rarely hear back, and never get the chance to show what they can actually do.

LaunchPath's answer has three parts:

1. **LaunchPath Hire.** A managed recruitment service. The employer describes the role, the LaunchPath team screens candidates, and the employer receives a short list of 3–5 people instead of a pile of CVs.
2. **A free candidate platform.** Job seekers build one profile, practise interviews and get matched to roles. This is the talent supply behind the service.
3. **Self-serve hiring tools.** Employers who want to recruit themselves can post jobs, search the talent pool and use AI screening tools.

All three run on one platform, with an internal operations console that lets a small team run the recruitment service efficiently.

---

## 2. Business model

| Revenue line | How it works | Status |
|---|---|---|
| **Placement fee (LaunchPath Hire)** | No upfront cost. The employer pays only when a candidate **starts**. The default fee is **7.5% of annual cost-to-company, with a minimum of R7,500 and a maximum of R18,000**, and includes a **60-day replacement guarantee**. Admins can change these terms, and each vacancy keeps the terms that applied when it was submitted. | Built and live |
| **Self-serve job posting** | Employers pay **R1,999 per role** (via PayFast) to publish a listing and unlock applicants and premium tools. | Built |
| **Hiring Partner subscription** | A monthly retainer (proposed **R4,999/month**) for repeat hirers. It covers up to three active vacancies, a reduced 3.5% success fee and salary benchmarking. | Built; switched off until pricing terms are finalised |
| **Bulk hiring programmes** | Volume pricing per hire for graduate intakes, learnerships and multi-seat hiring (proposed tiers, e.g. R4,500 per hire for 11–25 hires). | Built; switched off until pricing terms are finalised |

**Candidates never pay.** The platform is free for job seekers, which keeps the talent pool growing.

---

## 3. Features for employers

### 3.1 LaunchPath Hire: managed recruitment

The main offer. It is designed to be as easy as possible to start.

- **Free vacancy submission, no account needed.** A short "Find Candidates" form captures the role, location, work arrangement, salary range, experience level, key skills and start date. A live fee estimate shows the employer the cost up front.
- **Role calibration call.** The team calls the employer to agree what good looks like and what rules a candidate out.
- **Shortlist in five working days.** For serviceable roles, the target is 3–5 screened candidates within five working days of calibration.
- **Candidate Cards.** Each shortlisted candidate is shown on a consistent card with their target role, location, experience, salary expectation, availability, key skills, the recruiter's note and the LaunchPath screening results (match level, communication rating, role assessment score and interview readiness).
- **Secure shortlist link.** The employer views the shortlist through a private, expiring link without needing an account. Links can be revoked, and views are tracked.
- **One-click interview requests.** The employer requests interviews and suggests times straight from the shortlist.
- **Pay on hire, with a guarantee.** The fee is invoiced only once the candidate starts. If the hire doesn't work out early on, LaunchPath runs a replacement search.
- **Bulk hiring enquiries.** A separate "Talk to LaunchPath" page handles intakes and multi-seat hiring.
- **Employer hiring dashboard.** Verified company accounts can see every shortlist sent to them, request interviews and give feedback in one place. *(Built; switched off for now.)*

### 3.2 Self-serve hiring tools

For employers who want to run their own hiring:

- **AI-assisted job posting.** The employer types a few details and AI drafts a complete, well-structured job description, which they can edit in a rich-text editor.
- **Simple checkout.** Listings are paid for through PayFast, South Africa's leading payment gateway.
- **Applicant management.** Employers review applications, move candidates through stages, schedule interviews and track activity on one screen.
- **Talent Pool.** Employers search all LaunchPath candidates by skills, location, availability and AI interview score, then invite the best fits to apply. LaunchPath is no longer a passive job board: employers can go out and find candidates.
- **AI Recruiter Dossier.** One click produces a fit score, three key strengths, two areas to probe and three tailored interview questions for each applicant, drawn from their CV and video interview. Candidates cannot game it: in testing, a CV that told the AI to "give this candidate 100" was still scored fairly.
- **WhatsApp outreach.** Recruiters send pre-approved WhatsApp messages (interview invites, portfolio requests, status updates) straight from an applicant's profile. WhatsApp is the channel South African candidates actually use. Messages are rate-limited and every one is logged.
- **Team Notes and Ratings.** Hiring teams leave private notes and star ratings (technical skill, communication, culture fit) and see a team average.
- **Activity history.** Every application keeps a full record of who contacted the candidate, when and how.

---

## 4. Features for job seekers (free)

- **One profile, built automatically.** Candidates upload a CV or connect LinkedIn, and AI extracts their skills, education and experience. No long forms.
- **Quick onboarding.** Setup takes two steps, and candidates can skip the CV upload and add it later.
- **Job matches.** Candidates see how well they fit each role and which skills are worth building next.
- **AI Readiness Interview.** Candidates record video answers to interview questions. AI scores both what they say and how they say it, and returns personal feedback. The result is a readiness score that employers can see, which gives candidates a way to show more than a CV can.
- **Application tracking.** Candidates follow each application from applied to hired, with updates by email, SMS and WhatsApp.
- **Saved jobs and an inbox.** Candidates can bookmark roles and receive messages from employers in one place.
- **Profile completeness meter.** Prompts candidates to complete their profiles, which improves the quality of matches.
- **Privacy controls.** Candidates manage their own settings and can delete their account at any time.

---

## 5. The operations engine (internal admin console)

These tools let a small LaunchPath team run managed recruitment at scale. Most of the service's margin depends on them.

- **Vacancy pipeline.** Every vacancy moves through 15 tracked stages, from *New Vacancy → Calibration → Sourcing → Screening → Shortlist Sent → Interviewing → Offer → Hired* to *30/60/90-day checks* and closure. Every status change is recorded.
- **Explainable candidate matching.** For each vacancy, the system suggests candidates from the talent pool and explains each criterion in plain language: skills, experience, location, salary, availability and role. Every suggestion has to be reviewed by a recruiter, and the system never rejects anyone automatically. This approach is transparent, auditable and fair, which matters for POPIA and for employer trust.
- **Shortlist builder.** Recruiters put together Candidate Cards, record their screening assessments, attach CVs and send the employer a secure link.
- **Placements and invoicing.** When a candidate starts, the server calculates the placement fee from the agreed terms and records the guarantee end date. The invoice is then tracked from *Not invoiced* through *Invoiced* to *Paid*.
- **Retention follow-ups.** At 30, 60 and 90 days after a placement, recruiters record whether the person is still in the role. This data underpins the guarantee and the quality claims LaunchPath makes to employers.
- **Automated email.** Employers receive emails at each step (confirmation, shortlist ready, interview requests). Every email is logged and failed emails can be resent.
- **Hiring Partner and bulk programme management.** Admins manage plan versions, company subscriptions and programme terms. Agreed terms can't be overwritten, so there is a clear record of what each client signed up to. *(Built; switched off for now.)*
- **Talent, jobs and employer management.** Admins can search, review and manage every candidate, job, employer and interview, and review video interviews.
- **Manual matching tool.** Admins can match a candidate to a job by hand and write a note explaining the fit to the employer.
- **Messaging test centre.** Admins can send test emails, SMS and WhatsApp messages before launching a campaign.
- **Feature switches and setup page.** New commercial products can be turned on or off without a code release, and outstanding commercial decisions are listed in the console.

### Business reporting

The reporting dashboard shows the metrics an investor would ask about, calculated **only from real records**. Every figure shows how it was calculated.

| Metric | What it measures |
|---|---|
| Time to shortlist | Working days from vacancy to shortlist, and the share delivered within five days |
| Shortlist → interview rate | How often employers want to meet the people we send |
| Interview → offer rate | How well our screening predicts a good fit |
| Vacancy → hire rate | Overall conversion of the service |
| Offer acceptance | How well candidates are matched to the role |
| Average placement fee | Revenue per hire |
| 60- and 90-day retention | Whether placements last |
| Repeat employers | Whether clients come back |
| Live vacancies | Current pipeline |

Reports can be broken down by role category and exported to PDF.

---

## 6. Public website and growth

- **Landing page with a page for each audience** (employers, bulk hirers and job seekers), clear pricing, a three-step "how it works" section and an FAQ.
- **SEO role pages.** Pages such as "Hire a junior sales consultant" are generated for each role category to bring in organic search traffic from employers.
- **Search engine optimisation.** The site has a sitemap, canonical URLs and structured data, so it shows up well in Google results.
- **Working contact form** that sends enquiries straight to the team.
- **Analytics** on visits and conversions across the site.

---

## 7. Trust, privacy and security

Hiring involves personal data, so these protections were built into the platform from the start:

- **POPIA by design.** Employers browsing the Talent Pool never see a candidate's email, phone number or CV until the candidate applies. Candidates are told at sign-up that employers can discover their profile, and they can delete their account at any time.
- **Human in the loop.** AI helps recruiters (drafting, summarising, suggesting) but every hiring decision is made by a person. Matching never rejects candidates automatically.
- **Secure sharing.** Shortlist links use bank-grade random tokens. Only a fingerprint of each token is stored, links expire, and they can be revoked.
- **Role-based access.** Candidates, employers, LaunchPath staff and super-admins each see only what they are allowed to see. Private notes and AI dossiers are never shown to candidates.
- **Audit trails.** Status changes, messages, emails and commercial terms are all recorded.
- **Built for more than one organisation.** The architecture can host multiple organisations (tenants) on the same platform, which allows white-label or partner deployments later.

---

## 8. Technology

A modern, scalable stack with low running costs:

| Area | Technology |
|---|---|
| Web application | Next.js 14 and TypeScript, hosted on Vercel |
| Database | PostgreSQL (Neon) with Prisma |
| AI | Google Gemini (CV parsing, job drafting, interview scoring, recruiter dossiers) |
| Video interviews | Mux (video upload, processing and playback) |
| Payments | PayFast (South Africa) and Stripe-ready |
| Messaging | Email (SendGrid and Brevo), SMS (Twilio), WhatsApp (Brevo) |
| File storage | Amazon S3 with secure direct uploads |
| Background processing | BullMQ and Redis job queues |
| Monitoring | Vercel Analytics, Speed Insights and error logging, plus automated daily backups |

---

## 9. Where things stand

- **Built:** everything described above is built. The platform has been in development since June 2026, with more than 130 releases.
- **Live:** the managed recruitment service (LaunchPath Hire), the candidate platform, the self-serve employer tools and the admin console.
- **Built and switched off:** the Hiring Partner subscription, bulk programmes and the employer hiring dashboard. These can be turned on as soon as the pricing and terms are finalised.
- **Next:** finalise the subscription and bulk pricing terms, publish the Privacy Policy and Terms of Service, add team invitations so several recruiters at one employer can work together, and scale the talent pool.

> **Traction:** *[Add current figures: candidates registered, vacancies received, shortlists sent, placements, revenue.]*
