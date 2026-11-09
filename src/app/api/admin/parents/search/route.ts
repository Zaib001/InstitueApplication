import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";

    const whereClause: any = {
      role: UserRole.PARENT,
      isActive: true,
    };

    if (query) {
      whereClause.OR = [
        { fullName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { phoneNumber: { contains: query, mode: "insensitive" } },
      ];
    }

    const parents = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        createdAt: true,
        parentProfile: {
          select: {
            id: true,
            city: true,
            address: true,
            isAssistedRegistration: true,
            children: {
              where: { isArchived: false },
              select: {
                id: true,
                fullName: true,
                gradeLevel: true,
                cycle: true,
                schoolName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const formatted = parents.map((p) => ({
      userId: p.id,
      parentProfileId: p.parentProfile?.id || null,
      fullName: p.fullName,
      email: p.email,
      phoneNumber: p.phoneNumber,
      city: p.parentProfile?.city || "Conakry",
      address: p.parentProfile?.address || null,
      isAssistedRegistration: p.parentProfile?.isAssistedRegistration || false,
      children: p.parentProfile?.children || [],
      childrenCount: p.parentProfile?.children?.length || 0,
      createdAt: p.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      parents: formatted,
    });
  } catch (error) {
    console.error("Error searching parents:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recherche des parents" },
      { status: 500 }
    );
  }
}

