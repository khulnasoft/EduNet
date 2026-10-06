import { Request, Response } from 'express';
import { courseSchema } from '@edunet/validation';
import {
  findCourseById,
  listCoursesByOrganization,
  listCoursesByTeacher,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseEnrollmentCount,
} from './db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    organizationId?: string;
  };
}

function requireOrganizationId(req: AuthRequest, res: Response): string | null {
  const organizationId = req.user?.organizationId;
  if (!organizationId) {
    res.status(403).json({ error: 'An organization-scoped account is required' });
    return null;
  }
  return organizationId;
}

export async function createCourseHandler(req: AuthRequest, res: Response) {
  try {
    const organizationId = requireOrganizationId(req, res);
    if (!organizationId) return;

    const data = courseSchema.parse(req.body);

    const teacherId = req.user?.role === 'teacher' ? req.user.id : data.teacherId;
    const course = await createCourse({ ...data, organizationId, teacherId });
    res.status(201).json(course);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function getCourseHandler(req: AuthRequest, res: Response) {
  try {
    const organizationId = requireOrganizationId(req, res);
    if (!organizationId) return;

    const { id } = req.params;
    const course = await findCourseById(id, organizationId);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const enrollmentCount = await getCourseEnrollmentCount(id, organizationId);
    res.json({ ...course, enrollmentCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function listCoursesHandler(req: AuthRequest, res: Response) {
  try {
    const organizationId = requireOrganizationId(req, res);
    if (!organizationId) return;

    const { teacherId } = req.query;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    let courses;
    if (teacherId && typeof teacherId === 'string') {
      courses = await listCoursesByTeacher(organizationId, teacherId, limit, offset);
    } else {
      courses = await listCoursesByOrganization(organizationId, limit, offset);
    }

    res.json(courses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateCourseHandler(req: AuthRequest, res: Response) {
  try {
    const organizationId = requireOrganizationId(req, res);
    if (!organizationId) return;

    const { id } = req.params;
    const data = courseSchema.partial().parse(req.body);

    const existing = await findCourseById(id, organizationId);
    if (!existing) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (req.user?.role !== 'admin' && existing.teacherId !== req.user?.id) {
      return res.status(403).json({ error: 'You can only edit your own courses' });
    }

    const course = await updateCourse(id, organizationId, data);
    res.json(course);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function deleteCourseHandler(req: AuthRequest, res: Response) {
  try {
    const organizationId = requireOrganizationId(req, res);
    if (!organizationId) return;

    const { id } = req.params;

    const existing = await findCourseById(id, organizationId);
    if (!existing) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (req.user?.role !== 'admin' && existing.teacherId !== req.user?.id) {
      return res.status(403).json({ error: 'You can only delete your own courses' });
    }

    const course = await deleteCourse(id, organizationId);
    res.json(course);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function publishCourseHandler(req: AuthRequest, res: Response) {
  try {
    const organizationId = requireOrganizationId(req, res);
    if (!organizationId) return;

    const { id } = req.params;

    const existing = await findCourseById(id, organizationId);
    if (!existing) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (req.user?.role !== 'admin' && existing.teacherId !== req.user?.id) {
      return res.status(403).json({ error: 'You can only publish your own courses' });
    }

    const course = await updateCourse(id, organizationId, { isActive: true });
    res.json(course);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function unpublishCourseHandler(req: AuthRequest, res: Response) {
  try {
    const organizationId = requireOrganizationId(req, res);
    if (!organizationId) return;

    const { id } = req.params;

    const existing = await findCourseById(id, organizationId);
    if (!existing) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (req.user?.role !== 'admin' && existing.teacherId !== req.user?.id) {
      return res.status(403).json({ error: 'You can only unpublish your own courses' });
    }

    const course = await updateCourse(id, organizationId, { isActive: false });
    res.json(course);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
