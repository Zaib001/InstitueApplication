import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { TeacherVerificationStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

const DAY_NAMES = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const subject = searchParams.get("subject")?.trim() || "";
    const cycle = searchParams.get("cycle")?.trim() || "";
    const gradeLevel = searchParams.get("gradeLevel")?.trim() || "";
    const mode = searchParams.get("mode")?.trim() || ""; // HOME | ONLINE | HYBRID
    const commune = searchParams.get("commune")?.trim() || "";
    const dayOfWeekParam = searchParams.get("dayOfWeek");
    const dayOfWeek = dayOfWeekParam !== null && dayOfWeekParam !== "" ? Number(dayOfWeekParam) : null;

    // Base filter: STRICTLY APPROVED teachers with active accounts
    const whereClause: any = {
      verificationStatus: TeacherVerificationStatus.APPROVED,
      user: {
        isActive: true,
      },
    };

    const andConditions: any[] = [];

    // 1. Text Query (name, email, phone, bio, headline, degrees, institution)
    if (query) {
      andConditions.push({
        OR: [
          { user: { fullName: { contains: query, mode: "insensitive" } } },
          { user: { email: { contains: query, mode: "insensitive" } } },
          { user: { phoneNumber: { contains: query, mode: "insensitive" } } },
          { headline: { contains: query, mode: "insensitive" } },
          { bio: { contains: query, mode: "insensitive" } },
          { degrees: { contains: query, mode: "insensitive" } },
          { institution: { contains: query, mode: "insensitive" } },
          { customSubject: { contains: query, mode: "insensitive" } },
        ],
      });
    }

    // 2. Mode filter (optional hard filter if explicitly requested)
    if (mode === "HOME") {
      andConditions.push({ isHomeAvailable: true });
    } else if (mode === "ONLINE") {
      andConditions.push({ isOnlineAvailable: true });
    }

    // 3. Commune filter (optional hard filter if specified)
    if (commune && commune !== "Tous" && commune !== "Autre / Périphérie") {
      andConditions.push({
        OR: [
          { serviceArea: { contains: commune, mode: "insensitive" } },
          { city: { contains: commune, mode: "insensitive" } },
        ],
      });
    }

    // 4. Day of week filter (if specified)
    if (dayOfWeek !== null && !isNaN(dayOfWeek)) {
      andConditions.push({
        availabilities: {
          some: {
            dayOfWeek: dayOfWeek,
          },
        },
      });
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
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
        customSubject: true,
        customGradeLevel: true,
        verificationStatus: true,
        updatedAt: true,
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
        availabilities: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            isRecurring: true,
          },
          orderBy: [
            { dayOfWeek: "asc" },
            { startTime: "asc" },
          ],
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
      take: 100,
    });

    const targetSubjectLower = subject.toLowerCase().trim();
    const targetCycleLower = cycle.toLowerCase().trim();
    const targetGradeLower = gradeLevel.toLowerCase().trim();
    const targetCommuneLower = commune.toLowerCase().trim();

    // Map & compute deterministic relevance score and match classification
    const scoredTeachers = teachers.map((t) => {
      const ratingAvg =
        t.ratings.length > 0
          ? t.ratings.reduce((acc, r) => acc + r.score, 0) / t.ratings.length
          : null;

      const teacherSubjects = t.subjects.map((s) => s.subject.name);
      if (t.customSubject && !teacherSubjects.includes(t.customSubject)) {
        teacherSubjects.push(t.customSubject);
      }

      const teacherGradeLevels = t.gradeLevels.map((g) => g.gradeLevel.name);
      const teacherCycles = Array.from(new Set(t.gradeLevels.map((g) => g.gradeLevel.cycle)));

      // Relevance calculation
      let score = 0;
      const matchReasons: string[] = [];

      // A. Subject matching
      let subjectMatched = false;
      if (targetSubjectLower) {
        const directSubMatch = teacherSubjects.some((s) =>
          s.toLowerCase().includes(targetSubjectLower) ||
          targetSubjectLower.includes(s.toLowerCase())
        );
        const customSubMatch = t.customSubject?.toLowerCase().includes(targetSubjectLower);

        if (directSubMatch || customSubMatch) {
          score += 45;
          subjectMatched = true;
          matchReasons.push("Matière compatible");
        }
      } else {
        score += 10;
      }

      // B. Level / Cycle matching
      let levelMatched = false;
      if (targetGradeLower) {
        const gradeMatch = teacherGradeLevels.some((g) =>
          g.toLowerCase().includes(targetGradeLower) ||
          targetGradeLower.includes(g.toLowerCase())
        );
        if (gradeMatch) {
          score += 30;
          levelMatched = true;
          matchReasons.push("Niveau exact");
        }
      }

      if (!levelMatched && targetCycleLower) {
        const cycleMatch = teacherCycles.some((c) =>
          c.toLowerCase() === targetCycleLower
        );
        if (cycleMatch) {
          score += 25;
          levelMatched = true;
          matchReasons.push("Cycle compatible");
        }
      }

      // C. Mode matching
      let modeMatched = false;
      if (mode === "HOME") {
        if (t.isHomeAvailable) {
          score += 15;
          modeMatched = true;
        }
      } else if (mode === "ONLINE") {
        if (t.isOnlineAvailable) {
          score += 15;
          modeMatched = true;
        }
      } else if (mode === "HYBRID") {
        if (t.isHomeAvailable && t.isOnlineAvailable) {
          score += 15;
          modeMatched = true;
        } else if (t.isHomeAvailable || t.isOnlineAvailable) {
          score += 10;
        }
      } else {
        score += 5;
      }

      // D. Location / Commune matching
      if (targetCommuneLower && targetCommuneLower !== "tous") {
        const inService = t.serviceArea?.toLowerCase().includes(targetCommuneLower);
        const inCity = t.city?.toLowerCase().includes(targetCommuneLower);
        if (inService || inCity) {
          score += 10;
          matchReasons.push("Zone géographique");
        }
      }

      // E. Availability matching
      if (t.availabilities.length > 0) {
        score += 5;
        if (dayOfWeek !== null && t.availabilities.some((a) => a.dayOfWeek === dayOfWeek)) {
          score += 10;
          matchReasons.push("Disponible ce jour");
        }
      }

      // Tie-breakers: Experience and Rating
      score += Math.min(t.yearsOfExperience * 0.5, 5);
      if (ratingAvg) {
        score += ratingAvg;
      }

      // Match Classification Tag
      let matchBadge: "EXACT" | "SUBJECT_AND_LEVEL" | "SUBJECT_ONLY" | "COMPATIBLE" = "COMPATIBLE";
      if (subjectMatched && levelMatched && modeMatched) {
        matchBadge = "EXACT";
      } else if (subjectMatched && levelMatched) {
        matchBadge = "SUBJECT_AND_LEVEL";
      } else if (subjectMatched) {
        matchBadge = "SUBJECT_ONLY";
      }

      // Formatted availabilities for card display
      const formattedAvailabilities = t.availabilities.map((a) => ({
        id: a.id,
        dayOfWeek: a.dayOfWeek,
        dayName: DAY_NAMES[a.dayOfWeek] || `Jour ${a.dayOfWeek}`,
        startTime: a.startTime,
        endTime: a.endTime,
        isRecurring: a.isRecurring,
      }));

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
        subjects: teacherSubjects,
        gradeLevels: teacherGradeLevels,
        cycles: teacherCycles,
        customSubject: t.customSubject,
        customGradeLevel: t.customGradeLevel,
        availabilities: formattedAvailabilities,
        pricingOffers: t.pricingOffers,
        ratingAverage: ratingAvg ? Number(ratingAvg.toFixed(1)) : null,
        ratingsCount: t.ratings.length,
        relevanceScore: Math.round(score),
        matchBadge,
        matchReasons,
      };
    });

    // Deterministic sorting: highest relevance score first, then rating, then experience
    scoredTeachers.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      if ((b.ratingAverage || 0) !== (a.ratingAverage || 0)) {
        return (b.ratingAverage || 0) - (a.ratingAverage || 0);
      }
      return b.yearsOfExperience - a.yearsOfExperience;
    });

    return NextResponse.json({
      success: true,
      teachers: scoredTeachers,
      totalCount: scoredTeachers.length,
    });
  } catch (error) {
    console.error("Error searching teachers:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recherche des professeurs" },
      { status: 500 }
    );
  }
}
