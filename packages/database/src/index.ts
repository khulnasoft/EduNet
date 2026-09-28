import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import * as schema from './schema';

export * from './schema';

const connectionString = process.env.DATABASE_URL ||
  `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const client = postgres(connectionString);
const db = drizzle(client, { schema });

export async function findCourseById(id: string) {
  const result = await db.select().from(schema.courses).where(eq(schema.courses.id, id));
  return result[0] || null;
}

export async function findAssignmentById(id: string) {
  const result = await db.select().from(schema.assignments).where(eq(schema.assignments.id, id));
  return result[0] || null;
}

export async function findSubmissionById(id: string) {
  const result = await db.select().from(schema.submissions).where(eq(schema.submissions.id, id));
  return result[0] || null;
}

export async function findUserById(id: string) {
  const result = await db.select().from(schema.users).where(eq(schema.users.id, id));
  return result[0] || null;
}

export async function findOrganizationById(id: string) {
  const result = await db.select().from(schema.organizations).where(eq(schema.organizations.id, id));
  return result[0] || null;
}

export { db };
