import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireParentAuth } from "@/lib/auth/parent-guard";
import { canTransitionRequestStatus } from "@/lib/tutoring-request/state-machine";
import { RequestStatus, UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * POST /api/parent/requests/[id]/cancel
 * Cancels an eligible tutoring request (in DRAFT or OPEN status).
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

  // 2. State transition check (cannot cancel already closed, matched, or already cancelled)
  if (!canTransitionRequestStatus(existing.status, RequestStatus.CANCELLED)) {
    return NextResponse.json(
      { error: `Impossible d'annuler une demande au statut '${existing.status}'.` },
      { status: 400 }
    );
  }

  try {
    let reason: string | null = null;
    try {
      const body = await request.json();
      if (body.reason && typeof body.reason === "string") {
        reason = body.reason.trim();
      }
    } catch {
      // Body is optional
    }

    // 3. Mark request as CANCELLED
    const cancelled = await prisma.tutoringRequest.update({
      where: { id: existing.id },
      data: {
        status: RequestStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason || null,
      },
      include: { student: true },
    });

    // 4. Audit log entry
    await prisma.auditLog.create({
      data: {
        user: { connect: { id: user.id } },
        action: "TUTORING_REQUEST_CANCELLED",
        entityType: "TutoringRequest",
        entityId: cancelled.id,
        detailsJson: JSON.stringify({
          requestId: cancelled.id,
          studentName: cancelled.student.fullName,
          reason,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "La demande de tutorat a été annulée.",
      data: cancelled,
    });
  } catch (error) {
    console.error("Error cancelling tutoring request:", error);
    return NextResponse.json(
      { error: "Une erreur serveur est survenue lors de l'annulation." },
      { status: 500 }
    );
  }
}
