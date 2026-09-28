# EduNet Implementation State

Last updated: 2026-09-29
Baseline commit: `ef96741`

## Status Legend
`COMPLETE` · `PARTIAL` · `MISSING` · `NEEDS HARDENING` · `BLOCKED` · `VERIFIED`

---

## Verified Executable Evidence

| Gate | Command | Result |
|------|---------|--------|
| Install | `pnpm install` | PASS |
| Typecheck | `pnpm typecheck` | **19/19 tasks PASS** |
| Lint | `pnpm lint` | **24/24 tasks PASS**, 0 errors, warnings only |
| Unit tests | `pnpm test` | **19/19 tasks PASS, 63 tests passing** |
| Build | `pnpm build` | **15/15 tasks PASS** (incl. Next.js production build) |
| Migrations | `drizzle-kit migrate` on PostgreSQL 16 | **PASS — 17 tables created** |
| Migration constraints | live SQL assertions | **PASS** (unique/FK/NOT NULL all reject bad data) |
| E2E | — | MISSING |
| Security scan | — | NOT RUN (28 known Dependabot alerts) |

### Test inventory
| Package | Tests | Covers |
|---------|-------|--------|
| `@edunet/rbac` | 25 | role matrix, admin privileged role, tenant isolation, bearer auth, refresh-token replay |
| `@edunet/identity` | 25 | password hashing, JWT lifecycle, token-kind confusion, secret enforcement, middleware |
| `@edunet/courses` | 7 | course CRUD, teacher ownership, admin override |
| `@edunet/enrollments` | 6 | self-enrollment, cross-student rejection, duplicate prevention |

---

## Defects Found and Fixed This Session

| # | Severity | Defect | Fix |
|---|----------|--------|-----|
| 1 | **Critical** | `JWT_SECRET` fell back to a hardcoded public value (`your-secret-key-change-in-production`); a deployment that forgot the env var signed forgeable tokens | `resolveSecret()` throws when unset; rejects the placeholder in production |
| 2 | **Critical** | `verifyToken(token, isRefresh)` ignored `isRefresh`, so **refresh tokens were accepted as access tokens** | Split into `verifyToken` / `verifyRefreshToken` with a `tokenKind` claim; cross-use rejected |
| 3 | **Critical** | Entire test suite never ran — scripts called `jest`, which is installed nowhere; tests are Vitest | Standardized on Vitest; removed 6 phantom `test` scripts from packages with no tests |
| 4 | **Critical** | **No migrations existed.** Only 7 of 17 tables were covered; lessons/quizzes/notifications were absent from any provisioned database | Aggregated all service schemas into one drizzle config; generated + executed migration for all 17 tables |
| 5 | **High** | `admin` was rejected on teacher-only routes in identity while 10 services allowed it — inconsistent, divergent `authorize()` copies | New canonical `@edunet/rbac` package; identity delegates to it |
| 6 | **High** | `content_versions.created_by` / `media_files.uploaded_by` were `NOT NULL` with `ON DELETE SET NULL` — deleting a user aborted the transaction | Columns made nullable; verified live that the row survives with NULL |
| 7 | **High** | Duplicated unique constraint on `organizations.code` blocked migration generation | Removed inline `.unique()`, kept named constraint |
| 8 | **High** | `import '@edunet/database'` opened a DB connection at import time and crashed on missing env (`postgres://undefined:...`) | Lazy `getDb()`; `resolveConnectionString()` names the missing vars |
| 9 | **Medium** | A test asserted 400 for invalid input but the schema mock returned data unchanged, so it could never fail | Mock now enforces required fields; assertion is meaningful |
| 10 | **Medium** | 6 packages declared `test: jest` with zero test files — false green signal | Scripts removed until real tests exist |
| 11 | **High** | 12 services inlined their own `authenticate`/`authorize` in `routes.ts`, each reading `JWT_SECRET` with the hardcoded fallback and with drifted admin semantics (531 duplicated lines) | All migrated to `@edunet/rbac`; hardcoded secret removed from service source |

---

## Workstream Status

| Workstream | Status | Evidence / Gap |
|-----------|--------|----------------|
| Architecture | VERIFIED | monorepo builds; shared `@edunet/rbac`; lazy DB boundary |
| Identity & Auth | VERIFIED (hardened) | 25 tests; secrets + token-kind enforced |
| RBAC & Multi-tenancy | PARTIAL | canonical middleware in use across all 12 services + 25 tests; per-handler `organizationId` scoping still inconsistent |
| Database & Migrations | VERIFIED | 17 tables migrate; constraints proven |
| LMS core | PARTIAL | CRUD + ownership; no rubrics/resubmission |
| Assessment | PARTIAL | auto-grading for 2 objective types; 5 types missing |
| Content | PARTIAL | storage abstraction is a **non-functional stub** |
| Student workflow | PARTIAL | pages exist, untested E2E |
| Teacher workflow | PARTIAL | pages exist, untested E2E |
| Parent | PARTIAL | relationship auth present; UI absent |
| Notifications | PARTIAL | CRUD + event bus; no delivery adapters |
| Search | PARTIAL | `ILIKE` based; no ranking/facets |
| Analytics | PARTIAL | handlers exist, unverified |
| Design System | PARTIAL | 3 components added; ~20 missing |
| AI | MISSING | — |
| Live Learning / Tutoring / Extracurricular | MISSING | — |
| Communication / Calendar | MISSING | — |
| Offline / PWA | MISSING | core roadmap requirement |
| i18n | MISSING (pkg stub) | Bengali + English not wired |
| Admin / Institution | MISSING | — |
| Integrations | MISSING | — |
| Observability | MISSING | no logging, health, metrics |
| CI/CD | MISSING | — |
| Backup/DR | MISSING | — |
| Accessibility | MISSING | — |
| Pilot/Rollout/Operations | MISSING | — |

---

## Next Priority (highest risk first)

1. Implement the storage adapter for real (currently returns fake S3 URLs; signed URLs are not signed).
2. Enforce `organizationId` in the data layer so tenant scoping cannot be forgotten in a handler.
3. E2E coverage of the primary journey against a real database.
4. Observability: structured logging, `/health`, `/ready`.
5. CI pipeline enforcing install → lint → typecheck → test → build → migrate.
6. Resolve the 28 Dependabot alerts (2 critical).

---

## Environment Notes
- Docker Desktop is available and was used to verify migrations on PostgreSQL 16.
- No local Postgres or `psql` on the host; use Docker for DB verification.
