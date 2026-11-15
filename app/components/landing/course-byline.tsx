import { BookOpen, User } from "lucide-react";
import { cn } from "~/lib/utils";

export function CourseByline({
  instructorName,
  lessonCount,
  className,
}: {
  instructorName: string | null;
  lessonCount: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between text-xs text-muted-foreground",
        className
      )}
    >
      <span className="flex items-center gap-1">
        <User className="size-3" />
        {instructorName ?? "Instructor"}
      </span>
      <span className="flex items-center gap-1">
        <BookOpen className="size-3" />
        {lessonCount} lessons
      </span>
    </div>
  );
}
