import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { PricingOfferType, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.TEACHER) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const resolvedParams = await Promise.resolve(params);
    const offerId = resolvedParams.id;

    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
    });

    if (!teacherProfile) {
      return NextResponse.json(
        { error: "Profil enseignant introuvable" },
        { status: 404 }
      );
    }

    const existingOffer = await prisma.teacherPricingOffer.findUnique({
      where: { id: offerId },
    });

    if (!existingOffer || existingOffer.teacherProfileId !== teacherProfile.id) {
      return NextResponse.json(
        { error: "Offre tarifaire introuvable ou non autorisée" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      title,
      totalPriceGnf,
      sessionsCount,
      minutesPerSession,
      description,
      isActive,
      type,
    } = body;

    const dataToUpdate: any = {};

    if (title && typeof title === "string") {
      dataToUpdate.title = title.trim();
    }
    if (description !== undefined) {
      dataToUpdate.description = description ? description.trim() : null;
    }
    if (isActive !== undefined) {
      dataToUpdate.isActive = Boolean(isActive);
    }
    if (type) {
      dataToUpdate.type =
        type === PricingOfferType.MONTHLY_PACKAGE
          ? PricingOfferType.MONTHLY_PACKAGE
          : PricingOfferType.HOURLY;
    }
    if (totalPriceGnf !== undefined) {
      const parsedPrice = Number(totalPriceGnf);
      if (!Number.isInteger(parsedPrice) || parsedPrice <= 0) {
        return NextResponse.json(
          { error: "Le montant doit être un entier positif en GNF" },
          { status: 400 }
        );
      }
      dataToUpdate.totalPriceGnf = parsedPrice;
    }
    if (sessionsCount !== undefined) {
      const parsedSessions = Number(sessionsCount);
      if (!Number.isInteger(parsedSessions) || parsedSessions <= 0) {
        return NextResponse.json(
          { error: "Le nombre de séances doit être un entier positif" },
          { status: 400 }
        );
      }
      dataToUpdate.sessionsCount = parsedSessions;
    }
    if (minutesPerSession !== undefined) {
      const parsedMinutes = Number(minutesPerSession);
      if (!Number.isInteger(parsedMinutes) || parsedMinutes <= 0) {
        return NextResponse.json(
          { error: "La durée par séance doit être un entier positif" },
          { status: 400 }
        );
      }
      dataToUpdate.minutesPerSession = parsedMinutes;
    }

    const updatedOffer = await prisma.teacherPricingOffer.update({
      where: { id: offerId },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      offer: updatedOffer,
    });
  } catch (error) {
    console.error("Error updating pricing offer:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification de l'offre tarifaire" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.TEACHER) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const resolvedParams = await Promise.resolve(params);
    const offerId = resolvedParams.id;

    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
    });

    if (!teacherProfile) {
      return NextResponse.json(
        { error: "Profil enseignant introuvable" },
        { status: 404 }
      );
    }

    const existingOffer = await prisma.teacherPricingOffer.findUnique({
      where: { id: offerId },
    });

    if (!existingOffer || existingOffer.teacherProfileId !== teacherProfile.id) {
      return NextResponse.json(
        { error: "Offre introuvable" },
        { status: 404 }
      );
    }

    // Soft delete by deactivating
    await prisma.teacherPricingOffer.update({
      where: { id: offerId },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "Offre tarifaire désactivée avec succès",
    });
  } catch (error) {
    console.error("Error deleting pricing offer:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'offre" },
      { status: 500 }
    );
  }
}

