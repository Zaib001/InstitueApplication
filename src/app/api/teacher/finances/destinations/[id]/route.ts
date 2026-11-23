import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { TeacherPayoutService } from "@/lib/finance/teacher-payout-service";

export async function DELETE(
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

    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
    });

    if (!teacherProfile) {
      return NextResponse.json({ error: "Profil enseignant introuvable" }, { status: 404 });
    }

    const { id } = await params;

    await TeacherPayoutService.deleteTeacherDestination(id, teacherProfile.id, user.id);

    return NextResponse.json({
      success: true,
      message: "Coordonnée de versement supprimée avec succès.",
    });
  } catch (err: any) {
    console.error("DELETE /api/teacher/finances/destinations/[id] error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de la suppression" },
      { status: err.statusCode || 400 }
    );
  }
}

