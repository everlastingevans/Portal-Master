# LaunchPath Platform Update

**Board of Directors · October 2026**

---

## 1. Executive summary

Over this development cycle, the LaunchPath platform was redesigned end to end and expanded with four new recruiter tools. The work had three goals:

1. **Look and feel like a premium, trustworthy product** to employers, recruiters and job seekers.
2. **Give employers and recruiters tools that save them time** and set LaunchPath apart from job boards.
3. **Close security and data-protection gaps** found along the way.

All work is complete in code and passes a full production build. **It has not yet been released to customers.** Section 6 lists the steps and decisions needed before release.

---

## 2. A consistent, premium brand experience

Previously, each part of the platform looked different: mixed fonts, an old purple colour scheme alongside the new navy and lime, and inconsistent logos. Some screens also switched to a broken "dark mode" depending on the user's phone settings.

**What changed:**

- **One brand everywhere.** The LaunchPath logo, Lexend Deca typeface, and navy and lime colours are now used consistently across the website, the job-seeker portal, the employer portal and the internal admin console.
- **One loading experience.** Every portal now shows the same branded loading screen instead of plain text or mismatched spinners.
- **Reliable on mobile.** We fixed pop-ups and panels that were being cut off, and a mobile menu that blended into the page and was hard to read.

---

## 3. Redesigned experiences for each audience

### Public website (employers, recruiters and job seekers)

- **A new landing page** speaks directly to each audience: employers and SMEs, recruiters and agencies, and graduates. Each has a clear next step.
- **Clear story and pricing.** The page now explains the problem LaunchPath solves, how it works, and transparent pricing: **R1,999 per role for employers, free for job seekers.**
- **A working contact form.** The previous form did not send anything. Enquiries now reach the team by email.
- **Broken links fixed.** Several buttons led to pages that didn't exist.

### Sign-up and login

- **One-click entry.** "Find a job" and "Hire talent" buttons take people straight to the right sign-up form, which was previously a multi-step, confusing route.
- **Cleaner forms.** Sign-up, login and password reset were redesigned for clarity, with a password-strength indicator.
- **Better onboarding.** New job seekers get a simple two-step setup and can skip the CV upload instead of getting stuck.

### Job-seeker portal

- **Redesigned around the job search:** matched jobs, browsing, saved jobs, applications, messages, interview practice, and profile.
- **Profile completeness meter.** It encourages candidates to finish their profiles, which improves the quality of matches employers receive.

### Employer portal

- **Redesigned around hiring:** an overview, applicants, interviews, managing listings and the company profile.
- **Simpler posting and payment.** "Post a job" is always one click away, and the checkout page is clearer.

### Internal admin console

- **Rebuilt dashboard, accurate numbers.** The dashboard previously displayed **invented figures**, such as a hard-coded "+12% vs last month" and estimated sign-ups. It now shows only real data.

---

## 4. New features for employers and recruiters

| Feature | What it does | Why it matters |
|---|---|---|
| **Talent Pool** | Employers search all LaunchPath candidates by skills, location, availability and AI interview score, then invite the right people to apply to their live roles. | Turns LaunchPath from a passive job board into an active sourcing tool. It also encourages employers to pay for a role, because invitations only work on paid listings. |
| **AI Recruiter Dossier** | One click gives a fit score, three key strengths, two areas to probe, and three tailored interview questions for each applicant. It's generated from the candidate's CV and video interview. | Saves recruiters screening and interview-prep time. It's built to resist manipulation: in testing, a CV that instructed the AI to "give this candidate 100" was scored fairly at 65. |
| **WhatsApp Outreach** | Recruiters send a pre-written WhatsApp message (interview invite, request for a portfolio, or status check) straight from an applicant's profile. If message credits run out, they can open a direct WhatsApp chat instead. | Reaches candidates on the channel they actually use in South Africa. It includes spam limits, and every message is recorded. |
| **Team Notes & Ratings** | Hiring teams leave private notes and star ratings (technical, communication, culture fit) on each applicant and see a team average. | Supports structured, collaborative hiring decisions. Notes are never visible to candidates. |

Every application now also has an **activity history**, so the team can see who contacted a candidate, when, and how.

---

## 5. Security and data-protection fixes

