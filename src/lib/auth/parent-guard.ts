import { NextResponse } from "next/server";
import { getCurrentUser, AuthenticatedUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { UserRole } from "@prisma/client";

export interface AuthorizedParentContext {
  user: AuthenticatedUser;
  parentProfile: {
    id: string;
    userId: string;
    address: string | null;
    city: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Ensures the requesting client is an authenticated Parent (or Admin).
 * Returns the authenticated user and their ParentProfile from PostgreSQL.
 * If unauthorized, returns an appropriate NextResponse (401 or 403).
 */
export async function requireParentAuth(): Promise<
  { context: AuthorizedParentContext; errorResponse: null } |
  { context: null; errorResponse: NextResponse }
> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      context: null,
      errorResponse: NextResponse.json(
        { error: "Authentification requise. Veuillez vous connecter." },
        { status: 401 }
      ),
    };
  }

  if (user.role !== UserRole.PARENT && user.role !== UserRole.ADMIN) {
    return {
      context: null,
      errorResponse: NextResponse.json(
        { error: "Accès refusé. Espace réservé aux parents d'élèves." },
        { status: 403 }
      ),
    };
  }

  // Ensure ParentProfile exists
  let parentProfile = await prisma.parentProfile.findUnique({
    where: { userId: user.id },
  });

  if (!parentProfile) {
    parentProfile = await prisma.parentProfile.create({
      data: {
        userId: user.id,
        city: "Conakry",
      },
    });
  }

  return {
    context: {
      user,
      parentProfile,
    },
    errorResponse: null,
  };
}

/**
 * Strictly verifies that a given Student Profile belongs to the authenticated parent.
 * Prevents horizontal privilege escalation (Parent A accessing Parent B's child).
 */
export async function verifyStudentOwnership(
  studentId: string,
  parentId: string,
  userRole: UserRole
) {
  // Admin can view for customer support, but Parents can ONLY access their own children
  const whereClause: any = { id: studentId };
  if (userRole !== UserRole.ADMIN) {
    whereClause.parentId = parentId;
  }

  const student = await prisma.studentProfile.findFirst({
    where: whereClause,
    include: {
      parent: {
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      },
      tutoringRequests: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      classrooms: {
        include: {
          teacherProfile: {
            include: {
              user: {
                select: {
                  fullName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return student;
}
