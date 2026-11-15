import { and, desc, eq, inArray } from "drizzle-orm";
import {
  QuestionType,
  quizAnswers,
  quizAttempts,
  quizOptions,
  quizQuestions,
  quizzes,
} from "~/db/schema";
import type { Db } from "./db";

export function getQuizByLessonId(db: Db, lessonId: number) {
  return db.select().from(quizzes).where(eq(quizzes.lessonId, lessonId)).get();
}

function optionsByQuestion(db: Db, questionIds: number[]) {
  const options =
    questionIds.length === 0
      ? []
      : db
          .select()
          .from(quizOptions)
          .where(inArray(quizOptions.questionId, questionIds))
          .all();
  const byQuestion = new Map<number, (typeof options)[number][]>();
  for (const option of options) {
    const list = byQuestion.get(option.questionId) ?? [];
    list.push(option);
    byQuestion.set(option.questionId, list);
  }
  return byQuestion;
}

function questionsOf(db: Db, quizId: number) {
  return db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))
    .orderBy(quizQuestions.position)
    .all();
}

export function getQuizWithQuestions(db: Db, quizId: number) {
  const quiz = getQuizById(db, quizId);
  if (!quiz) return null;

  const questions = questionsOf(db, quizId);
  const options = optionsByQuestion(
    db,
    questions.map((question) => question.id)
  );
  return {
    ...quiz,
    questions: questions.map((question) => ({
      ...question,
      options: options.get(question.id) ?? [],
    })),
  };
}

export function getBestAttempt(db: Db, userId: number, quizId: number) {
  return db
    .select()
    .from(quizAttempts)
    .where(
      and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId))
    )
    .orderBy(desc(quizAttempts.score))
    .limit(1)
    .get();
}

export function calculateGrade(score: number): string {
  if (score >= 0.9) return "A";
  if (score >= 0.8) return "B";
  if (score >= 0.7) return "C";
  if (score >= 0.6) return "D";
  return "F";
}

type QuestionResult = {
  questionId: number;
  correct: boolean;
  selectedOptionId: number | null;
  correctOptionId: number | null;
};

export type QuizSubmission = {
  userId: number;
  quizId: number;
  selectedAnswers: Record<number, number>;
};

const SCORED_QUESTION_TYPES = new Set<string>([
  QuestionType.MultipleChoice,
  QuestionType.TrueFalse,
]);

function scoreQuestions(
  db: Db,
  quizId: number,
  selectedAnswers: Record<number, number>
): QuestionResult[] {
  const questions = questionsOf(db, quizId);
  const options = optionsByQuestion(
    db,
    questions.map((question) => question.id)
  );
  return questions.map((question) => {
    const selected = selectedAnswers[question.id];
    if (!selected) {
      return {
        questionId: question.id,
        correct: false,
        selectedOptionId: null,
        correctOptionId: null,
      };
    }
    const correctOptionId = SCORED_QUESTION_TYPES.has(question.questionType)
      ? ((options.get(question.id) ?? []).find((o) => o.isCorrect === true)
          ?.id ?? null)
      : null;
    return {
      questionId: question.id,
      correct: selected === correctOptionId,
      selectedOptionId: selected,
      correctOptionId,
    };
  });
}

function recordAttempt(
  db: Db,
  submission: QuizSubmission & { score: number; passed: boolean },
  questionResults: QuestionResult[]
) {
  return db.transaction((tx) => {
    const attempt = tx
      .insert(quizAttempts)
      .values({
        userId: submission.userId,
        quizId: submission.quizId,
        score: submission.score,
        passed: submission.passed,
      })
      .returning()
      .get();
    const answers = questionResults.flatMap((result) =>
      result.selectedOptionId === null
        ? []
        : [
            {
              attemptId: attempt.id,
              questionId: result.questionId,
              selectedOptionId: result.selectedOptionId,
            },
          ]
    );
    if (answers.length > 0) tx.insert(quizAnswers).values(answers).run();
    return attempt;
  });
}

export function computeResult(db: Db, submission: QuizSubmission) {
  try {
    if (!getQuizById(db, submission.quizId)) {
      console.error("quiz not found");
      return null;
    }

    const questionResults = scoreQuestions(
      db,
      submission.quizId,
      submission.selectedAnswers
    );
    const correct = questionResults.filter((result) => result.correct).length;
    const total = questionResults.length;
    const score = total > 0 ? correct / total : 0;
    const passed = score > 0.7;
    const attempt = recordAttempt(
      db,
      { ...submission, score, passed },
      questionResults
    );

    return {
      attemptId: attempt.id,
      score,
      passed,
      grade: calculateGrade(score),
      totalCorrect: correct,
      totalQuestions: total,
      questionResults,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

export function getQuizById(db: Db, quizId: number) {
  return db.select().from(quizzes).where(eq(quizzes.id, quizId)).get();
}

export type LessonQuiz = {
  id: number;
  title: string;
  passingScore: number;
  questions: Array<{
    id: number;
    questionText: string;
    questionType: string;
    position: number;
    options: Array<{ id: number; optionText: string }>;
  }>;
};

/** The Lesson's quiz without its answers, and the Student's best attempt. */
export function lessonQuiz(
  db: Db,
  lessonId: number,
  userId: number | null
): {
  quiz: LessonQuiz | null;
  bestAttempt: { score: number; passed: boolean } | null;
} {
  const quizRecord = getQuizByLessonId(db, lessonId);
  if (!quizRecord) return { quiz: null, bestAttempt: null };

  let quiz: LessonQuiz | null = null;
  const quizData = getQuizWithQuestions(db, quizRecord.id);
  if (quizData) {
    // Strip isCorrect from options so answers aren't leaked to the client
    quiz = {
      id: quizData.id,
      title: quizData.title,
      passingScore: quizData.passingScore,
      questions: quizData.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        position: q.position,
        options: q.options.map((o) => ({
          id: o.id,
          optionText: o.optionText,
        })),
      })),
    };
  }

  const best = userId ? getBestAttempt(db, userId, quizRecord.id) : undefined;
  return {
    quiz,
    bestAttempt: best ? { score: best.score, passed: best.passed } : null,
  };
}
