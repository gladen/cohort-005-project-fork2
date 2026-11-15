import { describe, it, expect } from "vitest";
import {
  heroActions,
  landingShowcase,
  landingStats,
  SHOWCASE_SIZE,
} from "../index";

describe("heroActions", () => {
  it("offers a signed-out visitor the catalogue, then sign-up", () => {
    expect(heroActions(null)).toEqual([
      { label: "Browse Courses", to: "/courses", emphasis: "primary" },
      { label: "Sign Up Free", to: "/signup", emphasis: "secondary" },
    ]);
  });

  it("offers a signed-in Person the catalogue, then their dashboard", () => {
    expect(heroActions({ id: 5 })).toEqual([
      { label: "Browse Courses", to: "/courses", emphasis: "primary" },
      { label: "Go to Dashboard", to: "/dashboard", emphasis: "secondary" },
    ]);
  });
});

describe("landingStats", () => {
  it("shows the counts with plural labels", () => {
    expect(landingStats({ totalCourses: 4, totalCategories: 5 })).toEqual([
      { key: "courses", value: "4", label: "Available Courses" },
      { key: "categories", value: "5", label: "Categories" },
      { key: "pace", value: "Self-paced", label: "Learn on your schedule" },
    ]);
  });

  it("uses singular labels for a count of one", () => {
    const [courses, categories] = landingStats({
      totalCourses: 1,
      totalCategories: 1,
    });
    expect(courses.label).toBe("Available Course");
    expect(categories.label).toBe("Category");
  });

  it("uses plural labels for a count of zero", () => {
    const [courses, categories] = landingStats({
      totalCourses: 0,
      totalCategories: 0,
    });
    expect(courses).toMatchObject({ value: "0", label: "Available Courses" });
    expect(categories).toMatchObject({ value: "0", label: "Categories" });
  });
});

describe("landingShowcase", () => {
  it("spotlights the newest course and features the next three", () => {
    expect(landingShowcase(["a", "b", "c", "d", "e"])).toEqual({
      spotlight: "a",
      featured: ["b", "c", "d"],
    });
  });

  it("asks for exactly the spotlight plus a full grid", () => {
    const courses = Array.from({ length: SHOWCASE_SIZE }, (_, i) => i);
    const { spotlight, featured } = landingShowcase(courses);
    expect([spotlight, ...featured]).toEqual(courses);
  });

  it("features nothing when there is only one course", () => {
    expect(landingShowcase(["a"])).toEqual({ spotlight: "a", featured: [] });
  });

  it("has no spotlight when there are no courses", () => {
    expect(landingShowcase([])).toEqual({ spotlight: null, featured: [] });
  });
});
