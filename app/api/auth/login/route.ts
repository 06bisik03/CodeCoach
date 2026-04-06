import { NextResponse } from "next/server";
import {
  attachAuthSessionCookie,
  createAuthSession,
  getSolvedProblemSlugsForUser,
  isValidEmail,
  normalizeEmail,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;
    const email = normalizeEmail(body.email ?? "");
    const password = body.password?.trim() ?? "";

    if (!email || !password) {
      return NextResponse.json(
        {
          error: "email and password are required.",
        },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          error: "Enter a valid email address.",
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        googleId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Invalid email or password.",
        },
        { status: 401 },
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        {
          error:
            user.googleId
              ? "This account uses Google sign-in. Continue with Google instead."
              : "This account does not have a password yet.",
        },
        { status: 401 },
      );
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);

    if (!passwordMatches) {
      return NextResponse.json(
        {
          error: "Invalid email or password.",
        },
        { status: 401 },
      );
    }

    const authSession = await createAuthSession(user.id);
    const solvedProblemSlugs = await getSolvedProblemSlugsForUser(user.id);

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      solvedProblemSlugs,
    });

    return attachAuthSessionCookie(
      response,
      authSession.token,
      authSession.expiresAt,
    );
  } catch (error) {
    console.error("POST /api/auth/login failed", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "CodeCoach could not log you in right now.",
      },
      { status: 500 },
    );
  }
}
