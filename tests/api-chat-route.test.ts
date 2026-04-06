import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/chat/route";
import { openai } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    problem: {
      findUnique: vi.fn(),
    },
    session: {
      upsert: vi.fn((args: unknown) => args),
    },
    chatMessage: {
      findMany: vi.fn(),
      create: vi.fn((args: unknown) => args),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/openai", () => ({
  aiModel: "qwen2.5-coder:3b",
  getAiUnavailableMessage: vi.fn(
    () => "AI is not configured for chat right now.",
  ),
  getAiErrorDetails: vi.fn((error: unknown) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      error.status === 429
    ) {
      return {
        message: "AI provider is unavailable right now.",
        status: 429,
      };
    }

    return {
      message: "CodeCoach could not respond right now. Please try again.",
      status: 500,
    };
  }),
  openai: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
}));

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when required fields are missing", async () => {
    const request = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "",
        problemSlug: "",
        sessionId: "",
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: "message, problemSlug, and sessionId are required.",
    });
  });

  it("stores the user message and assistant reply", async () => {
    vi.mocked(prisma.problem.findUnique).mockResolvedValue({
      id: 1,
      title: "Two Sum",
      slug: "two-sum",
      difficulty: "Easy",
      description: "Find two numbers that add up to a target.",
      examples: [{ input: "nums = [2,7,11,15], target = 9", output: "[0,1]" }],
      constraints: ["2 <= nums.length <= 10^4"],
      starterCode: {},
      createdAt: new Date("2026-04-04T00:00:00.000Z"),
    });
    vi.mocked(prisma.chatMessage.findMany).mockResolvedValue([
      {
        id: 10,
        sessionId: "session-123",
        role: "user",
        content: "I think my code is too slow.",
        createdAt: new Date("2026-04-04T00:00:00.000Z"),
      },
    ]);
    vi.mocked(openai.chat.completions.create).mockResolvedValue({
      choices: [
        {
          message: {
            content: "Try using a hash map to reduce the lookup time.",
          },
        },
      ],
    } as never);

    const request = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Can you review this approach?",
        code: "def two_sum(nums, target):\n    pass",
        problemSlug: "two-sum",
        sessionId: "session-123",
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      reply: "Try using a hash map to reduce the lookup time.",
    });
    expect(openai.chat.completions.create).toHaveBeenCalledTimes(1);
    expect(prisma.session.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("returns a JSON error when the OpenAI request fails", async () => {
    vi.mocked(prisma.problem.findUnique).mockResolvedValue({
      id: 1,
      title: "Two Sum",
      slug: "two-sum",
      difficulty: "Easy",
      description: "Find two numbers that add up to a target.",
      examples: [],
      constraints: ["2 <= nums.length <= 10^4"],
      starterCode: {},
      createdAt: new Date("2026-04-04T00:00:00.000Z"),
    });
    vi.mocked(prisma.chatMessage.findMany).mockResolvedValue([]);
    vi.mocked(openai.chat.completions.create).mockRejectedValue(
      Object.assign(new Error("OpenAI quota exceeded."), {
        status: 429,
      }),
    );

    const request = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Can you review this approach?",
        code: "def two_sum(nums, target):\n    pass",
        problemSlug: "two-sum",
        sessionId: "session-123",
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(429);
    expect(json).toEqual({
      error: "AI provider is unavailable right now.",
    });
  });
});
