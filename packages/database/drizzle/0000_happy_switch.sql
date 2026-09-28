CREATE TABLE IF NOT EXISTS "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"due_date" timestamp NOT NULL,
	"max_points" serial NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"subject" varchar(100) NOT NULL,
	"grade" varchar(20),
	"teacher_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) NOT NULL,
	"deleted_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "enrollments_student_course_unique" UNIQUE("student_id","course_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"type" varchar(50) NOT NULL,
	"code" varchar(50) NOT NULL,
	"address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "parent_child_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid NOT NULL,
	"child_id" uuid NOT NULL,
	"relationship" varchar(50) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"can_view_grades" boolean DEFAULT true NOT NULL,
	"can_view_attendance" boolean DEFAULT true NOT NULL,
	"can_view_assignments" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "parent_child_relationships_parent_child_unique" UNIQUE("parent_id","child_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"content" text NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"grade" serial NOT NULL,
	"feedback" text,
	"graded_at" timestamp,
	"graded_by" uuid,
	"deleted_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "submissions_assignment_student_unique" UNIQUE("assignment_id","student_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone_number" varchar(20),
	"password_hash" varchar(255) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"role" varchar(20) NOT NULL,
	"organization_id" uuid NOT NULL,
	"avatar_url" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "content_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"title" text NOT NULL,
	"content" jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "content_versions_lesson_version_unique" UNIQUE("lesson_id","version")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lesson_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" text NOT NULL,
	"progress" text DEFAULT '0' NOT NULL,
	"time_spent" text,
	"last_accessed_at" timestamp,
	"completed_at" timestamp,
	"deleted_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_progress_lesson_student_unique" UNIQUE("lesson_id","student_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"content" jsonb,
	"order" text NOT NULL,
	"duration" text,
	"is_published" text DEFAULT 'false' NOT NULL,
	"published_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid,
	"course_id" uuid,
	"uploaded_by" uuid,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"file_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"storage_key" text NOT NULL,
	"url" text NOT NULL,
	"duration" text,
	"dimensions" text,
	"thumbnail_url" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid,
	"course_id" uuid,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"url" text NOT NULL,
	"size" text,
	"mime_type" text,
	"description" text,
	"order" text,
	"is_downloadable" text DEFAULT 'true' NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" uuid NOT NULL,
	"type" text NOT NULL,
	"text" text NOT NULL,
	"points" text NOT NULL,
	"order" text NOT NULL,
	"options" jsonb,
	"correct_answer" jsonb,
	"explanation" text,
	"metadata" jsonb,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quiz_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp,
	"score" text,
	"passed" text NOT NULL,
	"time_spent" text,
	"answers" jsonb,
	"feedback" jsonb,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quizzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"time_limit" text,
	"passing_score" text,
	"max_attempts" text,
	"shuffle_questions" text DEFAULT 'false' NOT NULL,
	"show_results" text DEFAULT 'immediate' NOT NULL,
	"available_from" timestamp,
	"available_until" timestamp,
	"is_active" text DEFAULT 'true' NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"push_enabled" boolean DEFAULT true NOT NULL,
	"assignment_reminders" boolean DEFAULT true NOT NULL,
	"grade_notifications" boolean DEFAULT true NOT NULL,
	"enrollment_notifications" boolean DEFAULT true NOT NULL,
	"announcement_notifications" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"metadata" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"action_url" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assignments" ADD CONSTRAINT "assignments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "courses" ADD CONSTRAINT "courses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "courses" ADD CONSTRAINT "courses_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "parent_child_relationships" ADD CONSTRAINT "parent_child_relationships_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "parent_child_relationships" ADD CONSTRAINT "parent_child_relationships_child_id_users_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "submissions" ADD CONSTRAINT "submissions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "submissions" ADD CONSTRAINT "submissions_graded_by_users_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media_files" ADD CONSTRAINT "media_files_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media_files" ADD CONSTRAINT "media_files_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media_files" ADD CONSTRAINT "media_files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resources" ADD CONSTRAINT "resources_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resources" ADD CONSTRAINT "resources_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "questions" ADD CONSTRAINT "questions_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assignments_course_id_idx" ON "assignments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assignments_due_date_idx" ON "assignments" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assignments_is_active_idx" ON "assignments" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assignments_course_active_idx" ON "assignments" USING btree ("course_id","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assignments_course_due_date_idx" ON "assignments" USING btree ("course_id","due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "courses_organization_id_idx" ON "courses" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "courses_teacher_id_idx" ON "courses" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "courses_subject_idx" ON "courses" USING btree ("subject");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "courses_is_active_idx" ON "courses" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "courses_org_teacher_idx" ON "courses" USING btree ("organization_id","teacher_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "courses_org_active_idx" ON "courses" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrollments_student_id_idx" ON "enrollments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrollments_course_id_idx" ON "enrollments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrollments_status_idx" ON "enrollments" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrollments_student_status_idx" ON "enrollments" USING btree ("student_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrollments_course_status_idx" ON "enrollments" USING btree ("course_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organizations_type_idx" ON "organizations" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organizations_is_active_idx" ON "organizations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "parent_child_relationships_parent_id_idx" ON "parent_child_relationships" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "parent_child_relationships_child_id_idx" ON "parent_child_relationships" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submissions_assignment_id_idx" ON "submissions" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submissions_student_id_idx" ON "submissions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submissions_graded_by_idx" ON "submissions" USING btree ("graded_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submissions_student_grade_idx" ON "submissions" USING btree ("student_id","grade");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submissions_assignment_grade_idx" ON "submissions" USING btree ("assignment_id","grade");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_organization_id_idx" ON "users" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_is_verified_idx" ON "users" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_versions_lesson_id_idx" ON "content_versions" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lesson_progress_student_id_idx" ON "lesson_progress" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lesson_progress_status_idx" ON "lesson_progress" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lessons_course_id_idx" ON "lessons" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lessons_order_idx" ON "lessons" USING btree ("course_id","order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lessons_is_published_idx" ON "lessons" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_files_lesson_id_idx" ON "media_files" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_files_course_id_idx" ON "media_files" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_files_type_idx" ON "media_files" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_files_uploaded_by_idx" ON "media_files" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resources_lesson_id_idx" ON "resources" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resources_course_id_idx" ON "resources" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resources_type_idx" ON "resources" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "questions_quiz_id_idx" ON "questions" USING btree ("quiz_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "questions_order_idx" ON "questions" USING btree ("quiz_id","order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quiz_attempts_quiz_student_idx" ON "quiz_attempts" USING btree ("quiz_id","student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quiz_attempts_student_id_idx" ON "quiz_attempts" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quiz_attempts_submitted_idx" ON "quiz_attempts" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quizzes_course_id_idx" ON "quizzes" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quizzes_is_active_idx" ON "quizzes" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quizzes_available_idx" ON "quizzes" USING btree ("available_from","available_until");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_preferences_user_id_idx" ON "notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications" USING btree ("created_at");