import {
  describeDraft,
  type NoteDraft,
  type NoteDraftInput,
} from "./lib/note-draft";

export type { NoteDraft, NoteDraftStatus } from "./lib/note-draft";

/**
 * What the Lesson page's Note form shows for the Student's current draft:
 * the character count against the limit, whether Save is worth pressing,
 * and one status for the line beside it. Saving and an error from the last
 * save outrank everything else, so the Student always sees why a save did
 * not land.
 */
export function noteDraft(input: NoteDraftInput): NoteDraft {
  return describeDraft(input);
}
