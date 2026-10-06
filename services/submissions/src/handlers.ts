import { Request, Response } from 'express';
import { submissionSchema } from '@edunet/validation';
import {
  findCourseById,
  findAssignmentById,
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

function requireOrganizationId(req: AuthRequest, res: Response): string | null {
  const organizationId = req.user?.organizationId;
  if (!organizationId) {
    res.status(403).json({ error: 'An organization-scoped account is required' });
    return null;
  }
  return organizationId;
}

export async function createSubmissionHandler(req: AuthRequest, res: Response) {
  try {
    const organizationId = requireOrganizationId(req, res);
    if (!organizationId) return;

    const { assignmentId, content } = submissionSchema.parse(req.body);
    const { studentId } = req.body;

    if (!req.user?.id || (studentId && req.user.id !== studentId)) {
      return res.status(403).json({ error: 'Students can only submit their own work' });
    }

    const existing = await findSubmission(assignmentId, req.user.id, organizationId);
    if (existing) {
      return res.status(409).json({ error: 'Already submitted this assignment' });
    }

    const submission = await createSubmission({
      assignmentId,
      studentId: req.user.id,
      organizationId,
      content,
    });
    res.status(201).json(submission);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function getSubmissionHandler(req: AuthRequest, res: Response) {
  try {
    const organizationId = requireOrganizationId(req, res);
    if (!organizationId) return;

    const { id } = req.params;
    const submission = await findSubmissionById(id, organizationId);

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
    const organizationId = requireOrganizationId(req, res);
    if (!organizationId) return;

    const { assignmentId, studentId } = req.query;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    let result;
    if (req.user?.role === 'student') {
      if (studentId && typeof studentId === 'string' && req.user.id !== studentId) {
        return res.status(403).json({ error: 'You can only view your own submissions' });
      }
      if (assignmentId && typeof assignmentId === 'string') {
        const submission = await findSubmission(assignmentId, req.user.id, organizationId);
        result = submission ? [submission] : [];
      } else {
        result = await listSubmissionsByStudent(req.user.id, organizationId, limit, offset);
      }
    } else if (studentId && typeof studentId === 'string') {
      result = await listSubmissionsByStudent(studentId, organizationId, limit, offset);
    } else if (assignmentId && typeof assignmentId === 'string') {
      const assignment = await findAssignmentById(assignmentId, organizationId);
      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }
      result = await listSubmissionsByAssignment(assignmentId, organizationId, limit, offset);
    } else {
      return res.status(400).json({ error: 'assignmentId or studentId is required' });
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function gradeSubmissionHandler(req: AuthRequest, res: Response) {
  try {
    const organizationId = requireOrganizationId(req, res);
    if (!organizationId) return;

    const { id } = req.params;
    const grade = req.body?.grade;
    const feedback = req.body?.feedback;
    if (!Number.isSafeInteger(grade) || grade < 0) {
      return res.status(400).json({ error: 'grade must be a non-negative whole number' });
    }
    if (feedback !== undefined && (typeof feedback !== 'string' || feedback.length > 5000)) {
      return res.status(400).json({ error: 'feedback must be at most 5000 characters' });
    }

    const existing = await findSubmissionById(id, organizationId);
    if (!existing) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const assignment = await findAssignmentById(existing.assignmentId, organizationId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    if (grade > assignment.maxPoints) {
      return res.status(400).json({ error: 'Grade cannot exceed the assignment maximum points' });
    }

    const course = await findCourseById(assignment.courseId, organizationId);
    if (req.user?.role !== 'admin' && course?.teacherId !== req.user?.id) {
      return res.status(403).json({ error: 'You can only grade submissions for your own courses' });
    }

    const submission = await gradeSubmission(id, organizationId, grade, req.user!.id, feedback);
    res.json(submission);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function deleteSubmissionHandler(req: AuthRequest, res: Response) {
  try {
    const organizationId = requireOrganizationId(req, res);
    if (!organizationId) return;

    const { id } = req.params;

    const existing = await findSubmissionById(id, organizationId);
    if (!existing) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (req.user?.role === 'student' && existing.studentId !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own submissions' });
    }

    const submission = await deleteSubmission(id, organizationId);
    res.json(submission);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
