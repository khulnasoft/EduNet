# EduNet Roadmap Gap Matrix

## Status Legend
- COMPLETE: Fully implemented and verified
- PARTIAL: Core exists, needs expansion
- MISSING: Not implemented
- NEEDS_HARDENING: Exists but needs security/robustness work
- BLOCKED: Cannot proceed without dependencies

## 1. Foundation
| Item | Status | Notes |
|------|--------|-------|
| Product vision | PARTIAL | docs/product/ needed |
| Product scope | PARTIAL | Needs formal definition |
| MVP scope | COMPLETE | Core LMS functional |
| Personas | MISSING | Not documented |
| User journeys | PARTIAL | Basic flows exist |
| Functional requirements | PARTIAL | Scattered across docs |
| Non-functional requirements | MISSING | Not documented |
| Acceptance criteria | MISSING | Not defined |
| Success metrics | MISSING | Not defined |
| KPI definitions | MISSING | Not defined |
| Budget model | MISSING | Not defined |
| Team structure | MISSING | Not defined |
| Delivery milestones | PARTIAL | Phases exist |
| Risk register | MISSING | Not defined |
| Dependency register | MISSING | Not defined |
| Decision log | MISSING | Not defined |
| Product roadmap | PARTIAL | This document |
| Release roadmap | MISSING | Not defined |

## 2. Architecture
| Item | Status | Notes |
|------|--------|-------|
| Domain boundaries | COMPLETE | 12 services |
| Service boundaries | COMPLETE | Clear separation |
| API-first architecture | COMPLETE | Express services |
| Event architecture | PARTIAL | Basic event bus exists |
| Modular architecture | COMPLETE | Monorepo structure |
| Web architecture | COMPLETE | Next.js + Express |
| PWA/mobile architecture | MISSING | Not implemented |
| Backend architecture | COMPLETE | Microservices |
| Data architecture | PARTIAL | Basic schema exists |
| Storage architecture | PARTIAL | Abstraction exists |
| Media architecture | PARTIAL | Metadata only |
| Notification architecture | PARTIAL | Basic events |
| Search architecture | PARTIAL | ILIKE-based |
| Analytics architecture | PARTIAL | Basic handlers |
| AI architecture | MISSING | Not implemented |
| Integration architecture | MISSING | No adapters |
| Disaster recovery | MISSING | Not implemented |
| Multi-AZ strategy | MISSING | Not implemented |
| Multi-region strategy | MISSING | Not implemented |

## 3. Technology Platform
| Item | Status | Notes |
|------|--------|-------|
| Frontend framework | COMPLETE | Next.js 15 |
| Backend framework | COMPLETE | Express 4 |
| PostgreSQL | COMPLETE | Drizzle ORM |
| Redis | MISSING | Not used |
| Queues | MISSING | Not implemented |
| Object storage abstraction | COMPLETE | storage.ts exists |
| CDN abstraction | MISSING | Not implemented |
| Search | PARTIAL | ILIKE-based |
| Analytics | PARTIAL | Basic handlers |
| AI model abstraction | MISSING | Not implemented |
| Docker | MISSING | No containers |
| Kubernetes readiness | MISSING | Not implemented |
| Terraform/IaC | MISSING | Not implemented |
| CI/CD | MISSING | No pipeline |
| Monitoring | MISSING | Not implemented |
| Logging | MISSING | Not implemented |
| Tracing | MISSING | Not implemented |
| Secrets management | MISSING | Not implemented |
| Backup | MISSING | Not implemented |

## 4. Design System
| Item | Status | Notes |
|------|--------|-------|
| Brand identity | PARTIAL | Basic tokens |
| Color tokens | COMPLETE | tokens.ts |
| Typography | PARTIAL | Basic |
| Spacing | PARTIAL | Tailwind |
| Grid | PARTIAL | Tailwind |
| Icons | MISSING | Not implemented |
| Buttons | COMPLETE | Button.tsx |
| Inputs | COMPLETE | Input.tsx |
| Forms | PARTIAL | Basic forms |
| Modal | MISSING | Not implemented |
| Drawer | MISSING | Not implemented |
| Dropdown | MISSING | Not implemented |
| Tabs | MISSING | Not implemented |
| Tables | MISSING | Not implemented |
| Pagination | MISSING | Not implemented |
| Toast | MISSING | Not implemented |
| Alerts | MISSING | Not implemented |
| Empty states | PARTIAL | Basic |
| Loading states | PARTIAL | Basic |
| Error states | PARTIAL | Basic |
| Skeletons | MISSING | Not implemented |
| Accessibility states | MISSING | Not implemented |
| Dark mode | MISSING | Not implemented |
| Responsive behavior | PARTIAL | Tailwind |
| Bengali typography | MISSING | Not implemented |
| English typography | PARTIAL | Basic |
| RTL readiness | MISSING | Not implemented |

