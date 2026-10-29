import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole, TeacherVerificationStatus } from "@prisma/client";

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.role !== UserRole.ADMIN) {
    return NextResponse.json(
      { error: "Accès refusé. Réservé aux administrateurs." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const searchQuery = searchParams.get("search")?.trim() || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "20", 10)));
  const skip = (page - 1) * limit;

  // Build where filter
  const where: any = {};

  if (statusParam && statusParam !== "ALL") {
    if (Object.values(TeacherVerificationStatus).includes(statusParam as TeacherVerificationStatus)) {
      where.verificationStatus = statusParam as TeacherVerificationStatus;
    }
  }

  if (searchQuery) {
    where.OR = [
      { user: { fullName: { contains: searchQuery, mode: "insensitive" } } },
      { user: { email: { contains: searchQuery, mode: "insensitive" } } },
      { city: { contains: searchQuery, mode: "insensitive" } },
      { headline: { contains: searchQuery, mode: "insensitive" } },
      { degrees: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  const [totalCount, teachers] = await Promise.all([
    prisma.teacherProfile.count({ where }),
    prisma.teacherProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { submittedAt: "desc" },
        { updatedAt: "desc" },
      ],
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
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
        documents: {
          select: {
            id: true,
            type: true,
            title: true,
            status: true,
          },
        },
        _count: {
          select: {
            documents: true,
            availabilities: true,
            classrooms: true,
          },
        },
      },
    }),
  ]);

  // Status counters for tab filters
  const [pendingCount, approvedCount, rejectedCount, draftCount] = await Promise.all([
    prisma.teacherProfile.count({ where: { verificationStatus: TeacherVerificationStatus.PENDING_REVIEW } }),
    prisma.teacherProfile.count({ where: { verificationStatus: TeacherVerificationStatus.APPROVED } }),
    prisma.teacherProfile.count({ where: { verificationStatus: TeacherVerificationStatus.REJECTED } }),
    prisma.teacherProfile.count({ where: { verificationStatus: TeacherVerificationStatus.DRAFT } }),
  ]);

  return NextResponse.json({
    data: teachers,
    meta: {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      counts: {
        all: pendingCount + approvedCount + rejectedCount + draftCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        draft: draftCount,
      },
    },
  });
}
