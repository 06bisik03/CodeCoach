import { NextResponse } from "next/server";
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
  const problem = await prisma.problem.findUnique({
    where: {
      slug: params.slug,
    },
  });

  if (!problem) {
    return NextResponse.json(
      { error: "Problem not found." },
      { status: 404 },
    );
  }

  return NextResponse.json(problem);
}