## 5. Identity + RBAC
| Item | Status | Notes |
|------|--------|-------|
| Password reset | MISSING | Not implemented |
| Email verification | MISSING | Not implemented |
| Phone verification | MISSING | Not implemented |
| OTP | MISSING | Not implemented |
| OAuth/OIDC | MISSING | Not implemented |
| SSO | MISSING | Not implemented |
| MFA | MISSING | Not implemented |
| Device management | MISSING | Not implemented |
| Session management | PARTIAL | JWT only |
| Suspicious-login detection | MISSING | Not implemented |
| Account recovery | MISSING | Not implemented |
| Identity audit logs | MISSING | Not implemented |
| Role architecture | PARTIAL | 5 roles |
| Permission matrices | MISSING | Not defined |
| Tenant isolation | COMPLETE | orgId scoping |

## 6. Student Platform
| Item | Status | Notes |
|------|--------|-------|
| Student profile | PARTIAL | Basic |
| Academic profile | MISSING | Not implemented |
| Guardian relationships | COMPLETE | parents service |
| School/class/section | MISSING | Not implemented |
| Subjects | PARTIAL | Course subject |
| Skills | MISSING | Not implemented |
| Interests | MISSING | Not implemented |
| Learning goals | MISSING | Not implemented |
| Attendance | MISSING | Not implemented |
| Assignment history | PARTIAL | Basic |
| Grade history | PARTIAL | Basic |
| Achievements | MISSING | Not implemented |
| Certificates | MISSING | Not implemented |
| Learning streak | MISSING | Not implemented |
| Activity timeline | MISSING | Not implemented |
| Privacy controls | MISSING | Not implemented |

## 7. Parent Platform
| Item | Status | Notes |
|------|--------|-------|
| Parent registration | COMPLETE | Via register |
| Child linking | COMPLETE | parents service |
| Multiple children | COMPLETE | Supported |
| Progress dashboard | PARTIAL | Basic |
| Attendance | MISSING | Not implemented |
| Grades | PARTIAL | Basic |
| Assignments | PARTIAL | Basic |
| Teacher communication | MISSING | Not implemented |
| Notifications | PARTIAL | Basic |
| Calendar | MISSING | Not implemented |
| Reports | MISSING | Not implemented |
| Learning alerts | MISSING | Not implemented |
| Consent management | MISSING | Not implemented |

## 8. Teacher Platform
| Item | Status | Notes |
|------|--------|-------|
| Teacher profile | PARTIAL | Basic |
| Teacher dashboard | COMPLETE | teacher/page.tsx |
| Classes | MISSING | Not implemented |
| Student roster | PARTIAL | Enrollments |
| Course creation | COMPLETE | courses service |
| Lesson creation | COMPLETE | content service |
| Assignments | COMPLETE | assignments service |
| Quizzes | COMPLETE | assessments service |
| Grading | COMPLETE | submissions service |
| Attendance | MISSING | Not implemented |
| Analytics | PARTIAL | analytics service |
| Communication | MISSING | Not implemented |
| Resource library | PARTIAL | resources |
| Live classes | MISSING | Not implemented |
| Teacher workload | MISSING | Not implemented |

## 9. LMS Expansion
| Item | Status | Notes |
|------|--------|-------|
| Course catalog | COMPLETE | courses/page.tsx |
| Sections | MISSING | Not implemented |
| Chapters | MISSING | Not implemented |
| Lessons | COMPLETE | content service |
| Learning objectives | MISSING | Not implemented |
| Prerequisites | MISSING | Not implemented |
| Video | MISSING | Not implemented |
| Audio | MISSING | Not implemented |
| PDF/document | PARTIAL | Resources |
| Interactive lessons | MISSING | Not implemented |
| Completion | PARTIAL | Progress tracking |
| Progress | COMPLETE | lesson-progress |
| Resume learning | MISSING | Not implemented |
| Bookmarks | MISSING | Not implemented |
| Notes | MISSING | Not implemented |
| Favorites | MISSING | Not implemented |
| Search | PARTIAL | search service |
| Filtering | PARTIAL | Basic |
| Recommendations | MISSING | Not implemented |

