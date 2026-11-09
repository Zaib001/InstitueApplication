import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { EmailProvider } from "@/lib/notifications/email-provider";
import { EmailTemplateRegistry } from "@/lib/notifications/email-templates";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Accès refusé. Réservé aux administrateurs." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const targetEmail = body.recipientEmail?.trim() || user.email;

    if (!targetEmail || !targetEmail.includes("@")) {
      return NextResponse.json(
        { error: "Adresse email destinataire invalide." },
        { status: 400 }
      );
    }

    const rendered = EmailTemplateRegistry.render(
      "welcome",
      {
        recipientName: user.fullName || "Administrateur Monsieur Fanyi",
        role: "ADMIN",
        appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://monsieurfanyi.com",
      },
      "fr"
    );

    const result = await EmailProvider.sendEmail({
      to: targetEmail,
      subject: `[Test Resend] Vérification de délivrabilité — ${new Date().toLocaleTimeString("fr-FR")}`,
      html: rendered.html,
      text: rendered.text,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Échec de l'envoi via Resend",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      recipient: targetEmail,
      providerMessageId: result.providerMessageId,
      message: `E-mail de test expédié avec succès à ${targetEmail} via Resend (${result.providerMessageId}).`,
    });
  } catch (error: any) {
    console.error("[ADMIN_TEST_EMAIL_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne" },
      { status: 500 }
    );
  }
}

