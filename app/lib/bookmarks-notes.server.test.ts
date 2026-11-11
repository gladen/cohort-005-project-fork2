import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, seedBaseData } from "~/test/setup";
import * as schema from "~/db/schema";
import { UserRole } from "~/db/schema";
import { isBookmarked, listBookmarks, toggleBookmark } from "./bookmarks.server";
import { getNote, listNotes, saveNote } from "./notes.server";
import { MAX_NOTE_LENGTH } from "./notes";

type TestDb = ReturnType<typeof createTestDb>;

const NOW = new Date(2026, 9, 6, 12, 0, 0);
const LATER = new Date(2026, 9, 7, 9, 30, 0);
const LATEST = new Date(2026, 9, 8, 18, 0, 0);

let db: TestDb;
let base: ReturnType<typeof seedBaseData>;
let lessonIds: number[];

beforeEach(() => {
  db = createTestDb();
  base = seedBaseData(db);

  const module = db
    .insert(schema.modules)
    .values({ courseId: base.course.id, title: "Basics", position: 1 })
    .returning()
    .get();

  lessonIds = [1, 2, 3].map(
    (position) =>
      db
        .insert(schema.lessons)
        .values({ moduleId: module.id, title: `Lesson ${position}`, position })
        .returning()
        .get().id
  );
});

function addStudent(name: string) {
  return db
    .insert(schema.users)
    .values({
      name,
      email: `${name.toLowerCase()}@example.com`,
      role: UserRole.Student,
    })
    .returning()
    .get();
}

describe("toggling a Bookmark", () => {
  it("bookmarks a Lesson with no Bookmark, and un-bookmarks it on the next toggle", () => {
    const [lessonId] = lessonIds;

    expect(toggleBookmark(db, base.user.id, lessonId, NOW)).toBe(true);
    expect(isBookmarked(db, base.user.id, lessonId)).toBe(true);

    expect(toggleBookmark(db, base.user.id, lessonId, LATER)).toBe(false);
    expect(isBookmarked(db, base.user.id, lessonId)).toBe(false);
  });

  it("never leaves a Student with two Bookmarks on one Lesson", () => {
    const [lessonId] = lessonIds;
    toggleBookmark(db, base.user.id, lessonId, NOW);

    expect(() =>
      db
        .insert(schema.bookmarks)
        .values({ userId: base.user.id, lessonId })
        .run()
    ).toThrow();
    expect(listBookmarks(db, base.user.id)).toHaveLength(1);
  });
});

describe("saving a Note", () => {
  it("creates a Note, trimmed, on a Lesson with none", () => {
    const [lessonId] = lessonIds;

    saveNote(db, base.user.id, lessonId, "  Watch the bit at 3:10  ", NOW);

    expect(getNote(db, base.user.id, lessonId)).toMatchObject({
      body: "Watch the bit at 3:10",
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    });
  });

  it("replaces the body and moves the last-edited time on when saved again", () => {
    const [lessonId] = lessonIds;
    saveNote(db, base.user.id, lessonId, "First draft", NOW);

    saveNote(db, base.user.id, lessonId, "Second draft", LATER);

    expect(getNote(db, base.user.id, lessonId)).toMatchObject({
      body: "Second draft",
      createdAt: NOW.toISOString(),
      updatedAt: LATER.toISOString(),
    });
    expect(listNotes(db, base.user.id)).toHaveLength(1);
  });

  it("keeps characters like # and * exactly as typed", () => {
    const [lessonId] = lessonIds;

    saveNote(db, base.user.id, lessonId, "# not a heading\n*not bold*", NOW);

    expect(getNote(db, base.user.id, lessonId)?.body).toBe(
      "# not a heading\n*not bold*"
    );
  });

  it(`accepts a Note of exactly ${MAX_NOTE_LENGTH} characters`, () => {
    const [lessonId] = lessonIds;
    const body = "a".repeat(MAX_NOTE_LENGTH);

    expect(saveNote(db, base.user.id, lessonId, body, NOW).ok).toBe(true);
    expect(getNote(db, base.user.id, lessonId)?.body).toBe(body);
  });

  it(`refuses a Note over ${MAX_NOTE_LENGTH} characters, and stores nothing`, () => {
    const [lessonId] = lessonIds;

    expect(
      saveNote(db, base.user.id, lessonId, "a".repeat(MAX_NOTE_LENGTH + 1), NOW)
    ).toEqual({
      ok: false,
      error: "A note must be 2,000 characters or fewer.",
    });
    expect(getNote(db, base.user.id, lessonId)).toBeUndefined();
  });

  it("clears the Note when saved empty", () => {
    const [lessonId] = lessonIds;
    saveNote(db, base.user.id, lessonId, "Something", NOW);

    saveNote(db, base.user.id, lessonId, "   ", LATER);

    expect(getNote(db, base.user.id, lessonId)).toBeUndefined();
  });
});

describe("the Saved lists", () => {
  it("hold only the Student's own rows, newest first, with Lesson and Course", () => {
    const other = addStudent("Ben");
    const [first, second, third] = lessonIds;

    toggleBookmark(db, base.user.id, first, NOW);
    toggleBookmark(db, base.user.id, third, LATEST);
    toggleBookmark(db, base.user.id, second, LATER);
    toggleBookmark(db, other.id, first, LATEST);

    saveNote(db, base.user.id, first, "Old", NOW);
    saveNote(db, base.user.id, second, "Newer", LATER);
    saveNote(db, other.id, first, "Not yours", LATEST);
    saveNote(db, base.user.id, first, "Edited last", LATEST);

    expect(listBookmarks(db, base.user.id)).toEqual([
      expect.objectContaining({
        lessonId: third,
        lessonTitle: "Lesson 3",
        courseTitle: base.course.title,
        courseSlug: base.course.slug,
      }),
      expect.objectContaining({ lessonId: second }),
      expect.objectContaining({ lessonId: first }),
    ]);

    expect(listNotes(db, base.user.id)).toEqual([
      expect.objectContaining({
        lessonId: first,
        body: "Edited last",
        courseTitle: base.course.title,
        courseSlug: base.course.slug,
      }),
      expect.objectContaining({ lessonId: second, body: "Newer" }),
    ]);
  });
});
