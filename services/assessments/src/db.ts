import { and, eq, inArray } from 'drizzle-orm';
import { courses, users, resolveConnectionString } from '@edunet/database';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

type AssessmentDb = ReturnType<typeof drizzle<typeof schema>>;

let client: postgres.Sql | null = null;
let database: AssessmentDb | null = null;

export function getDb(): AssessmentDb {
  if (!database) {
    client = postgres(resolveConnectionString());
    database = drizzle(client, { schema });
  }
  return database;
}

export async function closeDb(): Promise<void> {
  if (client) {
    const activeClient = client;
    client = null;
    database = null;
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

export async function findQuizById(id: string, organizationId: string) {
  const db = getDb();
  const result = await db
    .select({ quiz: schema.quizzes })
    .from(schema.quizzes)
    .innerJoin(courses, eq(schema.quizzes.courseId, courses.id))
    .where(and(eq(schema.quizzes.id, id), eq(courses.organizationId, organizationId)));
  return result[0]?.quiz || null;
}

export async function listQuizzesByCourse(
  courseId: string,
  organizationId: string,
  limit = 50,
  offset = 0
) {
  const db = getDb();
  const result = await db
    .select({ quiz: schema.quizzes })
    .from(schema.quizzes)
    .innerJoin(courses, eq(schema.quizzes.courseId, courses.id))
    .where(and(eq(schema.quizzes.courseId, courseId), eq(courses.organizationId, organizationId)))
    .limit(limit)
    .offset(offset);
  return result.map(({ quiz }) => quiz);
}

export async function createQuiz(data: typeof schema.quizzes.$inferInsert, organizationId: string) {
  const db = getDb();
  const course = await findCourseById(data.courseId!, organizationId);
  if (!course) throw new Error('Course not found in the authenticated organization');
  const result = await db.insert(schema.quizzes).values(data).returning();
  return result[0];
}

export async function updateQuiz(
  id: string,
  organizationId: string,
  data: Partial<typeof schema.quizzes.$inferInsert>
) {
  const db = getDb();
  const result = await db
    .update(schema.quizzes)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(schema.quizzes.id, id),
        inArray(
          schema.quizzes.courseId,
          db
            .select({ id: courses.id })
            .from(courses)
            .where(eq(courses.organizationId, organizationId))
        )
      )
    )
    .returning();
  return result[0];
}

export async function deleteQuiz(id: string, organizationId: string) {
  const db = getDb();
  const result = await db
    .delete(schema.quizzes)
    .where(
      and(
        eq(schema.quizzes.id, id),
        inArray(
          schema.quizzes.courseId,
          db
            .select({ id: courses.id })
            .from(courses)
            .where(eq(courses.organizationId, organizationId))
        )
      )
    )
    .returning();
  return result[0];
}

export async function findQuestionById(id: string, organizationId: string) {
  const db = getDb();
  const result = await db
    .select({ question: schema.questions })
    .from(schema.questions)
    .innerJoin(schema.quizzes, eq(schema.questions.quizId, schema.quizzes.id))
    .innerJoin(courses, eq(schema.quizzes.courseId, courses.id))
    .where(and(eq(schema.questions.id, id), eq(courses.organizationId, organizationId)));
  return result[0]?.question || null;
}

export async function listQuestionsByQuiz(
  quizId: string,
  organizationId: string,
  limit = 100,
  offset = 0
) {
  const db = getDb();
  const result = await db
    .select({ question: schema.questions })
    .from(schema.questions)
    .innerJoin(schema.quizzes, eq(schema.questions.quizId, schema.quizzes.id))
    .innerJoin(courses, eq(schema.quizzes.courseId, courses.id))
    .where(and(eq(schema.questions.quizId, quizId), eq(courses.organizationId, organizationId)))
    .orderBy(schema.questions.order)
    .limit(limit)
    .offset(offset);
  return result.map(({ question }) => question);
}

export async function createQuestion(
  data: typeof schema.questions.$inferInsert,
  organizationId: string
) {
  const db = getDb();
  const quiz = await findQuizById(data.quizId!, organizationId);
  if (!quiz) throw new Error('Quiz not found in the authenticated organization');
  const result = await db.insert(schema.questions).values(data).returning();
  return result[0];
}

export async function updateQuestion(
  id: string,
  organizationId: string,
  data: Partial<typeof schema.questions.$inferInsert>
) {
  const db = getDb();
  const result = await db
    .update(schema.questions)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(schema.questions.id, id),
        inArray(
          schema.questions.quizId,
          db
            .select({ id: schema.quizzes.id })
            .from(schema.quizzes)
            .innerJoin(courses, eq(schema.quizzes.courseId, courses.id))
            .where(eq(courses.organizationId, organizationId))
        )
      )
    )
    .returning();
  return result[0];
}

