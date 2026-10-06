# EduNet Implementation State

Last updated: 2026-10-06
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
| Unit tests | `pnpm test` | **20/20 tasks PASS, 85 tests passing** |
| Build | `pnpm build` | **15/15 tasks PASS** (incl. Next.js production build) |
| Migrations | `drizzle-kit migrate` on PostgreSQL 16 | **PASS — 17 tables created** |
| Migration constraints | live SQL assertions | **PASS** (unique/FK/NOT NULL all reject bad data) |
| PostgreSQL integration | `pnpm --filter @edunet/database test:integration` | **5 tests PASS**, including cross-organization lesson, progress, resource, and media isolation |
| E2E | `pnpm --filter @edunet/web test:e2e` | **1 teacher/student journey passed against PostgreSQL 16, including assignment creation, submission, grading, feedback, and roster display** |
| Security scan | `gh api dependabot/alerts` | **Critical: 0 in the dependency tree.** Vitest 4.1.11 removes `tinypool` entirely, clearing GHSA-5gmw-xhrv-c9v3 and GHSA-85c8-ppgw-ccpr (prototype pollution → RCE). Remaining: `drizzle-orm` identifier escaping (HIGH, **not reachable** — see deferred), plus transitive vite/esbuild/postcss/minimatch |

### Test inventory
| Package | Tests | Covers |
|---------|-------|--------|
| `@edunet/rbac` | 25 | role matrix, admin privileged role, tenant isolation, bearer auth, refresh-token replay |
| `@edunet/identity` | 25 | password hashing, JWT lifecycle, token-kind confusion, secret enforcement, middleware |
| `@edunet/courses` | 7 | course CRUD, teacher ownership, admin override |
| `@edunet/enrollments` | 6 | self-enrollment, cross-student rejection, duplicate prevention |
| `@edunet/content` | 22 | media mime allowlist, key generation, **path traversal**, signed URL issue/verify, upload limits |

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
| 12 | **Critical** | Storage layer was fake production behaviour: S3 provider returned fabricated `s3://` URLs, an empty download body, a no-op delete and `exists` hardcoded to `true`; module was orphaned (nothing imported it) | Fake provider deleted. Real filesystem provider with allowlisted MIME types, 25MB cap, generated keys, and HMAC-signed expiring URLs. 22 tests |
| 13 | **High** | **Path traversal** in the local storage provider: `path.join(basePath, userKey)` allowed `../` to escape the storage root | Keys are `<scope>/<uuid>.<ext>` from generated UUIDs, regex-validated, plus a resolved-path containment check |
| 14 | **High** | `media_files` table existed in schema and migrations but **had no API at all** — the earlier "media metadata" completion claim was untrue | Implemented upload/list/access/delete with teacher course-ownership checks, pagination, soft delete and download counting |
| 15 | **High** | `media_files.url` was `NOT NULL`, forcing a permanent public URL to be stored, contradicting the private-media rule | Column made nullable (migration `0001`); access URLs are signed per request |
| 16 | **Critical** | **CVE-2026-47429** — Vitest `< 3.2.6` allows arbitrary file read/execute when the Vitest UI server is listening; unused `@vitest/ui` was installed | Vitest raised to `^4.1.11`; `@vitest/ui` removed; dead Jest toolchain deleted |
| 17 | **Critical** | Vitest 3 pulled `tinypool@1.1.1`, affected by two prototype-pollution → RCE advisories (GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr) | Vitest 4 drops the `tinypool` dependency entirely; it is absent from the lockfile |
| 18 | **High** | Vite `< 6.4.3` dev-server advisory | Root `pnpm.overrides` pins `vite ^6.4.3` and `esbuild ^0.25.0` (both required — Vite 6 pulls an incompatible esbuild 0.18 otherwise) |
| 19 | **Medium** | `bcryptjs` at cost 10 takes ~2.7s per operation in pure JS — every login burns seconds of CPU, and the auth suite spent 35s hashing | `BCRYPT_COST` configurable (default 10); tests use cost 4, suite drops to 2.4s. **Production: migrate to native bcrypt or argon2id** |
| 20 | **Medium** | 23 of 23 tsconfigs lacked `*.test.ts` excludes, so `pnpm build` emitted test files into production output | All tsconfigs normalised; `dist/` now contains zero test files |
| 21 | **Low** | Vitest 4 collected stale compiled suites from `dist/`, duplicating and failing suites | Per-package `vitest.config.ts` with explicit `include`/`exclude` |

---

## Workstream Status

| Workstream | Status | Evidence / Gap |
|-----------|--------|----------------|
| Architecture | VERIFIED | monorepo builds; shared `@edunet/rbac`; lazy DB boundary |
| Identity & Auth | VERIFIED (hardened) | 25 tests; secrets + token-kind enforced |
| RBAC & Multi-tenancy | PARTIAL | canonical middleware in use across all 12 services + 25 tests; courses, users, assignments, submissions, enrollments, assessments, and content scope reads and mutations to the authenticated organization; PostgreSQL integration coverage confirms tenant isolation across these domains |
| Database & Migrations | VERIFIED | 17 tables migrate; constraints proven |
| LMS core | PARTIAL | CRUD + ownership; no rubrics/resubmission |
| Assessment | PARTIAL | auto-grading for 2 objective types; 5 types missing |
| Content | PARTIAL | lessons, resources, progress, **media upload/signed access (new)**, versioning; multipart upload still pending |
| Student workflow | PARTIAL | PostgreSQL-backed browser journey verifies registration, enrollment, lesson completion, assignment submission, and returned grade/feedback |
| Teacher workflow | PARTIAL | PostgreSQL-backed browser journey verifies course/lesson/assignment creation, enrolled-student roster, and grading |
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
| CI/CD | PARTIAL | GitHub Actions gates frozen install, migrations, PostgreSQL integration, lint, typecheck, unit tests, and build on pushes and pull requests; first hosted run pending |
| Backup/DR | MISSING | — |
| Accessibility | MISSING | — |
| Pilot/Rollout/Operations | MISSING | — |

---

## Next Priority (highest risk first)

1. Add observability: structured logging, `/health`, `/ready`.
2. Replace `bcryptjs` with native bcrypt or argon2id (~2.7s per login today).

### Deferred with justification

**CVE-2026-39356 (drizzle-orm SQL injection via identifier escaping, HIGH).**
Not currently exploitable: the advisory affects `sql.identifier()` and `.as()`
when fed untrusted input, and a repo-wide search finds **no dynamic identifier
or alias construction** — every query references static schema columns.
Upgrading `drizzle-orm` 0.33 → 0.45.2 spans twelve minor versions with breaking
API changes (notably `relations()`), and no test currently exercises the real
ORM, so an upgrade would be unverifiable and risky. Scheduled immediately
after the integration test lands.

---

## Environment Notes
- Docker Desktop is available and was used to verify migrations on PostgreSQL 16.
- No local Postgres or `psql` on the host; use Docker for DB verification.
