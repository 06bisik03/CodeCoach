import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required." },
      { status: 400 },
    );
  }

  try {
    const messages = await prisma.chatMessage.findMany({
      where: {
        sessionId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error(
      "GET /api/chat/history failed, returning empty history fallback",
      error,
    );

    return NextResponse.json([]);
  }
}
