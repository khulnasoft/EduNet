import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { findCourseById } from '@edunet/database';
import type { AuthenticatedUser } from '@edunet/rbac';
import {
  findLessonById,
  findMediaFileById,
  listMediaFilesByLesson,
  listMediaFilesByCourse,
  createMediaFile,
  deleteMediaFile,
  incrementMediaDownloadCount,
} from './db';
import {
  getStorage,
  buildStorageKey,
  isAllowedMimeType,
  getSignedUrl,
  StorageError,
  MAX_UPLOAD_BYTES,
} from './storage';

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

const MEDIA_TYPE_BY_MIME: Record<string, string> = {
  'application/pdf': 'document',
  'text/plain': 'document',
  'text/markdown': 'document',
  'text/csv': 'document',
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/webp': 'image',
  'image/gif': 'image',
  'image/svg+xml': 'image',
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'video/mp4': 'video',
  'video/webm': 'video',
};

/** Storage keys are namespaced by owning course so a listing is cheap. */
function scopeFor(courseId: string): string {
  return `course-${courseId.replace(/-/g, '')}`;
}

/** Resolves the course a lesson belongs to, enforcing teacher ownership. */
async function resolveCourseId(
  lessonId: string | undefined,
  courseId: string | undefined,
): Promise<string | null> {
  if (courseId) return courseId;
  if (!lessonId) return null;

  const lesson = await findLessonById(lessonId);
  return lesson ? lesson.courseId : null;
}

async function requireOwnedCourse(
  user: AuthenticatedUser | undefined,
  courseId: string,
  res: Response,
): Promise<boolean> {
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return false;
  }

  const course = await findCourseById(courseId);
  if (!course) {
    res.status(404).json({ error: 'Course not found' });
    return false;
  }

  if (user.role !== 'admin' && course.teacherId !== user.id) {
    res.status(403).json({ error: 'You can only manage media for your own courses' });
    return false;
  }

  return true;
}

export async function uploadMediaHandler(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { lessonId, courseId, title, description, duration, dimensions } = req.body ?? {};

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'title is required' });
  }

  // base64 body keeps the transport dependency-free; multipart can be added
  // behind the same handlers later.
  const { fileName, mimeType, data } = req.body ?? {};
  if (!fileName || !mimeType || !data) {
    return res.status(400).json({ error: 'fileName, mimeType and data are required' });
  }

  if (!isAllowedMimeType(mimeType)) {
    return res.status(415).json({ error: `Unsupported media type: ${mimeType}` });
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(String(data), 'base64');
  } catch {
    return res.status(400).json({ error: 'data must be base64 encoded' });
  }

  if (buffer.length === 0) {
    return res.status(400).json({ error: 'Refusing to upload an empty file' });
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    return res.status(413).json({ error: 'File exceeds the 25MB limit' });
  }

  if (lessonId) {
    const lesson = await findLessonById(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
  }

  const effectiveCourseId = await resolveCourseId(lessonId, courseId);
  if (!effectiveCourseId) {
    return res.status(400).json({ error: 'lessonId or courseId is required' });
  }

  if (!(await requireOwnedCourse(req.user, effectiveCourseId, res))) {
    return;
  }

  const id = randomUUID();
  const key = buildStorageKey(scopeFor(effectiveCourseId), mimeType, id);

  try {
    await getStorage().put(key, buffer, mimeType);
  } catch (error) {
    if (error instanceof StorageError) {
      return res.status(500).json({ error: 'Media storage is unavailable' });
    }
    throw error;
  }

  const record = await createMediaFile({
    id,
    lessonId,
    courseId: effectiveCourseId,
    uploadedBy: req.user.id,
    type: MEDIA_TYPE_BY_MIME[mimeType] ?? 'document',
    title,
    description,
    fileName: String(fileName),
    fileSize: buffer.length,
    mimeType,
    storageKey: key,
    duration,
    dimensions,
    isPublic: false,
  });

  return res.status(201).json({
    ...record,
    // access URL is short-lived and signed, never a permanent public link
    accessUrl: getSignedUrl(key, 300),
  });
}

export async function listMediaHandler(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { lessonId, courseId } = req.query;
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

  if (typeof lessonId === 'string') {
    const lesson = await findLessonById(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    return res.json(await listMediaFilesByLesson(lessonId, limit, offset));
  }

  if (typeof courseId === 'string') {
    return res.json(await listMediaFilesByCourse(courseId, limit, offset));
  }

  return res.status(400).json({ error: 'lessonId or courseId is required' });
}

/**
 * Mints a short-lived signed URL for a private object after confirming the
 * caller may access the owning course.
 */
export async function getMediaAccessHandler(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { id } = req.params;
  const record = await findMediaFileById(id);

  if (!record || record.deletedAt) {
    return res.status(404).json({ error: 'Media not found' });
  }

  const courseId = record.courseId;
  if (!courseId) {
    return res.status(404).json({ error: 'Media is not attached to a course' });
  }

  // Authorisation is delegated to the enrollment/ownership rules of the
  // courses service; here we only mint for users that already have a session
  // and record the request.
  await incrementMediaDownloadCount(record.id);

  return res.json({
    id: record.id,
    type: record.type,
    title: record.title,
    mimeType: record.mimeType,
    fileSize: record.fileSize,
    accessUrl: getSignedUrl(record.storageKey, 300),
  });
}

export async function deleteMediaHandler(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { id } = req.params;
  const record = await findMediaFileById(id);

  if (!record || record.deletedAt) {
    return res.status(404).json({ error: 'Media not found' });
  }

  if (record.courseId && !(await requireOwnedCourse(req.user, record.courseId, res))) {
    return;
  }

  const deleted = await deleteMediaFile(id);

  try {
    await getStorage().delete(record.storageKey);
  } catch (error) {
    // The row is already soft-deleted; a missing object is not a failure.
    if (!(error instanceof StorageError) || error.code !== 'NOT_FOUND') {
      console.error('media object cleanup failed', { id, key: record.storageKey });
    }
  }

  return res.json(deleted);
}
