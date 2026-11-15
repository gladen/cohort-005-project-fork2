export type NoteStatus =
  | { kind: "empty" }
  | { kind: "unsaved" }
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
  saved: { body: string; updatedAt: string } | null;
  maxLength: number;
}): NoteEditorState {
  // The server trims before it stores, so compare what it would store.
  const trimmed = draft.trim();
  const length = trimmed.length;
  const tooLong = length > maxLength;
  const unchanged = trimmed === (saved?.body ?? "");

  const status: NoteStatus = tooLong
    ? { kind: "too-long" }
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
