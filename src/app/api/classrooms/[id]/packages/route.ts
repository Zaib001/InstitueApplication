import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { PricingOfferType, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  PricingEngine,
  PricingEngineError,
} from "@/lib/pricing/pricing-engine";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const classroomId = resolvedParams.id;

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        student: {
          include: { parent: true },
        },
        teacherProfile: true,
        packages: {
          orderBy: { version: "desc" },
        },
      },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Classe introuvable" }, { status: 404 });
    }

    // Authorization: parent owner, assigned teacher, or admin
    const isParent =
      user.role === UserRole.PARENT &&
      classroom.student.parent.userId === user.id;
    const isTeacher =
      user.role === UserRole.TEACHER &&
      classroom.teacherProfile.userId === user.id;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isParent && !isTeacher && !isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const formattedPackages = classroom.packages.map((pkg) => {
      let parsedAllocations = [];
      try {
        if (pkg.allocationsJson) {
          parsedAllocations = JSON.parse(pkg.allocationsJson);
        }
      } catch {
        // ignore
      }

      return {
        id: pkg.id,
        classroomId: pkg.classroomId,
        pricingType: pkg.pricingType,
        hourlyRateGnf: pkg.hourlyRateGnf,
        totalAmountGnf: pkg.totalAmountGnf,
        sessionsCount: pkg.sessionsCount,
        minutesPerSession: pkg.minutesPerSession,
        totalPlannedMinutes: pkg.totalPlannedMinutes,
        baseSessionRateGnf: pkg.baseSessionRateGnf,
        remainderGnf: pkg.remainderGnf,
        commissionRatePercent: pkg.commissionRatePercent,
        totalPlatformCommissionGnf: pkg.totalPlatformCommissionGnf,
        totalTeacherShareGnf: pkg.totalTeacherShareGnf,
        allocations: parsedAllocations,
        status: pkg.status,
        version: pkg.version,
        notes: pkg.notes,
        agreedAt: pkg.agreedAt ? pkg.agreedAt.toISOString() : null,
        createdAt: pkg.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      packages: formattedPackages,
    });
  } catch (error) {
    console.error("Error fetching classroom packages:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des forfaits de la classe" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const classroomId = resolvedParams.id;

    const body = await req.json();
    const {
      pricingType = PricingOfferType.MONTHLY_PACKAGE,
      amountGnf,
      sessionsCount = 8,
      minutesPerSession = 60,
      notes,
    } = body;

    const resolvedPricingType =
      pricingType === PricingOfferType.HOURLY
        ? PricingOfferType.HOURLY
        : PricingOfferType.MONTHLY_PACKAGE;

    const result = await PricingEngine.setupClassroomPackage({
      classroomId,
      userId: user.id,
      userRole: user.role,
      pricingType: resolvedPricingType,
      amountGnf: Number(amountGnf),
      sessionsCount: Number(sessionsCount),
      minutesPerSession: Number(minutesPerSession),
      notes,
    });

    return NextResponse.json({
      success: true,
      package: result.package,
      pricing: result.pricing,
    });
  } catch (error) {
    if (error instanceof PricingEngineError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Error setting up classroom package:", error);
    return NextResponse.json(
      { error: "Erreur interne lors de la configuration du forfait" },
      { status: 500 }
    );
  }
}

