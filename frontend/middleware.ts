import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_TOKEN_KEY, isTokenValid } from "@/src/lib/auth";

const PROTECTED_ROUTES = [
  "/applications",
  "/find",
  "/ranking",
  "/users",
  "/home",
  "/admin",
];

/** Solo login: si ya hay sesión, redirigir al home */
const GUEST_ONLY_AUTH_ROUTES = ["/auth/login"];

function normalizeCookieToken(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function isLoggedIn(request: NextRequest): boolean {
  const raw = request.cookies.get(AUTH_TOKEN_KEY)?.value;
  const token = normalizeCookieToken(raw);
  if (!token) return false;
  return isTokenValid(token);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loggedIn = isLoggedIn(request);

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  if (isProtected && !loggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/forbidden";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  const isGuestAuthRoute = GUEST_ONLY_AUTH_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  if (isGuestAuthRoute && loggedIn) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
  ],
};
