import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireParentAuth, verifyStudentOwnership } from "@/lib/auth/parent-guard";
import { studentUpdateSchema } from "@/lib/validation/parent";

export const dynamic = "force-dynamic";

/**
 * GET /api/parent/children/[id]
 * Retrieves full detail of a specific student profile.
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

  const student = await verifyStudentOwnership(id, parentProfile.id, user.role);

  if (!student) {
    return NextResponse.json(
      { error: "Profil élève introuvable ou accès non autorisé." },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: student });
}

/**
 * PUT /api/parent/children/[id]
 * Updates an existing student profile.
 * Verifies that the authenticated parent owns this student.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireParentAuth();
  if (auth.errorResponse) return auth.errorResponse;

  const { user, parentProfile } = auth.context;
  const { id } = await params;

  // Verify ownership before mutation
  const existing = await verifyStudentOwnership(id, parentProfile.id, user.role);
  if (!existing) {
    return NextResponse.json(
      { error: "Profil élève introuvable ou accès non autorisé." },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const validatedData = studentUpdateSchema.parse(body);

    const updatePayload: any = {};
    if (validatedData.fullName !== undefined) updatePayload.fullName = validatedData.fullName;
    if (validatedData.gradeLevel !== undefined) updatePayload.gradeLevel = validatedData.gradeLevel;
    if (validatedData.cycle !== undefined) updatePayload.cycle = validatedData.cycle;
    if (validatedData.schoolName !== undefined) updatePayload.schoolName = validatedData.schoolName || null;
    if (validatedData.dateOfBirth !== undefined) {
      updatePayload.dateOfBirth = validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null;
    }
    if (validatedData.supportNeeds !== undefined) {
      updatePayload.supportNeeds = validatedData.supportNeeds || null;
    }
    if (validatedData.preferredSubjects !== undefined) {
      updatePayload.preferredSubjects = validatedData.preferredSubjects;
    }
    if (validatedData.notes !== undefined) {
      updatePayload.notes = validatedData.notes || null;
    }

    const updated = await prisma.studentProfile.update({
      where: { id: existing.id },
      data: updatePayload,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "STUDENT_UPDATED",
        entityType: "StudentProfile",
        entityId: updated.id,
        detailsJson: JSON.stringify({
          studentId: updated.id,
          studentName: updated.fullName,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profil élève mis à jour avec succès.",
      data: updated,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Données d'élève invalides." },
        { status: 400 }
      );
    }
    console.error("Error updating student profile:", error);
    return NextResponse.json(
      { error: "Impossible de mettre à jour le profil de l'élève." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/parent/children/[id]
 * Lifecycle-aware removal or archival:
 * Checks for existing tutoring requests or classrooms. If history exists,
 * archives the student (isArchived: true) to preserve academic and audit records.
 * If no history exists, allows safe deletion.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireParentAuth();
  if (auth.errorResponse) return auth.errorResponse;

  const { user, parentProfile } = auth.context;
  const { id } = await params;

  const existing = await verifyStudentOwnership(id, parentProfile.id, user.role);
  if (!existing) {
    return NextResponse.json(
      { error: "Profil élève introuvable ou accès non autorisé." },
      { status: 404 }
    );
  }

  try {
    const hasHistory =
      existing.tutoringRequests.length > 0 || existing.classrooms.length > 0;

    if (hasHistory) {
      // Archive student to protect pedagogical, financial, and audit trail
      const archived = await prisma.studentProfile.update({
        where: { id: existing.id },
        data: {
          isArchived: true,
          archivedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "STUDENT_ARCHIVED",
          entityType: "StudentProfile",
          entityId: existing.id,
          detailsJson: JSON.stringify({
            studentId: existing.id,
            studentName: existing.fullName,
            reason: "Preserved related classroom/request history",
          }),
        },
      });

      return NextResponse.json({
        success: true,
        action: "ARCHIVED",
        message:
          "Le profil a été archivé pour conserver l'historique des cours et demandes associées.",
        data: archived,
      });
    } else {
      // Safe permanent deletion (no associated records)
      await prisma.studentProfile.delete({
        where: { id: existing.id },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "STUDENT_DELETED",
          entityType: "StudentProfile",
          entityId: existing.id,
          detailsJson: JSON.stringify({
            studentId: existing.id,
            studentName: existing.fullName,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        action: "DELETED",
        message: "Profil élève supprimé avec succès.",
      });
    }
  } catch (error: any) {
    console.error("Error removing student profile:", error);
    return NextResponse.json(
      { error: "Impossible de supprimer ce profil élève." },
      { status: 500 }
    );
  }
}
