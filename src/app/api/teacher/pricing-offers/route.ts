import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  PricingOfferType,
  TeacherVerificationStatus,
  UserRole,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.TEACHER) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      include: {
        pricingOffers: {
          orderBy: { createdAt: "desc" },
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
      success: true,
      offers: teacherProfile.pricingOffers,
    });
  } catch (error) {
    console.error("Error fetching teacher pricing offers:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des offres tarifaires" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.TEACHER) {
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

    // Only APPROVED teachers can publish active pricing offers
    if (
      teacherProfile.verificationStatus !== TeacherVerificationStatus.APPROVED
    ) {
      return NextResponse.json(
        {
          error:
            "Seuls les enseignants vérifiés et approuvés peuvent publier des offres tarifaires.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      type = PricingOfferType.HOURLY,
      title,
      totalPriceGnf,
      sessionsCount = 1,
      minutesPerSession = 60,
      description,
    } = body;

    if (!title || typeof title !== "string" || title.trim().length < 2) {
      return NextResponse.json(
        { error: "Le titre de l'offre tarifaire est obligatoire" },
        { status: 400 }
      );
    }

    const parsedPrice = Number(totalPriceGnf);
    if (!Number.isInteger(parsedPrice) || parsedPrice <= 0) {
      return NextResponse.json(
        { error: "Le prix doit être un entier positif en GNF" },
        { status: 400 }
      );
    }

    const parsedSessions = Number(sessionsCount);
    if (!Number.isInteger(parsedSessions) || parsedSessions <= 0) {
      return NextResponse.json(
        { error: "Le nombre de séances doit être un entier positif" },
        { status: 400 }
      );
    }

    const parsedMinutes = Number(minutesPerSession);
    if (!Number.isInteger(parsedMinutes) || parsedMinutes <= 0) {
      return NextResponse.json(
        { error: "La durée par séance doit être un entier positif en minutes" },
        { status: 400 }
      );
    }

    const resolvedType =
      type === PricingOfferType.MONTHLY_PACKAGE
        ? PricingOfferType.MONTHLY_PACKAGE
        : PricingOfferType.HOURLY;

    const offer = await prisma.teacherPricingOffer.create({
      data: {
        teacherProfileId: teacherProfile.id,
        type: resolvedType,
        title: title.trim(),
        totalPriceGnf: parsedPrice,
        sessionsCount: parsedSessions,
        minutesPerSession: parsedMinutes,
        description: description?.trim() || null,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      offer,
    });
  } catch (error) {
    console.error("Error creating pricing offer:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'offre tarifaire" },
      { status: 500 }
    );
  }
}

