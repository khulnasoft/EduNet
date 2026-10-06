# EduNet Development Setup

## Prerequisites

- Node.js 22+
- pnpm 9+
- PostgreSQL 16+

## Installation

```bash
# Clone the repository
git clone https://github.com/khulnasoft/EduNet.git
cd EduNet

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database credentials

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

## Environment Variables

```env
# Database
DATABASE_URL=postgres://user:password@localhost:5432/edunet
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_NAME=edunet

# JWT
JWT_SECRET=your-secret-key-change-in-production

# API
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Development Commands

```bash
# Build all packages
pnpm build

# Run tests
pnpm test

# Run linting
pnpm lint

# Run type checking
pnpm typecheck

# Start development servers
pnpm dev

# Clean build artifacts
pnpm clean
```

## Project Structure

- `apps/web/` - Next.js frontend application
- `packages/` - Shared libraries and utilities
- `services/` - Backend microservices
- `docs/` - Documentation
- `state/` - Progress tracking

## Code Style

- TypeScript strict mode
- ESLint for linting
- Prettier for formatting
- Conventional commits for git messages

## Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

### PostgreSQL integration test

The database integration suite writes and deletes rows. Use a disposable
PostgreSQL database with the current migrations applied; do not point it at a
shared or production database.

```bash
DATABASE_URL=postgres://postgres:password@localhost:5432/edunet_test \
  pnpm --filter @edunet/database test:integration
```

The command fails when `DATABASE_URL` is missing so it cannot silently report a
passing database integration run without connecting to PostgreSQL.


### Browser end-to-end journey

The browser test creates an isolated organization in a disposable PostgreSQL
database, starts the web app and the relevant API routes, then exercises teacher
registration/course/lesson creation and student registration/enrollment/lesson
viewing and progress completion. Apply migrations first, then run:

```bash
pnpm --filter @edunet/web exec playwright install chromium
DATABASE_URL=postgres://postgres:password@localhost:5432/edunet_test \
JWT_SECRET=local-e2e-secret-change-this BCRYPT_COST=4 \
pnpm --filter @edunet/web build
DATABASE_URL=postgres://postgres:password@localhost:5432/edunet_test \
JWT_SECRET=local-e2e-secret-change-this BCRYPT_COST=4 \
pnpm --filter @edunet/web test:e2e
```

The E2E test uses ports 3000 and 3001 and deletes its organization and related
rows after it finishes. Keep `DATABASE_URL` pointed at a disposable database.
