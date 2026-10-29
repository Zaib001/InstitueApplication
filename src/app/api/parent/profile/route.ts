import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireParentAuth } from "@/lib/auth/parent-guard";
import { parentProfileUpdateSchema } from "@/lib/validation/parent";

export const dynamic = "force-dynamic";

/**
 * GET /api/parent/profile
 * Retrieves personal information and metrics for the authenticated parent.
 */
export async function GET() {
  const auth = await requireParentAuth();
  if (auth.errorResponse) return auth.errorResponse;

  const { user, parentProfile } = auth.context;

  // Retrieve current children count and active tutoring requests
  const [childrenCount, activeRequestsCount] = await Promise.all([
    prisma.studentProfile.count({
      where: { parentId: parentProfile.id, isArchived: false },
    }),
    prisma.tutoringRequest.count({
      where: { parentId: parentProfile.id, status: "OPEN" },
    }),
  ]);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.isActive,
    },
    profile: {
      id: parentProfile.id,
      city: parentProfile.city,
      address: parentProfile.address,
      createdAt: parentProfile.createdAt,
      updatedAt: parentProfile.updatedAt,
      childrenCount,
      activeRequestsCount,
    },
  });
}

/**
 * PUT /api/parent/profile
 * Updates personal contact information (Full name, phone, city, address).
 * Strictly prevents modification of account role or email.
 */
export async function PUT(request: Request) {
  const auth = await requireParentAuth();
  if (auth.errorResponse) return auth.errorResponse;

  const { user, parentProfile } = auth.context;

  try {
    const body = await request.json();
    const validatedData = parentProfileUpdateSchema.parse(body);

    // Update User (fullName, phoneNumber) and ParentProfile (city, address) in a transaction
    const [updatedUser, updatedProfile] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: validatedData.fullName,
          phoneNumber: validatedData.phoneNumber || null,
        },
      }),
      prisma.parentProfile.update({
        where: { id: parentProfile.id },
        data: {
          city: validatedData.city,
          address: validatedData.address || null,
        },
      }),
    ]);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PARENT_PROFILE_UPDATED",
        entityType: "ParentProfile",
        entityId: parentProfile.id,
        detailsJson: JSON.stringify({
          city: validatedData.city,
          fullName: validatedData.fullName,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profil parent mis à jour avec succès.",
      user: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
      },
      profile: updatedProfile,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Données invalides." },
        { status: 400 }
      );
    }
    console.error("Error updating parent profile:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la mise à jour." },
      { status: 500 }
    );
  }
}
