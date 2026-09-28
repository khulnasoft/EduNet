import { drizzle } from 'drizzle-orm/postgres-js';
import { submissions } from '@edunet/database';
import { eq, and } from 'drizzle-orm';
import postgres from 'postgres';

let client: postgres.Sql | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL || 
      `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
    
    client = postgres(connectionString);
    db = drizzle(client);
  }
  return db;
}

export async function findSubmissionById(id: string) {
  const db = getDb();
  const result = await db.select().from(submissions).where(eq(submissions.id, id));
  return result[0] || null;
}

export async function findSubmission(assignmentId: string, studentId: string) {
  const db = getDb();
  const result = await db.select().from(submissions).where(
    and(eq(submissions.assignmentId, assignmentId), eq(submissions.studentId, studentId))
  );
  return result[0] || null;
}

export async function listSubmissionsByAssignment(assignmentId: string, limit = 50, offset = 0) {
  const db = getDb();
  return db.select().from(submissions).where(eq(submissions.assignmentId, assignmentId)).limit(limit).offset(offset);
}

export async function listSubmissionsByStudent(studentId: string, limit = 50, offset = 0) {
  const db = getDb();
  return db.select().from(submissions).where(eq(submissions.studentId, studentId)).limit(limit).offset(offset);
}

export async function createSubmission(data: {
  assignmentId: string;
  studentId: string;
  content: string;
}) {
  const db = getDb();
  const [submission] = await db.insert(submissions).values({
    id: crypto.randomUUID(),
    assignmentId: data.assignmentId,
    studentId: data.studentId,
    content: data.content,
    submittedAt: new Date(),
  }).returning();
  return submission;
}

export async function gradeSubmission(id: string, grade: number, gradedBy: string, feedback?: string) {
  const db = getDb();
  const [submission] = await db
    .update(submissions)
    .set({
      grade,
      gradedBy,
      gradedAt: new Date(),
      feedback: feedback || null,
    })
    .where(eq(submissions.id, id))
    .returning();
  return submission;
}

export async function deleteSubmission(id: string) {
  const db = getDb();
  const [submission] = await db.delete(submissions).where(eq(submissions.id, id)).returning();
  return submission;
}
