-- CreateEnum
CREATE TYPE "TeamLeaveRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "team_leave_requests" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "TeamLeaveRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "response_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "team_leave_requests_team_id_status_idx"
ON "team_leave_requests"("team_id", "status");

CREATE INDEX "team_leave_requests_student_id_status_idx"
ON "team_leave_requests"("student_id", "status");

CREATE INDEX "team_leave_requests_reviewed_by_id_idx"
ON "team_leave_requests"("reviewed_by_id");

-- AddForeignKey
ALTER TABLE "team_leave_requests"
ADD CONSTRAINT "team_leave_requests_team_id_fkey"
FOREIGN KEY ("team_id") REFERENCES "teams"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "team_leave_requests"
ADD CONSTRAINT "team_leave_requests_student_id_fkey"
FOREIGN KEY ("student_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "team_leave_requests"
ADD CONSTRAINT "team_leave_requests_reviewed_by_id_fkey"
FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;