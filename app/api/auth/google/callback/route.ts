import { NextRequest, NextResponse } from "next/server";
import {
  attachAuthSessionCookie,
  clearGoogleStateCookie,
  createAuthSession,
  getGoogleOAuthConfig,
  getStoredGoogleState,
  normalizeEmail,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfoResponse = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
};

function redirectWithError(origin: string, message: string) {
  const response = NextResponse.redirect(
    new URL(`/?authError=${encodeURIComponent(message)}`, origin),
  );
  return clearGoogleStateCookie(response);
}

export async function GET(request: NextRequest) {
  try {
    const origin = request.nextUrl.origin;
    const googleConfig = getGoogleOAuthConfig(origin);

    if (!googleConfig) {
      return redirectWithError(origin, "Google sign-in is not configured yet.");
    }

    const oauthError = request.nextUrl.searchParams.get("error");

    if (oauthError) {
      return redirectWithError(
        origin,
        oauthError === "access_denied"
          ? "Google sign-in was cancelled."
          : "Google sign-in could not be completed.",
      );
    }

    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const storedState = getStoredGoogleState();

    if (!code || !state || !storedState || state !== storedState) {
      return redirectWithError(
        origin,
        "Google sign-in could not be verified. Please try again.",
      );
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: googleConfig.clientId,
        client_secret: googleConfig.clientSecret,
        redirect_uri: googleConfig.redirectUri,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });

    const tokenPayload = (await tokenResponse.json()) as GoogleTokenResponse;

    if (!tokenResponse.ok || !tokenPayload.access_token) {
      return redirectWithError(
        origin,
        tokenPayload.error_description ||
          "Google sign-in could not be completed right now.",
      );
    }

    const userInfoResponse = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenPayload.access_token}`,
        },
        cache: "no-store",
      },
    );
    const googleUser = (await userInfoResponse.json()) as GoogleUserInfoResponse;

    if (
      !userInfoResponse.ok ||
      !googleUser.sub ||
      !googleUser.email ||
      googleUser.email_verified !== true
    ) {
      return redirectWithError(
        origin,
        "Google did not return a verified email address for this account.",
      );
    }

    const email = normalizeEmail(googleUser.email);
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          {
            googleId: googleUser.sub,
          },
          {
            email,
          },
        ],
      },
      select: {
        id: true,
        email: true,
        googleId: true,
      },
    });

    const user = existingUser
      ? existingUser.googleId === googleUser.sub
        ? existingUser
        : await prisma.user.update({
            where: {
              id: existingUser.id,
            },
            data: {
              googleId: googleUser.sub,
            },
            select: {
              id: true,
              email: true,
              googleId: true,
            },
          })
      : await prisma.user.create({
          data: {
            email,
            googleId: googleUser.sub,
          },
          select: {
            id: true,
            email: true,
            googleId: true,
          },
        });

    const authSession = await createAuthSession(user.id);
    const response = NextResponse.redirect(new URL("/", origin));
    clearGoogleStateCookie(response);

    return attachAuthSessionCookie(
      response,
      authSession.token,
      authSession.expiresAt,
    );
  } catch (error) {
    console.error("GET /api/auth/google/callback failed", error);

    return redirectWithError(
      request.nextUrl.origin,
      "Google sign-in could not be completed right now.",
    );
  }
}
