import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTeacherAuth, requireApprovedTeacherAuth } from "@/lib/auth/teacher-guard";
import { ApplicationStatus, NotificationEventType, NotificationPriority } from "@prisma/client";
import { NotificationService } from "@/lib/notifications/notification-service";

/**
 * GET /api/teacher/applications
 * Returns all applications submitted by the authenticated teacher.
 * Multi-tenant data isolation: Teachers can ONLY see their own applications.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireTeacherAuth();
    if (auth.errorResponse) return auth.errorResponse;

    const { teacherProfile } = auth.context;

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status")?.toUpperCase();
    const query = searchParams.get("query")?.trim().toLowerCase();

    const whereClause: any = {
      teacherProfileId: teacherProfile.id,
    };

    if (
      statusFilter &&
      ["SUBMITTED", "SHORTLISTED", "ACCEPTED", "REJECTED", "WITHDRAWN"].includes(statusFilter)
    ) {
      whereClause.status = statusFilter as ApplicationStatus;
    }

    const applications = await prisma.teacherApplication.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        request: {
          select: {
            id: true,
            subjectName: true,
            customSubject: true,
            cycle: true,
            gradeLevelName: true,
            mode: true,
            frequency: true,
            budgetGnf: true,
            budgetType: true,
            city: true,
            commune: true,
            neighborhood: true,
            status: true,
            publishedAt: true,
            student: {
              select: {
                fullName: true,
                gradeLevel: true,
              },
            },
          },
        },
      },
    });

    // Compute status counts for the teacher's dashboard tabs
    const allTeacherApps = await prisma.teacherApplication.findMany({
      where: { teacherProfileId: teacherProfile.id },
      select: { status: true },
    });

    const counts = {
      all: allTeacherApps.length,
      submitted: allTeacherApps.filter((a) => a.status === ApplicationStatus.SUBMITTED).length,
      shortlisted: allTeacherApps.filter((a) => a.status === ApplicationStatus.SHORTLISTED).length,
      accepted: allTeacherApps.filter((a) => a.status === ApplicationStatus.ACCEPTED).length,
      rejected: allTeacherApps.filter((a) => a.status === ApplicationStatus.REJECTED).length,
      withdrawn: allTeacherApps.filter((a) => a.status === ApplicationStatus.WITHDRAWN).length,
    };

    // Filter by query if supplied (subject name, commune)
    let filteredApplications = applications;
    if (query) {
      filteredApplications = filteredApplications.filter((app) => {
        const req = app.request;
        return (
          req.subjectName.toLowerCase().includes(query) ||
          (req.customSubject && req.customSubject.toLowerCase().includes(query)) ||
          req.gradeLevelName.toLowerCase().includes(query) ||
          (req.commune && req.commune.toLowerCase().includes(query))
        );
      });
    }

    const sanitized = filteredApplications.map((app) => ({
      id: app.id,
      requestId: app.requestId,
      pitchMessage: app.pitchMessage,
      proposedRateGnf: app.proposedRateGnf,
      proposedRateType: app.proposedRateType,
      sessionArrangement: app.sessionArrangement,
      availabilityNotes: app.availabilityNotes,
      status: app.status,
      rejectionReason: app.rejectionReason,
      withdrawnAt: app.withdrawnAt,
      decisionAt: app.decisionAt,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      request: {
        id: app.request.id,
        subjectName: app.request.subjectName,
        customSubject: app.request.customSubject,
        cycle: app.request.cycle,
        gradeLevelName: app.request.gradeLevelName,
        mode: app.request.mode,
        frequency: app.request.frequency,
        budgetGnf: app.request.budgetGnf,
        budgetType: app.request.budgetType,
        city: app.request.city,
        commune: app.request.commune,
        status: app.request.status,
        studentDisplay: `${app.request.student.fullName.split(" ")[0]} (${app.request.gradeLevelName})`,
      },
    }));

    return NextResponse.json({
      applications: sanitized,
      counts,
      total: sanitized.length,
    });
  } catch (error) {
    console.error("[GET /api/teacher/applications] Error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des candidatures." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/applications
 * Submits an application for an OPEN tutoring request.
 * Strict RBAC & Invariants:
 * - Teacher MUST be APPROVED
 * - User account MUST be active
 * - Request MUST be OPEN
 * - Anti-duplicate constraint enforced
 * - Does NOT create a classroom or assign a student
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Strict Eligibility Gate: Only APPROVED teachers can apply
    const auth = await requireApprovedTeacherAuth();
    if (auth.errorResponse) return auth.errorResponse;

    const { user, teacherProfile } = auth.context;

    // 2. Parse and validate payload
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
    }

    const {
      requestId,
      pitchMessage,
      proposedRateGnf,
      proposedRateType = "MONTHLY",
      sessionArrangement,
      availabilityNotes,
      pricingOfferId,
    } = body;

    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json({ error: "L'identifiant de la demande est requis." }, { status: 400 });
    }

    if (!pitchMessage || typeof pitchMessage !== "string" || pitchMessage.trim().length < 20) {
      return NextResponse.json(
        { error: "Veuillez rédiger une note de motivation détaillée (au moins 20 caractères)." },
        { status: 400 }
      );
    }

    const parsedRate = proposedRateGnf !== undefined && proposedRateGnf !== null
      ? parseInt(proposedRateGnf, 10)
      : null;

    if (parsedRate !== null && (isNaN(parsedRate) || parsedRate <= 0)) {
      return NextResponse.json(
        { error: "Le tarif proposé doit être un montant valide en Francs Guinéens (GNF)." },
        { status: 400 }
      );
    }

    // 3. Verify Tutoring Request existence and status
    const tutoringRequest = await prisma.tutoringRequest.findUnique({
      where: { id: requestId },
      include: {
        parent: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!tutoringRequest) {
      return NextResponse.json({ error: "Demande de cours introuvable." }, { status: 404 });
    }

    if (tutoringRequest.status !== "OPEN") {
      return NextResponse.json(
        {
          error: "Cette demande n'est pas ouverte aux candidatures (statut actuel : " + tutoringRequest.status + ").",
          requestStatus: tutoringRequest.status,
        },
        { status: 400 }
      );
    }

    // 4. Anti-Duplicate Check
    const existing = await prisma.teacherApplication.findUnique({
      where: {
        requestId_teacherProfileId: {
          requestId,
          teacherProfileId: teacherProfile.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "Vous avez déjà soumis une candidature pour cette opportunité de tutorat.",
          existingApplicationId: existing.id,
          status: existing.status,
        },
        { status: 409 }
      );
    }

    // 5. Transactional Execution
    const newApplication = await prisma.$transaction(async (tx) => {
      // Re-check request status inside transaction to prevent race conditions
      const currentReq = await tx.tutoringRequest.findUnique({
        where: { id: requestId },
        select: { status: true },
      });

      if (!currentReq || currentReq.status !== "OPEN") {
        throw new Error("REQUEST_NOT_OPEN");
      }

      // Create TeacherApplication
      const app = await tx.teacherApplication.create({
        data: {
          requestId,
          teacherProfileId: teacherProfile.id,
          pitchMessage: pitchMessage.trim(),
          proposedRateGnf: parsedRate,
          proposedRateType: proposedRateType === "HOURLY" ? "HOURLY" : "MONTHLY",
          sessionArrangement: sessionArrangement?.trim() || null,
          availabilityNotes: availabilityNotes?.trim() || null,
          pricingOfferId: pricingOfferId || null,
          status: ApplicationStatus.SUBMITTED,
        },
        include: {
          request: {
            select: {
              subjectName: true,
              gradeLevelName: true,
            },
          },
        },
      });

      // P14: Create notification & outbox email for the parent
      if (tutoringRequest.parent?.userId) {
        await NotificationService.publishNotificationEvent(
          {
            eventType: NotificationEventType.TEACHER_APPLICATION_RECEIVED,
            recipientUserId: tutoringRequest.parent.userId,
            actorUserId: user.id,
            entityType: "TeacherApplication",
            entityId: app.id,
            title: "Nouvelle candidature reçue",
            message: `Un enseignant certifié a postulé à votre demande de cours (${tutoringRequest.subjectName}).`,
            linkUrl: `/parent/requests/${requestId}`,
            priority: NotificationPriority.NORMAL,
            emailPayload: {
              subjectName: tutoringRequest.subjectName,
              teacherName: user.fullName,
              requestUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/parent/requests/${requestId}`,
            },
          },
          tx
        );
      }

      // Audit log entry
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "TEACHER_APPLICATION_SUBMITTED",
          entityType: "TeacherApplication",
          entityId: app.id,
          detailsJson: JSON.stringify({
            requestId,
            teacherProfileId: teacherProfile.id,
            proposedRateGnf: parsedRate,
            proposedRateType,
          }),
        },
      });

      return app;
    });

    return NextResponse.json(
      {
        application: newApplication,
        message: "Votre candidature a été transmise avec succès au parent d'élève.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "REQUEST_NOT_OPEN") {
      return NextResponse.json(
        { error: "Cette demande vient d'être fermée ou assignée et n'accepte plus de candidatures." },
        { status: 400 }
      );
    }

    // Handle Prisma unique constraint violation code P2002
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Vous avez déjà soumis une candidature pour cette opportunité." },
        { status: 409 }
      );
    }

    console.error("[POST /api/teacher/applications] Error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'enregistrement de votre candidature." },
      { status: 500 }
    );
  }
}
