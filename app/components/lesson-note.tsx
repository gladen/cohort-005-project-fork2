import { useState } from "react";
import { useFetcher } from "react-router";
import { Lock, NotebookPen } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import {
  noteEditorState,
  type NoteEditorState,
  type NoteStatus,
  type SavedNote,
} from "~/modules/lesson-note";
import { cn, formatRelativeTime } from "~/lib/utils";

/** The Student's private Note on a Lesson, styled to sit with the discussion card. */
export function LessonNote({ note }: { note: SavedNote | null }) {
  const fetcher = useFetcher<{ ok: boolean; error?: string }>();
  const [draft, setDraft] = useState(note?.body ?? "");
  const isSaving = fetcher.state !== "idle";
  const error = isSaving ? undefined : fetcher.data?.error;
  const state = noteEditorState(draft, note);

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <NoteHeader />
        <fetcher.Form method="post" className="space-y-2">
          <input type="hidden" name="intent" value="save-note" />
          <Textarea
            name="body"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Jot down what you want to remember from this lesson..."
            aria-label="Your notes"
            aria-invalid={state.tooLong || undefined}
            className="min-h-32 resize-y"
          />
          <NoteFooter state={state} isSaving={isSaving} error={error} />
        </fetcher.Form>
      </CardContent>
    </Card>
  );
}

function NoteHeader() {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <NotebookPen className="size-5 text-primary" />
        <h2 className="text-xl font-semibold">Your notes</h2>
      </div>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Lock className="size-3" />
        Only you can see these
      </span>
    </div>
  );
}

function NoteFooter({
  state,
  isSaving,
  error,
}: {
  state: NoteEditorState;
  isSaving: boolean;
  error: string | undefined;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button type="submit" size="sm" disabled={isSaving || !state.canSave}>
        {isSaving ? "Saving..." : "Save note"}
      </Button>
      <output
        suppressHydrationWarning
        className={cn(
          "text-xs",
          error ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {error ?? statusText(state.status)}
      </output>
      <span
        className={cn(
          "ml-auto text-xs",
          state.tooLong ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {state.length} / {state.maxLength}
      </span>
    </div>
  );
}

function statusText(status: NoteStatus): string {
  switch (status.kind) {
    case "empty":
      return "";
    case "unsaved":
      return "Unsaved changes";
    case "cleared":
      return "A note can't be empty. Undo to keep your saved note.";
    case "too-long":
      return "Too long to save";
    case "saved":
      return `Saved · last edited ${formatRelativeTime(status.updatedAt)}`;
  }
}