During the work we found and fixed several serious issues. None are known to have been exploited, but they should be noted.

| Issue found | Risk | Status |
|---|---|---|
| Anyone could create a **super-administrator account** through the public sign-up form | Full access to all platform data | **Fixed** |
| A hidden login "backdoor" created an admin account with any password | Full access to all platform data | **Fixed** |
| Employers could make a job **live without paying** by editing it | Lost revenue | **Fixed** |
| The payment-confirmation page can still publish a job without verifying payment | Lost revenue | **Open, decision needed** (see section 6) |
| Test messages and contact-form content were not protected against malicious input | Message tampering | **Fixed** |

**Privacy (POPIA) safeguards built into the new features:**

- **Talent Pool:** employers never see a candidate's email, phone number or CV file. These are only shared when the candidate applies.
- **AI Dossier and Team Notes:** only available to the employer that owns the role, and only on paid roles. Candidates can never see them.
- **Candidate notice:** the onboarding text now tells candidates that employers can discover their profile.

---

## 6. Decisions and actions needed before release

**For the board's attention:**

1. **Payment verification gap.** Jobs can currently go live from the payment-confirmation page without the payment being confirmed by PayFast. The fix is to activate jobs only after confirmed payment. This needs a check that the PayFast payment notifications are set up correctly first, otherwise genuine customers could be affected. *Recommendation: prioritise before the next marketing push.*
2. **Legal pages.** The platform links to a **Privacy Policy and Terms of Service that don't exist yet**. Under POPIA, these must be published. They should also cover the Talent Pool and the use of AI to support (not make) hiring decisions.
3. **Testimonial.** The landing-page testimonial ("Mark Veld, Veld Tech") needs to be confirmed as genuine, or removed before launch.

**Operational actions (technical team):**

4. **Database update.** New features require a one-time database update. It must run *before* the new version goes live, otherwise logins and profiles will break.
5. **WhatsApp setup.** Configure the Brevo WhatsApp account and get the three message templates approved by Meta (WhatsApp's owner). Until then, recruiters use the direct-chat option.
6. **Testing.** The release has passed automated build checks but has **not yet been tested by people in a browser or on phones**. A full test pass is recommended before release.

---

## 7. Recommended next steps

- **Sign-up growth reporting.** The database does not record when users sign up, so the board cannot yet see sign-up growth over time. A small change would enable this.
- **Team invitations** so employers can add colleagues to their company account. Team Notes are most valuable with more than one recruiter.
- **Profile nudges** asking existing candidates to add their location and availability, so the Talent Pool filters work well from day one.
- **Real photography** of South African graduates and SME teams to strengthen the website further.

---

## Appendix: Technical summary (for the development team)

- **Codebase:** Next.js 14, Prisma (PostgreSQL), Tailwind, Google Gemini, Brevo.
- **Design systems:** a light kit (`components/portal/`) and an admin dark kit (`app/(portals)/(admin)/admin/_components/`) share one component API, with a shared `PortalShell` for both portals.
- **Schema additions (pending `npx prisma db push`):**
  - Candidate fields `location`, `availability` and `bio`.
  - New tables `JobInvitation`, `ApplicationActivity` and `ApplicationNote`.
- **New API routes:**
  - `/api/contact`
  - `/api/employer/candidates` and `/api/employer/candidates/invite`
  - `/api/ai/candidate-briefing`
  - `/api/brevo/whatsapp`
  - `/api/applications/[id]/notes`
  - `/api/employer/applications/[id]/activity`
- **Environment variables to configure:**
  - **Required:** `GEMINI_API_KEY`, `BREVO_API_KEY`, `BREVO_WHATSAPP_SENDER_NUMBER`.
  - **Optional:** `CONTACT_EMAIL`, `GEMINI_BRIEFING_MODEL`, `BREVO_WA_TEMPLATE_INTERVIEW`, `BREVO_WA_TEMPLATE_PORTFOLIO`, `BREVO_WA_TEMPLATE_STATUS`.
- **Release order:**
  1. Run the database update.
  2. Deploy.
  3. Stop the local dev server before running `npm run build`, because it locks Prisma files.
- **Not yet committed to Git.** Review `package-lock.json`, which changed unexpectedly.
