-- LaunchPath CV import. NON-DESTRUCTIVE: creates 3 tables and adds nullable/defaulted columns to users.
-- No table or column is dropped and no existing value is changed. Existing candidates keep
-- created_via = 'SELF_SIGNUP' and talent_pool_visible = true, so the employer talent pool is unchanged.
-- Apply with 'npx prisma db push' or run this script, after review. Not applied by Claude.

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "source_id" INTEGER,
ADD COLUMN     "import_batch_id" INTEGER,
ADD COLUMN     "created_via" TEXT NOT NULL DEFAULT 'SELF_SIGNUP',
ADD COLUMN     "claimed_at" TIMESTAMP(3),
ADD COLUMN     "talent_pool_visible" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "candidate_sources" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'TRAINING_PROVIDER',
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_import_batches" (
    "id" SERIAL NOT NULL,
    "source_id" INTEGER,
    "label" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'BULK',
    "total_files" INTEGER NOT NULL DEFAULT 0,
    "talent_pool_visible" BOOLEAN NOT NULL DEFAULT false,
    "consent_confirmed_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cv_import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_import_items" (
    "id" SERIAL NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "candidate_id" INTEGER,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cv_import_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "users_source_id_idx" ON "users"("source_id");

-- CreateIndex
CREATE INDEX "users_import_batch_id_idx" ON "users"("import_batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_sources_name_key" ON "candidate_sources"("name");

-- CreateIndex
CREATE INDEX "cv_import_batches_source_id_idx" ON "cv_import_batches"("source_id");

-- CreateIndex
CREATE INDEX "cv_import_items_batch_id_idx" ON "cv_import_items"("batch_id");

-- CreateIndex
CREATE INDEX "cv_import_items_candidate_id_idx" ON "cv_import_items"("candidate_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "candidate_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "cv_import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_import_batches" ADD CONSTRAINT "cv_import_batches_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "candidate_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_import_items" ADD CONSTRAINT "cv_import_items_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "cv_import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
