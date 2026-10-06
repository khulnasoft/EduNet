import { drizzle } from 'drizzle-orm/postgres-js';
import { courses, enrollments, users } from '@edunet/database';
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

export async function findEnrollmentById(id: string, organizationId: string) {
  const db = getDb();
  const result = await db
    .select({ enrollment: enrollments })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .innerJoin(users, eq(enrollments.studentId, users.id))
    .where(
      and(
        eq(enrollments.id, id),
        eq(courses.organizationId, organizationId),
        eq(users.organizationId, organizationId)
      )
    );
  return result[0]?.enrollment || null;
}

export async function findEnrollment(studentId: string, courseId: string, organizationId: string) {
  const db = getDb();
  const result = await db
    .select({ enrollment: enrollments })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .innerJoin(users, eq(enrollments.studentId, users.id))
    .where(
      and(
        eq(enrollments.studentId, studentId),
        eq(enrollments.courseId, courseId),
        eq(courses.organizationId, organizationId),
        eq(users.organizationId, organizationId)
      )
    );
  return result[0]?.enrollment || null;
}

export async function listEnrollmentsByStudent(
  studentId: string,
  organizationId: string,
  limit = 50,
  offset = 0
) {
  const db = getDb();
  const result = await db
    .select({ enrollment: enrollments })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .innerJoin(users, eq(enrollments.studentId, users.id))
    .where(
      and(
        eq(enrollments.studentId, studentId),
        eq(courses.organizationId, organizationId),
        eq(users.organizationId, organizationId)
      )
    )
    .limit(limit)
    .offset(offset);
  return result.map(({ enrollment }) => enrollment);
}

export async function listEnrollmentsByCourse(
  courseId: string,
  organizationId: string,
  limit = 50,
  offset = 0
) {
  const db = getDb();
  const result = await db
    .select({ enrollment: enrollments })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .innerJoin(users, eq(enrollments.studentId, users.id))
    .where(
      and(
        eq(enrollments.courseId, courseId),
        eq(courses.organizationId, organizationId),
        eq(users.organizationId, organizationId)
      )
    )
    .limit(limit)
    .offset(offset);
  return result.map(({ enrollment }) => enrollment);
}

export async function createEnrollment(data: {
  studentId: string;
  courseId: string;
  organizationId: string;
}) {
  const db = getDb();
  const [validTargets] = await db
    .select({ studentId: users.id })
    .from(users)
    .innerJoin(courses, eq(courses.organizationId, users.organizationId))
    .where(
      and(
        eq(users.id, data.studentId),
        eq(users.role, 'student'),
        eq(users.organizationId, data.organizationId),
        eq(courses.id, data.courseId),
        eq(courses.organizationId, data.organizationId)
      )
    )
    .limit(1);
  if (!validTargets) {
    throw new Error('Student and course must belong to the authenticated organization');
  }

  const [enrollment] = await db
    .insert(enrollments)
    .values({
      id: crypto.randomUUID(),
      studentId: data.studentId,
      courseId: data.courseId,
      enrolledAt: new Date(),
      status: 'active',
    })
    .returning();
  return enrollment;
}

export async function updateEnrollmentStatus(
  id: string,
  organizationId: string,
  status: 'active' | 'completed' | 'dropped'
) {
  const db = getDb();
  const [enrollment] = await db
    .update(enrollments)
    .set({ status })
    .where(
      and(
        eq(enrollments.id, id),
        inArray(
          enrollments.courseId,
          db
            .select({ id: courses.id })
            .from(courses)
            .innerJoin(users, eq(enrollments.studentId, users.id))
            .where(
              and(
                eq(courses.organizationId, organizationId),
                eq(users.organizationId, organizationId)
              )
            )
        )
      )
    )
    .returning();
  return enrollment;
}

export async function deleteEnrollment(id: string, organizationId: string) {
  const db = getDb();
  const [enrollment] = await db
    .delete(enrollments)
    .where(
      and(
        eq(enrollments.id, id),
        inArray(
          enrollments.courseId,
          db
            .select({ id: courses.id })
            .from(courses)
            .innerJoin(users, eq(enrollments.studentId, users.id))
            .where(
              and(
                eq(courses.organizationId, organizationId),
                eq(users.organizationId, organizationId)
              )
            )
        )
      )
    )
    .returning();
  return enrollment;
}
