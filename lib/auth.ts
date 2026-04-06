import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const scrypt = promisify(scryptCallback);

const AUTH_COOKIE_NAME = "codecoach-auth";
const GOOGLE_STATE_COOKIE_NAME = "codecoach-google-state";
const AUTH_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const GOOGLE_STATE_TTL_MS = 1000 * 60 * 10;

export type AuthUser = {
  id: string;
  email: string;
};

export type AuthContext = {
  user: AuthUser;
  solvedProblemSlugs: string[];
};

function authCookieOptions(expires?: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  };
}

function transientCookieOptions(expires?: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  };
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string) {
  return password.trim().length >= 8;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, expectedHash] = storedHash.split(":");

  if (!salt || !expectedHash) {
    return false;
  }

  const computedHash = (await scrypt(password, salt, 64)) as Buffer;
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (computedHash.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(computedHash, expectedBuffer);
}

export async function createAuthSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + AUTH_SESSION_TTL_MS);

  await prisma.authSession.create({
    data: {
      id: token,
      userId,
      expiresAt,
    },
  });

  return {
    token,
    expiresAt,
  };
}

export function createOAuthState() {
  return randomBytes(24).toString("hex");
}

export function createOAuthStateExpiry() {
  return new Date(Date.now() + GOOGLE_STATE_TTL_MS);
}

export function attachAuthSessionCookie(
  response: NextResponse,
  token: string,
  expiresAt: Date,
) {
  response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions(expiresAt));
  return response;
}

export function clearAuthSessionCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    ...authCookieOptions(new Date(0)),
    maxAge: 0,
  });
  return response;
}

export function attachGoogleStateCookie(
  response: NextResponse,
  state: string,
  expiresAt: Date,
) {
  response.cookies.set(
    GOOGLE_STATE_COOKIE_NAME,
    state,
    transientCookieOptions(expiresAt),
  );
  return response;
}

export function clearGoogleStateCookie(response: NextResponse) {
  response.cookies.set(GOOGLE_STATE_COOKIE_NAME, "", {
    ...transientCookieOptions(new Date(0)),
    maxAge: 0,
  });
  return response;
}

export function getStoredGoogleState() {
  return cookies().get(GOOGLE_STATE_COOKIE_NAME)?.value ?? null;
}

export async function invalidateCurrentAuthSession() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return;
  }

  await prisma.authSession.deleteMany({
    where: {
      id: token,
    },
  });
}

export async function getCurrentAuthContext(): Promise<AuthContext | null> {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const authSession = await prisma.authSession.findUnique({
    where: {
      id: token,
    },
    include: {
      user: {
        include: {
          solvedProblems: {
            include: {
              problem: {
                select: {
                  slug: true,
                },
              },
            },
            orderBy: {
              solvedAt: "asc",
            },
          },
        },
      },
    },
  });

  if (!authSession) {
    return null;
  }

  if (authSession.expiresAt.getTime() <= Date.now()) {
    await prisma.authSession.delete({
      where: {
        id: authSession.id,
      },
    });

    return null;
  }

  return {
    user: {
      id: authSession.user.id,
      email: authSession.user.email,
    },
    solvedProblemSlugs: authSession.user.solvedProblems.map(
      (entry) => entry.problem.slug,
    ),
  };
}

export function getGoogleOAuthConfig(origin: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return null;
  }

  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI?.trim() ||
    new URL("/api/auth/google/callback", origin).toString();

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}

export async function getSolvedProblemSlugsForUser(userId: string) {
  const solvedProblemSlugs = await prisma.solvedProblem.findMany({
    where: {
      userId,
    },
    select: {
      problem: {
        select: {
          slug: true,
        },
      },
    },
    orderBy: {
      solvedAt: "asc",
    },
  });

  return solvedProblemSlugs.map((entry) => entry.problem.slug);
}

export async function markProblemSolved(userId: string, problemId: number) {
  const existingSolve = await prisma.solvedProblem.findUnique({
    where: {
      userId_problemId: {
        userId,
        problemId,
      },
    },
  });

  if (existingSolve) {
    return {
      newlySolved: false,
    };
  }

  await prisma.solvedProblem.create({
    data: {
      userId,
      problemId,
    },
  });

  return {
    newlySolved: true,
  };
}
