import { NextResponse } from "next/server";
import { getCurrentAuthContext, markProblemSolved } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SolvedBody = {
  problemSlug?: string;
};

export async function POST(request: Request) {
  try {
    const authContext = await getCurrentAuthContext();

    if (!authContext) {
      return NextResponse.json(
        {
          error: "Log in to save solved problems.",
        },
        { status: 401 },
      );
    }

    const body = (await request.json()) as SolvedBody;
    const problemSlug = body.problemSlug?.trim();

    if (!problemSlug) {
      return NextResponse.json(
        {
          error: "problemSlug is required.",
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

    const solveState = await markProblemSolved(authContext.user.id, problem.id);

    return NextResponse.json({
      saved: true,
      newlySolved: solveState.newlySolved,
      alreadySolved: !solveState.newlySolved,
      requiresLogin: false,
    });
  } catch (error) {
    console.error("POST /api/solved failed", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "Invalid request body.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "CodeCoach could not save your solved problem right now.",
      },
      { status: 500 },
    );
  }
}