export async function deleteQuestion(id: string, organizationId: string) {
  const db = getDb();
  const result = await db
    .delete(schema.questions)
    .where(
      and(
        eq(schema.questions.id, id),
        inArray(
          schema.questions.quizId,
          db
            .select({ id: schema.quizzes.id })
            .from(schema.quizzes)
            .innerJoin(courses, eq(schema.quizzes.courseId, courses.id))
            .where(eq(courses.organizationId, organizationId))
        )
      )
    )
    .returning();
  return result[0];
}

export async function findQuizAttemptById(id: string, organizationId: string) {
  const db = getDb();
  const result = await db
    .select({ attempt: schema.quizAttempts })
    .from(schema.quizAttempts)
    .innerJoin(schema.quizzes, eq(schema.quizAttempts.quizId, schema.quizzes.id))
    .innerJoin(courses, eq(schema.quizzes.courseId, courses.id))
    .innerJoin(users, eq(schema.quizAttempts.studentId, users.id))
    .where(
      and(
        eq(schema.quizAttempts.id, id),
        eq(courses.organizationId, organizationId),
        eq(users.organizationId, organizationId)
      )
    );
  return result[0]?.attempt || null;
}

export async function listQuizAttemptsByStudent(
  studentId: string,
  organizationId: string,
  limit = 50,
  offset = 0
) {
  const db = getDb();
  const result = await db
    .select({ attempt: schema.quizAttempts })
    .from(schema.quizAttempts)
    .innerJoin(schema.quizzes, eq(schema.quizAttempts.quizId, schema.quizzes.id))
    .innerJoin(courses, eq(schema.quizzes.courseId, courses.id))
    .innerJoin(users, eq(schema.quizAttempts.studentId, users.id))
    .where(
      and(
        eq(schema.quizAttempts.studentId, studentId),
        eq(courses.organizationId, organizationId),
        eq(users.organizationId, organizationId)
      )
    )
    .orderBy(schema.quizAttempts.startedAt)
    .limit(limit)
    .offset(offset);
  return result.map(({ attempt }) => attempt);
}

export async function listQuizAttemptsByQuiz(
  quizId: string,
  organizationId: string,
  limit = 50,
  offset = 0
) {
  const db = getDb();
  const result = await db
    .select({ attempt: schema.quizAttempts })
    .from(schema.quizAttempts)
    .innerJoin(schema.quizzes, eq(schema.quizAttempts.quizId, schema.quizzes.id))
    .innerJoin(courses, eq(schema.quizzes.courseId, courses.id))
    .innerJoin(users, eq(schema.quizAttempts.studentId, users.id))
    .where(
      and(
        eq(schema.quizAttempts.quizId, quizId),
        eq(courses.organizationId, organizationId),
        eq(users.organizationId, organizationId)
      )
    )
    .orderBy(schema.quizAttempts.startedAt)
    .limit(limit)
    .offset(offset);
  return result.map(({ attempt }) => attempt);
}

export async function createQuizAttempt(
  data: typeof schema.quizAttempts.$inferInsert,
  organizationId: string
) {
  const db = getDb();
  const [target] = await db
    .select({ quizId: schema.quizzes.id })
    .from(schema.quizzes)
    .innerJoin(courses, eq(schema.quizzes.courseId, courses.id))
    .innerJoin(users, eq(users.organizationId, courses.organizationId))
    .where(
      and(
        eq(schema.quizzes.id, data.quizId!),
        eq(courses.organizationId, organizationId),
        eq(users.id, data.studentId!),
        eq(users.role, 'student')
      )
    )
    .limit(1);
  if (!target) throw new Error('Quiz and student must belong to the authenticated organization');
  const result = await db.insert(schema.quizAttempts).values(data).returning();
  return result[0];
}

export async function updateQuizAttempt(
  id: string,
  organizationId: string,
  data: Partial<typeof schema.quizAttempts.$inferInsert>
) {
  const db = getDb();
  const result = await db
    .update(schema.quizAttempts)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(schema.quizAttempts.id, id),
        inArray(
          schema.quizAttempts.quizId,
          db
            .select({ id: schema.quizzes.id })
            .from(schema.quizzes)
            .innerJoin(courses, eq(schema.quizzes.courseId, courses.id))
            .innerJoin(users, eq(users.organizationId, courses.organizationId))
            .where(
              and(
                eq(courses.organizationId, organizationId),
                eq(users.id, schema.quizAttempts.studentId)
              )
            )
        )
      )
    )
    .returning();
  return result[0];
}

export async function deleteQuizAttempt(id: string, organizationId: string) {
  const db = getDb();
  const result = await db
    .delete(schema.quizAttempts)
    .where(
      and(
        eq(schema.quizAttempts.id, id),
        inArray(
          schema.quizAttempts.quizId,
          db
            .select({ id: schema.quizzes.id })
            .from(schema.quizzes)
            .innerJoin(courses, eq(schema.quizzes.courseId, courses.id))
            .innerJoin(users, eq(users.organizationId, courses.organizationId))
            .where(
              and(
                eq(courses.organizationId, organizationId),
                eq(users.id, schema.quizAttempts.studentId)
              )
            )
        )
      )
    )
    .returning();
  return result[0];
}
