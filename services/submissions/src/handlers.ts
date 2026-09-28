import { Request, Response } from 'express';
import { findCourseById, findAssignmentById } from '@edunet/database';
import {
  findSubmissionById,
  findSubmission,
  listSubmissionsByAssignment,
  listSubmissionsByStudent,
  createSubmission,
  gradeSubmission,
  deleteSubmission,
} from './db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    organizationId?: string;
  };
}

export async function createSubmissionHandler(req: AuthRequest, res: Response) {
  try {
    const { assignmentId, studentId, content } = req.body;
    
    if (!assignmentId || !studentId || !content) {
      return res.status(400).json({ error: 'assignmentId, studentId, and content are required' });
    }

    if (req.user?.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({ error: 'Students can only submit their own work' });
    }

    const existing = await findSubmission(assignmentId, studentId);
    if (existing) {
      return res.status(409).json({ error: 'Already submitted this assignment' });
    }

    const submission = await createSubmission({ assignmentId, studentId, content });
    res.status(201).json(submission);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function getSubmissionHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const submission = await findSubmissionById(id);
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (req.user?.role === 'student' && submission.studentId !== req.user.id) {
      return res.status(403).json({ error: 'You can only view your own submissions' });
    }
    
    res.json(submission);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function listSubmissionsHandler(req: AuthRequest, res: Response) {
  try {
    const { assignmentId, studentId } = req.query;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    let submissions;
    if (studentId && typeof studentId === 'string') {
      if (req.user?.role === 'student' && req.user.id !== studentId) {
        return res.status(403).json({ error: 'You can only view your own submissions' });
      }
      submissions = await listSubmissionsByStudent(studentId, limit, offset);
    } else if (assignmentId && typeof assignmentId === 'string') {
      submissions = await listSubmissionsByAssignment(assignmentId, limit, offset);
    } else {
      return res.status(400).json({ error: 'assignmentId or studentId is required' });
    }
    
    res.json(submissions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function gradeSubmissionHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { grade, feedback } = req.body;

    if (grade === undefined) {
      return res.status(400).json({ error: 'grade is required' });
    }

    const existing = await findSubmissionById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const assignment = await findAssignmentById(existing.assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const course = await findCourseById(assignment.courseId);
    if (req.user?.role !== 'admin' && course?.teacherId !== req.user?.id) {
      return res.status(403).json({ error: 'You can only grade submissions for your own courses' });
    }

    const submission = await gradeSubmission(id, grade, req.user.id, feedback);
    res.json(submission);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function deleteSubmissionHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    
    const existing = await findSubmissionById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (req.user?.role === 'student' && existing.studentId !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own submissions' });
    }

    const submission = await deleteSubmission(id);
    res.json(submission);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
