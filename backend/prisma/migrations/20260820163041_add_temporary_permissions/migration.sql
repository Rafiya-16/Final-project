-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('MANAGE_USERS', 'MANAGE_POOLS', 'MANAGE_PROJECTS', 'APPROVE_PROJECTS', 'REJECT_PROJECTS', 'PUBLISH_PROJECTS', 'ASSIGN_SUPERVISORS', 'MANAGE_TEAMS', 'VIEW_REPORTS');

-- CreateTable
CREATE TABLE "temporary_permissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "permission" "Permission" NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temporary_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "temporary_permissions_user_id_idx" ON "temporary_permissions"("user_id");

-- CreateIndex
CREATE INDEX "temporary_permissions_expires_at_idx" ON "temporary_permissions"("expires_at");

-- CreateIndex
CREATE INDEX "temporary_permissions_permission_idx" ON "temporary_permissions"("permission");

-- AddForeignKey
ALTER TABLE "temporary_permissions" ADD CONSTRAINT "temporary_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_permissions" ADD CONSTRAINT "temporary_permissions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
