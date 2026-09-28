# EduNet Product Requirements

## Product Vision
EduNet is a production-grade, modular, secure, scalable education platform for Bangladesh, supporting Bengali and English, with offline-first capabilities.

## Product Scope

### In Scope (MVP)
- Student/Teacher/Parent/Admin roles
- Course management
- Enrollment system
- Assignment submission and grading
- Quiz-based assessments
- Content management (lessons, resources)
- Parent-child relationships
- Basic notifications
- Search functionality
- Analytics dashboard

### In Scope (Phase 2)
- Live class integration
- Tutoring/mentoring
- Extracurricular booking
- Communication system
- Calendar system
- Advanced analytics
- Institution management

### In Scope (Phase 3)
- AI-powered features
- Advanced offline support
- Mobile applications
- National-level integrations

## Personas

### Student (শিক্ষার্থী)
- Age: 10-18
- Needs: Access courses, submit assignments, track progress
- Pain points: Poor connectivity, language barriers, device limitations

### Teacher (শিক্ষক)
- Age: 25-60
- Needs: Create courses, grade assignments, track student progress
- Pain points: Large class sizes, manual grading, limited tools

### Parent (অভিভাবক)
- Age: 30-55
- Needs: Monitor child progress, communicate with teachers
- Pain points: Limited visibility, language barriers

### Admin (প্রশাসক)
- Age: 25-60
- Needs: Manage users, courses, institutions
- Pain points: Manual processes, lack of analytics

## User Journeys

### Student Journey
1. Register/Login
2. Browse course catalog
3. Enroll in course
4. View lessons
5. Complete assignments
6. Take assessments
7. View progress/grades

### Teacher Journey
1. Login
2. Create course
3. Add lessons/content
4. Create assignments
5. Grade submissions
6. View analytics

### Parent Journey
1. Register/Login
2. Link child account
3. View child progress
4. Communicate with teachers

## Functional Requirements

### Authentication
- User registration with organization code
- Login with email/password
- JWT-based session management
- Password reset via email
- Role-based access control

### Course Management
- CRUD operations for courses
- Course publishing workflow
- Organization isolation
- Teacher ownership

### Enrollment
- Student self-enrollment
- Admin/teacher enrollment
- Duplicate prevention
- Enrollment status tracking

### Assignments
- Create assignments with deadlines
- File attachments
- Submission tracking
- Grading with feedback

### Assessments
- Multiple question types
- Auto-grading for objective questions
- Attempt limits
- Time limits

## Non-Functional Requirements

### Performance
- API response time < 500ms (p95)
- Page load time < 3s
- Support 10,000 concurrent users

### Security
- HTTPS everywhere
- Encrypted data at rest
- JWT token expiration
- Rate limiting
- Input validation

### Availability
- 99.9% uptime SLA
- Automated backups
- Disaster recovery plan

### Scalability
- Horizontal scaling ready
- Database connection pooling
- CDN for static assets

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Bengali language support

## Success Metrics

### User Engagement
- DAU/MAU ratio > 30%
- Course completion rate > 60%
- Assignment submission rate > 80%

### Learning Outcomes
- Assessment pass rate > 70%
- Student progress improvement > 20%
- Teacher satisfaction > 4.0/5.0

### Operational
- System uptime > 99.9%
- Support response time < 24h
- Bug resolution time < 48h

## KPI Definitions

### DAU (Daily Active Users)
Number of unique users who log in and perform at least one action per day.

### MAU (Monthly Active Users)
Number of unique users who log in and perform at least one action per month.

### Course Completion Rate
Percentage of enrolled students who complete all course requirements.

### Assignment Submission Rate
Percentage of assigned students who submit assignments on time.

### Assessment Pass Rate
Percentage of students who achieve passing score on assessments.
