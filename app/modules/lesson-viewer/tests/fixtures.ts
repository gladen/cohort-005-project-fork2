import { createTestDb, seedBaseData } from "~/test/setup";
import * as schema from "~/db/schema";
import { QuestionType } from "~/db/schema";
import { createLessonViewer } from "../index.server";

/**
 * A course with two modules, inserted out of order, and three lessons. The
 * course outline and quizzes belong to authoring, not to this module, so the
 * fixture writes them directly.
 */
export function lessonViewerFixture() {
  const db = createTestDb();
  const base = seedBaseData(db);

  const insertModule = (title: string, position: number) =>
    db
      .insert(schema.modules)
      .values({ courseId: base.course.id, title, position })
      .returning()
      .get();
  const second = insertModule("Second", 2);
  const first = insertModule("First", 1);

  const insertLesson = (moduleId: number, title: string, position: number) =>
    db
      .insert(schema.lessons)
      .values({
        moduleId,
        title,
        position,
        videoUrl: "https://youtu.be/x",
        durationMinutes: 10,
      })
      .returning()
      .get();
  const lessonB = insertLesson(first.id, "B", 2);
  const lessonA = insertLesson(first.id, "A", 1);
  const lessonC = insertLesson(second.id, "C", 1);

  return {
    db,
    base,
    modules: { first, second },
    lessons: { a: lessonA, b: lessonB, c: lessonC },
    viewer: createLessonViewer(db),
  };
}

export type Fixture = ReturnType<typeof lessonViewerFixture>;

/** A quiz with a multiple-choice and a true/false question. */
export function addQuiz({ db, lessons }: Fixture) {
  const quiz = db
    .insert(schema.quizzes)
    .values({ lessonId: lessons.a.id, title: "Check", passingScore: 0.7 })
    .returning()
    .get();

  const addQuestion = (
    questionType: QuestionType,
    position: number,
    options: Array<[string, boolean]>
  ) => {
    const question = db
      .insert(schema.quizQuestions)
      .values({
        quizId: quiz.id,
        questionText: `Q${position}`,
        questionType,
        position,
      })
      .returning()
      .get();
    const [right, wrong] = options.map(([optionText, isCorrect]) =>
      db
        .insert(schema.quizOptions)
        .values({ questionId: question.id, optionText, isCorrect })
        .returning()
        .get()
    );
    return { id: question.id, right: right.id, wrong: wrong.id };
  };

  const multiple = addQuestion(QuestionType.MultipleChoice, 1, [
    ["Right", true],
    ["Wrong", false],
  ]);
  const trueFalse = addQuestion(QuestionType.TrueFalse, 2, [
    ["True", true],
    ["False", false],
  ]);
  return { quiz, multiple, trueFalse };
}
