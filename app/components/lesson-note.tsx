import { useState, type KeyboardEvent } from "react";
import { Link, useFetcher } from "react-router";
import type { Route } from "../routes/+types/courses.$slug.lessons.$lessonId";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { NotebookPen } from "lucide-react";
import { cn, formatRelativeTime } from "~/lib/utils";
import { noteDraft, type NoteDraft } from "~/modules/note-form";

type SavedNote = Route.ComponentProps["loaderData"]["note"];

export function LessonNote({ note }: { note: SavedNote }) {
  const fetcher = useFetcher<{ ok: boolean; error?: string }>();
  const [body, setBody] = useState(note?.body ?? "");
  const draft = noteDraft({
    draft: body,
    savedBody: note?.body ?? null,
    saving: fetcher.state !== "idle",
    error: fetcher.data?.error,
  });

  function saveOnModEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || !(event.metaKey || event.ctrlKey)) return;
    event.preventDefault();
    if (draft.canSave) event.currentTarget.form?.requestSubmit();
  }

  return (
    <Card className="mb-8 gap-4">
      <NoteHeader />
      <CardContent>
        <fetcher.Form method="post" className="space-y-3">
          <input type="hidden" name="intent" value="save-note" />
          <Textarea
            name="body"
            aria-label="Your notes"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={saveOnModEnter}
            placeholder={
              "Key ideas in your own words…\nQuestions to ask in the discussion…\nCode or commands to try later…"
            }
            aria-invalid={draft.tooLong || draft.status === "error"}
            className="min-h-40 resize-y"
          />
          <NoteFooter draft={draft} note={note} error={fetcher.data?.error} />
        </fetcher.Form>
      </CardContent>
    </Card>
  );
}

function NoteHeader() {
  return (
    <CardHeader className="flex items-start justify-between gap-4">
      <div className="space-y-1.5">
        <CardTitle className="flex items-center gap-2">
          <NotebookPen className="size-4 text-muted-foreground" />
          <h2>Your notes</h2>
        </CardTitle>
        <CardDescription>
          Private to you. Write down what clicked, what's still fuzzy, and
          anything to come back to.
        </CardDescription>
      </div>
      <Link
        to="/saved"
        className="shrink-0 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        All notes
      </Link>
    </CardHeader>
  );
}

function NoteFooter({
  draft,
  note,
  error,
}: {
  draft: NoteDraft;
  note: SavedNote;
  error?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <NoteStatus draft={draft} note={note} error={error} />
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "text-xs tabular-nums text-muted-foreground",
            draft.tooLong && "font-medium text-destructive"
          )}
        >
          {draft.length.toLocaleString("en")} / {draft.max.toLocaleString("en")}
        </span>
        <Button
          type="submit"
          size="sm"
          disabled={!draft.canSave}
          title="Save (Ctrl+Enter)"
        >
          {draft.status === "saving" ? "Saving…" : "Save note"}
        </Button>
      </div>
    </div>
  );
}

function NoteStatus({
  draft,
  note,
  error,
}: {
  draft: NoteDraft;
  note: SavedNote;
  error?: string;
}) {
  const muted = "text-xs text-muted-foreground";
  switch (draft.status) {
    case "error":
      return <span className="text-sm text-destructive">{error}</span>;
    case "too-long":
      return (
        <span className="text-sm text-destructive">
          Shorten your note to save it.
        </span>
      );
    case "saving":
      return <span className={muted}>Saving…</span>;
    case "unsaved":
      return (
        <span className={muted}>Unsaved changes · Ctrl+Enter to save</span>
      );
    case "saved":
      return (
        <span suppressHydrationWarning className={muted}>
          Saved · last edited {note ? formatRelativeTime(note.updatedAt) : ""}
        </span>
      );
    default:
      return <span className={muted}>Write something, then save it.</span>;
  }
}
