import { NextResponse } from "next/server";
import { clearAuthSessionCookie, getCurrentAuthContext } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authContext = await getCurrentAuthContext();
    const response = NextResponse.json({
      user: authContext?.user ?? null,
      solvedProblemSlugs: authContext?.solvedProblemSlugs ?? [],
    });

    if (!authContext) {
      return clearAuthSessionCookie(response);
    }

    return response;
  } catch (error) {
    console.error("GET /api/auth/session failed", error);

    return NextResponse.json(
      {
        error: "CodeCoach could not load your session right now.",
      },
      { status: 500 },
    );
  }
}
