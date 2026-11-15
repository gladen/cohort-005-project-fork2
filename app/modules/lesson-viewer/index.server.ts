import { db as appDb } from "~/db";
import type { Db } from "./lib/db";
import {
  flattenCourseLessons,
  getCourseWithDetails,
  getLessonById,
  getModuleById,
  getUserById,
} from "./lib/course";
import { markLessonComplete, visitLesson } from "./lib/progress";
import { computeResult, getQuizById, lessonQuiz } from "./lib/quiz";
import { getCommentById, getLessonThread, renderThread } from "./lib/thread";

export type { Db } from "./lib/db";
export type { FlatLesson } from "./lib/course";
export type { LessonQuiz } from "./lib/quiz";
export type { ThreadComment } from "./lib/thread";

/**
 * The data behind the Lesson page, bound to a database. The app uses
 * `lessonViewer`; tests build their own against a test database.
 */
export function createLessonViewer(database: Db) {
  return {
    courseWithDetails: (courseId: number) =>
      getCourseWithDetails(database, courseId),
    lesson: (lessonId: number) => getLessonById(database, lessonId),
    module: (moduleId: number) => getModuleById(database, moduleId),
    user: (userId: number) => getUserById(database, userId),
    flattenCourseLessons,
    visitLesson: (visit: Parameters<typeof visitLesson>[1]) =>
      visitLesson(database, visit),
    markLessonComplete: (userId: number, lessonId: number) =>
      markLessonComplete(database, userId, lessonId),
    lessonQuiz: (lessonId: number, userId: number | null) =>
      lessonQuiz(database, lessonId, userId),
    quiz: (quizId: number) => getQuizById(database, quizId),
    /** Scores and records an attempt; null when the quiz could not be scored. */
    submitQuiz: (
      userId: number,
      quizId: number,
      selectedAnswers: Record<number, number>
    ) => computeResult(database, { userId, quizId, selectedAnswers }),
    comment: (commentId: number) => getCommentById(database, commentId),
    /** The Lesson's Discussion, nested and rendered to sanitised HTML. */
    renderedThread: (lessonId: number) =>
      renderThread(getLessonThread(database, lessonId)),
  };
}

export const lessonViewer = createLessonViewer(appDb);
