import { useEffect } from "react";
import { Link, useFetcher, useNavigate } from "react-router";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Github,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  CommentThread,
  type RenderedComment,
} from "~/components/comment-thread";
import { LessonNote } from "~/components/lesson-note";
import { YouTubePlayer } from "~/components/youtube-player";
import { LessonProgressStatus } from "~/db/schema";
import { formatDuration } from "~/lib/utils";
import { BookmarkToggle } from "./bookmark-toggle";
import { CurriculumSidebar, type Curriculum } from "./curriculum-sidebar";
import { LessonBreadcrumb } from "./lesson-breadcrumb";
import { QuizSection } from "./quiz-section";
import { useAutoplay } from "./use-autoplay";

type NeighbourLesson = { id: number; title: string };

export type FullLessonData = {
  course: { id: number; title: string; slug: string };
  curriculum: Curriculum;
  module: { id: number; title: string };
  lesson: {
    id: number;
    title: string;
    videoUrl: string | null;
    durationMinutes: number | null;
    githubRepoUrl: string | null;
  };
  contentHtml: string | null;
  lessonStatus: string | null;
  enrolled: boolean;
  currentUserId: number | null;
  prevLesson: NeighbourLesson | null;
  nextLesson: NeighbourLesson | null;
  quiz: Parameters<typeof QuizSection>[0]["quiz"] | null;
  bestAttempt: { score: number; passed: boolean } | null;
  lastWatchPosition: number;
  watchProgress: number;
  lessonProgressMap: Record<number, string>;
  comments: RenderedComment[];
  canModerate: boolean;
  instructorName: string;
  bookmarked: boolean;
  note: { body: string; updatedAt: string } | null;
};

export function FullLesson({ data }: { data: FullLessonData }) {
  const { course, lesson, enrolled, nextLesson } = data;
  const [autoplay, toggleAutoplay] = useAutoplay();
  const markComplete = useMarkComplete(data);
  const quizFetcher = useFetcher({ key: `quiz-${lesson.id}` });
  const quizResult = quizFetcher.data?.quizResult ?? null;

  return (
    <div className="flex">
      <CurriculumSidebar
        course={course}
        curriculum={data.curriculum}
        currentLessonId={lesson.id}
        lessonProgressMap={data.lessonProgressMap}
        enrolled={enrolled}
      />

      <div className="flex-1 p-6 lg:p-8">
        <LessonBreadcrumb
          course={course}
          mod={data.module}
          lessonTitle={lesson.title}
        />

        <div className="mx-auto max-w-4xl">
          <LessonHeader data={data} />
          <LessonMedia
            data={data}
            autoplay={autoplay}
            onToggleAutoplay={toggleAutoplay}
          />
          <LessonActivities
            data={data}
            quizFetcher={quizFetcher}
            quizResult={quizResult}
            markComplete={markComplete}
          />

          <LessonNav
            course={course}
            prevLesson={data.prevLesson}
            nextLesson={nextLesson}
          />
        </div>
      </div>
    </div>
  );
}

type MarkCompleteState = ReturnType<typeof useMarkComplete>;

function useMarkComplete({
  lesson,
  lessonStatus,
  course,
  nextLesson,
}: FullLessonData) {
  const fetcher = useFetcher({ key: `mark-complete-${lesson.id}` });
  const navigate = useNavigate();

  const isMarking =
    fetcher.state !== "idle" &&
    fetcher.formData?.get("intent") === "mark-complete";

  const justCompleted = fetcher.data?.success;

  const isCompleted =
    lessonStatus === LessonProgressStatus.Completed || justCompleted;

  useEffect(() => {
    if (justCompleted && nextLesson) {
      navigate(`/courses/${course.slug}/lessons/${nextLesson.id}`);
    }
  }, [justCompleted, nextLesson, course.slug, navigate]);

  return { fetcher, isMarking, isCompleted: !!isCompleted };
}

function LessonActivities({
  data,
  quizFetcher,
  quizResult,
  markComplete,
}: {
  data: FullLessonData;
  quizFetcher: ReturnType<typeof useFetcher>;
  quizResult: Parameters<typeof QuizSection>[0]["quizResult"];
  markComplete: MarkCompleteState;
}) {
  const { enrolled, currentUserId } = data;
  const isSubmittingQuiz = quizFetcher.state !== "idle";

  return (
    <>
      {data.quiz && enrolled && currentUserId && (
        <QuizSection
          quiz={data.quiz}
          bestAttempt={data.bestAttempt}
          quizResult={quizResult}
          quizFetcher={quizFetcher}
          isSubmitting={isSubmittingQuiz}
        />
      )}

      {enrolled && currentUserId && (
        <MarkComplete
          {...markComplete}
          courseSlug={data.course.slug}
          nextLesson={data.nextLesson}
        />
      )}

      {/* Questions & Discussion — confidential to people with access */}
      <CommentThread
        comments={data.comments}
        currentUserId={currentUserId}
        canModerate={data.canModerate}
        canPost
        instructorName={data.instructorName}
      />
    </>
  );
}

