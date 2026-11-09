import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTeacherAuth } from "@/lib/auth/teacher-guard";
import { calculateOpportunityMatch } from "@/lib/marketplace/matching";

/**
 * GET /api/teacher/opportunities
 * Returns all active OPEN tutoring requests in the Guinean marketplace.
 * Strictly filters out DRAFT, CANCELLED, CLOSED, and MATCHED requests.
 * Calculates deterministic match scores for the requesting teacher.
 * Protects student privacy: NO exact home addresses, NO parent phone numbers, NO private student files.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireTeacherAuth();
    if (auth.errorResponse) return auth.errorResponse;

    const { user, teacherProfile } = auth.context;
    const isApproved = teacherProfile.verificationStatus === "APPROVED";

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim().toLowerCase();
    const subjectId = searchParams.get("subjectId")?.trim();
    const cycle = searchParams.get("cycle")?.trim().toUpperCase();
    const mode = searchParams.get("mode")?.trim().toUpperCase();
    const commune = searchParams.get("commune")?.trim();
    const recommendedOnly = searchParams.get("recommendedOnly") === "true";
    const minBudget = searchParams.get("minBudget") ? parseInt(searchParams.get("minBudget")!, 10) : undefined;
    const maxBudget = searchParams.get("maxBudget") ? parseInt(searchParams.get("maxBudget")!, 10) : undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const skip = (page - 1) * limit;

    // 1. Fetch full teacher profile with subjects and gradeLevels for matching
    const fullTeacher = await prisma.teacherProfile.findUnique({
      where: { id: teacherProfile.id },
      include: {
        subjects: {
          include: {
            subject: true,
          },
        },
        gradeLevels: {
          include: {
            gradeLevel: true,
          },
        },
      },
    });

    if (!fullTeacher) {
      return NextResponse.json({ error: "Profil enseignant introuvable." }, { status: 404 });
    }

    // 2. Fetch existing applications by this teacher to flag "already applied"
    const teacherApplications = await prisma.teacherApplication.findMany({
      where: {
        teacherProfileId: teacherProfile.id,
      },
      select: {
        id: true,
        requestId: true,
        status: true,
        createdAt: true,
      },
    });

    const applicationsByRequestId = new Map(
      teacherApplications.map((app) => [app.requestId, app])
    );

    // 3. Build Prisma query - STRICT PRIVACY & OPEN STATUS ONLY
    // Non-negotiable: Only OPEN requests are discoverable.
    const whereClause: any = {
      status: "OPEN",
    };

    if (subjectId) {
      whereClause.subjectId = subjectId;
    }

    if (cycle) {
      whereClause.cycle = cycle;
    }

    if (mode && (mode === "HOME" || mode === "ONLINE" || mode === "HYBRID")) {
      whereClause.mode = mode;
    }

    if (commune) {
      whereClause.commune = {
        contains: commune,
        mode: "insensitive",
      };
    }

    if (minBudget !== undefined || maxBudget !== undefined) {
      whereClause.budgetGnf = {};
      if (minBudget !== undefined && !isNaN(minBudget)) {
        whereClause.budgetGnf.gte = minBudget;
      }
      if (maxBudget !== undefined && !isNaN(maxBudget)) {
        whereClause.budgetGnf.lte = maxBudget;
      }
    }

    if (query) {
      whereClause.OR = [
        { subjectName: { contains: query, mode: "insensitive" } },
        { customSubject: { contains: query, mode: "insensitive" } },
        { gradeLevelName: { contains: query, mode: "insensitive" } },
        { commune: { contains: query, mode: "insensitive" } },
        { neighborhood: { contains: query, mode: "insensitive" } },
      ];
    }

    // 4. Fetch requests from PostgreSQL
    const [allMatchingRequests, totalCount] = await Promise.all([
      prisma.tutoringRequest.findMany({
        where: whereClause,
        orderBy: {
          publishedAt: "desc",
        },
        select: {
          id: true,
          subjectId: true,
          subjectName: true,
          customSubject: true,
          cycle: true,
          customCycle: true,
          gradeLevelName: true,
          mode: true,
          frequency: true,
          preferredSchedule: true,
          sessionDurationMinutes: true,
          budgetGnf: true,
          budgetType: true,
          city: true,
          commune: true,
          neighborhood: true,
          learningGoals: true,
          publishedAt: true,
          createdAt: true,
          status: true,
          // STRICT SECURITY: Do NOT select parent phone, address, student full name, etc.
          student: {
            select: {
              fullName: true,
              gradeLevel: true,
            },
          },
        },
      }),
      prisma.tutoringRequest.count({ where: whereClause }),
    ]);

    // 5. Calculate deterministic match scores
    const scoredRequests = allMatchingRequests.map((req) => {
      const matchResult = calculateOpportunityMatch(
        {
          id: fullTeacher.id,
          verificationStatus: fullTeacher.verificationStatus,
          city: fullTeacher.city,
          serviceArea: fullTeacher.serviceArea,
          isHomeAvailable: fullTeacher.isHomeAvailable,
          isOnlineAvailable: fullTeacher.isOnlineAvailable,
          customSubject: fullTeacher.customSubject,
          customGradeLevel: fullTeacher.customGradeLevel,
          subjects: fullTeacher.subjects,
          gradeLevels: fullTeacher.gradeLevels,
        },
        {
          id: req.id,
          subjectId: req.subjectId,
          subjectName: req.subjectName,
          customSubject: req.customSubject,
          cycle: req.cycle,
          customCycle: req.customCycle,
          gradeLevelName: req.gradeLevelName,
          mode: req.mode,
          city: req.city,
          commune: req.commune,
          budgetGnf: req.budgetGnf,
          status: req.status,
        }
      );

      const existingApp = applicationsByRequestId.get(req.id);

      return {
        id: req.id,
        subjectId: req.subjectId,
        subjectName: req.subjectName,
        customSubject: req.customSubject,
        cycle: req.cycle,
        customCycle: req.customCycle,
        gradeLevelName: req.gradeLevelName,
        mode: req.mode,
        frequency: req.frequency,
        preferredSchedule: req.preferredSchedule,
        sessionDurationMinutes: req.sessionDurationMinutes,
        budgetGnf: req.budgetGnf,
        budgetType: req.budgetType,
        city: req.city,
        commune: req.commune,
        neighborhood: req.neighborhood,
        learningGoals: req.learningGoals,
        publishedAt: req.publishedAt || req.createdAt,
        status: req.status,
        studentDisplay: `${req.student.fullName.split(" ")[0]} (${req.gradeLevelName})`,
        matchResult,
        hasApplied: !!existingApp,
        applicationId: existingApp?.id || null,
        applicationStatus: existingApp?.status || null,
      };
    });

    // 6. Handle recommendation filter
    let finalItems = scoredRequests;
    if (recommendedOnly) {
      finalItems = finalItems.filter((r) => r.matchResult.isRecommended);
    }

    const recommendedCount = scoredRequests.filter((r) => r.matchResult.isRecommended).length;

    // Apply pagination to result set
    const paginatedItems = finalItems.slice(skip, skip + limit);

    return NextResponse.json({
      opportunities: paginatedItems,
      total: finalItems.length,
      allCount: scoredRequests.length,
      allOpenTotal: totalCount,
      recommendedCount,
      isTeacherApproved: isApproved,
      page,
      limit,
      totalPages: Math.ceil(finalItems.length / limit) || 1,
    });
  } catch (error) {
    console.error("[GET /api/teacher/opportunities] Error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors du chargement des opportunités." },
      { status: 500 }
    );
  }
}
