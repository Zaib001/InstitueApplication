import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { parentRegisterSchema, teacherRegisterSchema } from "@/lib/auth/validation";
import { UserRole, TeacherVerificationStatus } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const role = body.role;

    // Security check: Never allow registration as ADMIN or any unrecognized role
    if (role !== "PARENT" && role !== "TEACHER") {
      return NextResponse.json(
        { error: "Rôle non autorisé pour l'inscription publique." },
        { status: 400 }
      );
    }

    let validatedData: any;
    if (role === "PARENT") {
      const result = parentRegisterSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error.errors[0]?.message || "Données invalides." },
          { status: 400 }
        );
      }
      validatedData = result.data;
    } else {
      const result = teacherRegisterSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error.errors[0]?.message || "Données invalides." },
          { status: 400 }
        );
      }
      validatedData = result.data;
    }

    const { fullName, email, phoneNumber, password } = validatedData;

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Cette adresse email est déjà associée à un compte existant." },
        { status: 409 }
      );
    }

    // Check phone uniqueness if provided
    if (phoneNumber && phoneNumber.trim() !== "") {
      const existingPhone = await prisma.user.findUnique({
        where: { phoneNumber },
      });
      if (existingPhone) {
        return NextResponse.json(
          { error: "Ce numéro de téléphone est déjà utilisé par un autre compte." },
          { status: 409 }
        );
      }
    }

    // Hash password with bcryptjs
    const passwordHash = await hashPassword(password);

    // Create user and profile in an atomic transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName,
          email,
          phoneNumber: phoneNumber && phoneNumber.trim() !== "" ? phoneNumber : null,
          passwordHash,
          role: role as UserRole,
          isActive: true,
        },
      });

      if (role === "PARENT") {
        await tx.parentProfile.create({
          data: {
            userId: user.id,
            city: "Conakry",
          },
        });
      } else if (role === "TEACHER") {
        await tx.teacherProfile.create({
          data: {
            userId: user.id,
            city: "Conakry",
            verificationStatus: TeacherVerificationStatus.PENDING_REVIEW,
          },
        });
      }

      // Record audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "USER_REGISTERED",
          entityType: "User",
          entityId: user.id,
          detailsJson: JSON.stringify({ role, email }),
        },
      });

      return user;
    });

    // Create persistent session and set HTTP-only cookie
    await createSession({
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
    });

    const redirectUrl = role === "PARENT" ? "/parent/dashboard" : "/teacher/dashboard";

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
        },
        redirectUrl,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue est survenue lors de l'inscription." },
      { status: 500 }
    );
  }
}