function LessonHeader({ data }: { data: FullLessonData }) {
  const { lesson, currentUserId, bookmarked } = data;
  return (
    <>
      <div className="mb-2 flex items-start justify-between gap-3">
        <h1 className="text-3xl font-bold">{lesson.title}</h1>
        {currentUserId && <BookmarkToggle bookmarked={bookmarked} />}
      </div>
      <div className="mb-6 flex items-center gap-3">
        {lesson.durationMinutes && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="size-4" />
            {formatDuration(lesson.durationMinutes, true, false, false)}
          </div>
        )}
        {lesson.githubRepoUrl && (
          <a
            href={lesson.githubRepoUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <Github className="mr-1.5 size-4" />
              Open Code
            </Button>
          </a>
        )}
      </div>
    </>
  );
}

function LessonMedia({
  data,
  autoplay,
  onToggleAutoplay,
}: {
  data: FullLessonData;
  autoplay: boolean;
  onToggleAutoplay: () => void;
}) {
  const { lesson, contentHtml, enrolled, currentUserId, note } = data;
  return (
    <>
      {lesson.videoUrl && (
        <YouTubePlayer
          videoUrl={lesson.videoUrl}
          lessonId={lesson.id}
          title={lesson.title}
          startPosition={data.lastWatchPosition}
          durationMinutes={lesson.durationMinutes}
          watchProgress={data.watchProgress}
          trackingEnabled={enrolled && !!currentUserId}
          autoplay={autoplay}
          onToggleAutoplay={onToggleAutoplay}
        />
      )}

      {/* Note — under the video, so the Student can write while they watch */}
      {currentUserId && <LessonNote key={lesson.id} note={note} />}

      {contentHtml && (
        <div
          className="prose prose-neutral dark:prose-invert mb-8 max-w-none"
          // oxlint-disable-next-line react/no-danger -- the instructor wrote this Markdown
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      )}

      {!contentHtml && !lesson.videoUrl && (
        <Card className="mb-8">
          <CardContent className="py-12 text-center text-muted-foreground">
            No content has been added to this lesson yet.
          </CardContent>
        </Card>
      )}
    </>
  );
}

type MarkCompleteProps = MarkCompleteState & {
  courseSlug: string;
  nextLesson: NeighbourLesson | null;
};

function MarkComplete({
  fetcher,
  isCompleted,
  isMarking,
  courseSlug,
  nextLesson,
}: MarkCompleteProps) {
  return (
    <div className="mb-8">
      {isCompleted ? (
        <LessonCompleted courseSlug={courseSlug} nextLesson={nextLesson} />
      ) : nextLesson ? (
        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="mark-complete" />
          <Button disabled={isMarking}>
            {isMarking ? (
              "Completing..."
            ) : (
              <>
                Up next: {nextLesson.title}
                <ChevronRight className="ml-1 size-4" />
              </>
            )}
          </Button>
        </fetcher.Form>
      ) : (
        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="mark-complete" />
          <Button disabled={isMarking}>
            <CheckCircle2 className="mr-2 size-4" />
            {isMarking ? "Marking..." : "Mark as Complete"}
          </Button>
        </fetcher.Form>
      )}
    </div>
  );
}

function LessonCompleted({
  courseSlug,
  nextLesson,
}: {
  courseSlug: string;
  nextLesson: NeighbourLesson | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="size-5" />
        <span className="font-medium">Lesson completed</span>
      </div>
      {nextLesson && (
        <Link to={`/courses/${courseSlug}/lessons/${nextLesson.id}`}>
          <Button variant="outline" size="sm">
            Up next: {nextLesson.title}
            <ChevronRight className="ml-1 size-4" />
          </Button>
        </Link>
      )}
    </div>
  );
}

function LessonNav({
  course,
  prevLesson,
  nextLesson,
}: {
  course: FullLessonData["course"];
  prevLesson: NeighbourLesson | null;
  nextLesson: NeighbourLesson | null;
}) {
  return (
    <div className="flex items-center justify-between border-t pt-6">
      {prevLesson ? (
        <Link
          to={`/courses/${course.slug}/lessons/${prevLesson.id}`}
          className="flex items-center gap-2 text-sm hover:text-foreground text-muted-foreground"
        >
          <ChevronLeft className="size-4" />
          <div>
            <div className="text-xs text-muted-foreground">Previous</div>
            <div className="font-medium text-foreground">
              {prevLesson.title}
            </div>
          </div>
        </Link>
      ) : (
        <div />
      )}

      <NextLessonLink course={course} nextLesson={nextLesson} />
    </div>
  );
}

function NextLessonLink({
  course,
  nextLesson,
}: {
  course: FullLessonData["course"];
  nextLesson: NeighbourLesson | null;
}) {
  if (nextLesson) {
    return (
      <Link
        to={`/courses/${course.slug}/lessons/${nextLesson.id}`}
        className="flex items-center gap-2 text-right text-sm hover:text-foreground text-muted-foreground"
      >
        <div>
          <div className="text-xs text-muted-foreground">Next</div>
          <div className="font-medium text-foreground">{nextLesson.title}</div>
        </div>
        <ChevronRight className="size-4" />
      </Link>
    );
  }
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
    >
      <div>
        <div className="text-xs text-muted-foreground">Back to</div>
        <div className="font-medium text-foreground">{course.title}</div>
      </div>
      <ChevronRight className="size-4" />
    </Link>
  );
}
