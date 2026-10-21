import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { resetPasswordSchema } from "@/lib/auth/validation";
import { hashPassword } from "@/lib/auth/password";
import { hashToken } from "@/lib/auth/tokens";
import { destroyAllUserSessions } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Données de réinitialisation invalides." },
        { status: 400 }
      );
    }

    const { token, password } = result.data;
    const tokenHash = hashToken(token);

    // Look up token record
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: "Ce lien de réinitialisation est invalide ou a expiré." },
        { status: 400 }
      );
    }

    if (resetRecord.usedAt !== null) {
      return NextResponse.json(
        { error: "Ce lien de réinitialisation a déjà été utilisé." },
        { status: 400 }
      );
    }

    if (resetRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Ce lien de réinitialisation a expiré. Veuillez refaire une demande." },
        { status: 400 }
      );
    }

    // Hash the new password
    const newPasswordHash = await hashPassword(password);

    // Atomically update user password, mark token used, and delete active sessions
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newPasswordHash },
      });

      await tx.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          userId: resetRecord.userId,
          action: "PASSWORD_RESET_COMPLETED",
          entityType: "User",
          entityId: resetRecord.userId,
        },
      });
    });

    // Invalidate any active sessions on other devices
    await destroyAllUserSessions(resetRecord.userId);

    return NextResponse.json({
      success: true,
      message: "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la réinitialisation du mot de passe." },
      { status: 500 }
    );
  }
}
