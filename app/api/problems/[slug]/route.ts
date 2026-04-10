import { NextResponse } from "next/server";
import { getFallbackProblem } from "@/lib/problem-fallback";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    slug: string;
  };
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const problem = await prisma.problem.findUnique({
      where: {
        slug: params.slug,
      },
    });

    if (problem) {
      return NextResponse.json(problem);
    }
  } catch (error) {
    console.error(
      `GET /api/problems/${params.slug} failed, serving fallback problem detail`,
      error,
    );
  }

  const fallbackProblem = getFallbackProblem(params.slug);

  if (!fallbackProblem) {
    return NextResponse.json(
      { error: "Problem not found." },
      { status: 404 },
    );
  }

  return NextResponse.json(fallbackProblem);
}
