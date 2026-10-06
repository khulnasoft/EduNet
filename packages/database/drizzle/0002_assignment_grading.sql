ALTER TABLE "assignments" ALTER COLUMN "max_points" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "assignments" ALTER COLUMN "max_points" TYPE integer USING "max_points"::integer;--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "grade" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "grade" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "grade" TYPE integer USING "grade"::integer;--> statement-breakpoint
DROP SEQUENCE IF EXISTS "assignments_max_points_seq";--> statement-breakpoint
DROP SEQUENCE IF EXISTS "submissions_grade_seq";
