import { NextRequest, NextResponse } from "next/server";
import { AUTH_TOKEN_KEY } from "@/src/lib/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function loginErrorRedirect(request: NextRequest, message: string) {
  const url = new URL("/auth/login", request.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return loginErrorRedirect(request, "google_denied");
  }

  const code = searchParams.get("code");
  if (!code) {
    return loginErrorRedirect(request, "missing_code");
  }

  let data: {
    accessToken: string;
    user: { role: string; profileCompleted: boolean };
  };

  try {
    const res = await fetch(`${API_BASE}/auth/google/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as {
        message?: string;
        code?: string;
      };
      if (body.code === "INSTITUTIONAL_EMAIL_REJECTED") {
        return loginErrorRedirect(
          request,
          "institutional_email",
        );
      }
      return loginErrorRedirect(request, body.message ?? "auth_failed");
    }

    data = await res.json();
  } catch {
    return loginErrorRedirect(request, "network_error");
  }

  const destination = !data.user.profileCompleted
    ? "/auth/on-boarding"
    : data.user.role === "ADMIN"
      ? "/admin/dashboard"
      : "/home";

  const completeUrl = new URL("/auth/google/complete", request.url);
  completeUrl.searchParams.set("next", destination);
  // Handoff explícito del JWT a la página cliente (la cookie puede fallar en el primer paint)
  completeUrl.searchParams.set("token", data.accessToken);

  const response = NextResponse.redirect(completeUrl);
  response.cookies.set(AUTH_TOKEN_KEY, data.accessToken, {
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
