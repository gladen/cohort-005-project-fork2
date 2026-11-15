import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "~/db/schema";
import { LessonProgressStatus, UserRole } from "~/db/schema";
import { markdown } from "~/lib/text";
import { lessonViewerFixture, type Fixture } from "./fixtures";

let f: Fixture;

beforeEach(() => {
  f = lessonViewerFixture();
});

describe("course outline", () => {
  it("orders modules and their lessons by position", () => {
    const course = f.viewer.courseWithDetails(f.base.course.id);
    expect(course?.instructorName).toBe("Test Instructor");
    expect(course?.modules.map((m) => m.title)).toEqual(["First", "Second"]);
    expect(course?.modules[0].lessons.map((l) => l.title)).toEqual(["A", "B"]);
  });

  it("flattens the outline for previous and next links", () => {
    const course = f.viewer.courseWithDetails(f.base.course.id);
    if (!course) throw new Error("course missing");
    expect(f.viewer.flattenCourseLessons(course)).toEqual([
      {
        id: f.lessons.a.id,
        title: "A",
        moduleId: f.modules.first.id,
        moduleTitle: "First",
      },
      {
        id: f.lessons.b.id,
        title: "B",
        moduleId: f.modules.first.id,
        moduleTitle: "First",
      },
      {
        id: f.lessons.c.id,
        title: "C",
        moduleId: f.modules.second.id,
        moduleTitle: "Second",
      },
    ]);
  });

  it("finds nothing for an unknown course", () => {
    expect(f.viewer.courseWithDetails(9999)).toBeNull();
  });
});

describe("visitLesson", () => {
  const visit = (lesson = f.lessons.a) =>
    f.viewer.visitLesson({
      userId: f.base.user.id,
      courseId: f.base.course.id,
      lesson,
    });

  it("marks a first visit in progress", () => {
    const progress = visit();
    expect(progress.lessonStatus).toBe(LessonProgressStatus.InProgress);
    expect(progress.lessonProgressMap).toEqual({
      [f.lessons.a.id]: LessonProgressStatus.InProgress,
    });
  });

  it("keeps a completed lesson completed", () => {
    f.viewer.markLessonComplete(
      f.base.user.id,
      f.lessons.a.id,
      new Date("2026-11-01T10:00:00.000Z")
    );
    expect(visit().lessonStatus).toBe(LessonProgressStatus.Completed);
  });

  it("resumes from the last position and reports how far was watched", () => {
    const at = (positionSeconds: number, createdAt: string) =>
      f.db
        .insert(schema.videoWatchEvents)
        .values({
          userId: f.base.user.id,
          lessonId: f.lessons.a.id,
          eventType: "progress",
          positionSeconds,
          createdAt,
        })
        .run();
    at(450, "2026-11-01T10:00:00.000Z");
    at(120, "2026-11-01T11:00:00.000Z");

    const progress = visit();
    expect(progress.lastWatchPosition).toBe(120);
    expect(progress.watchProgress).toBe(75);
  });

  it("reports no watch state for a lesson without a video", () => {
    const progress = visit({ ...f.lessons.a, videoUrl: null });
    expect(progress.lastWatchPosition).toBe(0);
    expect(progress.watchProgress).toBe(0);
  });
});

describe("renderedThread", () => {
  const post = (
    userId: number,
    body: string,
    extra: Partial<typeof schema.comments.$inferInsert> = {}
  ) =>
    f.db
      .insert(schema.comments)
      .values({
        lessonId: f.lessons.a.id,
        userId,
        body: markdown(body),
        ...extra,
      })
      .returning()
      .get();

  it("nests replies, renders bodies and badges the instructor", async () => {
    const question = post(f.base.user.id, "**Why?**", {
      createdAt: "2026-11-01T10:00:00.000Z",
    });
    post(f.base.instructor.id, "Because.", {
      parentId: question.id,
      createdAt: "2026-11-01T11:00:00.000Z",
    });

    const [thread] = await f.viewer.renderedThread(f.lessons.a.id);
    expect(thread.bodyHtml).toContain("<strong>Why?</strong>");
    expect(thread.author.isInstructor).toBe(false);
    expect(thread.replies).toHaveLength(1);
    expect(thread.replies[0].author.isInstructor).toBe(true);
  });

  it("drops a deleted question with no replies, and blanks one with replies", async () => {
    post(f.base.user.id, "gone", { deletedAt: "2026-11-02T00:00:00.000Z" });
    const kept = post(f.base.user.id, "secret", {
      deletedAt: "2026-11-02T00:00:00.000Z",
    });
    const admin = f.db
      .insert(schema.users)
      .values({ name: "Admin", email: "a@example.com", role: UserRole.Admin })
      .returning()
      .get();
    post(admin.id, "reply", { parentId: kept.id });

    const thread = await f.viewer.renderedThread(f.lessons.a.id);
    expect(thread).toHaveLength(1);
    expect(thread[0]).toMatchObject({ deleted: true, body: "", bodyHtml: "" });
    expect(thread[0].replies[0].author.isPlatformAdmin).toBe(true);
  });
});
