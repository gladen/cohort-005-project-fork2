import { useState } from "react";
import { Link } from "react-router";
import { CheckCircle2, ChevronDown, Circle, PlayCircle } from "lucide-react";
import { LessonProgressStatus } from "~/db/schema";
import { cn } from "~/lib/utils";

export type Curriculum = Array<{
  id: number;
  title: string;
  lessons: Array<{ id: number; title: string }>;
}>;

type CurriculumSidebarProps = {
  course: { id: number; title: string; slug: string };
  curriculum: Curriculum;
  currentLessonId: number;
  lessonProgressMap: Record<number, string>;
  enrolled: boolean;
};

export function CurriculumSidebar({
  course,
  curriculum,
  currentLessonId,
  lessonProgressMap,
  enrolled,
}: CurriculumSidebarProps) {
  const currentModuleId = curriculum.find((m) =>
    m.lessons.some((l) => l.id === currentLessonId)
  )?.id;

  const [expandedModules, setExpandedModules] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    if (currentModuleId) initial.add(currentModuleId);
    return initial;
  });

  function toggleModule(moduleId: number) {
    setExpandedModules((prev) => toggled(prev, moduleId));
  }

  return (
    <aside className="hidden w-72 shrink-0 border-r border-border lg:block">
      <div className="sticky top-0 flex h-screen flex-col overflow-y-auto">
        <div className="border-b border-border p-4">
          <Link
            to={`/courses/${course.slug}`}
            className="text-sm font-semibold hover:text-primary"
          >
            {course.title}
          </Link>
        </div>

        <nav className="flex-1 p-2">
          {curriculum.map((mod) => (
            <ModuleItem
              key={mod.id}
              mod={mod}
              courseSlug={course.slug}
              isExpanded={expandedModules.has(mod.id)}
              onToggle={() => toggleModule(mod.id)}
              currentLessonId={currentLessonId}
              lessonProgressMap={lessonProgressMap}
              enrolled={enrolled}
            />
          ))}
        </nav>
      </div>
    </aside>
  );
}

function ModuleItem({
  mod,
  courseSlug,
  isExpanded,
  onToggle,
  currentLessonId,
  lessonProgressMap,
  enrolled,
}: {
  mod: Curriculum[number];
  courseSlug: string;
  isExpanded: boolean;
  onToggle: () => void;
  currentLessonId: number;
  lessonProgressMap: Record<number, string>;
  enrolled: boolean;
}) {
  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
      >
        <ChevronDown
          className={cn(
            "size-4 shrink-0 transition-transform",
            !isExpanded && "-rotate-90"
          )}
        />
        <span className="flex-1 text-left">{mod.title}</span>
      </button>

      {isExpanded && (
        <ul className="ml-4 space-y-0.5 py-1">
          {mod.lessons.map((l) => (
            <LessonItem
              key={l.id}
              lesson={l}
              courseSlug={courseSlug}
              isCurrent={l.id === currentLessonId}
              status={lessonProgressMap[l.id]}
              enrolled={enrolled}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function LessonItem({
  lesson,
  courseSlug,
  isCurrent,
  status,
  enrolled,
}: {
  lesson: { id: number; title: string };
  courseSlug: string;
  isCurrent: boolean;
  status: string | undefined;
  enrolled: boolean;
}) {
  return (
    <li>
      <Link
        to={`/courses/${courseSlug}/lessons/${lesson.id}`}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
          isCurrent
            ? "bg-primary/10 font-medium text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <LessonStatusIcon status={enrolled ? status : undefined} />
        <span className="truncate">{lesson.title}</span>
      </Link>
    </li>
  );
}

function LessonStatusIcon({ status }: { status: string | undefined }) {
  if (status === LessonProgressStatus.Completed) {
    return <CheckCircle2 className="size-3.5 shrink-0 text-green-500" />;
  }
  if (status === LessonProgressStatus.InProgress) {
    return <PlayCircle className="size-3.5 shrink-0 text-blue-500" />;
  }
  return <Circle className="size-3.5 shrink-0" />;
}

function toggled(set: Set<number>, id: number) {
  const next = new Set(set);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}
