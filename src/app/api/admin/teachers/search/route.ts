import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { TeacherVerificationStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const subject = searchParams.get("subject")?.trim() || "";

    const whereClause: any = {
      verificationStatus: TeacherVerificationStatus.APPROVED,
      user: {
        isActive: true,
      },
    };

    if (query) {
      whereClause.OR = [
        { user: { fullName: { contains: query, mode: "insensitive" } } },
        { user: { email: { contains: query, mode: "insensitive" } } },
        { user: { phoneNumber: { contains: query, mode: "insensitive" } } },
        { headline: { contains: query, mode: "insensitive" } },
        { bio: { contains: query, mode: "insensitive" } },
      ];
    }

    if (subject) {
      whereClause.subjects = {
        some: {
          subject: {
            name: { contains: subject, mode: "insensitive" },
          },
        },
      };
    }

    const teachers = await prisma.teacherProfile.findMany({
      where: whereClause,
      select: {
        id: true,
        headline: true,
        bio: true,
        yearsOfExperience: true,
        city: true,
        serviceArea: true,
        degrees: true,
        institution: true,
        isHomeAvailable: true,
        isOnlineAvailable: true,
        hourlyRateGnf: true,
        monthlyPackageRateGnf: true,
        verificationStatus: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
          },
        },
        subjects: {
          select: {
            subject: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
        gradeLevels: {
          select: {
            gradeLevel: {
              select: {
                id: true,
                name: true,
                cycle: true,
              },
            },
          },
        },
        pricingOffers: {
          where: { isActive: true },
          select: {
            id: true,
            type: true,
            title: true,
            totalPriceGnf: true,
            sessionsCount: true,
            minutesPerSession: true,
          },
        },
        ratings: {
          select: {
            score: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    const formatted = teachers.map((t) => {
      const ratingAvg =
        t.ratings.length > 0
          ? t.ratings.reduce((acc, r) => acc + r.score, 0) / t.ratings.length
          : null;

      return {
        id: t.id,
        userId: t.user.id,
        fullName: t.user.fullName,
        email: t.user.email,
        phoneNumber: t.user.phoneNumber,
        avatarUrl: t.user.avatarUrl,
        headline: t.headline,
        bio: t.bio,
        yearsOfExperience: t.yearsOfExperience,
        city: t.city,
        serviceArea: t.serviceArea,
        degrees: t.degrees,
        institution: t.institution,
        isHomeAvailable: t.isHomeAvailable,
        isOnlineAvailable: t.isOnlineAvailable,
        hourlyRateGnf: t.hourlyRateGnf,
        monthlyPackageRateGnf: t.monthlyPackageRateGnf,
        subjects: t.subjects.map((s) => s.subject.name),
        gradeLevels: t.gradeLevels.map((g) => g.gradeLevel.name),
        pricingOffers: t.pricingOffers,
        ratingAverage: ratingAvg ? Number(ratingAvg.toFixed(1)) : null,
        ratingsCount: t.ratings.length,
      };
    });

    return NextResponse.json({
      success: true,
      teachers: formatted,
    });
  } catch (error) {
    console.error("Error searching teachers:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recherche des professeurs" },
      { status: 500 }
    );
  }
}

