import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_TOKEN_KEY, isTokenValid } from "@/src/lib/auth";

const PROTECTED_ROUTES = [
  "/applications",
  "/find",
  "/ranking",
  "/users",
  "/home",
];

/** Solo login/register: si ya hay sesión, no tiene sentido volver ahí */
const GUEST_ONLY_AUTH_ROUTES = ["/auth/login", "/auth/register"];

function isLoggedIn(request: NextRequest): boolean {
  const token = request.cookies.get(AUTH_TOKEN_KEY)?.value;
  if (!token) return false;
  return isTokenValid(decodeURIComponent(token));
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
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
  ],
};
