import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/db/prisma";
import { UserRole, TeacherVerificationStatus } from "@prisma/client";

export const SESSION_COOKIE_NAME = "fanyi_session";
export const DEFAULT_SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

const secretKey = process.env.AUTH_SECRET || "dev_fanyi_secret_key_session_guinea_2026_xyz_secure_min_32";
const encodedKey = new TextEncoder().encode(secretKey);

export interface SessionPayload {
  sub: string; // User ID
  email: string;
  fullName: string;
  role: UserRole;
  jti: string; // Session ID (DB record identifier)
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  parentProfile?: {
    id: string;
    city: string;
  } | null;
  teacherProfile?: {
    id: string;
    verificationStatus: TeacherVerificationStatus;
    city: string;
  } | null;
}

/**
 * Creates a persistent database session and an HTTP-only JWT session cookie.
 */
export async function createSession(
  user: { id: string; email: string; fullName: string; role: UserRole },
  options?: { ipAddress?: string; userAgent?: string; maxAgeSeconds?: number }
): Promise<string> {
  const maxAge = options?.maxAgeSeconds ?? DEFAULT_SESSION_MAX_AGE;
  const expiresAt = new Date(Date.now() + maxAge * 1000);

  // 1. Persist session record in PostgreSQL
  const dbSession = await prisma.session.create({
    data: {
      userId: user.id,
      sessionToken: crypto.randomUUID(),
      expiresAt,
      ipAddress: options?.ipAddress || null,
      userAgent: options?.userAgent || null,
    },
  });

  // 2. Generate signed JWT containing the session ID (jti)
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    jti: dbSession.sessionToken,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(encodedKey);

  // 3. Set secure HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
    expires: expiresAt,
  });

  return token;
}

/**
 * Reads and verifies the session token from cookies or raw token string.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Retrieves the currently authenticated user from the database.
 * Validates session token, checks that user is active, and verifies the DB session has not been revoked.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload?.sub || !payload.jti) return null;

    // Verify session still exists and has not expired in DB
    const dbSession = await prisma.session.findUnique({
      where: { sessionToken: payload.jti },
    });

    if (!dbSession || dbSession.expiresAt < new Date()) {
      return null;
    }

    // Retrieve user and status from DB
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        parentProfile: {
          select: { id: true, city: true },
        },
        teacherProfile: {
          select: { id: true, verificationStatus: true, city: true },
        },
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      parentProfile: user.parentProfile,
      teacherProfile: user.teacherProfile,
    };
  } catch (error: any) {
    if (error?.digest === "DYNAMIC_SERVER_USAGE") throw error;
    console.error("Error retrieving current user:", error);
    return null;
  }
}

/**
 * Invalidates the current session both in PostgreSQL and by clearing the HTTP-only cookie.
 */
export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      const payload = await verifySessionToken(token);
      if (payload?.jti) {
        await prisma.session.deleteMany({
          where: { sessionToken: payload.jti },
        });
      }
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (error) {
    console.error("Error destroying session:", error);
  }
}

/**
 * Invalidate all sessions for a user (e.g. upon password reset or security change).
 */
export async function destroyAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  });
}

/**
 * Role-based server-side guard. Returns authenticated user or throws error.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

/**
 * Enforces role restriction. Throws if user lacks required role.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
