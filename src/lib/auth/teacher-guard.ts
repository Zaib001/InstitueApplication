import { NextResponse } from "next/server";
import { getCurrentUser, AuthenticatedUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { UserRole } from "@prisma/client";

export interface AuthorizedTeacherContext {
  user: AuthenticatedUser;
  teacherProfile: {
    id: string;
    userId: string;
    headline: string | null;
    bio: string | null;
    city: string;
    verificationStatus: string;
    hourlyRateGnf: number | null;
    monthlyPackageRateGnf: number | null;
    customSubject: string | null;
    customGradeLevel: string | null;
  };
}

export interface ApprovedTeacherContext {
  user: AuthenticatedUser;
  teacherProfile: {
    id: string;
    userId: string;
    headline: string | null;
    bio: string | null;
    city: string;
    serviceArea: string | null;
    isHomeAvailable: boolean;
    isOnlineAvailable: boolean;
    verificationStatus: string;
    hourlyRateGnf: number | null;
    monthlyPackageRateGnf: number | null;
    monthlyPackageSessions: number | null;
    monthlyPackageHoursPerSession: number | null;
    customSubject: string | null;
    customGradeLevel: string | null;
    subjects: Array<{
      subjectId: string;
      subject: { id: string; name: string };
    }>;
    gradeLevels: Array<{
      gradeLevelId: string;
      gradeLevel: { id: string; name: string; cycle: string };
    }>;
  };
}

/**
 * Ensures the requesting client is an authenticated Teacher (or Admin).
 * Returns the authenticated user and their TeacherProfile from PostgreSQL.
 * If unauthorized, returns an appropriate NextResponse (401 or 403).
 */
export async function requireTeacherAuth(): Promise<
  | { context: AuthorizedTeacherContext; errorResponse: null }
  | { context: null; errorResponse: NextResponse }
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

  if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
    return {
      context: null,
      errorResponse: NextResponse.json(
        { error: "Accès refusé. Espace réservé aux enseignants." },
        { status: 403 }
      ),
    };
  }

  let teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      userId: true,
      headline: true,
      bio: true,
      city: true,
      verificationStatus: true,
      hourlyRateGnf: true,
      monthlyPackageRateGnf: true,
      customSubject: true,
      customGradeLevel: true,
    },
  });

  if (!teacherProfile && user.role === UserRole.TEACHER) {
    teacherProfile = await prisma.teacherProfile.create({
      data: {
        userId: user.id,
      },
      select: {
        id: true,
        userId: true,
        headline: true,
        bio: true,
        city: true,
        verificationStatus: true,
        hourlyRateGnf: true,
        monthlyPackageRateGnf: true,
        customSubject: true,
        customGradeLevel: true,
      },
    });
  }

  if (!teacherProfile && user.role === UserRole.ADMIN) {
    // Admin without teacher profile
    return {
      context: {
        user,
        teacherProfile: {
          id: "admin-pseudo-profile",
          userId: user.id,
          headline: "Administrateur",
          bio: null,
          city: "Conakry",
          verificationStatus: "APPROVED",
          hourlyRateGnf: null,
          monthlyPackageRateGnf: null,
          customSubject: null,
          customGradeLevel: null,
        },
      },
      errorResponse: null,
    };
  }

  return {
    context: {
      user,
      teacherProfile: teacherProfile!,
    },
    errorResponse: null,
  };
}

/**
 * Ensures the requesting client is an authenticated, active Teacher with APPROVED verification status.
 * Required for marketplace actions (applying to requests, accessing sensitive opportunity matching).
 */
