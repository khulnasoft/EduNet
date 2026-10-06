import { Request, Response } from 'express';
import { findCourseById } from './db';
import {
  findLessonById,
  listLessonsByCourse,
  createLesson,
  updateLesson,
  deleteLesson,
  findLessonProgressById,
  findLessonProgress,
  listLessonProgressByStudent,
  createLessonProgress,
  updateLessonProgress,
  deleteLessonProgress,
  findResourceById,
  listResourcesByLesson,
  listResourcesByCourse,
  createResource,
  updateResource,
  deleteResource,
} from './db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    organizationId?: string;
  };
}

// Lesson handlers
export async function createLessonHandler(req: AuthRequest, res: Response) {
  const organizationId = req.user?.organizationId;
  if (!organizationId) return res.status(403).json({ error: 'Organization context required' });
  try {
    const { courseId, title, type, content, order } = req.body;

    if (!courseId || !title || !type || order === undefined) {
      return res.status(400).json({ error: 'courseId, title, type, and order are required' });
    }

    const course = await findCourseById(courseId, organizationId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (req.user?.role !== 'admin' && course.teacherId !== req.user?.id) {
      return res.status(403).json({ error: 'You can only add content to your own courses' });
    }

    const lesson = await createLesson({
      courseId,
      title,
      description: req.body.description,
      type,
      content,
      order,
      duration: req.body.duration,
      isPublished: req.body.isPublished || 'false',
    }, organizationId);

    res.status(201).json(lesson);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function getLessonHandler(req: AuthRequest, res: Response) {
  const organizationId = req.user?.organizationId;
  if (!organizationId) return res.status(403).json({ error: 'Organization context required' });
  try {
    const { id } = req.params;
    const lesson = await findLessonById(id, organizationId);
    
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    
    res.json(lesson);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function listLessonsHandler(req: AuthRequest, res: Response) {
  const organizationId = req.user?.organizationId;
  if (!organizationId) return res.status(403).json({ error: 'Organization context required' });
  try {
    const { courseId } = req.query;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    
    if (!courseId || typeof courseId !== 'string') {
      return res.status(400).json({ error: 'courseId is required' });
    }
    
    const lessons = await listLessonsByCourse(courseId, organizationId, limit, offset);
    res.json(lessons);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateLessonHandler(req: AuthRequest, res: Response) {
  const organizationId = req.user?.organizationId;
  if (!organizationId) return res.status(403).json({ error: 'Organization context required' });
  try {
    const { id } = req.params;
    const data = req.body ?? {};

    const existing = await findLessonById(id, organizationId);
    if (!existing) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const course = await findCourseById(existing.courseId, organizationId);
    if (req.user?.role !== 'admin' && course?.teacherId !== req.user?.id) {
      return res.status(403).json({ error: 'You can only edit content for your own courses' });
    }

    const lesson = await updateLesson(id, organizationId, {
      title: data.title, description: data.description, type: data.type, content: data.content,
      order: data.order, duration: data.duration, isPublished: data.isPublished,
      publishedAt: data.isPublished === 'true' && !existing.publishedAt ? new Date() : undefined,
    });

    res.json(lesson);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function deleteLessonHandler(req: AuthRequest, res: Response) {
  const organizationId = req.user?.organizationId;
  if (!organizationId) return res.status(403).json({ error: 'Organization context required' });
  try {
    const { id } = req.params;

    const existing = await findLessonById(id, organizationId);
    if (!existing) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const course = await findCourseById(existing.courseId, organizationId);
    if (req.user?.role !== 'admin' && course?.teacherId !== req.user?.id) {
      return res.status(403).json({ error: 'You can only delete content for your own courses' });
    }

    const lesson = await deleteLesson(id, organizationId);
    res.json(lesson);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Lesson Progress handlers
export async function createLessonProgressHandler(req: AuthRequest, res: Response) {
  const organizationId = req.user?.organizationId;
  if (!organizationId) return res.status(403).json({ error: 'Organization context required' });
  try {
    const { lessonId, studentId, status, progress } = req.body;
    
    if (!lessonId || !studentId || !status) {
      return res.status(400).json({ error: 'lessonId, studentId, and status are required' });
    }

    if (req.user?.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({ error: 'Students can only track their own progress' });
    }

    const existing = await findLessonProgress(lessonId, studentId, organizationId);
    const values = {
      status,
      progress: progress || '0',
      timeSpent: req.body.timeSpent,
      lastAccessedAt: new Date(),
      completedAt: status === 'completed' ? new Date() : undefined,
    };
    const progressRecord = existing
      ? await updateLessonProgress(existing.id, organizationId, values)
      : await createLessonProgress({ lessonId, studentId, ...values }, organizationId);

    res.status(existing ? 200 : 201).json(progressRecord);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function getLessonProgressHandler(req: AuthRequest, res: Response) {
  const organizationId = req.user?.organizationId;
  if (!organizationId) return res.status(403).json({ error: 'Organization context required' });
  try {
    const { id } = req.params;
    const progress = await findLessonProgressById(id, organizationId);
    
    if (!progress) {
      return res.status(404).json({ error: 'Lesson progress not found' });
    }

    if (req.user?.role === 'student' && progress.studentId !== req.user.id) {
      return res.status(403).json({ error: 'You can only view your own progress' });
    }
    
    res.json(progress);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function listLessonProgressHandler(req: AuthRequest, res: Response) {
  const organizationId = req.user?.organizationId;
  if (!organizationId) return res.status(403).json({ error: 'Organization context required' });
  try {
    const { studentId } = req.query;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    if (!studentId || typeof studentId !== 'string') {
      return res.status(400).json({ error: 'studentId is required' });
    }

    if (req.user?.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({ error: 'You can only view your own progress' });
    }
    
    const progressList = await listLessonProgressByStudent(studentId, organizationId, limit, offset);
    res.json(progressList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateLessonProgressHandler(req: AuthRequest, res: Response) {
  const organizationId = req.user?.organizationId;
  if (!organizationId) return res.status(403).json({ error: 'Organization context required' });
  try {
    const { id } = req.params;
    const { status, progress, timeSpent } = req.body;
    
    const existing = await findLessonProgressById(id, organizationId);
    if (!existing) {
      return res.status(404).json({ error: 'Lesson progress not found' });
    }

    if (req.user?.role === 'student' && existing.studentId !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own progress' });
    }

    const progressRecord = await updateLessonProgress(id, organizationId, {
      status,
      progress,
      timeSpent,
      completedAt: status === 'completed' && !existing.completedAt ? new Date() : undefined,
      lastAccessedAt: new Date(),
    });
    
    res.json(progressRecord);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function deleteLessonProgressHandler(req: AuthRequest, res: Response) {
  const organizationId = req.user?.organizationId;
  if (!organizationId) return res.status(403).json({ error: 'Organization context required' });
  try {
    const { id } = req.params;
    
    const existing = await findLessonProgressById(id, organizationId);
    if (!existing) {
      return res.status(404).json({ error: 'Lesson progress not found' });
    }

    if (req.user?.role === 'student' && existing.studentId !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own progress' });
    }

    const progressRecord = await deleteLessonProgress(id, organizationId);
    res.json(progressRecord);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Resource handlers
export async function createResourceHandler(req: AuthRequest, res: Response) {
  const organizationId = req.user?.organizationId;
  if (!organizationId) return res.status(403).json({ error: 'Organization context required' });
  try {
    const { title, type, url, courseId } = req.body;

    if (!title || !type || !url) {
      return res.status(400).json({ error: 'title, type, and url are required' });
    }

    if (courseId) {
      const course = await findCourseById(courseId, organizationId);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }
      if (req.user?.role !== 'admin' && course.teacherId !== req.user?.id) {
        return res.status(403).json({ error: 'You can only add resources to your own courses' });
      }
    }

    const resource = await createResource({
      lessonId: req.body.lessonId,
      courseId: req.body.courseId,
      title,
      type,
      url,
      size: req.body.size,
      mimeType: req.body.mimeType,
      description: req.body.description,
      order: req.body.order,
      isDownloadable: req.body.isDownloadable || 'true',
    }, organizationId);

    res.status(201).json(resource);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function getResourceHandler(req: AuthRequest, res: Response) {
  const organizationId = req.user?.organizationId;
  if (!organizationId) return res.status(403).json({ error: 'Organization context required' });
  try {
    const { id } = req.params;
    const resource = await findResourceById(id, organizationId);
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    res.json(resource);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function listResourcesHandler(req: AuthRequest, res: Response) {
  const organizationId = req.user?.organizationId;
  if (!organizationId) return res.status(403).json({ error: 'Organization context required' });
  try {
    const { lessonId, courseId } = req.query;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    let resources;
    if (lessonId && typeof lessonId === 'string') {
      resources = await listResourcesByLesson(lessonId, organizationId, limit, offset);
    } else if (courseId && typeof courseId === 'string') {
      resources = await listResourcesByCourse(courseId, organizationId, limit, offset);
    } else {
      return res.status(400).json({ error: 'lessonId or courseId is required' });
    }
    
    res.json(resources);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateResourceHandler(req: AuthRequest, res: Response) {
  const organizationId = req.user?.organizationId;
  if (!organizationId) return res.status(403).json({ error: 'Organization context required' });
  try {
    const { id } = req.params;
    const input = req.body ?? {};

    const existing = await findResourceById(id, organizationId);
    if (!existing) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    if (existing.courseId) {
      const course = await findCourseById(existing.courseId, organizationId);
      if (req.user?.role !== 'admin' && course?.teacherId !== req.user?.id) {
        return res.status(403).json({ error: 'You can only edit resources for your own courses' });
      }
    }

    const resource = await updateResource(id, organizationId, {
      title: input.title, type: input.type, url: input.url, size: input.size,
      mimeType: input.mimeType, description: input.description, order: input.order,
      isDownloadable: input.isDownloadable,
    });
    res.json(resource);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function deleteResourceHandler(req: AuthRequest, res: Response) {
  const organizationId = req.user?.organizationId;
  if (!organizationId) return res.status(403).json({ error: 'Organization context required' });
  try {
    const { id } = req.params;

    const existing = await findResourceById(id, organizationId);
    if (!existing) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    if (existing.courseId) {
      const course = await findCourseById(existing.courseId, organizationId);
      if (req.user?.role !== 'admin' && course?.teacherId !== req.user?.id) {
        return res.status(403).json({ error: 'You can only delete resources for your own courses' });
      }
    }

    const resource = await deleteResource(id, organizationId);
    res.json(resource);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
