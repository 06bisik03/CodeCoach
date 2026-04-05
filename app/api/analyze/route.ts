import { openai } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT =
  "You are a coding interview coach reviewing code in real time. Analyze ONLY for these issues and be brief (max 2 sentences per issue):\n1. Time complexity problems — warn if the solution is O(n²) or worse when a faster approach is clearly possible. Mention the better complexity.\n2. Space complexity problems — flag unnecessary memory usage.\n3. Interview red flags — things that would hurt the user in a real interview (e.g. using eval(), not handling edge cases, overly complex logic).\nIf the code looks good or is incomplete, respond with exactly: LGTM";

type AnalyzeRequestBody = {
  code?: string;
  problemSlug?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as AnalyzeRequestBody;
  const code = body.code?.trim();
  const problemSlug = body.problemSlug?.trim();

  if (!code || !problemSlug) {
    return new Response("code and problemSlug are required.", {
      status: 400,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const problem = await prisma.problem.findUnique({
    where: {
      slug: problemSlug,
    },
  });

  if (!problem) {
    return new Response("Problem not found.", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
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

  return new Response(analysis, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
