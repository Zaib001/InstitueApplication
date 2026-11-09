import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireParentAuth } from "@/lib/auth/parent-guard";
import { tutoringRequestPublishSchema } from "@/lib/validation/tutoring-request";
import { canTransitionRequestStatus } from "@/lib/tutoring-request/state-machine";
import { RequestStatus, UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * POST /api/parent/requests/[id]/publish
 * Publishes an existing DRAFT request, making it OPEN and discoverable by tutors.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireParentAuth();
  if (auth.errorResponse) return auth.errorResponse;

  const { user, parentProfile } = auth.context;
  const { id } = await params;

  // 1. Verify existence & authorization
  const existing = await prisma.tutoringRequest.findFirst({
    where: {
      id,
      ...(user.role !== UserRole.ADMIN ? { parentId: parentProfile.id } : {}),
    },
    include: { student: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Demande de tutorat introuvable ou accès non autorisé." },
      { status: 404 }
    );
  }

  // 2. State transition check
  if (!canTransitionRequestStatus(existing.status, RequestStatus.OPEN)) {
    return NextResponse.json(
      { error: `Impossible de publier une demande au statut '${existing.status}'.` },
      { status: 400 }
    );
  }

  try {
    // 3. Strict publication validation on existing record data
    tutoringRequestPublishSchema.parse(existing);

    // 4. Update status to OPEN and set publishedAt timestamp
    const published = await prisma.tutoringRequest.update({
      where: { id: existing.id },
      data: {
        status: RequestStatus.OPEN,
        publishedAt: new Date(),
      },
      include: { student: true },
    });

    // 5. Audit log entry
    await prisma.auditLog.create({
      data: {
        user: { connect: { id: user.id } },
        action: "TUTORING_REQUEST_PUBLISHED",
        entityType: "TutoringRequest",
        entityId: published.id,
        detailsJson: JSON.stringify({
          requestId: published.id,
          studentName: published.student.fullName,
          subjectName: published.subjectName,
          customSubject: published.customSubject,
          budgetGnf: published.budgetGnf,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Demande de tutorat publiée avec succès. Les enseignants qualifiés peuvent désormais postuler.",
      data: published,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          error: "La demande ne remplit pas tous les critères nécessaires pour être publiée.",
          details: error.errors,
        },
        { status: 400 }
      );
    }
    console.error("Error publishing tutoring request:", error);
    return NextResponse.json(
      { error: "Une erreur serveur est survenue lors de la publication." },
      { status: 500 }
    );
  }
}
