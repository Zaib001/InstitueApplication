import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireParentAuth, verifyStudentOwnership } from "@/lib/auth/parent-guard";
import {
  tutoringRequestDraftSchema,
  tutoringRequestPublishSchema,
} from "@/lib/validation/tutoring-request";
import { RequestStatus, UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/parent/requests
 * Lists all tutoring requests belonging to the authenticated parent with filter and pagination support.
 */
export async function GET(request: Request) {
  const auth = await requireParentAuth();
  if (auth.errorResponse) return auth.errorResponse;

  const { parentProfile } = auth.context;
  const { searchParams } = new URL(request.url);

  const statusParam = searchParams.get("status");
  const studentIdParam = searchParams.get("studentId");
  const searchParam = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
  const skip = (page - 1) * limit;

  // Build filter where clause strictly scoped to the parent
  const where: any = {
    parentId: parentProfile.id,
  };

  if (statusParam && Object.values(RequestStatus).includes(statusParam as RequestStatus)) {
    where.status = statusParam as RequestStatus;
  }

  if (studentIdParam) {
    where.studentId = studentIdParam;
  }

  if (searchParam && searchParam.trim().length > 0) {
    const q = searchParam.trim();
    where.OR = [
      { subjectName: { contains: q, mode: "insensitive" } },
      { customSubject: { contains: q, mode: "insensitive" } },
      { gradeLevelName: { contains: q, mode: "insensitive" } },
      { student: { fullName: { contains: q, mode: "insensitive" } } },
    ];
  }

  // Concurrent queries for paginated items and accurate status aggregates
  const [requests, totalCount, statusCounts] = await Promise.all([
    prisma.tutoringRequest.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            gradeLevel: true,
            cycle: true,
            customCycle: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.tutoringRequest.count({ where }),
    prisma.tutoringRequest.groupBy({
      by: ["status"],
      where: { parentId: parentProfile.id },
      _count: { status: true },
    }),
  ]);

  // Map counts by status for dashboard summary counters
  const countsByStatus = {
    total: 0,
    draft: 0,
    open: 0,
    matched: 0,
    closed: 0,
    cancelled: 0,
  };

  statusCounts.forEach((c) => {
    countsByStatus.total += c._count.status;
    if (c.status === RequestStatus.DRAFT) countsByStatus.draft = c._count.status;
    if (c.status === RequestStatus.OPEN) countsByStatus.open = c._count.status;
    if (c.status === RequestStatus.MATCHED || c.status === RequestStatus.ASSIGNED) {
      countsByStatus.matched += c._count.status;
    }
    if (c.status === RequestStatus.CLOSED) countsByStatus.closed = c._count.status;
    if (c.status === RequestStatus.CANCELLED) countsByStatus.cancelled = c._count.status;
  });

  return NextResponse.json({
    data: requests,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
    countsByStatus,
  });
}

/**
 * POST /api/parent/requests
 * Creates a new tutoring request for one of the parent's authorized students.
 * Supports saving as DRAFT or directly PUBLISHING (OPEN).
 */
export async function POST(request: Request) {
  const auth = await requireParentAuth();
  if (auth.errorResponse) return auth.errorResponse;

  const { user, parentProfile } = auth.context;

  try {
    const body = await request.json();
    const action = body.action === "publish" ? "publish" : "save_draft";

    // 1. Validate payload based on target action
    const validatedData =
      action === "publish"
        ? tutoringRequestPublishSchema.parse(body)
        : tutoringRequestDraftSchema.parse(body);

    // 2. Strict IDOR check: Verify the student belongs to this parent
    const student = await verifyStudentOwnership(
      validatedData.studentId!,
      parentProfile.id,
      user.role
    );

    if (!student) {
      return NextResponse.json(
        { error: "Élève introuvable ou non associé à votre compte parent." },
        { status: 403 }
      );
    }

    const targetStatus = action === "publish" ? RequestStatus.OPEN : RequestStatus.DRAFT;
    const publishedAt = action === "publish" ? new Date() : null;

    // 3. Persist the request in PostgreSQL
    const tutoringRequest = await prisma.tutoringRequest.create({
      data: {
        parentId: parentProfile.id,
        studentId: student.id,
        subjectId: validatedData.subjectId || null,
        subjectName: validatedData.subjectName || "",
        customSubject: validatedData.customSubject || null,
        cycle: validatedData.cycle || student.cycle || null,
        customCycle: validatedData.customCycle || student.customCycle || null,
        gradeLevelName: validatedData.gradeLevelName || student.gradeLevel || "",
        mode: validatedData.mode || "HOME",
        frequency: validatedData.frequency || null,
        preferredSchedule: validatedData.preferredSchedule || null,
        sessionDurationMinutes: validatedData.sessionDurationMinutes || 120,
        budgetGnf: validatedData.budgetGnf || 800000,
        budgetType: validatedData.budgetType || "MONTHLY",
        city: validatedData.city || parentProfile.city || "Conakry",
        commune: validatedData.commune || null,
        neighborhood: validatedData.neighborhood || null,
        locationAddress: validatedData.locationAddress || parentProfile.address || null,
        learningGoals: validatedData.learningGoals || null,
        description: validatedData.description || "",
        notes: validatedData.notes || null,
        status: targetStatus,
        publishedAt,
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            gradeLevel: true,
            cycle: true,
          },
        },
      },
    });

    // 4. Audit log entry
    await prisma.auditLog.create({
      data: {
        user: { connect: { id: user.id } },
        action: action === "publish" ? "TUTORING_REQUEST_PUBLISHED" : "TUTORING_REQUEST_CREATED",
        entityType: "TutoringRequest",
        entityId: tutoringRequest.id,
        detailsJson: JSON.stringify({
          requestId: tutoringRequest.id,
          studentId: student.id,
          studentName: student.fullName,
          subjectName: tutoringRequest.subjectName,
          customSubject: tutoringRequest.customSubject,
          status: tutoringRequest.status,
          mode: tutoringRequest.mode,
          budgetGnf: tutoringRequest.budgetGnf,
        }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          action === "publish"
            ? "Demande de tutorat publiée avec succès. Elle est désormais visible par les professeurs qualifiés."
            : "Brouillon de demande enregistré avec succès.",
        data: tutoringRequest,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          error: error.errors[0]?.message || "Données de demande invalides.",
          details: error.errors,
        },
        { status: 400 }
      );
    }
    console.error("Error creating tutoring request:", error);
    return NextResponse.json(
      { error: "Une erreur serveur est survenue lors de l'enregistrement de la demande." },
      { status: 500 }
    );
  }
}
