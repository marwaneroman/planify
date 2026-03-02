/**
 * Unit tests for lib/utils.ts
 */
import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (class names utility)", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", true && "visible")).toBe("base visible");
  });

  it("deduplicates Tailwind classes with tailwind-merge", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("returns empty string for no args", () => {
    expect(cn()).toBe("");
  });

  it("filters falsy values", () => {
    expect(cn("a", null, undefined, false, "b")).toBe("a b");
  });
});
