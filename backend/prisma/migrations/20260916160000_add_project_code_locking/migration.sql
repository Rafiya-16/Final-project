-- Add permanent project-code locking metadata.
ALTER TABLE "projects"
ADD COLUMN "project_code_locked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "project_code_locked_at" TIMESTAMP(3);

-- Support nightly code reorganization queries.
CREATE INDEX "projects_pool_id_faculty_id_idx"
ON "projects"("pool_id", "faculty_id");

CREATE INDEX "projects_pool_id_project_code_locked_idx"
ON "projects"("pool_id", "project_code_locked");
