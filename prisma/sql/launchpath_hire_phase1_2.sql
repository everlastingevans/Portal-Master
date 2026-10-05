-- LaunchPath Hire, Phases 1 and 2 combined (Phase 1 was never applied). ADDITIVE ONLY:
-- creates 11 new tables plus their indexes and foreign keys. No existing table is altered or dropped.
-- Generated: prisma migrate diff --from-schema-datamodel <committed schema> --to-schema-datamodel prisma/schema.prisma --script
-- Verified on 2026-10-05 by a read-only diff against the configured database: these are the only differences.
-- Apply with 'npx prisma db push' (the project's existing workflow) or run this script. Review first.

-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_by_id" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "employer_leads" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employer_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vacancies" (
    "id" SERIAL NOT NULL,
    "submission_key" TEXT NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "submitted_by_user_id" INTEGER,
    "company_name" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "role_title" TEXT NOT NULL,
    "role_category" TEXT NOT NULL,
    "role_category_other" TEXT,
    "location" TEXT NOT NULL,
    "work_arrangement" TEXT NOT NULL,
    "salary_min" INTEGER NOT NULL,
    "salary_max" INTEGER NOT NULL,
    "employment_type" TEXT NOT NULL,
    "required_experience" TEXT NOT NULL,
    "key_skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "start_date" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW_VACANCY',
    "status_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "owner_id" INTEGER,
    "internal_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vacancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vacancy_status_events" (
    "id" SERIAL NOT NULL,
    "vacancy_id" INTEGER NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "actor_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vacancy_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shortlists" (
    "id" SERIAL NOT NULL,
    "vacancy_id" INTEGER NOT NULL,
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sent_at" TIMESTAMP(3),
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shortlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shortlist_links" (
    "id" SERIAL NOT NULL,
    "shortlist_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_by_id" INTEGER,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "last_viewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shortlist_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shortlist_candidates" (
    "id" SERIAL NOT NULL,
    "shortlist_id" INTEGER NOT NULL,
    "candidate_id" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,
    "display_name" TEXT NOT NULL,
    "target_role" TEXT,
    "location" TEXT,
    "experience" TEXT,
    "salary_expectation" INTEGER,
    "availability" TEXT,
    "key_skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recruiter_note" TEXT,
    "cv_s3_key" TEXT,
    "cv_external_url" TEXT,
    "match_level" TEXT,
    "communication_rating" INTEGER,
    "communication_note" TEXT,
    "role_assessment_name" TEXT,
    "role_assessment_score" INTEGER,
    "role_assessment_max" INTEGER,
    "role_assessment_note" TEXT,
    "interview_readiness" INTEGER,
    "assessed_by_id" INTEGER,
    "assessed_at" TIMESTAMP(3),
    "employer_feedback" TEXT,
    "interview_outcome" TEXT,
    "offer_status" TEXT,
    "offer_made_at" TIMESTAMP(3),
    "offer_responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shortlist_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_requests" (
    "id" SERIAL NOT NULL,
    "vacancy_id" INTEGER NOT NULL,
    "shortlist_candidate_id" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "requester_name" TEXT,
    "message" TEXT,
    "preferred_times" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "scheduled_for" TIMESTAMP(3),
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placements" (
    "id" SERIAL NOT NULL,
    "vacancy_id" INTEGER NOT NULL,
    "shortlist_candidate_id" INTEGER,
    "candidate_id" INTEGER,
    "candidate_name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "annual_ctc" INTEGER NOT NULL,
    "fee_rate_bps" INTEGER NOT NULL,
    "fee_min" INTEGER NOT NULL,
    "fee_max" INTEGER NOT NULL,
    "guarantee_days" INTEGER NOT NULL,
    "placement_fee" INTEGER NOT NULL,
    "guarantee_end_date" TIMESTAMP(3) NOT NULL,
    "invoice_status" TEXT NOT NULL DEFAULT 'NOT_INVOICED',
    "invoiced_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "employer_feedback" TEXT,
    "check_30_outcome" TEXT,
    "check_30_at" TIMESTAMP(3),
    "check_30_note" TEXT,
    "check_60_outcome" TEXT,
    "check_60_at" TIMESTAMP(3),
    "check_60_note" TEXT,
    "check_90_outcome" TEXT,
    "check_90_at" TIMESTAMP(3),
    "check_90_note" TEXT,
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hire_events" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "vacancy_id" INTEGER NOT NULL,
    "shortlist_id" INTEGER,
    "shortlist_candidate_id" INTEGER,
    "placement_id" INTEGER,
    "actor_id" INTEGER,
    "dedupe_key" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hire_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" SERIAL NOT NULL,
    "dedupe_key" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "to_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "vacancy_id" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employer_leads_email_key" ON "employer_leads"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vacancies_submission_key_key" ON "vacancies"("submission_key");

-- CreateIndex
CREATE INDEX "vacancies_status_idx" ON "vacancies"("status");

-- CreateIndex
CREATE INDEX "vacancies_contact_email_created_at_idx" ON "vacancies"("contact_email", "created_at");

-- CreateIndex
CREATE INDEX "vacancy_status_events_vacancy_id_created_at_idx" ON "vacancy_status_events"("vacancy_id", "created_at");

-- CreateIndex
CREATE INDEX "shortlists_vacancy_id_idx" ON "shortlists"("vacancy_id");

-- CreateIndex
CREATE UNIQUE INDEX "shortlist_links_token_hash_key" ON "shortlist_links"("token_hash");

-- CreateIndex
CREATE INDEX "shortlist_links_shortlist_id_idx" ON "shortlist_links"("shortlist_id");

-- CreateIndex
CREATE INDEX "shortlist_candidates_shortlist_id_idx" ON "shortlist_candidates"("shortlist_id");

-- CreateIndex
CREATE INDEX "shortlist_candidates_candidate_id_idx" ON "shortlist_candidates"("candidate_id");

-- CreateIndex
CREATE INDEX "interview_requests_vacancy_id_idx" ON "interview_requests"("vacancy_id");

-- CreateIndex
CREATE INDEX "interview_requests_shortlist_candidate_id_idx" ON "interview_requests"("shortlist_candidate_id");

-- CreateIndex
CREATE UNIQUE INDEX "placements_shortlist_candidate_id_key" ON "placements"("shortlist_candidate_id");

-- CreateIndex
CREATE INDEX "placements_vacancy_id_idx" ON "placements"("vacancy_id");

-- CreateIndex
CREATE INDEX "placements_start_date_idx" ON "placements"("start_date");

-- CreateIndex
CREATE UNIQUE INDEX "hire_events_dedupe_key_key" ON "hire_events"("dedupe_key");

-- CreateIndex
CREATE INDEX "hire_events_vacancy_id_idx" ON "hire_events"("vacancy_id");

-- CreateIndex
CREATE INDEX "hire_events_type_occurred_at_idx" ON "hire_events"("type", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_logs_dedupe_key_key" ON "email_logs"("dedupe_key");

-- CreateIndex
CREATE INDEX "email_logs_vacancy_id_idx" ON "email_logs"("vacancy_id");

-- CreateIndex
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");

-- AddForeignKey
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "employer_leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancy_status_events" ADD CONSTRAINT "vacancy_status_events_vacancy_id_fkey" FOREIGN KEY ("vacancy_id") REFERENCES "vacancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortlists" ADD CONSTRAINT "shortlists_vacancy_id_fkey" FOREIGN KEY ("vacancy_id") REFERENCES "vacancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortlist_links" ADD CONSTRAINT "shortlist_links_shortlist_id_fkey" FOREIGN KEY ("shortlist_id") REFERENCES "shortlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortlist_candidates" ADD CONSTRAINT "shortlist_candidates_shortlist_id_fkey" FOREIGN KEY ("shortlist_id") REFERENCES "shortlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_requests" ADD CONSTRAINT "interview_requests_vacancy_id_fkey" FOREIGN KEY ("vacancy_id") REFERENCES "vacancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_requests" ADD CONSTRAINT "interview_requests_shortlist_candidate_id_fkey" FOREIGN KEY ("shortlist_candidate_id") REFERENCES "shortlist_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_vacancy_id_fkey" FOREIGN KEY ("vacancy_id") REFERENCES "vacancies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_shortlist_candidate_id_fkey" FOREIGN KEY ("shortlist_candidate_id") REFERENCES "shortlist_candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hire_events" ADD CONSTRAINT "hire_events_vacancy_id_fkey" FOREIGN KEY ("vacancy_id") REFERENCES "vacancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

