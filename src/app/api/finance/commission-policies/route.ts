import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { CommissionPolicyService } from "@/lib/finance/commission-policy-service";
import { FinancialError } from "@/lib/finance/types";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const activePolicy = await CommissionPolicyService.getActivePolicy();
    const policies = await CommissionPolicyService.listPolicies();

    return NextResponse.json({
      activePolicy,
      policies,
      clientConfirmationStatus: {
        isConfirmedByClient: false,
        pendingDecision: "15% plateforme / 85% enseignant VS 20% plateforme / 80% enseignant",
        notice:
          "En attente de validation formelle du pourcentage de commission par le client Ousman avant activation des versements en direct.",
      },
    });
  } catch (error: any) {
    console.error("GET /api/finance/commission-policies error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Réservé aux administrateurs" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { version, platformPercent, description, effectiveFrom } = body;

    if (!version || platformPercent === undefined) {
      return NextResponse.json(
        { error: "Version et pourcentage plateforme requis" },
        { status: 400 }
      );
    }

    const newPolicy = await CommissionPolicyService.createNewPolicyVersion({
      version,
      platformPercent: Number(platformPercent),
      description:
        description ||
        `Politique ${version} (${platformPercent}% plateforme / ${100 - platformPercent}% enseignant)`,
      adminId: user.id,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
    });

    return NextResponse.json({ policy: newPolicy }, { status: 201 });
  } catch (error: any) {
    if (error instanceof FinancialError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error("POST /api/finance/commission-policies error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne" },
      { status: 500 }
    );
  }
}

