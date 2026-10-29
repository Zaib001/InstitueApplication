import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireParentAuth } from "@/lib/auth/parent-guard";
import { studentCreateSchema } from "@/lib/validation/parent";

export const dynamic = "force-dynamic";

/**
 * GET /api/parent/children
 * Lists all student profiles belonging to the authenticated parent.
 */
export async function GET(request: Request) {
  const auth = await requireParentAuth();
  if (auth.errorResponse) return auth.errorResponse;

  const { parentProfile } = auth.context;
  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get("includeArchived") === "true";

  const children = await prisma.studentProfile.findMany({
    where: {
      parentId: parentProfile.id,
      ...(includeArchived ? {} : { isArchived: false }),
    },
    include: {
      _count: {
        select: {
          tutoringRequests: true,
          classrooms: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    data: children,
    count: children.length,
  });
}

/**
 * POST /api/parent/children
 * Creates a new student profile associated with the authenticated parent.
 */
export async function POST(request: Request) {
  const auth = await requireParentAuth();
  if (auth.errorResponse) return auth.errorResponse;

  const { user, parentProfile } = auth.context;

  try {
    const body = await request.json();
    const validatedData = studentCreateSchema.parse(body);

    const student = await prisma.studentProfile.create({
      data: {
        parentId: parentProfile.id,
        fullName: validatedData.fullName,
        gradeLevel: validatedData.gradeLevel,
        cycle: validatedData.cycle || null,
        schoolName: validatedData.schoolName || null,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
        supportNeeds: validatedData.supportNeeds || null,
        preferredSubjects: validatedData.preferredSubjects || [],
        notes: validatedData.notes || null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "STUDENT_CREATED",
        entityType: "StudentProfile",
        entityId: student.id,
        detailsJson: JSON.stringify({
          studentId: student.id,
          studentName: student.fullName,
          gradeLevel: student.gradeLevel,
          cycle: student.cycle,
        }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Profil élève créé avec succès.",
        data: student,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Données d'élève invalides." },
        { status: 400 }
      );
    }
    console.error("Error creating student profile:", error);
    return NextResponse.json(
      { error: "Impossible d'enregistrer le profil de l'élève." },
      { status: 500 }
    );
  }
}
