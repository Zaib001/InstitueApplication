import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireParentAuth } from "@/lib/auth/parent-guard";

export const dynamic = "force-dynamic";

/**
 * GET /api/parent/master-data
 * Returns subjects and grade levels for parent forms (adding/editing students).
 */
export async function GET() {
  const auth = await requireParentAuth();
  if (auth.errorResponse) return auth.errorResponse;

  const [subjects, gradeLevels] = await Promise.all([
    prisma.subject.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, category: true },
    }),
    prisma.gradeLevel.findMany({
      orderBy: { orderIndex: "asc" },
      select: { id: true, name: true, cycle: true, orderIndex: true },
    }),
  ]);

  return NextResponse.json({
    subjects,
    gradeLevels,
  });
}
