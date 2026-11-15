export type HeroAction = {
  label: string;
  to: string;
  emphasis: "primary" | "secondary";
};

export type LandingStat = {
  key: "courses" | "categories" | "pace";
  value: string;
  label: string;
};

export function buildHeroActions(viewer: { id: number } | null): HeroAction[] {
  const browse: HeroAction = {
    label: "Browse Courses",
    to: "/courses",
    emphasis: "primary",
  };
  const next: HeroAction = viewer
    ? { label: "Go to Dashboard", to: "/dashboard", emphasis: "secondary" }
    : { label: "Sign Up Free", to: "/signup", emphasis: "secondary" };
  return [browse, next];
}

function countLabel(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

export function buildLandingStats(counts: {
  totalCourses: number;
  totalCategories: number;
}): LandingStat[] {
  return [
    {
      key: "courses",
      value: String(counts.totalCourses),
      label: countLabel(
        counts.totalCourses,
        "Available Course",
        "Available Courses"
      ),
    },
    {
      key: "categories",
      value: String(counts.totalCategories),
      label: countLabel(counts.totalCategories, "Category", "Categories"),
    },
    { key: "pace", value: "Self-paced", label: "Learn on your schedule" },
  ];
}

export const FEATURED_GRID_SIZE = 3;

export function buildShowcase<T>(newestFirst: T[]): {
  spotlight: T | null;
  featured: T[];
} {
  const [spotlight = null, ...rest] = newestFirst;
  return { spotlight, featured: rest.slice(0, FEATURED_GRID_SIZE) };
}
