# EduNet Architecture Overview

## System Architecture

EduNet is a production-grade, modular, secure, scalable education platform built as a pnpm monorepo.

### Core Principles
- **Modularity**: Each domain is a separate service with its own database schema
- **Security**: JWT-based authentication, role-based authorization, organization isolation
- **Scalability**: Microservices architecture allows independent scaling
- **Type Safety**: Full TypeScript coverage with shared types package

### Technology Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for APIs, Next.js for frontend
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with refresh tokens
- **Validation**: Zod schemas
- **Build**: Turborepo for monorepo management

### Monorepo Structure
```
edunet-agent-launch/
├── apps/
│   └── web/                 # Next.js frontend
├── packages/
│   ├── api-client/          # Shared API client
│   ├── auth/                # Authentication context
│   ├── config/              # Configuration
│   ├── database/            # Shared database schema
│   ├── i18n/                # Internationalization
│   ├── testing/             # Test utilities
│   ├── types/               # Shared types
│   ├── ui/                  # UI component library
│   └── validation/          # Zod validation schemas
├── services/
│   ├── analytics/           # Analytics service
│   ├── assessments/         # Assessment engine
│   ├── assignments/         # Assignment management
│   ├── content/             # Content management
│   ├── courses/             # Course management
│   ├── enrollments/         # Enrollment management
│   ├── identity/            # Authentication & identity
│   ├── notifications/       # Notification system
│   ├── organizations/       # Organization management
│   ├── parents/             # Parent domain
│   ├── search/              # Search service
│   ├── submissions/         # Submission management
│   └── users/               # User management
└── docs/                    # Documentation
```

### Data Flow
1. Frontend (Next.js) → API Client → Express Services → Drizzle ORM → PostgreSQL
2. Authentication: Identity service issues JWT tokens
3. Authorization: Middleware validates tokens and checks roles
4. Organization isolation: All queries scoped by organizationId

### Security Architecture
- JWT tokens with 7-day expiry for access, 30-day for refresh
- bcrypt password hashing (10 rounds)
- Role-based access control (student, teacher, parent, admin, tutor)
- Organization-based data isolation
- Input validation with Zod schemas
- SQL injection prevention via Drizzle ORM parameterized queries
