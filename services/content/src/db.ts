import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { courses, users } from '@edunet/database';
import { eq, and, or, desc, isNull, sql, inArray } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/edunet';
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
const scopedCourseIds = (organizationId: string) => db.select({ id: courses.id }).from(courses).where(eq(courses.organizationId, organizationId));
const scopedLessonIds = (organizationId: string) => db.select({ id: schema.lessons.id }).from(schema.lessons).where(inArray(schema.lessons.courseId, scopedCourseIds(organizationId)));
export async function findCourseById(id: string, organizationId: string) {
  const [course] = await db.select().from(courses).where(and(eq(courses.id, id), eq(courses.organizationId, organizationId))).limit(1);
  return course ?? null;
}
export async function closeDb() { await client.end(); }

// Lesson operations
export async function findLessonById(id: string, organizationId: string) {
  const result = await db.select().from(schema.lessons).where(and(eq(schema.lessons.id, id), inArray(schema.lessons.courseId, scopedCourseIds(organizationId)))).limit(1);
  return result[0] || null;
}

export async function listLessonsByCourse(courseId: string, organizationId: string, limit = 100, offset = 0) {
  return db.select()
    .from(schema.lessons)
    .where(and(eq(schema.lessons.courseId, courseId), inArray(schema.lessons.courseId, scopedCourseIds(organizationId))))
    .orderBy(schema.lessons.order)
    .limit(limit)
    .offset(offset);
}

export async function createLesson(data: typeof schema.lessons.$inferInsert, organizationId: string) {
  if (!await findCourseById(data.courseId!, organizationId)) throw new Error('Course not found');
  const result = await db.insert(schema.lessons).values(data).returning();
  return result[0];
}

export async function updateLesson(id: string, organizationId: string, data: Partial<typeof schema.lessons.$inferInsert>) {
  const { courseId: _ignoredCourseId, ...safeData } = data;
  const result = await db.update(schema.lessons)
    .set({ ...safeData, updatedAt: new Date() })
    .where(and(eq(schema.lessons.id, id), inArray(schema.lessons.courseId, scopedCourseIds(organizationId))))
    .returning();
  return result[0];
}

export async function deleteLesson(id: string, organizationId: string) {
  const result = await db.delete(schema.lessons).where(and(eq(schema.lessons.id, id), inArray(schema.lessons.courseId, scopedCourseIds(organizationId)))).returning();
  return result[0];
}

// Lesson Progress operations
const scopedProgress = (organizationId: string) => and(inArray(schema.lessonProgress.lessonId, scopedLessonIds(organizationId)), inArray(schema.lessonProgress.studentId, db.select({id: users.id}).from(users).where(eq(users.organizationId, organizationId))));
export async function findLessonProgressById(id: string, organizationId: string) {
  const result = await db.select().from(schema.lessonProgress).where(and(eq(schema.lessonProgress.id, id), scopedProgress(organizationId))).limit(1);
  return result[0] || null;
}

export async function findLessonProgress(lessonId: string, studentId: string, organizationId: string) {
  const result = await db.select()
    .from(schema.lessonProgress)
    .where(and(eq(schema.lessonProgress.lessonId, lessonId), eq(schema.lessonProgress.studentId, studentId), scopedProgress(organizationId)))
    .limit(1);
  return result[0] || null;
}

export async function listLessonProgressByStudent(studentId: string, organizationId: string, limit = 50, offset = 0) {
  return db.select()
    .from(schema.lessonProgress)
    .where(and(eq(schema.lessonProgress.studentId, studentId), scopedProgress(organizationId)))
    .limit(limit)
    .offset(offset);
}

export async function createLessonProgress(data: typeof schema.lessonProgress.$inferInsert, organizationId: string) {
  if (!await findLessonById(data.lessonId!, organizationId)) throw new Error('Lesson not found');
  const [student] = await db.select({id: users.id}).from(users).where(and(eq(users.id, data.studentId!), eq(users.organizationId, organizationId))).limit(1);
  if (!student) throw new Error('Student not found');
  const result = await db.insert(schema.lessonProgress).values(data).returning();
  return result[0];
}

export async function updateLessonProgress(id: string, organizationId: string, data: Partial<typeof schema.lessonProgress.$inferInsert>) {
  const { lessonId: _ignoredLessonId, studentId: _ignoredStudentId, ...safeData } = data;
  const result = await db.update(schema.lessonProgress)
    .set({ ...safeData, updatedAt: new Date() })
    .where(and(eq(schema.lessonProgress.id, id), scopedProgress(organizationId)))
    .returning();
  return result[0];
}

export async function deleteLessonProgress(id: string, organizationId: string) {
  const result = await db.delete(schema.lessonProgress).where(and(eq(schema.lessonProgress.id, id), scopedProgress(organizationId))).returning();
  return result[0];
}

// Resource operations
export async function findResourceById(id: string, organizationId: string) {
  const result = await db.select().from(schema.resources).where(and(eq(schema.resources.id, id), or(inArray(schema.resources.courseId, scopedCourseIds(organizationId)), inArray(schema.resources.lessonId, scopedLessonIds(organizationId))))).limit(1);
  return result[0] || null;
}

export async function listResourcesByLesson(lessonId: string, organizationId: string, limit = 50, offset = 0) {
  return db.select()
    .from(schema.resources)
    .where(and(eq(schema.resources.lessonId, lessonId), inArray(schema.resources.lessonId, scopedLessonIds(organizationId))))
    .orderBy(schema.resources.order)
    .limit(limit)
    .offset(offset);
}

