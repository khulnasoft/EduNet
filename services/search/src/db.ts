import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { courses, users, assignments, organizations } from '@edunet/database';
import { eq, or, and, ilike, sql, desc, asc } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/edunet';
const client = postgres(connectionString);
export const db = drizzle(client);

function buildSearchCondition(column: any, query: string) {
  return ilike(column, `%${query}%`);
}

export async function searchCourses(
  query: string,
  organizationId?: string,
  limit = 20,
  offset = 0,
  sortBy: 'title' | 'createdAt' | 'enrollmentCount' = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  const conditions = [
    buildSearchCondition(courses.title, query),
    buildSearchCondition(courses.description, query),
    buildSearchCondition(courses.subject, query),
  ];

  if (organizationId) {
    conditions.push(eq(courses.organizationId, organizationId));
  }

  const sortColumn = sortBy === 'title' ? courses.title : courses.createdAt;
  const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  return db.select()
    .from(courses)
    .where(and(
      eq(courses.isActive, true),
      or(...conditions)
    ))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
}

export async function searchUsers(
  query: string,
  organizationId?: string,
  role?: string,
  limit = 20,
  offset = 0,
  sortBy: 'name' | 'email' | 'createdAt' = 'name',
  sortOrder: 'asc' | 'desc' = 'asc'
) {
  const conditions = [
    buildSearchCondition(users.firstName, query),
    buildSearchCondition(users.lastName, query),
    buildSearchCondition(users.email, query),
  ];

  if (organizationId) {
    conditions.push(eq(users.organizationId, organizationId));
  }

  if (role) {
    conditions.push(eq(users.role, role));
  }

  const sortColumn = sortBy === 'email' ? users.email : sortBy === 'createdAt' ? users.createdAt : users.firstName;
  const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  return db.select({
    id: users.id,
    firstName: users.firstName,
    lastName: users.lastName,
    email: users.email,
    role: users.role,
    organizationId: users.organizationId,
    isVerified: users.isVerified,
  })
    .from(users)
    .where(or(...conditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
}

export async function searchAssignments(
  query: string,
  organizationId?: string,
  limit = 20,
  offset = 0,
  sortBy: 'title' | 'dueDate' | 'createdAt' = 'dueDate',
  sortOrder: 'asc' | 'desc' = 'asc'
) {
  const conditions = [
    buildSearchCondition(assignments.title, query),
    buildSearchCondition(assignments.description, query),
  ];

  const courseConditions = [];
  if (organizationId) {
    courseConditions.push(eq(courses.organizationId, organizationId));
  }

  const sortColumn = sortBy === 'title' ? assignments.title : sortBy === 'createdAt' ? assignments.createdAt : assignments.dueDate;
  const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  return db.select({
    id: assignments.id,
    title: assignments.title,
    description: assignments.description,
    dueDate: assignments.dueDate,
    maxPoints: assignments.maxPoints,
    courseId: assignments.courseId,
  })
    .from(assignments)
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .where(and(
      eq(assignments.isActive, true),
      or(...conditions),
      ...courseConditions
    ))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
}

export async function searchOrganizations(
  query: string,
  limit = 20,
  offset = 0,
  sortBy: 'name' | 'createdAt' = 'name',
  sortOrder: 'asc' | 'desc' = 'asc'
) {
  const sortColumn = sortBy === 'createdAt' ? organizations.createdAt : organizations.name;
  const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  return db.select()
    .from(organizations)
    .where(and(
      eq(organizations.isActive, true),
      or(
        buildSearchCondition(organizations.name, query),
        buildSearchCondition(organizations.code, query)
      )
    ))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
}

export async function globalSearch(
  query: string,
  organizationId?: string,
  limit = 10,
  sortBy: 'relevance' | 'createdAt' = 'relevance',
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  const coursesResult = await searchCourses(query, organizationId, limit, 0, 'createdAt', sortOrder);
  const usersResult = await searchUsers(query, organizationId, undefined, limit, 0, 'name', 'asc');
  const assignmentsResult = await searchAssignments(query, organizationId, limit, 0, 'dueDate', 'asc');

  return {
    courses: coursesResult,
    users: usersResult,
    assignments: assignmentsResult,
  };
}
