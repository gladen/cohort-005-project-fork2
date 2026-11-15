import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import * as schema from "~/db/schema";
import { addQuiz, lessonViewerFixture, type Fixture } from "./fixtures";

let f: Fixture;
let q: ReturnType<typeof addQuiz>;

beforeEach(() => {
  f = lessonViewerFixture();
  q = addQuiz(f);
});

describe("lessonQuiz", () => {
  it("has no quiz for a lesson without one", () => {
    expect(f.viewer.lessonQuiz(f.lessons.b.id, f.base.user.id)).toEqual({
      quiz: null,
      bestAttempt: null,
    });
  });

  it("returns the questions without revealing the answers", () => {
    const { quiz, bestAttempt } = f.viewer.lessonQuiz(
      f.lessons.a.id,
      f.base.user.id
    );
    expect(bestAttempt).toBeNull();
    expect(quiz?.questions.map((question) => question.questionText)).toEqual([
      "Q1",
      "Q2",
    ]);
    expect(quiz?.questions[0].options[0]).toEqual({
      id: q.multiple.right,
      optionText: "Right",
    });
  });

  it("reports the best attempt", () => {
    f.viewer.submitQuiz(f.base.user.id, q.quiz.id, { [q.multiple.wrong]: 0 });
    f.viewer.submitQuiz(f.base.user.id, q.quiz.id, {
      [q.multiple.id]: q.multiple.right,
      [q.trueFalse.id]: q.trueFalse.right,
    });
    expect(
      f.viewer.lessonQuiz(f.lessons.a.id, f.base.user.id).bestAttempt
    ).toEqual({
      score: 1,
      passed: true,
    });
  });
});

describe("submitQuiz", () => {
  it("passes with an A when every answer is right", () => {
    const result = f.viewer.submitQuiz(f.base.user.id, q.quiz.id, {
      [q.multiple.id]: q.multiple.right,
      [q.trueFalse.id]: q.trueFalse.right,
    });
    expect(result).toMatchObject({
      score: 1,
      passed: true,
      grade: "A",
      totalCorrect: 2,
      totalQuestions: 2,
    });
  });

  it("fails with an F at half marks, and shows the right answer", () => {
    const result = f.viewer.submitQuiz(f.base.user.id, q.quiz.id, {
      [q.multiple.id]: q.multiple.wrong,
      [q.trueFalse.id]: q.trueFalse.right,
    });
    expect(result).toMatchObject({ score: 0.5, passed: false, grade: "F" });
    expect(result?.questionResults[0]).toEqual({
      questionId: q.multiple.id,
      correct: false,
      selectedOptionId: q.multiple.wrong,
      correctOptionId: q.multiple.right,
    });
  });

  it("counts an unanswered question as wrong", () => {
    const result = f.viewer.submitQuiz(f.base.user.id, q.quiz.id, {
      [q.multiple.id]: q.multiple.right,
    });
    expect(result?.questionResults[1]).toEqual({
      questionId: q.trueFalse.id,
      correct: false,
      selectedOptionId: null,
      correctOptionId: null,
    });
  });

  it("records each answer given with the attempt", () => {
    const result = f.viewer.submitQuiz(f.base.user.id, q.quiz.id, {
      [q.multiple.id]: q.multiple.wrong,
    });
    expect(
      f.db
        .select()
        .from(schema.quizAnswers)
        .where(eq(schema.quizAnswers.attemptId, result?.attemptId ?? -1))
        .all()
        .map(({ questionId, selectedOptionId }) => ({
          questionId,
          selectedOptionId,
        }))
    ).toEqual([
      { questionId: q.multiple.id, selectedOptionId: q.multiple.wrong },
    ]);
  });

  it("scores a submission with no answers as zero", () => {
    expect(f.viewer.submitQuiz(f.base.user.id, q.quiz.id, {})).toMatchObject({
      score: 0,
      passed: false,
      grade: "F",
      totalCorrect: 0,
      totalQuestions: 2,
    });
  });

  it("cannot score a quiz that does not exist", () => {
    expect(f.viewer.submitQuiz(f.base.user.id, 9999, {})).toBeNull();
  });

  it("finds a quiz by id", () => {
    expect(f.viewer.quiz(q.quiz.id)?.lessonId).toBe(f.lessons.a.id);
  });
});
