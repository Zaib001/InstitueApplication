import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();

  if (!user || user.role !== UserRole.ADMIN) {
    return NextResponse.json(
      { error: "Accès refusé. Réservé aux administrateurs." },
      { status: 403 }
    );
  }

  const { id } = await params;

  const profile = await prisma.teacherProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          avatarUrl: true,
          createdAt: true,
          isActive: true,
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
      availabilities: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
      documents: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Candidature enseignant introuvable." }, { status: 404 });
  }

  // Fetch recent audit logs relating to this teacher
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entityId: profile.id },
        { userId: profile.userId },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    profile,
    auditLogs,
  });
}
