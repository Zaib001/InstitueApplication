import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { TeacherPayoutService } from "@/lib/finance/teacher-payout-service";

export async function GET() {
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

    const destinations = await TeacherPayoutService.getTeacherDestinations(teacherProfile.id);

    return NextResponse.json({
      success: true,
      destinations,
    });
  } catch (err: any) {
    console.error("GET /api/teacher/finances/destinations error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { operator, phone, accountHolderName, isDefault } = body;

    const destination = await TeacherPayoutService.upsertTeacherDestination({
      teacherProfileId: teacherProfile.id,
      operator,
      phone,
      accountHolderName,
      isDefault: Boolean(isDefault),
      actorUserId: user.id,
    });

    return NextResponse.json({
      success: true,
      destination,
      message: "Coordonnées de versement enregistrées avec succès.",
    });
  } catch (err: any) {
    console.error("POST /api/teacher/finances/destinations error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de l'enregistrement du compte de versement" },
      { status: err.statusCode || 400 }
    );
  }
}

