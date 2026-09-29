import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/edunet';
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

// Lesson operations
export async function findLessonById(id: string) {
  const result = await db.select().from(schema.lessons).where(eq(schema.lessons.id, id)).limit(1);
  return result[0] || null;
}

export async function listLessonsByCourse(courseId: string, limit = 100, offset = 0) {
  return db.select()
    .from(schema.lessons)
    .where(eq(schema.lessons.courseId, courseId))
    .orderBy(schema.lessons.order)
    .limit(limit)
    .offset(offset);
}

export async function createLesson(data: typeof schema.lessons.$inferInsert) {
  const result = await db.insert(schema.lessons).values(data).returning();
  return result[0];
}

export async function updateLesson(id: string, data: Partial<typeof schema.lessons.$inferInsert>) {
  const result = await db.update(schema.lessons)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.lessons.id, id))
    .returning();
  return result[0];
}

export async function deleteLesson(id: string) {
  const result = await db.delete(schema.lessons).where(eq(schema.lessons.id, id)).returning();
  return result[0];
}

// Lesson Progress operations
export async function findLessonProgressById(id: string) {
  const result = await db.select().from(schema.lessonProgress).where(eq(schema.lessonProgress.id, id)).limit(1);
  return result[0] || null;
}

export async function findLessonProgress(lessonId: string, studentId: string) {
  const result = await db.select()
    .from(schema.lessonProgress)
    .where(and(eq(schema.lessonProgress.lessonId, lessonId), eq(schema.lessonProgress.studentId, studentId)))
    .limit(1);
  return result[0] || null;
}

export async function listLessonProgressByStudent(studentId: string, limit = 50, offset = 0) {
  return db.select()
    .from(schema.lessonProgress)
    .where(eq(schema.lessonProgress.studentId, studentId))
    .limit(limit)
    .offset(offset);
}

export async function createLessonProgress(data: typeof schema.lessonProgress.$inferInsert) {
  const result = await db.insert(schema.lessonProgress).values(data).returning();
  return result[0];
}

export async function updateLessonProgress(id: string, data: Partial<typeof schema.lessonProgress.$inferInsert>) {
  const result = await db.update(schema.lessonProgress)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.lessonProgress.id, id))
    .returning();
  return result[0];
}

export async function deleteLessonProgress(id: string) {
  const result = await db.delete(schema.lessonProgress).where(eq(schema.lessonProgress.id, id)).returning();
  return result[0];
}

// Resource operations
export async function findResourceById(id: string) {
  const result = await db.select().from(schema.resources).where(eq(schema.resources.id, id)).limit(1);
  return result[0] || null;
}

export async function listResourcesByLesson(lessonId: string, limit = 50, offset = 0) {
  return db.select()
    .from(schema.resources)
    .where(eq(schema.resources.lessonId, lessonId))
    .orderBy(schema.resources.order)
    .limit(limit)
    .offset(offset);
}

export async function listResourcesByCourse(courseId: string, limit = 50, offset = 0) {
  return db.select()
    .from(schema.resources)
    .where(eq(schema.resources.courseId, courseId))
    .orderBy(schema.resources.order)
    .limit(limit)
    .offset(offset);
}

export async function createResource(data: typeof schema.resources.$inferInsert) {
  const result = await db.insert(schema.resources).values(data).returning();
  return result[0];
}

export async function updateResource(id: string, data: Partial<typeof schema.resources.$inferInsert>) {
  const result = await db.update(schema.resources)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.resources.id, id))
    .returning();
  return result[0];
}

export async function deleteResource(id: string) {
  const result = await db.delete(schema.resources).where(eq(schema.resources.id, id)).returning();
  return result[0];
}

import { eq, and, desc, isNull, sql } from 'drizzle-orm';

// Content Version operations
export async function createContentVersion(data: {
  lessonId: string;
  version: number;
  title: string;
  content?: any;
  createdBy: string;
}) {
  const result = await db.insert(schema.contentVersions).values({
    id: crypto.randomUUID(),
    lessonId: data.lessonId,
    version: data.version,
    title: data.title,
    content: data.content,
    createdBy: data.createdBy,
  }).returning();
  return result[0];
}

export async function listContentVersionsByLesson(lessonId: string) {
  return db.select()
    .from(schema.contentVersions)
    .where(eq(schema.contentVersions.lessonId, lessonId))
    .orderBy(desc(schema.contentVersions.version));
}

export async function findContentVersion(lessonId: string, version: number) {
  const result = await db.select()
    .from(schema.contentVersions)
    .where(and(
      eq(schema.contentVersions.lessonId, lessonId),
      eq(schema.contentVersions.version, version)
    ));
  return result[0] || null;
}

// Media File operations
export async function createMediaFile(data: {
  id: string;
  lessonId?: string;
  courseId: string;
  uploadedBy: string;
  type: string;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  duration?: string;
  dimensions?: string;
  thumbnailUrl?: string;
  isPublic?: boolean;
}) {
  // No permanent public URL is persisted; access URLs are signed per request.
  const result = await db.insert(schema.mediaFiles).values({
    id: data.id,
    lessonId: data.lessonId,
    courseId: data.courseId,
    uploadedBy: data.uploadedBy,
    type: data.type,
    title: data.title,
    description: data.description,
    fileName: data.fileName,
    fileSize: data.fileSize,
    mimeType: data.mimeType,
    storageKey: data.storageKey,
    duration: data.duration,
    dimensions: data.dimensions,
    thumbnailUrl: data.thumbnailUrl,
    isPublic: data.isPublic || false,
  }).returning();
  return result[0];
}

export async function findMediaFileById(id: string) {
  const result = await db
    .select()
    .from(schema.mediaFiles)
    .where(and(eq(schema.mediaFiles.id, id), isNull(schema.mediaFiles.deletedAt)));
  return result[0] || null;
}

export async function listMediaFilesByLesson(
  lessonId: string,
  limit = 50,
  offset = 0,
) {
  return db
    .select()
    .from(schema.mediaFiles)
    .where(and(
      eq(schema.mediaFiles.lessonId, lessonId),
      isNull(schema.mediaFiles.deletedAt)
    ))
    .orderBy(desc(schema.mediaFiles.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function listMediaFilesByCourse(
  courseId: string,
  limit = 50,
  offset = 0,
) {
  return db
    .select()
    .from(schema.mediaFiles)
    .where(and(
      eq(schema.mediaFiles.courseId, courseId),
      isNull(schema.mediaFiles.deletedAt)
    ))
    .orderBy(desc(schema.mediaFiles.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function incrementMediaDownloadCount(id: string) {
  const [row] = await db
    .update(schema.mediaFiles)
    .set({ downloadCount: sql`${schema.mediaFiles.downloadCount} + 1` })
    .where(eq(schema.mediaFiles.id, id))
    .returning();
  return row;
}

/** Soft delete: media rows are retained so grade and audit history stays intact. */
export async function deleteMediaFile(id: string) {
  const result = await db
    .update(schema.mediaFiles)
    .set({ deletedAt: new Date() })
    .where(eq(schema.mediaFiles.id, id))
    .returning();
  return result[0];
}
