import {
  aiModel,
  getAiErrorDetails,
  getAiUnavailableMessage,
  openai,
} from "@/lib/openai";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT =
  "You are a coding interview coach reviewing code in real time. Analyze ONLY for these issues and be brief (max 2 sentences per issue):\n1. Time complexity problems — warn if the solution is O(n²) or worse when a faster approach is clearly possible. Mention the better complexity.\n2. Space complexity problems — flag unnecessary memory usage.\n3. Interview red flags — things that would hurt the user in a real interview (e.g. using eval(), not handling edge cases, overly complex logic).\nIf the code looks good or is incomplete, respond with exactly: LGTM";

type AnalyzeRequestBody = {
  code?: string;
  problemSlug?: string;
};

function errorResponse(message: string, status: number) {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalyzeRequestBody;
    const code = body.code?.trim();
    const problemSlug = body.problemSlug?.trim();

    if (!code || !problemSlug) {
      return errorResponse("code and problemSlug are required.", 400);
    }

    if (!openai) {
      return errorResponse(
        getAiUnavailableMessage("analysis"),
        503,
      );
    }

    const problem = await prisma.problem.findUnique({
      where: {
        slug: problemSlug,
      },
    });

    if (!problem) {
      return errorResponse("Problem not found.", 404);
    }

    const completion = await openai.chat.completions.create({
      model: aiModel,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            `Problem title: ${problem.title}`,
            `Difficulty: ${problem.difficulty}`,
            `Description:\n${problem.description}`,
            `Constraints:\n${problem.constraints.join("\n")}`,
            `Current code:\n${code}`,
          ].join("\n\n"),
        },
      ],
    });

    const analysis =
      completion.choices[0]?.message?.content?.trim() || "LGTM";

    return errorResponse(analysis, 200);
  } catch (error) {
    console.error("POST /api/analyze failed", error);
    const errorDetails = getAiErrorDetails(error, "analysis");
    return errorResponse(errorDetails.message, errorDetails.status);
  }
}
