import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { changePasswordSchema } from "@/lib/auth/validation";
import { verifyPassword, hashPassword } from "@/lib/auth/password";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé. Veuillez vous connecter." }, { status: 401 });
    }

    const body = await request.json();
    const result = changePasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Données invalides." },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = result.data;

    // Fetch full user with password hash
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!fullUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé." }, { status: 404 });
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, fullUser.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: "Le mot de passe actuel est incorrect." },
        { status: 400 }
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "PASSWORD_CHANGED",
          entityType: "User",
          entityId: user.id,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Votre mot de passe a été modifié avec succès.",
    });
  } catch (error: any) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors du changement de mot de passe." },
      { status: 500 }
    );
  }
}
