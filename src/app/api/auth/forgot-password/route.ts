import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { forgotPasswordSchema } from "@/lib/auth/validation";
import { generateSecureResetToken } from "@/lib/auth/tokens";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Adresse email invalide." },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user && user.isActive) {
      // 1. Invalidate any existing unused tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      // 2. Generate secure token & hash
      const { plainToken, tokenHash } = generateSecureResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      // 3. Construct reset URL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const resetLink = `${appUrl}/reset-password?token=${plainToken}`;

      // In production, integrate SMTP. In development, log reset URL for immediate testing.
      console.log(`[PASSWORD_RESET_DISPATCH] To: ${user.email} | Link: ${resetLink}`);
    }

    // Always return safe, generic message to prevent email enumeration
    return NextResponse.json({
      success: true,
      message:
        "Si un compte actif est associé à cette adresse, un lien de réinitialisation valable 1 heure vous a été envoyé.",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la demande de réinitialisation." },
      { status: 500 }
    );
  }
}
