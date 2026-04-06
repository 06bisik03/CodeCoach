import { NextResponse } from "next/server";
import { getCurrentAuthContext, markProblemSolved } from "@/lib/auth";
import {
  buildExecutionProgram,
  buildRunResponse,
  executeCode,
  isExecutionLanguage,
  isProblemSlug,
  type ExecutionLanguage,
} from "@/lib/code-runner";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RunRequestBody = {
  code?: string;
  problemSlug?: string;
  language?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RunRequestBody;
    const code = body.code?.trim();
    const problemSlug = body.problemSlug?.trim();
    const language = body.language?.trim();

    if (!code || !problemSlug || !language) {
      return NextResponse.json(
        {
          error: "code, problemSlug, and language are required.",
        },
        { status: 400 },
      );
    }

    if (!isProblemSlug(problemSlug)) {
      return NextResponse.json(
        {
          error: "This problem is not supported by the run engine yet.",
        },
        { status: 400 },
      );
    }

    if (!isExecutionLanguage(language)) {
      return NextResponse.json(
        {
          error: "This language is not supported by the run engine yet.",
        },
        { status: 400 },
      );
    }

    const problem = await prisma.problem.findUnique({
      where: {
        slug: problemSlug,
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (!problem) {
      return NextResponse.json(
        {
          error: "Problem not found.",
        },
        { status: 404 },
      );
    }

    const visibleTestCases = await prisma.testCase.findMany({
      where: {
        problemId: problem.id,
        isHidden: false,
      },
      orderBy: {
        sortOrder: "asc",
      },
      select: {
        id: true,
        input: true,
        expected: true,
        explanation: true,
      },
    });

    if (visibleTestCases.length === 0) {
      return NextResponse.json(
        {
          error: "This problem does not have visible run cases configured yet.",
        },
        { status: 500 },
      );
    }

    const source = buildExecutionProgram(
      problemSlug,
      language as ExecutionLanguage,
      code,
      visibleTestCases,
    );
    const execution = await executeCode(
      language as ExecutionLanguage,
      source,
    );

    try {
      const runResponse = buildRunResponse(
        execution,
        problemSlug,
        visibleTestCases,
      );

      if (runResponse.status === "accepted") {
        const authContext = await getCurrentAuthContext();

        if (authContext?.user) {
          const solveState = await markProblemSolved(
            authContext.user.id,
            problem.id,
          );

          runResponse.solveState = {
            saved: true,
            newlySolved: solveState.newlySolved,
            alreadySolved: !solveState.newlySolved,
            requiresLogin: false,
          };
        } else {
          runResponse.solveState = {
            saved: false,
            newlySolved: false,
            alreadySolved: false,
            requiresLogin: true,
          };
        }
      }

      return NextResponse.json(runResponse);
    } catch (error) {
      console.error("POST /api/run could not parse runner output", error);

      return NextResponse.json(
        {
          status: "runtime-error",
          summary:
            "Your code ran, but CodeCoach could not parse the test results.",
          cases: [],
          stderr: execution.run.stderr || null,
          stdout: execution.run.stdout || execution.run.output || null,
        },
        { status: 200 },
      );
    }
  } catch (error) {
    console.error("POST /api/run failed", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "Invalid request body.",
        },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error:
            error.message ||
            "CodeCoach could not run your solution right now.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: "CodeCoach could not run your solution right now.",
      },
      { status: 503 },
    );
  }
}
