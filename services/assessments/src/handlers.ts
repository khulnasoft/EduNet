import { Request, Response } from 'express';
import {
  findQuizById,
  listQuizzesByCourse,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  findQuestionById,
  listQuestionsByQuiz,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  findQuizAttemptById,
  listQuizAttemptsByStudent,
  listQuizAttemptsByQuiz,
  createQuizAttempt,
  updateQuizAttempt,
  deleteQuizAttempt,
} from './db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    organizationId?: string;
  };
}

// Quiz handlers
export async function createQuizHandler(req: AuthRequest, res: Response) {
  try {
    const { courseId, title, description, type, timeLimit, passingScore, maxAttempts } = req.body;
    
    if (!courseId || !title || !type) {
      return res.status(400).json({ error: 'courseId, title, and type are required' });
    }

    const quiz = await createQuiz({
      courseId,
      title,
      description,
      type,
      timeLimit,
      passingScore,
      maxAttempts,
      shuffleQuestions: req.body.shuffleQuestions || 'false',
      showResults: req.body.showResults || 'immediate',
      availableFrom: req.body.availableFrom ? new Date(req.body.availableFrom) : null,
      availableUntil: req.body.availableUntil ? new Date(req.body.availableUntil) : null,
    });
    
    res.status(201).json(quiz);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function getQuizHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const quiz = await findQuizById(id);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    res.json(quiz);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function listQuizzesHandler(req: AuthRequest, res: Response) {
  try {
    const { courseId } = req.query;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    if (!courseId || typeof courseId !== 'string') {
      return res.status(400).json({ error: 'courseId is required' });
    }
    
    const quizzes = await listQuizzesByCourse(courseId, limit, offset);
    res.json(quizzes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateQuizHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const existing = await findQuizById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const quiz = await updateQuiz(id, {
      ...data,
      availableFrom: data.availableFrom ? new Date(data.availableFrom) : undefined,
      availableUntil: data.availableUntil ? new Date(data.availableUntil) : undefined,
    });
    
    res.json(quiz);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function deleteQuizHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    
    const quiz = await deleteQuiz(id);
    res.json(quiz);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Question handlers
export async function createQuestionHandler(req: AuthRequest, res: Response) {
  try {
    const { quizId, type, text, points, order } = req.body;
    
    if (!quizId || !type || !text || !points || order === undefined) {
      return res.status(400).json({ error: 'quizId, type, text, points, and order are required' });
    }

    const question = await createQuestion({
      quizId,
      type,
      text,
      points,
      order,
      options: req.body.options,
      correctAnswer: req.body.correctAnswer,
      explanation: req.body.explanation,
      metadata: req.body.metadata,
    });
    
    res.status(201).json(question);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function getQuestionHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const question = await findQuestionById(id);

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (req.user?.role === 'student') {
      const { correctAnswer, explanation, ...safeQuestion } = question as any;
      return res.json(safeQuestion);
    }

    res.json(question);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function listQuestionsHandler(req: AuthRequest, res: Response) {
  try {
    const { quizId } = req.query;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!quizId || typeof quizId !== 'string') {
      return res.status(400).json({ error: 'quizId is required' });
    }

    const questions = await listQuestionsByQuiz(quizId, limit, offset);

    if (req.user?.role === 'student') {
      const safeQuestions = questions.map((q: any) => {
        const { correctAnswer, explanation, ...safe } = q;
        return safe;
      });
      return res.json(safeQuestions);
    }

    res.json(questions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateQuestionHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const existing = await findQuestionById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const question = await updateQuestion(id, data);
    res.json(question);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function deleteQuestionHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    
    const question = await deleteQuestion(id);
    res.json(question);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Quiz Attempt handlers
export async function createQuizAttemptHandler(req: AuthRequest, res: Response) {
  try {
    const { quizId, studentId } = req.body;

    if (!quizId || !studentId) {
      return res.status(400).json({ error: 'quizId and studentId are required' });
    }

    if (req.user?.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({ error: 'Students can only start their own attempts' });
    }

    const quiz = await findQuizById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const maxAttempts = quiz.maxAttempts ? parseInt(quiz.maxAttempts as string, 10) : null;
    if (maxAttempts && !isNaN(maxAttempts)) {
      const existingAttempts = await listQuizAttemptsByStudent(studentId);
      const quizAttempts = existingAttempts.filter((a: any) => a.quizId === quizId);
      if (quizAttempts.length >= maxAttempts) {
        return res.status(403).json({ error: 'Maximum number of attempts reached' });
      }
    }

    const attempt = await createQuizAttempt({
      quizId,
      studentId,
      answers: req.body.answers,
      feedback: req.body.feedback,
      passed: 'false',
    });

    res.status(201).json(attempt);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function getQuizAttemptHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const attempt = await findQuizAttemptById(id);
    
    if (!attempt) {
      return res.status(404).json({ error: 'Quiz attempt not found' });
    }

    if (req.user?.role === 'student' && attempt.studentId !== req.user.id) {
      return res.status(403).json({ error: 'You can only view your own attempts' });
    }
    
    res.json(attempt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function listQuizAttemptsHandler(req: AuthRequest, res: Response) {
  try {
    const { quizId, studentId } = req.query;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    let attempts;
    if (studentId && typeof studentId === 'string') {
      if (req.user?.role === 'student' && req.user.id !== studentId) {
        return res.status(403).json({ error: 'You can only view your own attempts' });
      }
      attempts = await listQuizAttemptsByStudent(studentId, limit, offset);
    } else if (quizId && typeof quizId === 'string') {
      attempts = await listQuizAttemptsByQuiz(quizId, limit, offset);
    } else {
      return res.status(400).json({ error: 'quizId or studentId is required' });
    }
    
    res.json(attempts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function submitQuizAttemptHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { answers, timeSpent } = req.body;

    const existing = await findQuizAttemptById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Quiz attempt not found' });
    }

    if (req.user?.role === 'student' && existing.studentId !== req.user.id) {
      return res.status(403).json({ error: 'You can only submit your own attempts' });
    }

    if (existing.submittedAt) {
      return res.status(400).json({ error: 'This attempt has already been submitted' });
    }

    const quiz = await findQuizById(existing.quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const timeLimitMinutes = quiz.timeLimit ? parseInt(quiz.timeLimit as string, 10) : null;
    if (timeLimitMinutes && !isNaN(timeLimitMinutes) && existing.startedAt) {
      const elapsed = (Date.now() - new Date(existing.startedAt).getTime()) / 1000 / 60;
      if (elapsed > timeLimitMinutes) {
        return res.status(400).json({ error: 'Time limit exceeded for this attempt' });
      }
    }

    const questions = await listQuestionsByQuiz(existing.quizId, 1000, 0);
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedAnswers: any = {};

    for (const question of questions) {
      const points = parseInt(question.points as string, 10) || 0;
      totalPoints += points;
      const studentAnswer = answers?.[question.id];
      const correctAnswer = question.correctAnswer;

      if (question.type === 'multiple_choice' || question.type === 'true_false') {
        if (studentAnswer && correctAnswer && studentAnswer === correctAnswer) {
          earnedPoints += points;
          gradedAnswers[question.id] = { correct: true, points };
        } else {
          gradedAnswers[question.id] = { correct: false, points: 0 };
        }
      } else {
        gradedAnswers[question.id] = { pending: true, points: 0 };
      }
    }

    const score = totalPoints > 0 ? `${Math.round((earnedPoints / totalPoints) * 100)}%` : '0%';
    const passingScoreNum = quiz.passingScore ? parseInt(quiz.passingScore as string, 10) : null;
    const passed = passingScoreNum && !isNaN(passingScoreNum)
      ? (earnedPoints / totalPoints) * 100 >= passingScoreNum
      : earnedPoints >= totalPoints * 0.6;

    const attempt = await updateQuizAttempt(id, {
      answers,
      score,
      passed: passed ? 'true' : 'false',
      timeSpent,
      feedback: JSON.stringify(gradedAnswers),
      submittedAt: new Date(),
    });

    res.json(attempt);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function deleteQuizAttemptHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    
    const existing = await findQuizAttemptById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Quiz attempt not found' });
    }

    if (req.user?.role === 'student' && existing.studentId !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own attempts' });
    }

    const attempt = await deleteQuizAttempt(id);
    res.json(attempt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
