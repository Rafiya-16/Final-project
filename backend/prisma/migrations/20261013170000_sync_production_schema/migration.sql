
-- Add supervisor preference status enum.
CREATE TYPE "SupervisorPreferenceStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'EXPIRED',
    'CLOSED'
);

-- Add notification types required by the current application.
ALTER TYPE "NotificationType" ADD VALUE 'SUPERVISION_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'SUPERVISION_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'SUPERVISION_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'SUPERVISOR_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'SUBADMIN_ACCESS_GRANTED';
ALTER TYPE "NotificationType" ADD VALUE 'SUBADMIN_ACCESS_REVOKED';

-- Add the student-idea phase to pool status.
ALTER TYPE "PoolStatus" ADD VALUE 'IDEA_SUBMISSION';

-- Faculty ordering within a pool.
ALTER TABLE "pool_faculty"
ADD COLUMN "allocation_order" INTEGER;

CREATE UNIQUE INDEX "pool_faculty_pool_id_allocation_order_key"
ON "pool_faculty" ("pool_id", "allocation_order");

-- Project code and similarity detection fields.
-- Preserve legacy project-code locking columns for now.
ALTER TABLE "projects"
ADD COLUMN "projectCode" TEXT,
ADD COLUMN "similarityScore" DOUBLE PRECISION,
ADD COLUMN "similarityStatus" TEXT;

CREATE UNIQUE INDEX "projects_pool_id_projectCode_key"
ON "projects" ("pool_id", "projectCode");

-- Student idea similarity and supervisor assignment fields.
ALTER TABLE "student_ideas"
ADD COLUMN "similarityScore" DOUBLE PRECISION,
ADD COLUMN "similarityStatus" TEXT,
ADD COLUMN "similarity_checked_at" TIMESTAMP(3),
ADD COLUMN "supervisor_id" TEXT;

CREATE INDEX "student_ideas_pool_id_idx"
ON "student_ideas" ("pool_id");

CREATE INDEX "student_ideas_student_id_idx"
ON "student_ideas" ("student_id");

CREATE INDEX "student_ideas_supervisor_id_idx"
ON "student_ideas" ("supervisor_id");

-- Ensure faculty IDs are unique.
CREATE UNIQUE INDEX "users_faculty_id_key"
ON "users" ("faculty_id");

-- Supervisor preference workflow.
CREATE TABLE "supervisor_preferences" (
    "id" TEXT NOT NULL,
    "idea_id" TEXT NOT NULL,
    "supervisor_id" TEXT NOT NULL,
    "preference_order" INTEGER NOT NULL,
    "responseStatus" "SupervisorPreferenceStatus" NOT NULL DEFAULT 'PENDING',
    "responded_at" TIMESTAMP(3),
    "response_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supervisor_preferences_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "supervisor_preferences_supervisor_id_responseStatus_idx"
ON "supervisor_preferences" ("supervisor_id", "responseStatus");

CREATE UNIQUE INDEX "supervisor_preferences_idea_id_preference_order_key"
ON "supervisor_preferences" ("idea_id", "preference_order");

CREATE UNIQUE INDEX "supervisor_preferences_idea_id_supervisor_id_key"
ON "supervisor_preferences" ("idea_id", "supervisor_id");

-- Supervisor assignment relation.
ALTER TABLE "student_ideas"
ADD CONSTRAINT "student_ideas_supervisor_id_fkey"
FOREIGN KEY ("supervisor_id")
REFERENCES "users" ("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Supervisor preference relations.
ALTER TABLE "supervisor_preferences"
ADD CONSTRAINT "supervisor_preferences_idea_id_fkey"
FOREIGN KEY ("idea_id")
REFERENCES "student_ideas" ("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "supervisor_preferences"
ADD CONSTRAINT "supervisor_preferences_supervisor_id_fkey"
FOREIGN KEY ("supervisor_id")
REFERENCES "users" ("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Align timestamp defaults with the Prisma schema.
ALTER TABLE "team_dissolve_requests"
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "users"
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
