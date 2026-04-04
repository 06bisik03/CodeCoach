import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
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
}
