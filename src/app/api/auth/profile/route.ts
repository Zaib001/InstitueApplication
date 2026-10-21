import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { updateProfileSchema } from "@/lib/auth/validation";

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé. Veuillez vous connecter." }, { status: 401 });
    }

    const body = await request.json();
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Données de mise à jour invalides." },
        { status: 400 }
      );
    }

    const { fullName, phoneNumber, address, city } = result.data;

    // Check phone uniqueness if modified
    if (phoneNumber && phoneNumber !== user.phoneNumber) {
      const existing = await prisma.user.findUnique({
        where: { phoneNumber },
      });
      if (existing && existing.id !== user.id) {
        return NextResponse.json(
          { error: "Ce numéro de téléphone est déjà utilisé par un autre compte." },
          { status: 409 }
        );
      }
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: user.id },
        data: {
          fullName: fullName ?? user.fullName,
          phoneNumber: phoneNumber !== undefined ? (phoneNumber.trim() === "" ? null : phoneNumber) : user.phoneNumber,
        },
      });

      if (user.role === "PARENT" && (address !== undefined || city !== undefined)) {
        await tx.parentProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            address: address || null,
            city: city || "Conakry",
          },
          update: {
            address: address !== undefined ? address : undefined,
            city: city !== undefined ? city : undefined,
          },
        });
      } else if (user.role === "TEACHER" && city !== undefined) {
        await tx.teacherProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            city: city || "Conakry",
          },
          update: {
            city: city !== undefined ? city : undefined,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "PROFILE_UPDATED",
          entityType: "User",
          entityId: user.id,
          detailsJson: JSON.stringify({ fullName, phoneNumber, city }),
        },
      });

      return u;
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        phoneNumber: updatedUser.phoneNumber,
        role: updatedUser.role,
      },
    });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la mise à jour de votre profil." },
      { status: 500 }
    );
  }
}
