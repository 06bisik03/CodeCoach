import { NextRequest, NextResponse } from "next/server";
import {
  attachGoogleStateCookie,
  createOAuthState,
  createOAuthStateExpiry,
  getGoogleOAuthConfig,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const googleConfig = getGoogleOAuthConfig(origin);

  if (!googleConfig) {
    return NextResponse.redirect(
      new URL(
        "/?authError=Google%20sign-in%20is%20not%20configured%20yet.",
        origin,
      ),
    );
  }

  const state = createOAuthState();
  const stateExpiresAt = createOAuthStateExpiry();
  const authorizationUrl = new URL(
    "https://accounts.google.com/o/oauth2/v2/auth",
  );

  authorizationUrl.searchParams.set("client_id", googleConfig.clientId);
  authorizationUrl.searchParams.set("redirect_uri", googleConfig.redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", "openid email profile");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authorizationUrl);
  return attachGoogleStateCookie(response, state, stateExpiresAt);
}
