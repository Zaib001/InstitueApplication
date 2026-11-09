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

    const assessments = await prisma.academicAssessment.findMany({
      where: { studentId },
      include: {
        classroom: { select: { subjectName: true } },
        teacherProfile: {
          select: {
            user: { select: { fullName: true } },
          },
        },
      },
      orderBy: { assessmentDate: "desc" },
    });

    return NextResponse.json(assessments);
  } catch (err: any) {
    console.error("GET /api/students/[id]/assessments error:", err);
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
        { error: "Seuls les enseignants et administrateurs peuvent enregistrer des évaluations." },
        { status: 403 }
      );
    }

    const { id: studentId } = await params;
    const body = await req.json();

    const result = await ProgressService.createAssessment({
      studentId,
      classroomId: body.classroomId,
      sessionId: body.sessionId || null,
      title: body.title,
      assessmentType: body.assessmentType,
      assessmentDate: body.assessmentDate || null,
      obtainedScore: Number(body.obtainedScore),
      maxScore: body.maxScore ? Number(body.maxScore) : 20,
      learningObjectives: body.learningObjectives || null,
      teacherComments: body.teacherComments || null,
      actorUserId: user.id,
      actorRole: user.role,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    if (err instanceof ProgressServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("POST /api/students/[id]/assessments error:", err);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

