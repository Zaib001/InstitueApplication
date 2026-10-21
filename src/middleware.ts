import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "fanyi_session";
const secretKey = process.env.AUTH_SECRET || "dev_fanyi_secret_key_session_guinea_2026_xyz_secure_min_32";
const encodedKey = new TextEncoder().encode(secretKey);

interface TokenPayload {
  sub: string;
  email: string;
  role: "PARENT" | "TEACHER" | "ADMIN" | "STUDENT";
}

function getDashboardForRole(role: string): string {
  switch (role) {
    case "TEACHER":
      return "/teacher/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    case "PARENT":
    case "STUDENT":
    default:
      return "/parent/dashboard";
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  let session: TokenPayload | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, encodedKey, {
        algorithms: ["HS256"],
      });
      session = payload as unknown as TokenPayload;
    } catch {
      // Token is invalid or expired
      session = null;
    }
  }

  // 1. Guest-only routes: redirect logged-in users to their role dashboard
  const guestOnlyRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];
  const isGuestOnlyRoute = guestOnlyRoutes.some((route) => pathname.startsWith(route));

  if (isGuestOnlyRoute && session) {
    const destination = getDashboardForRole(session.role);
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // 2. Protected routes validation
  const isParentRoute = pathname.startsWith("/parent");
  const isTeacherRoute = pathname.startsWith("/teacher");
  const isAdminRoute = pathname.startsWith("/admin");
  const isSettingsRoute = pathname.startsWith("/settings");

  const isProtectedRoute = isParentRoute || isTeacherRoute || isAdminRoute || isSettingsRoute;

  if (isProtectedRoute) {
    if (!session) {
      // Redirect unauthenticated visitor to login with safe relative callback URL
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based authorization enforcement
    if (isParentRoute && session.role !== "PARENT") {
      const properDashboard = getDashboardForRole(session.role);
      return NextResponse.redirect(new URL(properDashboard, request.url));
    }

    if (isTeacherRoute && session.role !== "TEACHER") {
      const properDashboard = getDashboardForRole(session.role);
      return NextResponse.redirect(new URL(properDashboard, request.url));
    }

    if (isAdminRoute && session.role !== "ADMIN") {
      const properDashboard = getDashboardForRole(session.role);
      return NextResponse.redirect(new URL(properDashboard, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/parent/:path*",
    "/teacher/:path*",
    "/admin/:path*",
    "/settings/:path*",
  ],
};
