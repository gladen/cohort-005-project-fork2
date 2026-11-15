import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { CourseImage } from "~/components/course-image";
import { CourseByline } from "./course-byline";
import type { HeroAction } from "~/modules/landing";

export type SpotlightCourse = {
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  instructorName: string | null;
  categoryName: string | null;
  lessonCount: number;
};

export function LandingHero({
  actions,
  spotlight,
}: {
  actions: HeroAction[];
  spotlight: SpotlightCourse | null;
}) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-primary/5 to-transparent lg:block"
      />
      <div
        className={cn(
          "relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:py-28",
          spotlight && "lg:grid-cols-[1.15fr_1fr]"
        )}
      >
        <div>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            Courses for developers
          </p>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Learn to code,
            <br />
            <span className="text-muted-foreground">at your own pace</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Structured courses built by experienced instructors. Track your
            progress, take quizzes, and build real-world skills.
          </p>
          <HeroActions actions={actions} />
        </div>
        {spotlight && <SpotlightCard course={spotlight} />}
      </div>
    </section>
  );
}

function HeroActions({ actions }: { actions: HeroAction[] }) {
  return (
    <div className="mt-10 flex flex-wrap items-center gap-4">
      {actions.map((action) => (
        <Button
          key={action.to}
          asChild
          size="lg"
          variant={action.emphasis === "primary" ? "default" : "outline"}
        >
          <Link to={action.to}>
            {action.label}
            {action.emphasis === "primary" && (
              <ArrowRight className="ml-2 size-4" />
            )}
          </Link>
        </Button>
      ))}
    </div>
  );
}

function SpotlightCard({ course }: { course: SpotlightCourse }) {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group block rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
    >
      <CourseImage
        src={course.coverImageUrl}
        alt={course.title}
        className="aspect-video w-full rounded-t-xl object-cover"
      />
      <div className="p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Newest{course.categoryName ? ` · ${course.categoryName}` : ""}
        </p>
        <h2 className="mt-2 text-xl font-semibold leading-snug group-hover:text-primary">
          {course.title}
        </h2>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {course.description}
        </p>
        <CourseByline
          className="mt-4"
          instructorName={course.instructorName}
          lessonCount={course.lessonCount}
        />
      </div>
    </Link>
  );
}
