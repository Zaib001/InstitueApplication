import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ReportingService, ReportingServiceError } from "@/lib/reporting/reporting-service";
import { DisputeStatus, UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") as DisputeStatus) || undefined;
    const category = searchParams.get("category") || undefined;

    const data = await ReportingService.getAdminDisputes({
      status,
      category,
    });

    return NextResponse.json(data);
  } catch (err: any) {
    if (err instanceof ReportingServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("GET /api/admin/session-disputes error:", err);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

