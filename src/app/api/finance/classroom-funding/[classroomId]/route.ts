import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ classroomId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { classroomId } = await params;

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        funding: {
          include: {
            lastPaymentIntent: {
              select: {
                id: true,
                intentReference: true,
                provider: true,
                selectedMethod: true,
                status: true,
                amountGnf: true,
                createdAt: true,
              },
            },
          },
        },
        packages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        sessions: {
          orderBy: { sessionSequence: "asc" },
          select: {
            id: true,
            sessionSequence: true,
            scheduledStart: true,
            durationMinutes: true,
            status: true,
            isFunded: true,
            earningsStatus: true,
            allocatedAmountGnf: true,
            teacherNetGnf: true,
            platformCommissionGnf: true,
            report: {
              select: {
                id: true,
                status: true,
                submittedAt: true,
              },
            },
            approval: {
              select: {
                id: true,
                approvedAt: true,
              },
            },
            dispute: {
              select: {
                id: true,
                status: true,
                category: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            fullName: true,
            parentId: true,
            parent: {
              select: {
                userId: true,
              },
            },
          },
        },
        teacherProfile: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Classe introuvable" }, { status: 404 });
    }

    // Access control: Parent of the classroom, teacher of the classroom, or Admin
    const isParent = classroom.student.parent.userId === user.id;
    const isTeacher = classroom.teacherProfile.userId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isParent && !isTeacher && !isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const funding = classroom.funding;
    const activePackage = classroom.packages[0] || null;

    return NextResponse.json({
      classroomId: classroom.id,
      subjectName: classroom.subjectName,
      status: classroom.status,
      funding: funding || {
        status: "UNFUNDED",
        totalFundedAmountGnf: 0,
        allocatedAmountGnf: 0,
        refundedAmountGnf: 0,
        availableBalanceGnf: 0,
        fundedAt: null,
      },
      package: activePackage,
      sessions: classroom.sessions,
      summary: {
        totalSessions: classroom.sessions.length,
        fundedSessionsCount: classroom.sessions.filter((s) => s.isFunded).length,
        creditedSessionsCount: classroom.sessions.filter(
          (s) => s.earningsStatus === "PAID"
        ).length,
        pendingValidationSessionsCount: classroom.sessions.filter(
          (s) => s.report && s.report.status !== "VALIDATED" && !s.approval
        ).length,
      },
    });
  } catch (error: any) {
    console.error("GET classroom funding error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne" },
      { status: 500 }
    );
  }
}

