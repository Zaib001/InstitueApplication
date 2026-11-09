import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireParentAuth, verifyStudentOwnership } from "@/lib/auth/parent-guard";
import {
  tutoringRequestDraftSchema,
  tutoringRequestPublishSchema,
} from "@/lib/validation/tutoring-request";
import { isRequestEditable } from "@/lib/tutoring-request/state-machine";
import { RequestStatus, UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * Helper to fetch a TutoringRequest and strictly verify parent authorization.
 */
async function getAuthorizedRequest(requestId: string, parentProfileId: string, userRole: UserRole) {
  const where: any = { id: requestId };
  if (userRole !== UserRole.ADMIN) {
    where.parentId = parentProfileId;
  }

  return prisma.tutoringRequest.findFirst({
    where,
    include: {
      student: true,
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
      _count: {
        select: {
          applications: true,
        },
      },
      applications: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          pitchMessage: true,
          proposedRateGnf: true,
          proposedRateType: true,
          sessionArrangement: true,
          status: true,
          createdAt: true,
          teacherProfile: {
            select: {
              id: true,
              headline: true,
              yearsOfExperience: true,
              city: true,
              serviceArea: true,
              verificationStatus: true,
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
}

/**
 * GET /api/parent/requests/[id]
 * Retrieves full details of a specific tutoring request.
 * Strictly verifies parent ownership.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireParentAuth();
  if (auth.errorResponse) return auth.errorResponse;

  const { user, parentProfile } = auth.context;
  const { id } = await params;

  const tutoringRequest = await getAuthorizedRequest(id, parentProfile.id, user.role);

  if (!tutoringRequest) {
    return NextResponse.json(
      { error: "Demande de tutorat introuvable ou accès non autorisé." },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: tutoringRequest });
}

/**
 * PATCH /api/parent/requests/[id]
 * Updates an existing tutoring request.
 * Verifies that the parent owns the request and that its status allows edits (DRAFT or OPEN).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireParentAuth();
  if (auth.errorResponse) return auth.errorResponse;

  const { user, parentProfile } = auth.context;
  const { id } = await params;

  // 1. Verify existence and authorization
  const existing = await getAuthorizedRequest(id, parentProfile.id, user.role);

  if (!existing) {
    return NextResponse.json(
      { error: "Demande de tutorat introuvable ou accès non autorisé." },
      { status: 404 }
    );
  }

  // 2. Verify lifecycle editability rule
  if (!isRequestEditable(existing.status)) {
    return NextResponse.json(
      {
        error: `Une demande au statut '${existing.status}' ne peut plus être modifiée directement.`,
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const action = body.action === "publish" ? "publish" : "save_draft";

    // 3. Validate input
    const validatedData =
      action === "publish"
        ? tutoringRequestPublishSchema.parse({
            ...existing,
            ...body,
            studentId: body.studentId || existing.studentId,
          })
        : tutoringRequestDraftSchema.parse(body);

    // 4. If studentId is changing, verify parent owns the target child
    if (validatedData.studentId && validatedData.studentId !== existing.studentId) {
      const student = await verifyStudentOwnership(
        validatedData.studentId,
        parentProfile.id,
        user.role
      );
      if (!student) {
        return NextResponse.json(
          { error: "Élève sélectionné introuvable ou non autorisé." },
          { status: 403 }
        );
      }
    }

    const updatePayload: any = {};
    if (validatedData.studentId !== undefined) updatePayload.studentId = validatedData.studentId;
    if (validatedData.subjectId !== undefined) updatePayload.subjectId = validatedData.subjectId;
    if (validatedData.subjectName !== undefined) updatePayload.subjectName = validatedData.subjectName;
    if (validatedData.customSubject !== undefined) updatePayload.customSubject = validatedData.customSubject || null;
    if (validatedData.cycle !== undefined) updatePayload.cycle = validatedData.cycle || null;
    if (validatedData.customCycle !== undefined) updatePayload.customCycle = validatedData.customCycle || null;
    if (validatedData.gradeLevelName !== undefined) updatePayload.gradeLevelName = validatedData.gradeLevelName;
    if (validatedData.mode !== undefined) updatePayload.mode = validatedData.mode;
    if (validatedData.frequency !== undefined) updatePayload.frequency = validatedData.frequency || null;
    if (validatedData.preferredSchedule !== undefined) updatePayload.preferredSchedule = validatedData.preferredSchedule || null;
    if (validatedData.sessionDurationMinutes !== undefined) updatePayload.sessionDurationMinutes = validatedData.sessionDurationMinutes;
    if (validatedData.budgetGnf !== undefined) updatePayload.budgetGnf = validatedData.budgetGnf;
    if (validatedData.budgetType !== undefined) updatePayload.budgetType = validatedData.budgetType;
    if (validatedData.city !== undefined) updatePayload.city = validatedData.city;
    if (validatedData.commune !== undefined) updatePayload.commune = validatedData.commune || null;
    if (validatedData.neighborhood !== undefined) updatePayload.neighborhood = validatedData.neighborhood || null;
    if (validatedData.locationAddress !== undefined) updatePayload.locationAddress = validatedData.locationAddress || null;
    if (validatedData.learningGoals !== undefined) updatePayload.learningGoals = validatedData.learningGoals || null;
    if (validatedData.description !== undefined) updatePayload.description = validatedData.description;
    if (validatedData.notes !== undefined) updatePayload.notes = validatedData.notes || null;

    if (action === "publish" && existing.status === RequestStatus.DRAFT) {
      updatePayload.status = RequestStatus.OPEN;
      updatePayload.publishedAt = new Date();
    }

    const updated = await prisma.tutoringRequest.update({
      where: { id: existing.id },
      data: updatePayload,
      include: {
        student: true,
      },
    });

    // 5. Audit log
    await prisma.auditLog.create({
      data: {
        user: { connect: { id: user.id } },
        action: action === "publish" ? "TUTORING_REQUEST_PUBLISHED" : "TUTORING_REQUEST_UPDATED",
        entityType: "TutoringRequest",
        entityId: updated.id,
        detailsJson: JSON.stringify({
          requestId: updated.id,
          studentName: updated.student.fullName,
          status: updated.status,
          action,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message:
        action === "publish"
          ? "Demande de tutorat publiée avec succès."
          : "Demande mise à jour avec succès.",
      data: updated,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          error: error.errors[0]?.message || "Données de modification invalides.",
          details: error.errors,
        },
        { status: 400 }
      );
    }
    console.error("Error updating tutoring request:", error);
    return NextResponse.json(
      { error: "Une erreur serveur est survenue lors de la mise à jour." },
      { status: 500 }
    );
  }
}
