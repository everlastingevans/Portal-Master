# TIA PreSeed Fund 2026 (Propella): Application Draft

**Deadline: 16 October 2026** · Applications go through Propella, TIA's implementing partner, which forwards approved packs to TIA.

> **Note for Evans (remove before submitting):**
> 1. **Get Propella's actual application form today.** The form's sections may differ from the ones below. These answers follow TIA's published Pre-Seed framework, so map them onto whatever headings the form uses. Contact: https://www.propella.co.za
> 2. **The fund supports TRL 3–4 technology** (proof of principle → early prototype), not products that are already live. The LaunchPath platform itself is beyond that stage, so this draft asks for money for a **new technology component**: a validated, fair work-readiness assessment engine. The readiness interview that exists today is the proof of principle. Ask Propella directly whether this framing fits before you put time into it.
> 3. **Deploy the new scoring before you submit.** The random-points endpoint has been removed. Readiness scores now come from a 4-part rubric (see `lib/readiness.ts`), and any answer the AI can't score goes to a person for review. Only past scores created with the old system are affected; consider re-running or excluding them.
> 4. **Read the terms.** TIA gets **first right of refusal** to fund further development of the project outputs. You also **can't cede or encumber the project IP** without TIA's written approval. Check this with your co-founders and any investors you're talking to.
> 5. **Salaries of the core team and general operating costs are not fundable.** The budget below therefore puts money into specialists, field studies, IP work and market research.
> 6. Fill in every **[bracket]**. Don't send placeholder numbers.

---

## 1. Applicant details

| Field | Answer |
|---|---|
| Company name | [LaunchPath (Pty) Ltd] |
| CIPC registration no. | [ ] |
| Date of registration | [ ] |
| Tax clearance (SARS TCS PIN) | [ ], **mandatory** |
| B-BBEE level / ownership | [e.g. Level 1 EME, xx% black-owned, xx% youth-owned] |
| South African ownership | [≥51% required] |
| Lead applicant | Evans Munatsa, Chief Technology Officer |
| Contact | evans@launchpath.co.za · [phone] |
| Location | [City, Province] |
| Sector / focus area | Digital transformation (ICT): AI for youth employment |

---

## 2. Project title

**Fair Readiness Engine: a validated, explainable AI assessment of work-readiness for young South African job seekers**

---

## 3. Project summary (about 150 words)

> South Africa's youth unemployment rate is among the highest in the world [insert latest Stats SA QLFS figure]. One cause is that employers can't tell, from a CV alone, which young applicants are ready for work. As a result, many capable young people, especially those without networks, polished CVs or well-known schools, are never interviewed.
>
> LaunchPath has built a working prototype: candidates record answers to interview questions on video, and AI scores what they say and how they say it. This project will turn that proof of principle into a **validated, fair and explainable** assessment. We will test it against real hiring outcomes, audit it for bias across South African languages, accents, gender, disability and location, and make it usable on low-cost phones with limited data.
>
> Outputs: a validated technical prototype, a fairness audit report, an IP strategy, primary market research with employers, and a roadmap to commercialisation.

---

## 4. Problem statement

> **For young job seekers:** applicants send dozens of applications and rarely hear back. A CV doesn't show communication, motivation or problem-solving. These are the qualities employers say matter most for early-career roles, and they are also where disadvantaged young people are most often underestimated.
>
> **For employers:** a single junior vacancy can attract hundreds of applications. Most SMEs have no recruiter, so they screen on CV signals such as school, university and previous employers. That reinforces exclusion.
>
> **For AI screening:** the AI tools available today are mostly built and tested on non-South African populations. They aren't validated against local hiring outcomes and risk penalising candidates for accent, home language or the quality of their device and connection. If a tool decides who gets an interview, it must be fair, explainable and validated, and POPIA requires this too.

---

## 5. The technology and its current stage (TRL)

**Current state: about TRL 3–4 (proof of principle established)**

