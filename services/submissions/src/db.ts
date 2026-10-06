import { drizzle } from 'drizzle-orm/postgres-js';
import { assignments, courses, submissions, users } from '@edunet/database';
import { eq, and, inArray } from 'drizzle-orm';
import postgres from 'postgres';

let client: postgres.Sql | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!db) {
    const connectionString =
      process.env.DATABASE_URL ||
      `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

    client = postgres(connectionString);
    db = drizzle(client);
  }
  return db;
}

export async function closeDb(): Promise<void> {
  if (client) {
    const activeClient = client;
    client = null;
    db = null;
    await activeClient.end();
  }
}

export async function findCourseById(id: string, organizationId: string) {
  const db = getDb();
  const result = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, id), eq(courses.organizationId, organizationId)));
  return result[0] || null;
}

export async function findAssignmentById(id: string, organizationId: string) {
  const db = getDb();
  const result = await db
    .select({ assignment: assignments })
    .from(assignments)
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .where(and(eq(assignments.id, id), eq(courses.organizationId, organizationId)));
  return result[0]?.assignment || null;
}

export async function findSubmissionById(id: string, organizationId: string) {
  const db = getDb();
  const result = await db
    .select({ submission: submissions })
    .from(submissions)
    .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .where(and(eq(submissions.id, id), eq(courses.organizationId, organizationId)));
  return result[0]?.submission || null;
}

export async function findSubmission(
  assignmentId: string,
  studentId: string,
  organizationId: string
) {
  const db = getDb();
  const result = await db
    .select({ submission: submissions })
    .from(submissions)
    .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .where(
      and(
        eq(submissions.assignmentId, assignmentId),
        eq(submissions.studentId, studentId),
        eq(courses.organizationId, organizationId)
      )
    );
  return result[0]?.submission || null;
}

export async function listSubmissionsByAssignment(
  assignmentId: string,
  organizationId: string,
  limit = 50,
  offset = 0
) {
  const db = getDb();
  const result = await db
    .select({ submission: submissions })
    .from(submissions)
    .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .where(
      and(eq(submissions.assignmentId, assignmentId), eq(courses.organizationId, organizationId))
    )
    .limit(limit)
    .offset(offset);
  return result.map(({ submission }) => submission);
}

export async function listSubmissionsByStudent(
  studentId: string,
  organizationId: string,
  limit = 50,
  offset = 0
) {
  const db = getDb();
  const result = await db
    .select({ submission: submissions })
    .from(submissions)
    .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .where(and(eq(submissions.studentId, studentId), eq(courses.organizationId, organizationId)))
    .limit(limit)
    .offset(offset);
  return result.map(({ submission }) => submission);
}

export async function createSubmission(data: {
  assignmentId: string;
  studentId: string;
  organizationId: string;
  content: string;
}) {
  const db = getDb();
  const [validTarget] = await db
    .select({ assignmentId: assignments.id })
    .from(assignments)
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .innerJoin(users, eq(users.id, data.studentId))
    .where(
      and(
        eq(assignments.id, data.assignmentId),
        eq(courses.organizationId, data.organizationId),
        eq(users.organizationId, data.organizationId),
        eq(users.role, 'student')
      )
    )
    .limit(1);
  if (!validTarget) {
    throw new Error('Assignment and student must belong to the authenticated organization');
  }

  const [submission] = await db
    .insert(submissions)
    .values({
      id: crypto.randomUUID(),
      assignmentId: data.assignmentId,
      studentId: data.studentId,
      content: data.content,
      submittedAt: new Date(),
    })
    .returning();
  return submission;
}

export async function gradeSubmission(
  id: string,
  organizationId: string,
  grade: number,
  gradedBy: string,
  feedback?: string
) {
  const db = getDb();
  const [submission] = await db
    .update(submissions)
    .set({
      grade,
      gradedBy,
      gradedAt: new Date(),
      feedback: feedback || null,
    })
    .where(
      and(
        eq(submissions.id, id),
        inArray(
          submissions.assignmentId,
          db
            .select({ id: assignments.id })
            .from(assignments)
            .innerJoin(courses, eq(assignments.courseId, courses.id))
            .where(eq(courses.organizationId, organizationId))
        )
      )
    )
    .returning();
  return submission;
}

export async function deleteSubmission(id: string, organizationId: string) {
  const db = getDb();
  const [submission] = await db
    .delete(submissions)
    .where(
      and(
        eq(submissions.id, id),
        inArray(
          submissions.assignmentId,
          db
            .select({ id: assignments.id })
            .from(assignments)
            .innerJoin(courses, eq(assignments.courseId, courses.id))
            .where(eq(courses.organizationId, organizationId))
        )
      )
    )
    .returning();
  return submission;
}
