import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { ReportingService, ReportingServiceError } from "@/lib/reporting/reporting-service";
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

    const { id: sessionId } = await params;

    const session = await prisma.lessonSession.findUnique({
      where: { id: sessionId },
      include: {
        classroom: {
          include: {
            teacherProfile: true,
            student: true,
          },
        },
        report: true,
        approval: true,
        dispute: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Séance introuvable" }, { status: 404 });
    }

    if (user.role === UserRole.TEACHER && session.classroom.teacherProfile.userId !== user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    return NextResponse.json({ session });
  } catch (err: any) {
    console.error("GET /api/teacher/sessions/[id]/report error:", err);
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
      return NextResponse.json({ error: "Accès réservé aux enseignants" }, { status: 403 });
    }

    const { id: sessionId } = await params;
    const body = await req.json();

    const isSubmit = body.action === "submit";

    if (isSubmit) {
      const result = await ReportingService.submitLessonReport({
        sessionId,
        topicsCovered: body.topicsCovered,
        learningObjectives: body.learningObjectives,
        studentEffort: body.studentEffort,
        teacherNotes: body.teacherNotes,
        strengths: body.strengths,
        areasForImprovement: body.areasForImprovement,
        homeworkGiven: body.homeworkGiven,
        homeworkDueDate: body.homeworkDueDate,
        nextLessonRecommendations: body.nextLessonRecommendations,
        assessmentTitle: body.assessmentTitle,
        assessmentScore: body.assessmentScore,
        assessmentMaxScore: body.assessmentMaxScore,
        assessmentComment: body.assessmentComment,
        progressRating: body.progressRating,
        attendanceStatus: body.attendanceStatus || "PRESENT",
        actualDurationMinutes: body.actualDurationMinutes,
        actorUserId: user.id,
        actorRole: user.role,
      });

      return NextResponse.json({
        success: true,
        report: result.report,
        session: result.session,
        message: "Compte rendu soumis avec succès pour validation parentale.",
      });
    } else {
      // Draft mode
      const report = await ReportingService.saveDraftReport({
        sessionId,
        topicsCovered: body.topicsCovered || "",
        learningObjectives: body.learningObjectives,
        studentEffort: body.studentEffort,
        teacherNotes: body.teacherNotes,
        strengths: body.strengths,
        areasForImprovement: body.areasForImprovement,
        homeworkGiven: body.homeworkGiven,
        homeworkDueDate: body.homeworkDueDate,
        nextLessonRecommendations: body.nextLessonRecommendations,
        assessmentTitle: body.assessmentTitle,
        assessmentScore: body.assessmentScore,
        assessmentMaxScore: body.assessmentMaxScore,
        assessmentComment: body.assessmentComment,
        progressRating: body.progressRating,
        attendanceStatus: body.attendanceStatus,
        actualDurationMinutes: body.actualDurationMinutes,
        actorUserId: user.id,
        actorRole: user.role,
      });

      return NextResponse.json({
        success: true,
        report,
        message: "Brouillon du compte rendu enregistré.",
      });
    }
  } catch (err: any) {
    if (err instanceof ReportingServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("POST /api/teacher/sessions/[id]/report error:", err);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

