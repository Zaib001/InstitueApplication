import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole, TeacherVerificationStatus, DocumentStatus } from "@prisma/client";

export async function POST(
  _request: Request,
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

  const profile = await prisma.teacherProfile.findUnique({
    where: { id },
    include: {
      documents: true,
      subjects: true,
      user: true,
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Candidature enseignant introuvable." }, { status: 404 });
  }

  // Prevent duplicate approval
  if (profile.verificationStatus === TeacherVerificationStatus.APPROVED) {
    return NextResponse.json(
      { error: "Ce professeur a déjà été validé et approuvé." },
      { status: 400 }
    );
  }

  // Completeness check before approval
  const hasIdentityDoc = profile.documents.some(
    (d) => d.type === "NATIONAL_ID" || d.type === "PASSPORT"
  );
  const hasDiplomaDoc = profile.documents.some((d) => d.type === "DIPLOMA");

  if (!hasIdentityDoc || !hasDiplomaDoc) {
    return NextResponse.json(
      { error: "Impossible d'approuver : le dossier ne contient pas les pièces obligatoires (CNI et diplôme)." },
      { status: 400 }
    );
  }

  // Transaction-safe approval
  const updatedProfile = await prisma.$transaction(async (tx) => {
    // 1. Update TeacherProfile
    const updated = await tx.teacherProfile.update({
      where: { id: profile.id },
      data: {
        verificationStatus: TeacherVerificationStatus.APPROVED,
        verifiedAt: new Date(),
        reviewerId: user.id,
        rejectionReason: null,
      },
    });

    // 2. Mark pending documents as VERIFIED
    await tx.teacherDocument.updateMany({
      where: {
        teacherProfileId: profile.id,
        status: DocumentStatus.PENDING,
      },
      data: {
        status: DocumentStatus.VERIFIED,
        verifiedAt: new Date(),
      },
    });

    // 3. Write AuditLog
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "TEACHER_APPLICATION_APPROVED",
        entityType: "TeacherProfile",
        entityId: profile.id,
        detailsJson: JSON.stringify({
          teacherUserId: profile.userId,
          teacherName: profile.user.fullName,
          teacherEmail: profile.user.email,
          reviewerId: user.id,
          reviewerName: user.fullName,
          verifiedAt: new Date().toISOString(),
        }),
      },
    });

    // 4. In-App Notification for the teacher
    await tx.notification.create({
      data: {
        userId: profile.userId,
        title: "Félicitations ! Votre profil est approuvé 🎉",
        message:
          "Votre candidature d'enseignant a été validée par l'administration. Vous pouvez désormais postuler aux demandes de soutien scolaire.",
        linkUrl: "/teacher/dashboard",
      },
    });

    return updated;
  });

  return NextResponse.json({
    success: true,
    message: "Candidature approuvée avec succès. L'enseignant a été notifié.",
    profile: updatedProfile,
  });
}
