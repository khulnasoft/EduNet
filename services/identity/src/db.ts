import { drizzle } from 'drizzle-orm/postgres-js';
import { users, organizations } from '@edunet/database';
import { eq } from 'drizzle-orm';
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

export async function closeDb(): Promise<void> {
  if (client) {
    const activeClient = client;
    client = null;
    db = null;
    await activeClient.end();
  }
}

export async function findUserByEmail(email: string) {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0] || null;
}

export async function findUserById(id: string) {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0] || null;
}

export async function findOrganizationByCode(code: string) {
  const db = getDb();
  const result = await db.select().from(organizations).where(eq(organizations.code, code));
  return result[0] || null;
}

export async function createUser(data: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
}) {
  const db = getDb();
  const [user] = await db.insert(users).values({
    id: crypto.randomUUID(),
    email: data.email,
    passwordHash: data.passwordHash,
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role as any,
    organizationId: data.organizationId,
    isVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  return user;
}
