import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ClassroomStatus, TutoringMode, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  ClassroomService,
  ClassroomServiceError,
} from "@/lib/classroom/classroom-service";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "all" | "assisted" | "marketplace"
    const status = searchParams.get("status") as ClassroomStatus | null;
    const query = searchParams.get("q")?.trim() || "";

    const whereClause: any = {};

    if (type === "assisted") {
      whereClause.isAssistedAssignment = true;
    } else if (type === "marketplace") {
      whereClause.isAssistedAssignment = false;
    }

    if (status && Object.values(ClassroomStatus).includes(status)) {
      whereClause.status = status;
    }

    if (query) {
      whereClause.OR = [
        { subjectName: { contains: query, mode: "insensitive" } },
        {
          student: {
            fullName: { contains: query, mode: "insensitive" },
          },
        },
        {
          student: {
            parent: {
              user: {
                fullName: { contains: query, mode: "insensitive" },
              },
            },
          },
        },
        {
          teacherProfile: {
            user: {
              fullName: { contains: query, mode: "insensitive" },
            },
          },
        },
      ];
    }

    const classrooms = await prisma.classroom.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            parent: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phoneNumber: true,
                  },
                },
              },
            },
          },
        },
        teacherProfile: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                avatarUrl: true,
              },
            },
          },
        },
        assignedByAdmin: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        request: {
          select: {
            id: true,
            status: true,
            budgetGnf: true,
            budgetType: true,
            preferredSchedule: true,
            commune: true,
          },
        },
        _count: {
          select: {
            sessions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute stats
    const [totalCount, assistedCount, marketplaceCount, pendingPaymentCount, activeCount] =
      await Promise.all([
        prisma.classroom.count(),
        prisma.classroom.count({ where: { isAssistedAssignment: true } }),
        prisma.classroom.count({ where: { isAssistedAssignment: false } }),
        prisma.classroom.count({ where: { status: ClassroomStatus.PENDING_PAYMENT } }),
        prisma.classroom.count({ where: { status: ClassroomStatus.ACTIVE } }),
      ]);

    const formatted = classrooms.map((c) => ({
      id: c.id,
      requestId: c.requestId,
      subjectName: c.subjectName,
      mode: c.mode,
      hourlyRateGnf: c.hourlyRateGnf,
      monthlyRateGnf: c.monthlyRateGnf,
      isAssistedAssignment: c.isAssistedAssignment,
      assignmentSource: c.assignmentSource,
      adminNotes: c.adminNotes,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      student: {
        id: c.student.id,
        fullName: c.student.fullName,
        gradeLevel: c.student.gradeLevel,
        cycle: c.student.cycle,
        parent: {
          id: c.student.parent.id,
          fullName: c.student.parent.user.fullName,
          email: c.student.parent.user.email,
          phoneNumber: c.student.parent.user.phoneNumber,
        },
      },
      teacher: {
        id: c.teacherProfile.id,
        fullName: c.teacherProfile.user.fullName,
        email: c.teacherProfile.user.email,
        phoneNumber: c.teacherProfile.user.phoneNumber,
        avatarUrl: c.teacherProfile.user.avatarUrl,
      },
      assignedByAdmin: c.assignedByAdmin
        ? {
            id: c.assignedByAdmin.id,
            fullName: c.assignedByAdmin.fullName,
          }
        : null,
      sessionsCount: c._count.sessions,
    }));

    return NextResponse.json({
      success: true,
      classrooms: formatted,
      stats: {
        total: totalCount,
        assisted: assistedCount,
        marketplace: marketplaceCount,
        pendingPayment: pendingPaymentCount,
        active: activeCount,
      },
    });
  } catch (error) {
    console.error("Error fetching admin assignments:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des affectations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();
    const {
      parentProfileId,
      studentId,
      teacherProfileId,
      subjectName,
      mode,
      gradeLevelName,
      cycle,
      hourlyRateGnf,
      monthlyRateGnf,
      sessionsCount,
      minutesPerSession,
      assignmentSource = "PHONE_INQUIRY",
      adminNotes,
      city = "Conakry",
      commune,
      locationAddress,
      preferredSchedule,
    } = body;

    if (!parentProfileId || !studentId || !teacherProfileId || !subjectName) {
      return NextResponse.json(
        {
          error:
            "Paramètres requis manquants (parent, élève, professeur, matière)",
        },
        { status: 400 }
      );
    }

    const validModes: TutoringMode[] = [
      TutoringMode.HOME,
      TutoringMode.ONLINE,
      TutoringMode.HYBRID,
    ];
    const resolvedMode = validModes.includes(mode) ? mode : TutoringMode.HOME;

    const result = await ClassroomService.createAdminAssistedClassroom({
      adminUserId: user.id,
      parentProfileId,
      studentId,
      teacherProfileId,
      subjectName: subjectName.trim(),
      mode: resolvedMode,
      gradeLevelName,
      cycle,
      hourlyRateGnf: hourlyRateGnf ? Number(hourlyRateGnf) : null,
      monthlyRateGnf: monthlyRateGnf ? Number(monthlyRateGnf) : null,
      sessionsCount: sessionsCount ? Number(sessionsCount) : null,
      minutesPerSession: minutesPerSession ? Number(minutesPerSession) : null,
      assignmentSource,
      adminNotes,
      city,
      commune,
      locationAddress,
      preferredSchedule,
    });

    return NextResponse.json({
      success: true,
      classroom: result.classroom,
      request: result.request,
      application: result.application,
    });
  } catch (error) {
    if (error instanceof ClassroomServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Error creating direct assignment:", error);
    return NextResponse.json(
      { error: "Erreur interne lors de l'affectation directe" },
      { status: 500 }
    );
  }
}

