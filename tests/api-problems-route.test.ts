import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/problems/route";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    problem: {
      findMany: vi.fn(),
    },
  },
}));

describe("GET /api/problems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the list of problems with summary fields", async () => {
    vi.mocked(prisma.problem.findMany).mockResolvedValue([
      {
        id: 1,
        title: "Two Sum",
        slug: "two-sum",
        difficulty: "Easy",
      },
      {
        id: 2,
        title: "Valid Parentheses",
        slug: "valid-parentheses",
        difficulty: "Easy",
      },
    ] as never);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual([
      {
        id: 1,
        title: "Two Sum",
        slug: "two-sum",
        difficulty: "Easy",
      },
      {
        id: 2,
        title: "Valid Parentheses",
        slug: "valid-parentheses",
        difficulty: "Easy",
      },
    ]);
    expect(prisma.problem.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
      },
      orderBy: {
        id: "asc",
      },
    });
  });
});
