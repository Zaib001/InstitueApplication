import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { UserRole } from "@prisma/client";
import { validateAvailabilitySlots } from "@/lib/validation/availability";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      include: {
        availabilities: {
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
      },
    });

    if (!teacherProfile) {
      return NextResponse.json(
        { error: "Profil enseignant introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      availabilities: teacherProfile.availabilities,
    });
  } catch (error: any) {
    console.error("[GET_TEACHER_AVAILABILITY_ERROR]", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les disponibilités." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
    });

    if (!teacherProfile) {
      return NextResponse.json(
        { error: "Profil enseignant introuvable" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const rawSlots = Array.isArray(body.availabilities) ? body.availabilities : [];

    // Format slots
    const formattedSlots = rawSlots.map((s: any) => ({
      dayOfWeek: Number(s.dayOfWeek),
      startTime: String(s.startTime).trim(),
      endTime: String(s.endTime).trim(),
    }));

    if (formattedSlots.length === 0) {
      return NextResponse.json(
        { error: "Veuillez renseigner au moins un créneau horaire hebdomadaire." },
        { status: 400 }
      );
    }

    const validation = validateAvailabilitySlots(formattedSlots);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || "Créneaux horaires invalides ou qui se chevauchent." },
        { status: 400 }
      );
    }

    // Atomic update in PostgreSQL
    const updated = await prisma.$transaction(async (tx) => {
      await tx.availability.deleteMany({
        where: { teacherProfileId: teacherProfile.id },
      });

      await tx.availability.createMany({
        data: formattedSlots.map(
          (s: { dayOfWeek: number; startTime: string; endTime: string }) => ({
            teacherProfileId: teacherProfile.id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            isRecurring: true,
          })
        ),
      });

      return tx.availability.findMany({
        where: { teacherProfileId: teacherProfile.id },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      });
    });

    return NextResponse.json({
      success: true,
      availabilities: updated,
      message: "Vos disponibilités hebdomadaires ont été mises à jour avec succès.",
    });
  } catch (error: any) {
    console.error("[PUT_TEACHER_AVAILABILITY_ERROR]", error);
    return NextResponse.json(
      { error: "Impossible d'enregistrer les disponibilités." },
      { status: 500 }
    );
  }
}