## 10. Assignment System
| Item | Status | Notes |
|------|--------|-------|
| Instructions | COMPLETE | description |
| Attachments | MISSING | Not implemented |
| Submission | COMPLETE | submissions service |
| Resubmission | MISSING | Not implemented |
| Deadlines | COMPLETE | dueDate |
| Late submissions | MISSING | Not implemented |
| Autosave | MISSING | Not implemented |
| Rubrics | MISSING | Not implemented |
| Grading | COMPLETE | gradeSubmission |
| Feedback | COMPLETE | feedback field |
| Grade calculation | PARTIAL | Basic |
| Grade history | MISSING | Not implemented |
| Submission audit | MISSING | Not implemented |

## 11. Assessment Engine
| Item | Status | Notes |
|------|--------|-------|
| MCQ | COMPLETE | multiple_choice |
| Multiple select | MISSING | Not implemented |
| True/false | COMPLETE | true_false |
| Short answer | COMPLETE | short_answer |
| Long answer | COMPLETE | essay |
| Matching | MISSING | Not implemented |
| Fill-in-the-blank | MISSING | Not implemented |
| Question banks | MISSING | Not implemented |
| Randomized questions | MISSING | Not implemented |
| Randomized options | MISSING | Not implemented |
| Time limits | COMPLETE | timeLimit |
| Attempts | COMPLETE | maxAttempts |
| Auto grading | COMPLETE | Objective only |
| Manual grading | MISSING | Not implemented |
| Partial scoring | MISSING | Not implemented |
| Exam analytics | MISSING | Not implemented |
| Result publication | PARTIAL | Basic |
| Recheck workflow | MISSING | Not implemented |

## 12-47. Remaining Workstreams
| Item | Status | Notes |
|------|--------|-------|
| Live Learning | MISSING | Not implemented |
| Tutoring | MISSING | Not implemented |
| Extracurricular | MISSING | Not implemented |
| Content Management | PARTIAL | Basic CMS |
| Communication | MISSING | Not implemented |
| Calendar | MISSING | Not implemented |
| Search | PARTIAL | Basic |
| Notifications | PARTIAL | Basic |
| Analytics | PARTIAL | Basic |
| AI | MISSING | Not implemented |
| Support | MISSING | Not implemented |
| Offline | MISSING | Not implemented |
| Internationalization | PARTIAL | i18n package |
| Admin | MISSING | Not implemented |
| Institution Management | MISSING | Not implemented |
| Integrations | MISSING | Not implemented |
| Data Architecture | PARTIAL | Basic |
| Security | PARTIAL | Hardened |
| Privacy | MISSING | Not implemented |
| Infrastructure | MISSING | Not implemented |
| DevOps | MISSING | Not implemented |
| Observability | MISSING | Not implemented |
| Performance | MISSING | Not tested |
| QA | PARTIAL | Unit tests |
| Accessibility | MISSING | Not implemented |
| Backup/DR | MISSING | Not implemented |
| Documentation | PARTIAL | Basic |
| Support Operations | MISSING | Not implemented |
| Pilot | MISSING | Not planned |
| Rollout | MISSING | Not planned |
| Operations | MISSING | Not planned |
| Business/Cost | MISSING | Not tracked |
| KPI | MISSING | Not defined |
| Release Governance | MISSING | Not defined |

## Priority Implementation Order
1. Product documentation (Phase 00)
2. Design system expansion (Phase 03)
3. Identity extension (password reset, email verification)
4. Student platform expansion
5. Teacher platform expansion
6. LMS expansion (sections, chapters, objectives)
7. Assignment system expansion (rubrics, resubmission)
8. Assessment engine expansion (more question types)
9. Communication system
10. Calendar system
11. Notification platform expansion
12. Analytics platform expansion
13. Admin platform
14. Institution management
15. Security hardening
16. Infrastructure/DevOps
17. Observability
18. QA expansion
19. Accessibility
20. Backup/DR
