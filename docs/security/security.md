# EduNet Security Documentation

## Authentication

### JWT Tokens
- Access tokens: 7-day expiry
- Refresh tokens: 30-day expiry
- Algorithm: HS256
- Secret: Configured via `JWT_SECRET` environment variable

### Password Security
- Hashing: bcrypt with 10 rounds
- Minimum password length: 8 characters
- Maximum password length: 128 characters

## Authorization

### Role-Based Access Control (RBAC)
- **student**: Can view courses, submit assignments, view own progress
- **teacher**: Can create/edit own courses, grade submissions, view analytics
- **parent**: Can view linked children's progress
- **admin**: Full access to all resources
- **tutor**: Can schedule sessions

### Organization Isolation
- All data is scoped by `organizationId`
- Users can only access data within their organization
- Cross-organization requests are rejected

## API Security

### Input Validation
- All inputs validated with Zod schemas
- SQL injection prevention via Drizzle ORM parameterized queries
- XSS prevention via React's built-in escaping

### Rate Limiting
- TODO: Implement rate limiting middleware

### CORS
- TODO: Configure CORS for production

## Data Protection

### Sensitive Data
- Passwords never stored in plain text
- Password hashes never returned in API responses
- JWT tokens stored in localStorage (TODO: migrate to httpOnly cookies)

### Assessment Security
- Correct answers hidden from students before submission
- Auto-grading only for objective questions (MCQ, true/false)
- Manual grading required for subjective questions

## Security Test Coverage

### Authentication Tests
- Token generation and verification
- Password hashing and verification
- Expired token rejection
- Invalid token rejection

### Authorization Tests
- Role-based access control
- Unauthenticated request rejection
- Wrong role rejection
- Organization isolation

### Resource Protection Tests
- Course ownership verification
- Assignment ownership verification
- Submission ownership verification
- Content ownership verification