> LaunchPath has built and is running a working proof of principle inside its recruitment platform:
> - Candidates record video answers to structured interview questions (Mux video infrastructure).
> - A large language model (Google Gemini) evaluates the content of the answers and how they are delivered, and gives the candidate personal feedback and a readiness score.
> - A separate AI "recruiter dossier" combines the CV and interview into a fit score, strengths, areas to probe and suggested questions. In testing, it held up against prompt-injection attempts (e.g. a CV instructing the AI to "give this candidate 100").
> - A rules-based, explainable matching engine shows recruiters why a candidate fits a vacancy. A person reviews every decision and no candidate is rejected automatically.
>
> **What's not yet proven, and what this project will do:**
> 1. **Validity.** We haven't yet shown that readiness scores predict real outcomes: being shortlisted, interviewed, hired and still employed after 90 days.
> 2. **Fairness.** Scoring hasn't been audited across South African languages, accents, gender, disability, location or device quality.
> 3. **Accessibility.** We haven't tested whether the assessment works well on entry-level smartphones and limited mobile data.
> 4. **Explainability.** Candidates and employers can't yet see a consistent, standardised breakdown of how each score was reached.
>
> **Target at project end: TRL 4–5.** The output will be a technology validated in a relevant environment and ready for TIA Seed Fund or investor follow-on funding.

---

## 6. Innovation and novelty

> - **Built for South Africa:** the scoring will be calibrated against local hiring outcomes and audited for local language and accent bias. We are not aware of any assessment that does this.
> - **Outcome-linked validation:** LaunchPath already tracks each placement from shortlist to interview, offer, hire and 30/60/90-day retention. That gives the project a rare feedback loop for checking whether scores actually predict success at work.
> - **Explainable by design:** every score comes with a plain-language breakdown, and people make the final decisions. This supports POPIA's protections against decisions made only by automated processing.
> - **Resistant to manipulation:** candidate input is treated as data, not instructions, and this is tested against prompt-injection attacks.
> - **Low-bandwidth delivery:** the assessment will work on the devices and data that young South Africans actually have.

---

## 7. Intellectual property

> - **Copyright:** LaunchPath owns the platform source code, assessment question banks, scoring rubrics and feedback models (original works created by the team).
> - **Trade secrets / know-how:** the validated scoring methodology, calibration approach and anonymised outcome dataset.
> - **Trade mark:** "LaunchPath" [registered / application no. ___ / to be filed].
> - **Patentability:** software as such is generally excluded from patent protection in South Africa. Part of this project (fundable under "sourcing of IP opinions") is to get a registered patent attorney's opinion on whether any element is patentable, and to develop a formal IP strategy.
> - **Freedom to operate:** the solution uses commercially licensed third-party services (Google Gemini, Mux) under standard terms and does not depend on any third-party IP restricted by the IPR Act. [Confirm. If any university or publicly funded research is involved, disclose it.]

---

## 8. Market need and opportunity

> - **Employers:** SMEs and corporates hiring for early-career roles in Sales, Marketing, Business Operations, Technology and Finance. They need a better signal than a CV.
> - **Job seekers:** [insert Stats SA figure: number of unemployed 15–34-year-olds]. Every one of them needs a way to show what they can do.
> - **Channel partners:** youth employment programmes, learnership providers, TVET colleges and universities' career offices, all of which need to show employers which candidates are ready.
>
> **Commercial route:** the validated engine strengthens LaunchPath's existing revenue streams, which are a pay-on-hire placement fee (7.5% of annual CTC, R7,500–R18,000) and self-serve job posting (R1,999 per role). It also opens a new **B2B licensing** line: assessments sold to employers, training providers and youth programmes.
>
> **Traction to date:** [candidates registered] · [readiness interviews completed] · [employers / vacancies received] · [shortlists sent] · [placements]. These must be real numbers.

---

## 9. Project plan (12 months)

| # | Work package | Months | Deliverable |
|---|---|---|---|
| 1 | **Assessment design and rubric validation**: work with an industrial/organisational psychologist to define competencies for early-career roles and standardise rubrics | 1–3 | Competency framework and validated scoring rubric |
| 2 | **Prototype engine v2**: standardised scoring, explainability breakdown, version tracking for every score, manipulation testing | 2–5 | Technical prototype and technical feasibility report |
| 3 | **Fairness and bias field study**: [300] candidates across [3] provinces, urban and rural, different home languages, with and without disability | 4–8 | Fairness audit report with corrective changes |
| 4 | **Low-bandwidth / mobile field test**: entry-level devices and limited data, through partner youth programmes or TVETs | 5–8 | Accessibility test report |
| 5 | **Outcome validation**: compare scores with shortlist, interview, hire and 90-day retention outcomes from LaunchPath placements | 6–11 | Predictive validity report |
| 6 | **Primary market research**: interviews with [30] employers and [5] youth programmes on willingness to pay | 3–9 | Market report with letters of interest from industry |
| 7 | **IP opinion and strategy** | 2–4 | Patent attorney opinion and IP strategy |
| 8 | **Commercialisation roadmap** | 10–12 | Technology roadmap and follow-on funding plan |

