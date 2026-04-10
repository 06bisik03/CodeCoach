import {
  aiModel,
  getAiErrorDetails,
  getAiUnavailableMessage,
  openai,
} from "@/lib/openai";
import { isLikelyPlaceholderCode } from "@/lib/code-analysis";
import { getFallbackProblem } from "@/lib/problem-fallback";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT =
  "You are a coding interview coach reviewing code in real time. Analyze ONLY for these issues and be brief (max 2 sentences per issue):\n1. Time complexity problems — warn only when the code contains enough concrete logic to support the claim, and only if the solution is O(n²) or worse when a faster approach is clearly possible. Mention the better complexity.\n2. Space complexity problems — flag unnecessary memory usage only when the code actually allocates extra structures.\n3. Interview red flags — things that would hurt the user in a real interview (e.g. using eval(), not handling edge cases, overly complex logic).\nDo not guess complexity from placeholder or incomplete code. A fixed literal return, TODO, pass, or obviously incomplete stub must be treated as incomplete. If the code looks good or is incomplete, respond with exactly: LGTM";

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

    if (isLikelyPlaceholderCode(code)) {
      return errorResponse("LGTM", 200);
    }

    if (!openai) {
      return errorResponse(
        getAiUnavailableMessage("analysis"),
        503,
      );
    }

    let problem = null;

    try {
      problem = await prisma.problem.findUnique({
        where: {
          slug: problemSlug,
        },
      });
    } catch (dbError) {
      console.error(
        `POST /api/analyze failed to load problem ${problemSlug} from DB, using fallback`,
        dbError,
      );
    }

    problem ??= getFallbackProblem(problemSlug);

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
