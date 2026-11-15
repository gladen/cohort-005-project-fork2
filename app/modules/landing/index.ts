import {
  buildHeroActions,
  buildLandingStats,
  buildShowcase,
  FEATURED_GRID_SIZE,
} from "./lib/landing";

export type { HeroAction, LandingStat } from "./lib/landing";

/**
 * The landing page's calls to action, in display order. Everyone gets
 * "Browse Courses" first; a signed-out visitor is then offered sign-up, a
 * signed-in Person their dashboard.
 */
export function heroActions(viewer: { id: number } | null) {
  return buildHeroActions(viewer);
}

/**
 * The stats strip under the hero: course count, category count, and the
 * self-paced promise, with labels that read correctly for a count of one.
 */
export function landingStats(counts: {
  totalCourses: number;
  totalCategories: number;
}) {
  return buildLandingStats(counts);
}

/** How many courses the landing page shows: the spotlight plus the grid. */
export const SHOWCASE_SIZE = 1 + FEATURED_GRID_SIZE;

/**
 * Splits the newest published courses between the hero's spotlight (the
 * newest) and the Featured Courses grid (the next three), so no course
 * appears twice on the page. Pass them newest first.
 */
export function landingShowcase<T>(newestFirst: T[]) {
  return buildShowcase(newestFirst);
}
