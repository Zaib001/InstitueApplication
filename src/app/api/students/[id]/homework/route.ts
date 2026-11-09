import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ProgressService, ProgressServiceError } from "@/lib/progress/progress-service";
import { prisma } from "@/lib/db/prisma";
import { UserRole } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id: studentId } = await params;

    // Check authorization: parent of student, teacher with classroom, or admin
    if (user.role === UserRole.PARENT) {
      const student = await prisma.studentProfile.findFirst({
        where: { id: studentId, parent: { userId: user.id } },
      });
      if (!student) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
    } else if (user.role === UserRole.TEACHER) {
      const classroom = await prisma.classroom.findFirst({
        where: { studentId, teacherProfile: { userId: user.id } },
      });
      if (!classroom) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
    } else if (user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const homework = await prisma.homeworkAssignment.findMany({
      where: { studentId },
      include: {
        classroom: { select: { subjectName: true } },
        teacherProfile: {
          select: {
            user: { select: { fullName: true } },
          },
        },
      },
      orderBy: { dueDate: "desc" },
    });

    return NextResponse.json(homework);
  } catch (err: any) {
    console.error("GET /api/students/[id]/homework error:", err);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Seuls les enseignants et administrateurs peuvent assigner des devoirs." },
        { status: 403 }
      );
    }

    const { id: studentId } = await params;
    const body = await req.json();

    const result = await ProgressService.createHomework({
      studentId,
      classroomId: body.classroomId,
      sessionId: body.sessionId || null,
      title: body.title,
      description: body.description,
      dueDate: body.dueDate || null,
      actorUserId: user.id,
      actorRole: user.role,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    if (err instanceof ProgressServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("POST /api/students/[id]/homework error:", err);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

