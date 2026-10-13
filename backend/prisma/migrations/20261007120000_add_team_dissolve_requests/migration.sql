-- CreateEnum
CREATE TYPE "TeamDissolveRequestStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);

-- CreateTable
CREATE TABLE "team_dissolve_requests" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "requested_by_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "TeamDissolveRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "response_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_dissolve_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "team_dissolve_requests_team_id_status_idx"
ON "team_dissolve_requests"("team_id", "status");

-- CreateIndex
CREATE INDEX "team_dissolve_requests_requested_by_id_status_idx"
ON "team_dissolve_requests"("requested_by_id", "status");

-- CreateIndex
CREATE INDEX "team_dissolve_requests_reviewed_by_id_idx"
ON "team_dissolve_requests"("reviewed_by_id");

-- AddForeignKey
ALTER TABLE "team_dissolve_requests"
ADD CONSTRAINT "team_dissolve_requests_team_id_fkey"
FOREIGN KEY ("team_id")
REFERENCES "teams"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_dissolve_requests"
ADD CONSTRAINT "team_dissolve_requests_requested_by_id_fkey"
FOREIGN KEY ("requested_by_id")
REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_dissolve_requests"
ADD CONSTRAINT "team_dissolve_requests_reviewed_by_id_fkey"
FOREIGN KEY ("reviewed_by_id")
REFERENCES "users"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;