import { pgTable, uuid, text, timestamp, jsonb, index, unique, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { courses, users } from '@edunet/database';

// Lessons - Content units within courses
export const lessons = pgTable('lessons', {
  id: uuid('id').defaultRandom().primaryKey(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type').notNull(), // video, text, document, interactive, quiz
  content: jsonb('content'), // Structured content based on type
  order: text('order').notNull(), // Display order within course
  duration: text('duration'), // e.g., "30m", "1h"
  isPublished: text('is_published').default('false').notNull(), // true, false
  publishedAt: timestamp('published_at'),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  courseIdx: index('lessons_course_id_idx').on(table.courseId),
  orderIdx: index('lessons_order_idx').on(table.courseId, table.order),
  isPublishedIdx: index('lessons_is_published_idx').on(table.isPublished),
}));

// Lesson Progress - Student progress through lessons
export const lessonProgress = pgTable('lesson_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  lessonId: uuid('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }).notNull(),
  studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: text('status').notNull(), // not_started, in_progress, completed
  progress: text('progress').default('0').notNull(), // e.g., "50", "100" (percentage)
  timeSpent: text('time_spent'), // e.g., "15m 30s"
  lastAccessedAt: timestamp('last_accessed_at'),
  completedAt: timestamp('completed_at'),
  deletedAt: timestamp('deleted_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  lessonStudentIdx: unique('lesson_progress_lesson_student_unique').on(table.lessonId, table.studentId),
  studentIdx: index('lesson_progress_student_id_idx').on(table.studentId),
  statusIdx: index('lesson_progress_status_idx').on(table.status),
}));

// Resources - Attachments and supplementary materials
export const resources = pgTable('resources', {
  id: uuid('id').defaultRandom().primaryKey(),
  lessonId: uuid('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  type: text('type').notNull(), // pdf, doc, video, image, link, other
  url: text('url').notNull(),
  size: text('size'), // e.g., "2.5MB"
  mimeType: text('mime_type'),
  description: text('description'),
  order: text('order'),
  isDownloadable: text('is_downloadable').default('true').notNull(),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  lessonIdx: index('resources_lesson_id_idx').on(table.lessonId),
  courseIdx: index('resources_course_id_idx').on(table.courseId),
  typeIdx: index('resources_type_idx').on(table.type),
}));

// Content Versions - Version history for lessons
export const contentVersions = pgTable('content_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  lessonId: uuid('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }).notNull(),
  version: integer('version').notNull(),
  title: text('title').notNull(),
  content: jsonb('content'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  lessonVersionIdx: unique('content_versions_lesson_version_unique').on(table.lessonId, table.version),
  lessonIdx: index('content_versions_lesson_id_idx').on(table.lessonId),
}));

// Media Files - Documents, images, audio, video metadata
export const mediaFiles = pgTable('media_files', {
  id: uuid('id').defaultRandom().primaryKey(),
  lessonId: uuid('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }).notNull(),
  type: text('type').notNull(), // document, image, audio, video
  title: text('title').notNull(),
  description: text('description'),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: text('mime_type').notNull(),
  storageKey: text('storage_key').notNull(),
  url: text('url').notNull(),
  duration: text('duration'), // for audio/video: e.g., "5m 30s"
  dimensions: text('dimensions'), // for images: e.g., "1920x1080"
  thumbnailUrl: text('thumbnail_url'),
  isPublic: boolean('is_public').default(false).notNull(),
  downloadCount: integer('download_count').default(0).notNull(),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  lessonIdx: index('media_files_lesson_id_idx').on(table.lessonId),
  courseIdx: index('media_files_course_id_idx').on(table.courseId),
  typeIdx: index('media_files_type_idx').on(table.type),
  uploadedByIdx: index('media_files_uploaded_by_idx').on(table.uploadedBy),
}));

// Relations
export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  course: one(courses, {
    fields: [lessons.courseId],
    references: [courses.id],
  }),
  progress: many(lessonProgress),
  resources: many(resources),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  lesson: one(lessons, {
    fields: [lessonProgress.lessonId],
    references: [lessons.id],
  }),
  student: one(users, {
    fields: [lessonProgress.studentId],
    references: [users.id],
  }),
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
  lesson: one(lessons, {
    fields: [resources.lessonId],
    references: [lessons.id],
  }),
  course: one(courses, {
    fields: [resources.courseId],
    references: [courses.id],
  }),
}));

export const contentVersionsRelations = relations(contentVersions, ({ one }) => ({
  lesson: one(lessons, {
    fields: [contentVersions.lessonId],
    references: [lessons.id],
  }),
  createdBy: one(users, {
    fields: [contentVersions.createdBy],
    references: [users.id],
  }),
}));

export const mediaFilesRelations = relations(mediaFiles, ({ one }) => ({
  lesson: one(lessons, {
    fields: [mediaFiles.lessonId],
    references: [lessons.id],
  }),
  course: one(courses, {
    fields: [mediaFiles.courseId],
    references: [courses.id],
  }),
  uploadedBy: one(users, {
    fields: [mediaFiles.uploadedBy],
    references: [users.id],
  }),
}));
