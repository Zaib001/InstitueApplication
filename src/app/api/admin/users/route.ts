import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  if (!user || user.role !== UserRole.ADMIN) {
    return NextResponse.json(
      { error: "Accès refusé. Réservé aux administrateurs." },
      { status: 403 }
    );
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      phoneNumber: true,
      role: true,
      isActive: true,
      createdAt: true,
      teacherProfile: {
        select: {
          id: true,
          city: true,
          verificationStatus: true,
          headline: true,
          subjects: {
            select: {
              subject: { select: { name: true } },
            },
          },
        },
      },
      parentProfile: {
        select: {
          id: true,
          city: true,
          address: true,
          children: {
            select: { id: true, fullName: true, gradeLevel: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return NextResponse.json(
      { error: "Accès refusé. Réservé aux administrateurs." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { userId, isActive } = body;

    if (!userId || typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Données de requête invalides." },
        { status: 400 }
      );
    }

    // Do not allow deactivating yourself
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: "Impossible de désactiver votre propre compte administrateur." },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, email: true, fullName: true, isActive: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: isActive ? "ADMIN_USER_ACTIVATED" : "ADMIN_USER_SUSPENDED",
        entityType: "User",
        entityId: userId,
        detailsJson: JSON.stringify({
          targetUserEmail: updatedUser.email,
          newStatus: isActive ? "ACTIVE" : "SUSPENDED",
        }),
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: isActive ? "Utilisateur activé avec succès." : "Utilisateur suspendu avec succès.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la mise à jour." },
      { status: 500 }
    );
  }
}
