import { MAX_NOTE_LENGTH } from "~/lib/notes";

export type NoteDraftStatus =
  | "empty"
  | "too-long"
  | "unsaved"
  | "saving"
  | "saved"
  | "error";

export type NoteDraftInput = {
  draft: string;
  /** The body the server holds, or null before the first save. */
  savedBody: string | null;
  saving: boolean;
  /** The last save's error, shown until the next save. */
  error?: string;
};

export type NoteDraft = {
  /** Characters that count against the limit: the server trims before saving. */
  length: number;
  max: number;
  tooLong: boolean;
  canSave: boolean;
  status: NoteDraftStatus;
};

function statusOf(
  input: NoteDraftInput,
  trimmed: string,
  changed: boolean
): NoteDraftStatus {
  if (input.saving) return "saving";
  if (input.error) return "error";
  if (trimmed.length > MAX_NOTE_LENGTH) return "too-long";
  if (changed) return trimmed.length === 0 ? "empty" : "unsaved";
  return "saved";
}

export function describeDraft(input: NoteDraftInput): NoteDraft {
  const trimmed = input.draft.trim();
  const changed = trimmed !== input.savedBody;
  const tooLong = trimmed.length > MAX_NOTE_LENGTH;
  return {
    length: trimmed.length,
    max: MAX_NOTE_LENGTH,
    tooLong,
    canSave: changed && trimmed.length > 0 && !tooLong && !input.saving,
    status: statusOf(input, trimmed, changed),
  };
}
