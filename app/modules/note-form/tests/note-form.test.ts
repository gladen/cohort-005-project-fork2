import { describe, it, expect } from "vitest";
import { noteDraft } from "../index";
import { MAX_NOTE_LENGTH } from "~/lib/notes";

const idle = { saving: false } as const;

describe("noteDraft", () => {
  it("is empty and unsaveable before the Student writes anything", () => {
    expect(noteDraft({ ...idle, draft: "", savedBody: null })).toEqual({
      length: 0,
      max: MAX_NOTE_LENGTH,
      tooLong: false,
      canSave: false,
      status: "empty",
    });
  });

  it("treats whitespace alone as empty", () => {
    const draft = noteDraft({ ...idle, draft: "   \n ", savedBody: null });
    expect(draft.status).toBe("empty");
    expect(draft.canSave).toBe(false);
  });

  it("counts the trimmed draft, as the server saves it", () => {
    expect(
      noteDraft({ ...idle, draft: "  abc  ", savedBody: null }).length
    ).toBe(3);
  });

  it("can save a new draft and marks it unsaved", () => {
    const draft = noteDraft({ ...idle, draft: "Generics", savedBody: null });
    expect(draft.status).toBe("unsaved");
    expect(draft.canSave).toBe(true);
  });

  it("is saved, with nothing to save, when the draft matches the Note", () => {
    const draft = noteDraft({
      ...idle,
      draft: "Generics\n",
      savedBody: "Generics",
    });
    expect(draft.status).toBe("saved");
    expect(draft.canSave).toBe(false);
  });

  it("is unsaved once the Student edits a saved Note", () => {
    const draft = noteDraft({
      ...idle,
      draft: "Generics!",
      savedBody: "Generics",
    });
    expect(draft.status).toBe("unsaved");
    expect(draft.canSave).toBe(true);
  });

  it("cannot save a cleared Note, since an empty Note is rejected", () => {
    const draft = noteDraft({ ...idle, draft: "", savedBody: "Generics" });
    expect(draft.status).toBe("empty");
    expect(draft.canSave).toBe(false);
  });

  it("allows a draft of exactly the limit", () => {
    const draft = noteDraft({
      ...idle,
      draft: "a".repeat(MAX_NOTE_LENGTH),
      savedBody: null,
    });
    expect(draft.tooLong).toBe(false);
    expect(draft.canSave).toBe(true);
    expect(draft.status).toBe("unsaved");
  });

  it("blocks a draft one character over the limit", () => {
    const draft = noteDraft({
      ...idle,
      draft: "a".repeat(MAX_NOTE_LENGTH + 1),
      savedBody: null,
    });
    expect(draft.tooLong).toBe(true);
    expect(draft.canSave).toBe(false);
    expect(draft.status).toBe("too-long");
  });

  it("cannot save again while a save is in flight", () => {
    const draft = noteDraft({
      draft: "Generics",
      savedBody: null,
      saving: true,
    });
    expect(draft.status).toBe("saving");
    expect(draft.canSave).toBe(false);
  });

  it("shows the last save's error over the draft's own status", () => {
    const draft = noteDraft({
      ...idle,
      draft: "Generics",
      savedBody: null,
      error: "Something went wrong",
    });
    expect(draft.status).toBe("error");
    expect(draft.canSave).toBe(true);
  });

  it("shows saving over an error", () => {
    expect(
      noteDraft({ draft: "x", savedBody: null, saving: true, error: "boom" })
        .status
    ).toBe("saving");
  });
});
