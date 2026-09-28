import { Request, Response } from 'express';
import { assignmentSchema } from '@edunet/validation';
import { findCourseById } from '@edunet/database';
import {
  findAssignmentById,
  listAssignmentsByCourse,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentSubmissionCount,
} from './db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    organizationId?: string;
  };
}

export async function createAssignmentHandler(req: AuthRequest, res: Response) {
  try {
    const data = assignmentSchema.parse(req.body);
    const assignment = await createAssignment({
      ...data,
      dueDate: new Date(data.dueDate),
    });
    res.status(201).json(assignment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function getAssignmentHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const assignment = await findAssignmentById(id);
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    const submissionCount = await getAssignmentSubmissionCount(id);
    res.json({ ...assignment, submissionCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function listAssignmentsHandler(req: AuthRequest, res: Response) {
  try {
    const { courseId } = req.query;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    if (!courseId || typeof courseId !== 'string') {
      return res.status(400).json({ error: 'courseId is required' });
    }
    
    const assignments = await listAssignmentsByCourse(courseId, limit, offset);
    res.json(assignments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateAssignmentHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = assignmentSchema.partial().parse(req.body);

    const existing = await findAssignmentById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const course = await findCourseById(existing.courseId);
    if (req.user?.role !== 'admin' && course?.teacherId !== req.user?.id) {
      return res.status(403).json({ error: 'You can only edit assignments for your own courses' });
    }

    const assignment = await updateAssignment(id, {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    });
    res.json(assignment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function deleteAssignmentHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const existing = await findAssignmentById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const course = await findCourseById(existing.courseId);
    if (req.user?.role !== 'admin' && course?.teacherId !== req.user?.id) {
      return res.status(403).json({ error: 'You can only delete assignments for your own courses' });
    }

    const assignment = await deleteAssignment(id);
    res.json(assignment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
