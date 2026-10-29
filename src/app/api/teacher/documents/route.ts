import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole, DocumentType, DocumentStatus, TeacherVerificationStatus } from "@prisma/client";
import { savePrivateDocument } from "@/lib/storage/private-storage";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.role !== UserRole.TEACHER) {
    return NextResponse.json(
      { error: "Accès refusé. Réservé aux enseignants authentifiés." },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentType = formData.get("type") as string | null;
    const title = formData.get("title") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
    }

    if (!documentType || !Object.values(DocumentType).includes(documentType as DocumentType)) {
      return NextResponse.json(
        { error: "Type de document invalide (NATIONAL_ID, PASSPORT, DIPLOMA, POLICE_RECORD, CV)." },
        { status: 400 }
      );
    }

    // Save document securely to private storage
    const stored = await savePrivateDocument(file, file.name);

    // Get or create teacher profile
    let profile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      profile = await prisma.teacherProfile.create({
        data: {
          userId: user.id,
          verificationStatus: TeacherVerificationStatus.DRAFT,
        },
      });
    }

    // Persist document record in PostgreSQL
    const docRecord = await prisma.teacherDocument.create({
      data: {
        teacherProfileId: profile.id,
        type: documentType as DocumentType,
        title: title?.trim() || file.name,
        fileUrl: stored.storedFileName,
        mimeType: stored.mimeType,
        fileSizeBytes: stored.fileSizeBytes,
        status: DocumentStatus.PENDING,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "TEACHER_DOCUMENT_UPLOADED",
        entityType: "TeacherDocument",
        entityId: docRecord.id,
        detailsJson: JSON.stringify({
          type: documentType,
          originalName: file.name,
          storedName: stored.storedFileName,
          fileSizeBytes: stored.fileSizeBytes,
          mimeType: stored.mimeType,
          sha256: stored.sha256,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Document téléversé avec succès.",
      document: docRecord,
    });
  } catch (error: any) {
    console.error("Erreur lors du téléversement du justificatif:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors du traitement du fichier." },
      { status: 400 }
    );
  }
}
