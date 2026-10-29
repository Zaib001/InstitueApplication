import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole, TeacherVerificationStatus } from "@prisma/client";

const rejectSchema = z.object({
  reason: z
    .string()
    .min(5, "Le motif du rejet doit comporter au moins 5 caractères explicatifs pour l'enseignant.")
    .max(1000),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();

  if (!user || user.role !== UserRole.ADMIN) {
    return NextResponse.json(
      { error: "Accès refusé. Réservé aux administrateurs." },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { reason } = rejectSchema.parse(body);

    const profile = await prisma.teacherProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Candidature enseignant introuvable." }, { status: 404 });
    }

    // Transaction-safe rejection
    const updatedProfile = await prisma.$transaction(async (tx) => {
      const updated = await tx.teacherProfile.update({
        where: { id: profile.id },
        data: {
          verificationStatus: TeacherVerificationStatus.REJECTED,
          rejectionReason: reason.trim(),
          reviewedAt: new Date(),
          reviewerId: user.id,
        },
      });

      // Write AuditLog
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "TEACHER_APPLICATION_REJECTED",
          entityType: "TeacherProfile",
          entityId: profile.id,
          detailsJson: JSON.stringify({
            teacherUserId: profile.userId,
            teacherName: profile.user.fullName,
            teacherEmail: profile.user.email,
            reason: reason.trim(),
            reviewerId: user.id,
            reviewerName: user.fullName,
            reviewedAt: new Date().toISOString(),
          }),
        },
      });

      // In-App Notification for teacher
      await tx.notification.create({
        data: {
          userId: profile.userId,
          title: "Complément requis pour votre dossier enseignant",
          message: `Votre dossier n'a pas pu être validé en l'état : ${reason.trim()}. Vous pouvez corriger vos informations et renvoyer votre candidature.`,
          linkUrl: "/teacher/onboarding",
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: "Dossier rejeté avec notification du motif transmise à l'enseignant.",
      profile: updatedProfile,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Données invalides." },
        { status: 400 }
      );
    }
    console.error("Erreur lors du rejet de la candidature enseignant:", error);
    return NextResponse.json(
      { error: "Une erreur serveur est survenue lors du traitement." },
      { status: 500 }
    );
  }
}
