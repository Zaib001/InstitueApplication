import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.PARENT) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: user.id },
    });

    if (!parentProfile) {
      return NextResponse.json(
        { error: "Profil parent introuvable" },
        { status: 404 }
      );
    }

    const classrooms = await prisma.classroom.findMany({
      where: {
        student: {
          parentId: parentProfile.id,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            gradeLevel: true,
            cycle: true,
          },
        },
        teacherProfile: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
        request: {
          select: {
            id: true,
            commune: true,
            preferredSchedule: true,
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

    const formatted = classrooms.map((c) => ({
      id: c.id,
      requestId: c.requestId,
      subjectName: c.subjectName,
      mode: c.mode,
      hourlyRateGnf: c.hourlyRateGnf,
      monthlyRateGnf: c.monthlyRateGnf,
      isAssistedAssignment: c.isAssistedAssignment,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      student: c.student,
      teacher: {
        id: c.teacherProfile.id,
        fullName: c.teacherProfile.user.fullName,
        avatarUrl: c.teacherProfile.user.avatarUrl,
        headline: c.teacherProfile.headline,
      },
      sessionsCount: c._count.sessions,
    }));

    return NextResponse.json({
      success: true,
      classrooms: formatted,
    });
  } catch (error) {
    console.error("Error fetching parent classes:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des classes" },
      { status: 500 }
    );
  }
}

