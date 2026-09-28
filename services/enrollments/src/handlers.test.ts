import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createEnrollmentHandler, getEnrollmentHandler, deleteEnrollmentHandler } from './handlers';

vi.mock('./db', () => ({
  findEnrollmentById: vi.fn(),
  findEnrollment: vi.fn(),
  listEnrollmentsByStudent: vi.fn(),
  listEnrollmentsByCourse: vi.fn(),
  createEnrollment: vi.fn(),
  updateEnrollmentStatus: vi.fn(),
  deleteEnrollment: vi.fn(),
}));

describe('Enrollment Handlers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = 'test-secret-key';
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('createEnrollmentHandler', () => {
    it('should create enrollment for self', async () => {
      const mockEnrollment = { id: 'enroll-1', studentId: 'student-1', courseId: 'course-1' };
      const { createEnrollment, findEnrollment } = await import('./db');
      (findEnrollment as any).mockResolvedValue(null);
      (createEnrollment as any).mockResolvedValue(mockEnrollment);

      const req: any = {
        body: { studentId: 'student-1', courseId: 'course-1' },
        user: { id: 'student-1', role: 'student' },
      };
      const res: any = {
        statusCode: 200,
        body: undefined,
        status(code: number) { this.statusCode = code; return this; },
        json(data: any) { this.body = data; return this; },
      };

      await createEnrollmentHandler(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(mockEnrollment);
    });

    it('should reject student enrolling another student', async () => {
      const req: any = {
        body: { studentId: 'student-2', courseId: 'course-1' },
        user: { id: 'student-1', role: 'student' },
      };
      const res: any = {
        statusCode: 200,
        body: undefined,
        status(code: number) { this.statusCode = code; return this; },
        json(data: any) { this.body = data; return this; },
      };

      await createEnrollmentHandler(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Students can only enroll themselves');
    });

    it('should reject duplicate enrollment', async () => {
      const { findEnrollment } = await import('./db');
      (findEnrollment as any).mockResolvedValue({ id: 'existing' });

      const req: any = {
        body: { studentId: 'student-1', courseId: 'course-1' },
        user: { id: 'student-1', role: 'student' },
      };
      const res: any = {
        statusCode: 200,
        body: undefined,
        status(code: number) { this.statusCode = code; return this; },
        json(data: any) { this.body = data; return this; },
      };

      await createEnrollmentHandler(req, res);

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toBe('Already enrolled in this course');
    });

    it('should allow admin to enroll any student', async () => {
      const mockEnrollment = { id: 'enroll-1', studentId: 'student-2', courseId: 'course-1' };
      const { createEnrollment, findEnrollment } = await import('./db');
      (findEnrollment as any).mockResolvedValue(null);
      (createEnrollment as any).mockResolvedValue(mockEnrollment);

      const req: any = {
        body: { studentId: 'student-2', courseId: 'course-1' },
        user: { id: 'admin-1', role: 'admin' },
      };
      const res: any = {
        statusCode: 200,
        body: undefined,
        status(code: number) { this.statusCode = code; return this; },
        json(data: any) { this.body = data; return this; },
      };

      await createEnrollmentHandler(req, res);

      expect(res.statusCode).toBe(201);
    });
  });

  describe('getEnrollmentHandler', () => {
    it('should return enrollment for owner', async () => {
      const mockEnrollment = { id: 'enroll-1', studentId: 'student-1', courseId: 'course-1' };
      const { findEnrollmentById } = await import('./db');
      (findEnrollmentById as any).mockResolvedValue(mockEnrollment);

      const req: any = {
        params: { id: 'enroll-1' },
        user: { id: 'student-1', role: 'student' },
      };
      const res: any = {
        statusCode: 200,
        body: undefined,
        status(code: number) { this.statusCode = code; return this; },
        json(data: any) { this.body = data; return this; },
      };

      await getEnrollmentHandler(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockEnrollment);
    });

    it('should reject viewing another student\'s enrollment', async () => {
      const mockEnrollment = { id: 'enroll-1', studentId: 'student-2', courseId: 'course-1' };
      const { findEnrollmentById } = await import('./db');
      (findEnrollmentById as any).mockResolvedValue(mockEnrollment);

      const req: any = {
        params: { id: 'enroll-1' },
        user: { id: 'student-1', role: 'student' },
      };
      const res: any = {
        statusCode: 200,
        body: undefined,
        status(code: number) { this.statusCode = code; return this; },
        json(data: any) { this.body = data; return this; },
      };

      await getEnrollmentHandler(req, res);

      expect(res.statusCode).toBe(403);
    });
  });
});
