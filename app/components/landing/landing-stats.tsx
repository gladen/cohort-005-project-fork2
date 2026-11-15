import { BookOpen, GraduationCap, Users } from "lucide-react";
import type { LandingStat } from "~/modules/landing";

const ICONS = {
  courses: BookOpen,
  categories: GraduationCap,
  pace: Users,
} satisfies Record<LandingStat["key"], unknown>;

export function LandingStats({ stats }: { stats: LandingStat[] }) {
  return (
    <section className="border-y border-border bg-muted/50 py-12">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = ICONS[stat.key];
          return (
            <div key={stat.key} className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="size-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