---

## 10. Budget (illustrative, up to R1,000,000; confirm the split with Propella)

TIA rule: **80% project activities / 20% enabling activities.** The enabling portion includes Propella's management fee of up to 12%.

**Project activities (80%: R800,000)**

| Item | Amount (R) |
|---|---|
| Industrial/organisational psychologist: competency framework and rubric validation (outsourced) | [150,000] |
| Specialist ML/AI development and evaluation for Prototype v2 (outsourced service provider) | [250,000] |
| Fairness field study: participant data/airtime stipends, partner coordination, travel | [150,000] |
| Low-bandwidth device testing: test devices and data | [40,000] |
| Cloud, AI inference and video processing for project testing | [70,000] |
| Patent attorney IP opinion and IP strategy | [40,000] |
| Primary market research with employers and youth programmes | [70,000] |
| Independent statistical analysis for the validity study | [30,000] |
| **Subtotal** | **800,000** |

**Enabling activities (20%: R200,000)**

| Item | Amount (R) |
|---|---|
| Propella management fee (up to 12%) | [ ] |
| Due diligence and technology road-mapping | [ ] |
| Mentorship and industry expert opinions | [ ] |
| Fundraising and pitch deck preparation | [ ] |
| **Subtotal** | **200,000** |

*Not included, because TIA doesn't fund them: core team salaries, working capital, general operating costs, and routine platform hosting.*

---

## 11. Team

| Name | Role | Relevant experience |
|---|---|---|
| Evans Munatsa | CTO, technical lead | Designed and built the LaunchPath platform: 130+ releases since June 2026. Covers AI integration (Gemini), video (Mux), payments, messaging, security and POPIA controls |
| [Name] | [CEO / Co-founder] | [Recruitment / commercial experience] |
| [Name] | [Recruitment lead] | [ ] |
| [Partner] | I/O psychologist (contracted) | [ ] |
| [Partner] | Youth programme / TVET partner | [ ] |

---

## 12. Socio-economic impact

> - **Jobs for young people:** a fairer screening signal gets capable young people interviewed who would otherwise be filtered out on CV signals.
> - **Inclusion:** the bias audit protects candidates from rural areas, those with disabilities, and speakers of every home language and accent.
> - **SME productivity:** small employers spend less time screening and make better hires, which supports retention.
> - **Responsible AI in SA:** a published, validated approach to fair AI assessment that follows POPIA.
> - **Targets (12 months):** [x] candidates assessed · [x] in the field study (≥[50]% women, ≥[x]% rural) · [x] employers engaged · [x] placements tracked through 90 days.

---

## 13. Risks and mitigation

| Risk | Mitigation |
|---|---|
| Scores don't predict outcomes well | Iterate the rubric with the I/O psychologist. A negative result is still a valid TRL output and helps shape the redesign. |
| Bias found in scoring | That's the purpose of the audit. Corrections get built into Prototype v2, and a person stays in the loop for every decision. |
| Too few placements to validate | Supplement with partner programmes' outcome data and proxy outcomes such as shortlist and interview rates. |
| Third-party AI model changes | Version-track the model and prompt behind every score, and re-validate after any provider change. |
| Data protection | POPIA consent at sign-up, anonymised research dataset, role-based access, and the right to deletion. |

---

## 14. Supporting documents checklist

- [ ] Signed TIA Seed Fund application form (Propella's version)
- [ ] CIPC registration documents and shareholder register
- [ ] Valid SARS tax clearance (TCS PIN)
- [ ] B-BBEE certificate or sworn affidavit
- [ ] Certified IDs of directors
- [ ] Proof of principle: demo video or screenshots of the readiness interview and dossier, and a short technical note
- [ ] Letters of support or interest from employers / youth programmes (aim for 2–3)
- [ ] Budget spreadsheet and project plan
- [ ] Short CVs of the team
- [ ] Declaration of no other government funding for the same costs (no double funding)
