import { NextResponse } from "next/server";
import { clearAuthSessionCookie, invalidateCurrentAuthSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await invalidateCurrentAuthSession();
    const response = NextResponse.json({
      success: true,
    });

    return clearAuthSessionCookie(response);
  } catch (error) {
    console.error("POST /api/auth/logout failed", error);

    return NextResponse.json(
      {
        error: "CodeCoach could not log you out right now.",
      },
      { status: 500 },
    );
  }
}
