import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTeacherAuth } from "@/lib/auth/teacher-guard";
import { ApplicationStatus } from "@prisma/client";

/**
 * POST /api/teacher/applications/[id]/withdraw
 * Allows an authorized teacher to withdraw an eligible submitted or shortlisted application.
 * Rejects withdrawal if application is ACCEPTED or already WITHDRAWN.
 * Strictly preserves historical records and timestamps.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireTeacherAuth();
    if (auth.errorResponse) return auth.errorResponse;

    const { user, teacherProfile } = auth.context;
    const { id } = await params;

    // 1. Fetch application with request relation
    const application = await prisma.teacherApplication.findUnique({
      where: { id },
      include: {
        request: {
          select: {
            id: true,
            subjectName: true,
            parentId: true,
            parent: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
    }

    // 2. Ownership verification: Teacher can only withdraw their own application
    if (application.teacherProfileId !== teacherProfile.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès non autorisé. Vous ne pouvez retirer que vos propres candidatures." },
        { status: 403 }
      );
    }

    // 3. State transition validation
    if (application.status === ApplicationStatus.WITHDRAWN) {
      return NextResponse.json(
        { error: "Cette candidature a déjà été retirée." },
        { status: 400 }
      );
    }

    if (application.status === ApplicationStatus.ACCEPTED) {
      return NextResponse.json(
        {
          error:
            "Une candidature acceptée est liée à une demande en cours de finalisation et ne peut pas être retirée directement.",
        },
        { status: 400 }
      );
    }

    if (application.status === ApplicationStatus.REJECTED) {
      return NextResponse.json(
        { error: "Cette candidature a déjà été déclinée par le parent." },
        { status: 400 }
      );
    }

    // 4. Update status with timestamp in transaction
    const updatedApplication = await prisma.$transaction(async (tx) => {
      const updated = await tx.teacherApplication.update({
        where: { id },
        data: {
          status: ApplicationStatus.WITHDRAWN,
          withdrawnAt: new Date(),
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "TEACHER_APPLICATION_WITHDRAWN",
          entityType: "TeacherApplication",
          entityId: id,
          detailsJson: JSON.stringify({
            requestId: application.requestId,
            teacherProfileId: teacherProfile.id,
            withdrawnAt: new Date(),
          }),
        },
      });

      // Notify parent of withdrawal
      if (application.request.parent?.userId) {
        await tx.notification.create({
          data: {
            userId: application.request.parent.userId,
            title: "Candidature retirée",
            message: `Un enseignant a retiré sa candidature pour votre demande de cours (${application.request.subjectName}).`,
            linkUrl: `/parent/requests/${application.requestId}`,
          },
        });
      }

      return updated;
    });

    return NextResponse.json({
      message: "Votre candidature a été retirée avec succès.",
      application: updatedApplication,
    });
  } catch (error) {
    console.error("[POST /api/teacher/applications/[id]/withdraw] Error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors du retrait de la candidature." },
      { status: 500 }
    );
  }
}
