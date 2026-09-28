# EduNet API Endpoints

## Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | None | Register new user |
| POST | `/login` | None | Login and get tokens |
| POST | `/refresh` | None | Refresh access token |
| GET | `/me` | Bearer | Get current user profile |

## Organizations (`/api/organizations`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Admin | Create organization |
| GET | `/` | Any | List organizations |
| GET | `/:id` | Any | Get organization |
| PUT | `/:id` | Admin | Update organization |

## Users (`/api/users`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Admin/Teacher | List users |
| GET | `/:id` | Any | Get user |
| PUT | `/:id` | Admin | Update user |
| PUT | `/:id/password` | Any | Update password |
| PUT | `/:id/verify` | Admin | Verify user |
| DELETE | `/:id` | Admin | Delete user |

## Courses (`/api/courses`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Teacher/Admin | Create course |
| GET | `/` | Any | List courses |
| GET | `/:id` | Any | Get course |
| PUT | `/:id` | Teacher/Admin | Update course |
| DELETE | `/:id` | Teacher/Admin | Delete course |

## Enrollments (`/api/enrollments`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Student/Admin | Create enrollment |
| GET | `/` | Any | List enrollments |
| GET | `/:id` | Any | Get enrollment |
| PUT | `/:id` | Teacher/Admin | Update enrollment |
| DELETE | `/:id` | Student/Admin | Delete enrollment |

## Assignments (`/api/assignments`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Teacher/Admin | Create assignment |
| GET | `/` | Any | List assignments |
| GET | `/:id` | Any | Get assignment |
| PUT | `/:id` | Teacher/Admin | Update assignment |
| DELETE | `/:id` | Teacher/Admin | Delete assignment |

## Submissions (`/api/submissions`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Student | Create submission |
| GET | `/` | Any | List submissions |
| GET | `/:id` | Any | Get submission |
| PUT | `/:id/grade` | Teacher/Admin | Grade submission |
| DELETE | `/:id` | Student/Admin | Delete submission |

## Content (`/api/content`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/lessons` | Teacher/Admin | Create lesson |
| GET | `/lessons` | Any | List lessons |
| GET | `/lessons/:id` | Any | Get lesson |
| PUT | `/lessons/:id` | Teacher/Admin | Update lesson |
| DELETE | `/lessons/:id` | Teacher/Admin | Delete lesson |
| POST | `/lesson-progress` | Any | Create progress |
| GET | `/lesson-progress` | Any | List progress |
| POST | `/resources` | Teacher/Admin | Create resource |
| GET | `/resources` | Any | List resources |

## Assessments (`/api/assessments`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/quizzes` | Teacher/Admin | Create quiz |
| GET | `/quizzes` | Any | List quizzes |
| GET | `/quizzes/:id` | Any | Get quiz |
| POST | `/questions` | Teacher/Admin | Create question |
| GET | `/questions` | Any | List questions |
| POST | `/quiz-attempts` | Student | Start attempt |
| GET | `/quiz-attempts` | Any | List attempts |
| PUT | `/quiz-attempts/:id/submit` | Student | Submit attempt |

## Parents (`/api/parents`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/relationships` | Parent/Admin | Create relationship |
| GET | `/children` | Parent | List children |
| GET | `/children/:childId/enrollments` | Parent/Admin | Child enrollments |
| GET | `/children/:childId/submissions` | Parent/Admin | Child submissions |

## Notifications (`/api/notifications`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/notifications` | Admin | Create notification |
| GET | `/notifications` | Any | List notifications |
| PUT | `/notifications/:id/read` | Any | Mark as read |
| PUT | `/notifications/read-all` | Any | Mark all as read |
| GET | `/preferences` | Any | Get preferences |
| PUT | `/preferences` | Any | Update preferences |

## Search (`/api/search`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Any | Search (q, type, organizationId) |

## Analytics (`/api/analytics`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/courses/:courseId/analytics` | Teacher/Admin | Course analytics |
| GET | `/courses/:courseId/analytics/students` | Teacher/Admin | Student performance |
| GET | `/courses/:courseId/analytics/assignments` | Teacher/Admin | Assignment performance |
| GET | `/courses/:courseId/analytics/engagement` | Teacher/Admin | Course engagement |
