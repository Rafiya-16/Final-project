ALTER TABLE "public"."pools"
ADD COLUMN "session" TEXT;

ALTER TABLE "public"."pools"
ADD COLUMN "idea_submission_start" TIMESTAMP(3);

ALTER TABLE "public"."pools"
ADD COLUMN "idea_submission_end" TIMESTAMP(3);