export async function requireApprovedTeacherAuth(): Promise<
  | { context: ApprovedTeacherContext; errorResponse: null }
  | { context: null; errorResponse: NextResponse }
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

  if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
    return {
      context: null,
      errorResponse: NextResponse.json(
        { error: "Accès refusé. Espace réservé aux enseignants." },
        { status: 403 }
      ),
    };
  }

  if (!user.isActive) {
    return {
      context: null,
      errorResponse: NextResponse.json(
        { error: "Votre compte est inactif ou désactivé. Veuillez contacter le support." },
        { status: 403 }
      ),
    };
  }

  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      userId: true,
      headline: true,
      bio: true,
      city: true,
      serviceArea: true,
      isHomeAvailable: true,
      isOnlineAvailable: true,
      verificationStatus: true,
      hourlyRateGnf: true,
      monthlyPackageRateGnf: true,
      monthlyPackageSessions: true,
      monthlyPackageHoursPerSession: true,
      customSubject: true,
      customGradeLevel: true,
      subjects: {
        include: {
          subject: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      gradeLevels: {
        include: {
          gradeLevel: {
            select: {
              id: true,
              name: true,
              cycle: true,
            },
          },
        },
      },
    },
  });

  if (!teacherProfile && user.role === UserRole.ADMIN) {
    // Admin override for testing/administration
    return {
      context: {
        user,
        teacherProfile: {
          id: "admin-pseudo-profile",
          userId: user.id,
          headline: "Administrateur",
          bio: null,
          city: "Conakry",
          serviceArea: "Conakry",
          isHomeAvailable: true,
          isOnlineAvailable: true,
          verificationStatus: "APPROVED",
          hourlyRateGnf: 50000,
          monthlyPackageRateGnf: 800000,
          monthlyPackageSessions: 8,
          monthlyPackageHoursPerSession: 2,
          customSubject: null,
          customGradeLevel: null,
          subjects: [],
          gradeLevels: [],
        },
      },
      errorResponse: null,
    };
  }

  if (!teacherProfile) {
    return {
      context: null,
      errorResponse: NextResponse.json(
        { error: "Profil enseignant introuvable." },
        { status: 404 }
      ),
    };
  }

  if (teacherProfile.verificationStatus !== "APPROVED") {
    return {
      context: null,
      errorResponse: NextResponse.json(
        {
          error:
            "Votre profil enseignant doit être approuvé par l'administration avant de pouvoir postuler.",
          verificationStatus: teacherProfile.verificationStatus,
        },
        { status: 403 }
      ),
    };
  }

  return {
    context: {
      user,
      teacherProfile: teacherProfile as ApprovedTeacherContext["teacherProfile"],
    },
    errorResponse: null,
  };
}

/**
 * Strictly verifies that a given Student Profile has an authorized tutoring relationship
 * with the authenticated teacher (via an active or completed Classroom).
 * Prevents horizontal privilege escalation and prevents teachers from snooping
 * on unrelated students.
 *
 * @param teacherProfileId - ID of the teacher's profile
 * @param studentId - ID of the student to access
 * @param userRole - Role of the requesting user
 * @returns StudentProfile if authorized, null if denied
 */
export async function verifyTeacherStudentAccess(
  teacherProfileId: string,
  studentId: string,
  userRole: UserRole
) {
  // Admin can supervise all students
  if (userRole === UserRole.ADMIN) {
    return prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        parent: {
          include: {
            user: {
              select: {
                fullName: true,
                phoneNumber: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  // Teacher MUST have a valid, authorized classroom with the student
  const classroom = await prisma.classroom.findFirst({
    where: {
      teacherProfileId,
      studentId,
      status: { not: "CANCELLED" },
    },
    include: {
      student: {
        include: {
          parent: {
            include: {
              user: {
                select: {
                  fullName: true,
                  phoneNumber: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!classroom) {
    return null;
  }

  return classroom.student;
}

/**
 * Retrieves all students legitimately associated with a teacher.
 * A newly registered teacher without approved classrooms returns an empty array [].
 */
export async function getTeacherAssignedStudents(teacherProfileId: string) {
  const classrooms = await prisma.classroom.findMany({
    where: {
      teacherProfileId,
      status: { not: "CANCELLED" },
    },
    include: {
      student: true,
    },
  });

  return classrooms.map((c) => c.student);
}

