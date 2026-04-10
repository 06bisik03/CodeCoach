import { NextResponse } from "next/server";
import { FALLBACK_PROBLEM_SUMMARIES } from "@/lib/problem-fallback";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const problems = await prisma.problem.findMany({
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

    return NextResponse.json(problems);
  } catch (error) {
    console.error(
      "GET /api/problems failed, serving fallback problem list",
      error,
    );

    return NextResponse.json(FALLBACK_PROBLEM_SUMMARIES);
  }
}
