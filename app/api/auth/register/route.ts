import { NextResponse } from "next/server";
import {
  attachAuthSessionCookie,
  createAuthSession,
  getSolvedProblemSlugsForUser,
  hashPassword,
  isValidEmail,
  isValidPassword,
  normalizeEmail,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RegisterBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody;
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

    if (!isValidPassword(password)) {
      return NextResponse.json(
        {
          error: "Password must be at least 8 characters long.",
        },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        googleId: true,
        passwordHash: true,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            existingUser.googleId && !existingUser.passwordHash
              ? "An account with that email already exists. Continue with Google instead."
              : "An account with that email already exists.",
        },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
      },
    });

    const authSession = await createAuthSession(user.id);
    const response = NextResponse.json(
      {
        user,
        solvedProblemSlugs: await getSolvedProblemSlugsForUser(user.id),
      },
      { status: 201 },
    );

    return attachAuthSessionCookie(
      response,
      authSession.token,
      authSession.expiresAt,
    );
  } catch (error) {
    console.error("POST /api/auth/register failed", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "CodeCoach could not create your account right now.",
      },
      { status: 500 },
    );
  }
}
