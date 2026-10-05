-- LaunchPath Phase 3. NON-DESTRUCTIVE: creates 8 tables; adds nullable/defaulted columns to vacancies,
-- interview_requests and placements; relaxes NOT NULL on placements.fee_rate_bps/fee_min/fee_max.
-- No table or column is dropped and no existing value is changed. Phases 1-2 are already applied to the
-- configured database (read-only diff on 2026-10-05 was empty before these changes).
-- Apply with 'npx prisma db push' or run this script, after review. Not applied by Claude.

-- AlterTable
ALTER TABLE "vacancies" ADD COLUMN     "commercial_model" TEXT NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "company_id" INTEGER,
ADD COLUMN     "partner_subscription_id" INTEGER,
ADD COLUMN     "programme_id" INTEGER,
ADD COLUMN     "salary_benchmark_note" TEXT;

-- AlterTable
ALTER TABLE "interview_requests" ADD COLUMN     "requested_by_user_id" INTEGER;

-- AlterTable
ALTER TABLE "placements" ADD COLUMN     "commercial_model" TEXT NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "fee_basis" TEXT NOT NULL DEFAULT 'PERCENT',
ADD COLUMN     "fee_flat" INTEGER,
ADD COLUMN     "partner_subscription_id" INTEGER,
ADD COLUMN     "programme_terms_id" INTEGER,
ALTER COLUMN "fee_rate_bps" DROP NOT NULL,
ALTER COLUMN "fee_min" DROP NOT NULL,
ALTER COLUMN "fee_max" DROP NOT NULL;

-- CreateTable
CREATE TABLE "companies" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_members" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "granted_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_plan_versions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "monthly_price" INTEGER NOT NULL,
    "vat_treatment" TEXT NOT NULL DEFAULT 'UNDECIDED',
    "vacancy_limit" INTEGER NOT NULL,
    "success_fee_bps" INTEGER NOT NULL,
    "fee_rule" TEXT NOT NULL DEFAULT 'UNDECIDED',
    "fee_min" INTEGER,
    "fee_max" INTEGER,
    "guarantee_days" INTEGER NOT NULL,
    "entitlements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "notes" TEXT,
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_plan_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_subscriptions" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "plan_version_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "billing_mode" TEXT NOT NULL DEFAULT 'MANUAL',
    "checkout_ref" TEXT NOT NULL,
    "monthly_price" INTEGER NOT NULL,
    "vat_treatment" TEXT NOT NULL,
    "vacancy_limit" INTEGER NOT NULL,
    "success_fee_bps" INTEGER NOT NULL,
    "fee_rule" TEXT NOT NULL,
    "fee_min" INTEGER,
    "fee_max" INTEGER,
    "guarantee_days" INTEGER NOT NULL,
    "entitlements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "terms_note" TEXT,
    "talent_partner_id" INTEGER,
    "starts_on" TIMESTAMP(3) NOT NULL,
    "ends_on" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "provider_token" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_events" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "event_key" TEXT NOT NULL,
    "subscription_id" INTEGER,
    "payment_status" TEXT,
    "amount_cents" INTEGER,
    "provider_payment_id" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "outcome" TEXT NOT NULL,
    "detail" TEXT,
    "recorded_by_id" INTEGER,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulk_programmes" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ENQUIRY',
    "submission_key" TEXT,
    "company_name" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT,
    "name" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "role_categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "locations" TEXT,
    "target_hires" INTEGER NOT NULL,
    "start_by" TIMESTAMP(3),
    "owner_id" INTEGER,
    "internal_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bulk_programmes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programme_terms" (
    "id" SERIAL NOT NULL,
    "programme_id" INTEGER NOT NULL,
    "pricing_model" TEXT NOT NULL,
    "tier_label" TEXT,
    "per_hire_fee" INTEGER NOT NULL,
    "guarantee_days" INTEGER NOT NULL,
    "note" TEXT,
    "agreed_on" TIMESTAMP(3) NOT NULL,
    "agreed_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "programme_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employer_feedback" (
    "id" SERIAL NOT NULL,
    "shortlist_candidate_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "decision" TEXT NOT NULL,
    "comment" TEXT,
    "score_skills" INTEGER,
    "score_communication" INTEGER,
    "score_culture" INTEGER,
    "score_overall" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employer_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_members_user_id_idx" ON "company_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_members_company_id_user_id_key" ON "company_members"("company_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "partner_subscriptions_checkout_ref_key" ON "partner_subscriptions"("checkout_ref");

-- CreateIndex
CREATE UNIQUE INDEX "partner_subscriptions_provider_token_key" ON "partner_subscriptions"("provider_token");

-- CreateIndex
CREATE INDEX "partner_subscriptions_company_id_idx" ON "partner_subscriptions"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "billing_events_event_key_key" ON "billing_events"("event_key");

-- CreateIndex
CREATE INDEX "billing_events_subscription_id_idx" ON "billing_events"("subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "bulk_programmes_submission_key_key" ON "bulk_programmes"("submission_key");

-- CreateIndex
CREATE INDEX "bulk_programmes_status_idx" ON "bulk_programmes"("status");

-- CreateIndex
CREATE INDEX "programme_terms_programme_id_idx" ON "programme_terms"("programme_id");

-- CreateIndex
CREATE UNIQUE INDEX "employer_feedback_shortlist_candidate_id_user_id_key" ON "employer_feedback"("shortlist_candidate_id", "user_id");

-- AddForeignKey
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_partner_subscription_id_fkey" FOREIGN KEY ("partner_subscription_id") REFERENCES "partner_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_programme_id_fkey" FOREIGN KEY ("programme_id") REFERENCES "bulk_programmes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_subscriptions" ADD CONSTRAINT "partner_subscriptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_subscriptions" ADD CONSTRAINT "partner_subscriptions_plan_version_id_fkey" FOREIGN KEY ("plan_version_id") REFERENCES "partner_plan_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "partner_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_programmes" ADD CONSTRAINT "bulk_programmes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programme_terms" ADD CONSTRAINT "programme_terms_programme_id_fkey" FOREIGN KEY ("programme_id") REFERENCES "bulk_programmes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_feedback" ADD CONSTRAINT "employer_feedback_shortlist_candidate_id_fkey" FOREIGN KEY ("shortlist_candidate_id") REFERENCES "shortlist_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

