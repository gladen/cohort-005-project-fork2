import { describe, expect, it } from "vitest";
import { noteEditorState } from "../index";
import { MAX_NOTE_LENGTH } from "~/lib/notes";

const saved = {
  body: "Generics are type parameters",
  updatedAt: "2026-11-01T10:00:00.000Z",
};

describe("noteEditorState", () => {
  it("is empty and unsaveable when there is no note and no draft", () => {
    expect(noteEditorState("", null)).toEqual({
      length: 0,
      maxLength: MAX_NOTE_LENGTH,
      tooLong: false,
      canSave: false,
      status: { kind: "empty" },
    });
  });

  it("does not offer to save whitespace", () => {
    const state = noteEditorState("   \n ", null);
    expect(state.canSave).toBe(false);
    expect(state.length).toBe(0);
    expect(state.status).toEqual({ kind: "empty" });
  });

  it("offers to save a new draft", () => {
    const state = noteEditorState("First thought", null);
    expect(state.canSave).toBe(true);
    expect(state.length).toBe("First thought".length);
    expect(state.status).toEqual({ kind: "unsaved" });
  });

  it("shows when the saved note was last edited while the draft matches it", () => {
    const state = noteEditorState(saved.body, saved);
    expect(state.canSave).toBe(false);
    expect(state.status).toEqual({ kind: "saved", updatedAt: saved.updatedAt });
  });

  it("treats surrounding whitespace as no change, since the server trims it", () => {
    const state = noteEditorState(`  ${saved.body}\n`, saved);
    expect(state.canSave).toBe(false);
    expect(state.status.kind).toBe("saved");
  });

  it("marks an edited draft as unsaved", () => {
    const state = noteEditorState(`${saved.body}!`, saved);
    expect(state.canSave).toBe(true);
    expect(state.status).toEqual({ kind: "unsaved" });
  });

  it("marks a cleared note as unsaved but not saveable", () => {
    const state = noteEditorState("", saved);
    expect(state.canSave).toBe(false);
    expect(state.status).toEqual({ kind: "unsaved" });
  });

  it("accepts a draft of exactly the maximum length", () => {
    const state = noteEditorState("a".repeat(MAX_NOTE_LENGTH), null);
    expect(state.tooLong).toBe(false);
    expect(state.canSave).toBe(true);
  });

  it("refuses a draft over the maximum length", () => {
    const state = noteEditorState("a".repeat(MAX_NOTE_LENGTH + 1), null);
    expect(state.tooLong).toBe(true);
    expect(state.canSave).toBe(false);
    expect(state.length).toBe(MAX_NOTE_LENGTH + 1);
    expect(state.status).toEqual({ kind: "too-long" });
  });
});
