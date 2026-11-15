import { MAX_NOTE_LENGTH } from "~/lib/notes";
import {
  deriveNoteEditorState,
  type NoteEditorState,
} from "./lib/editor-state";

export type { NoteEditorState, NoteStatus } from "./lib/editor-state";

/**
 * What the Lesson page's note editor shows for a draft: the character count,
 * whether Save is worth pressing, and the status line beside it.
 */
export function noteEditorState(
  draft: string,
  saved: { body: string; updatedAt: string } | null
): NoteEditorState {
  return deriveNoteEditorState({ draft, saved, maxLength: MAX_NOTE_LENGTH });
}
