import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole, DocumentStatus } from "@prisma/client";
import { getPrivateDocument, deletePrivateDocument } from "@/lib/storage/private-storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const { id } = await params;

  const doc = await prisma.teacherDocument.findUnique({
    where: { id },
    include: {
      teacherProfile: {
        select: { userId: true },
      },
    },
  });

  if (!doc) {
    return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
  }

  // Strict Security Check: Only the document owner OR an administrator may view
  const isOwner = doc.teacherProfile.userId === user.id;
  const isAdmin = user.role === UserRole.ADMIN;

  if (!isOwner && !isAdmin) {
    return NextResponse.json(
      { error: "Accès interdit. Vous n'avez pas l'autorisation de consulter ce justificatif." },
      { status: 403 }
    );
  }

  // Retrieve file from private disk
  const stored = await getPrivateDocument(doc.fileUrl);
  if (!stored) {
    return NextResponse.json(
      { error: "Fichier introuvable sur le disque sécurisé." },
      { status: 404 }
    );
  }

  return new NextResponse(new Uint8Array(stored.buffer), {
    status: 200,
    headers: {
      "Content-Type": doc.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.title)}"`,
      "Content-Length": stored.buffer.length.toString(),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const { id } = await params;

  const doc = await prisma.teacherDocument.findUnique({
    where: { id },
    include: {
      teacherProfile: {
        select: { userId: true },
      },
    },
  });

  if (!doc) {
    return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
  }

  const isOwner = doc.teacherProfile.userId === user.id;
  const isAdmin = user.role === UserRole.ADMIN;

  if (!isOwner && !isAdmin) {
    return NextResponse.json(
      { error: "Accès interdit. Vous ne pouvez pas supprimer ce document." },
      { status: 403 }
    );
  }

  // Disallow non-admin deletion of already verified docs in APPROVED profiles
  if (doc.status === DocumentStatus.VERIFIED && !isAdmin) {
    return NextResponse.json(
      { error: "Un document validé par l'administration ne peut être supprimé sans autorisation." },
      { status: 400 }
    );
  }

  // Remove from database and disk
  await prisma.teacherDocument.delete({ where: { id } });
  await deletePrivateDocument(doc.fileUrl);

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "TEACHER_DOCUMENT_DELETED",
      entityType: "TeacherDocument",
      entityId: id,
      detailsJson: JSON.stringify({
        title: doc.title,
        type: doc.type,
      }),
    },
  });

  return NextResponse.json({
    success: true,
    message: "Document supprimé avec succès.",
  });
}
