/** The Student's Note as last stored. */
export type SavedNote = { body: string; updatedAt: string };

export type NoteStatus =
  | { kind: "empty" }
  | { kind: "unsaved" }
  | { kind: "cleared" }
  | { kind: "too-long" }
  | { kind: "saved"; updatedAt: string };

export type NoteEditorState = {
  length: number;
  maxLength: number;
  tooLong: boolean;
  canSave: boolean;
  status: NoteStatus;
};

export function deriveNoteEditorState({
  draft,
  saved,
  maxLength,
}: {
  draft: string;
  saved: SavedNote | null;
  maxLength: number;
}): NoteEditorState {
  // The server trims before it stores, so compare what it would store.
  const trimmed = draft.trim();
  const length = trimmed.length;
  const tooLong = length > maxLength;
  const unchanged = trimmed === (saved?.body ?? "");

  const status: NoteStatus = tooLong
    ? { kind: "too-long" }
    : length === 0 && saved
      ? { kind: "cleared" }
      : !unchanged
        ? { kind: "unsaved" }
        : saved
          ? { kind: "saved", updatedAt: saved.updatedAt }
          : { kind: "empty" };

  return {
    length,
    maxLength,
    tooLong,
    canSave: length > 0 && !tooLong && !unchanged,
    status,
  };
}
