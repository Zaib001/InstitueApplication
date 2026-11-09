import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const resolvedParams = await Promise.resolve(params);
    const parentProfileId = resolvedParams.id;

    const parent = await prisma.parentProfile.findUnique({
      where: { id: parentProfileId },
      include: {
        children: {
          where: { isArchived: false },
          orderBy: { fullName: "asc" },
        },
      },
    });

    if (!parent) {
      return NextResponse.json(
        { error: "Profil parent introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      students: parent.children,
    });
  } catch (error) {
    console.error("Error fetching parent students:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des élèves" },
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
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const resolvedParams = await Promise.resolve(params);
    const parentProfileId = resolvedParams.id;

    const parent = await prisma.parentProfile.findUnique({
      where: { id: parentProfileId },
    });

    if (!parent) {
      return NextResponse.json(
        { error: "Profil parent introuvable" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { fullName, gradeLevel, cycle, schoolName, supportNeeds } = body;

    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      return NextResponse.json(
        { error: "Le nom de l'élève est obligatoire" },
        { status: 400 }
      );
    }

    if (!gradeLevel || typeof gradeLevel !== "string") {
      return NextResponse.json(
        { error: "La classe/niveau de l'élève est obligatoire" },
        { status: 400 }
      );
    }

    const student = await prisma.studentProfile.create({
      data: {
        parentId: parent.id,
        fullName: fullName.trim(),
        gradeLevel: gradeLevel.trim(),
        cycle: cycle?.trim() || null,
        schoolName: schoolName?.trim() || null,
        supportNeeds: supportNeeds?.trim() || null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "ADMIN_CREATE_STUDENT_PROFILE",
        entityType: "StudentProfile",
        entityId: student.id,
        detailsJson: JSON.stringify({
          parentId: parent.id,
          studentName: student.fullName,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      student,
    });
  } catch (error) {
    console.error("Error creating student profile:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'élève" },
      { status: 500 }
    );
  }
}