export async function listResourcesByCourse(courseId: string, organizationId: string, limit = 50, offset = 0) {
  return db.select()
    .from(schema.resources)
    .where(and(eq(schema.resources.courseId, courseId), inArray(schema.resources.courseId, scopedCourseIds(organizationId))))
    .orderBy(schema.resources.order)
    .limit(limit)
    .offset(offset);
}

export async function createResource(data: typeof schema.resources.$inferInsert, organizationId: string) {
  if (!data.courseId && !data.lessonId) throw new Error('Resource must belong to a course or lesson');
  if (data.courseId && !await findCourseById(data.courseId, organizationId)) throw new Error('Course not found');
  if (data.lessonId) {
    const lesson = await findLessonById(data.lessonId, organizationId);
    if (!lesson) throw new Error('Lesson not found');
    if (data.courseId && lesson.courseId !== data.courseId) throw new Error('Lesson and course must match');
  }
  const result = await db.insert(schema.resources).values(data).returning();
  return result[0];
}

export async function updateResource(id: string, organizationId: string, data: Partial<typeof schema.resources.$inferInsert>) {
  const { courseId: _ignoredCourseId, lessonId: _ignoredLessonId, ...safeData } = data;
  const result = await db.update(schema.resources)
    .set({ ...safeData, updatedAt: new Date() })
    .where(and(eq(schema.resources.id, id), or(inArray(schema.resources.courseId, scopedCourseIds(organizationId)), inArray(schema.resources.lessonId, scopedLessonIds(organizationId)))))
    .returning();
  return result[0];
}

export async function deleteResource(id: string, organizationId: string) {
  const result = await db.delete(schema.resources).where(and(eq(schema.resources.id, id), or(inArray(schema.resources.courseId, scopedCourseIds(organizationId)), inArray(schema.resources.lessonId, scopedLessonIds(organizationId))))).returning();
  return result[0];
}


// Content Version operations
export async function createContentVersion(data: {
  lessonId: string;
  version: number;
  title: string;
  content?: any;
  createdBy: string;
}, organizationId: string) {
  if (!await findLessonById(data.lessonId, organizationId)) throw new Error('Lesson not found');
  const [creator] = await db.select({ id: users.id }).from(users).where(and(eq(users.id, data.createdBy), eq(users.organizationId, organizationId))).limit(1);
  if (!creator) throw new Error('Creator not found');
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

export async function listContentVersionsByLesson(lessonId: string, organizationId: string) {
  return db.select()
    .from(schema.contentVersions)
    .where(and(eq(schema.contentVersions.lessonId, lessonId), inArray(schema.contentVersions.lessonId, scopedLessonIds(organizationId))))
    .orderBy(desc(schema.contentVersions.version));
}

export async function findContentVersion(lessonId: string, version: number, organizationId: string) {
  const result = await db.select()
    .from(schema.contentVersions)
    .where(and(
      eq(schema.contentVersions.lessonId, lessonId),
      eq(schema.contentVersions.version, version),
      inArray(schema.contentVersions.lessonId, scopedLessonIds(organizationId))
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
}, organizationId: string) {
  const course = await findCourseById(data.courseId, organizationId);
  if (!course) throw new Error('Course not found');
  const [uploader] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, data.uploadedBy), eq(users.organizationId, organizationId)))
    .limit(1);
  if (!uploader) throw new Error('Uploader not found');
  if (data.lessonId) {
    const lesson = await findLessonById(data.lessonId, organizationId);
    if (!lesson || lesson.courseId !== data.courseId) throw new Error('Lesson and course must match');
  }
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

export async function findMediaFileById(id: string, organizationId: string) {
  const result = await db
    .select()
    .from(schema.mediaFiles)
    .where(and(eq(schema.mediaFiles.id, id), inArray(schema.mediaFiles.courseId, scopedCourseIds(organizationId)), isNull(schema.mediaFiles.deletedAt)));
  return result[0] || null;
}

export async function listMediaFilesByLesson(
  lessonId: string,
  organizationId: string,
  limit = 50,
  offset = 0,
) {
  return db
    .select()
    .from(schema.mediaFiles)
    .where(and(
      eq(schema.mediaFiles.lessonId, lessonId),
      inArray(schema.mediaFiles.courseId, scopedCourseIds(organizationId)),
      isNull(schema.mediaFiles.deletedAt)
    ))
    .orderBy(desc(schema.mediaFiles.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function listMediaFilesByCourse(
  courseId: string,
  organizationId: string,
  limit = 50,
  offset = 0,
) {
  return db
    .select()
    .from(schema.mediaFiles)
    .where(and(
      eq(schema.mediaFiles.courseId, courseId),
      inArray(schema.mediaFiles.courseId, scopedCourseIds(organizationId)),
      isNull(schema.mediaFiles.deletedAt)
    ))
    .orderBy(desc(schema.mediaFiles.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function incrementMediaDownloadCount(id: string, organizationId: string) {
  const [row] = await db
    .update(schema.mediaFiles)
    .set({ downloadCount: sql`${schema.mediaFiles.downloadCount} + 1` })
    .where(and(eq(schema.mediaFiles.id, id), inArray(schema.mediaFiles.courseId, scopedCourseIds(organizationId))))
    .returning();
  return row;
}

/** Soft delete: media rows are retained so grade and audit history stays intact. */
export async function deleteMediaFile(id: string, organizationId: string) {
  const result = await db
    .update(schema.mediaFiles)
    .set({ deletedAt: new Date() })
    .where(and(eq(schema.mediaFiles.id, id), inArray(schema.mediaFiles.courseId, scopedCourseIds(organizationId))))
    .returning();
  return result[0];
}
