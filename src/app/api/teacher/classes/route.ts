import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.TEACHER) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
    });

    if (!teacherProfile) {
      return NextResponse.json(
        { error: "Profil enseignant introuvable" },
        { status: 404 }
      );
    }

    const classrooms = await prisma.classroom.findMany({
      where: {
        teacherProfileId: teacherProfile.id,
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            gradeLevel: true,
            cycle: true,
            schoolName: true,
            supportNeeds: true,
          },
        },
        request: {
          select: {
            id: true,
            commune: true,
            neighborhood: true,
            locationAddress: true,
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
      location: {
        commune: c.request?.commune || null,
        neighborhood: c.request?.neighborhood || null,
        preferredSchedule: c.request?.preferredSchedule || null,
      },
      sessionsCount: c._count.sessions,
    }));

    return NextResponse.json({
      success: true,
      classrooms: formatted,
    });
  } catch (error) {
    console.error("Error fetching teacher classes:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des classes" },
      { status: 500 }
    );
  }
}

