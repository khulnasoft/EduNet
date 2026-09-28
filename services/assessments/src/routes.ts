import { Router } from 'express';
import { authorize, authenticate } from '@edunet/rbac';
import {
  createQuizHandler,
  getQuizHandler,
  listQuizzesHandler,
  updateQuizHandler,
  deleteQuizHandler,
  createQuestionHandler,
  getQuestionHandler,
  listQuestionsHandler,
  updateQuestionHandler,
  deleteQuestionHandler,
  createQuizAttemptHandler,
  getQuizAttemptHandler,
  listQuizAttemptsHandler,
  submitQuizAttemptHandler,
  deleteQuizAttemptHandler,
} from './handlers';


export function registerRoutes(app: any) {
  const router = Router();

  // Quiz routes
  router.post('/quizzes', authenticate, authorize('teacher', 'admin'), createQuizHandler);
  router.get('/quizzes', authenticate, listQuizzesHandler);
  router.get('/quizzes/:id', authenticate, getQuizHandler);
  router.put('/quizzes/:id', authenticate, authorize('teacher', 'admin'), updateQuizHandler);
  router.delete('/quizzes/:id', authenticate, authorize('teacher', 'admin'), deleteQuizHandler);

  // Question routes
  router.post('/questions', authenticate, authorize('teacher', 'admin'), createQuestionHandler);
  router.get('/questions', authenticate, listQuestionsHandler);
  router.get('/questions/:id', authenticate, getQuestionHandler);
  router.put('/questions/:id', authenticate, authorize('teacher', 'admin'), updateQuestionHandler);
  router.delete('/questions/:id', authenticate, authorize('teacher', 'admin'), deleteQuestionHandler);

  // Quiz Attempt routes
  router.post('/quiz-attempts', authenticate, authorize('student'), createQuizAttemptHandler);
  router.get('/quiz-attempts', authenticate, listQuizAttemptsHandler);
  router.get('/quiz-attempts/:id', authenticate, getQuizAttemptHandler);
  router.put('/quiz-attempts/:id/submit', authenticate, authorize('student'), submitQuizAttemptHandler);
  router.delete('/quiz-attempts/:id', authenticate, authorize('student', 'admin'), deleteQuizAttemptHandler);

  app.use('/api/assessments', router);
}
