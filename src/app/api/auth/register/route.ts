import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { parentRegisterSchema, teacherRegisterSchema } from "@/lib/auth/validation";
import { UserRole, TeacherVerificationStatus, NotificationEventType, NotificationPriority } from "@prisma/client";
import { NotificationService } from "@/lib/notifications/notification-service";

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

    // Legal requirement: Terms & Non-circumvention clause acceptance is mandatory
    if (body.termsAccepted !== true) {
      return NextResponse.json(
        {
          error:
            "Vous devez lire et accepter les Conditions Générales d'Utilisation et la Charte d'engagement pédagogique, y compris la clause de non-contournement.",
        },
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

    // Extract client IP and user agent for immutable legal acceptance record
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const userAgent = request.headers.get("user-agent") || null;
    const termsVersion = "V2.1-2026-NC";
    const acceptedAt = new Date();

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
            termsAccepted: true,
            termsAcceptedAt: acceptedAt,
            termsVersion,
          },
        });
      } else if (role === "TEACHER") {
        await tx.teacherProfile.create({
          data: {
            userId: user.id,
            city: "Conakry",
            verificationStatus: TeacherVerificationStatus.PENDING_REVIEW,
            termsAccepted: true,
            termsAcceptedAt: acceptedAt,
            termsVersion,
          },
        });
      }

      // Record immutable legal acceptance records for CGU, Charte, and Non-Circumvention
      await tx.legalAcceptance.createMany({
        data: [
          {
            userId: user.id,
            documentType: "CGU",
            documentVersion: termsVersion,
            context: "REGISTRATION",
            ipAddress,
            userAgent,
            acceptedAt,
          },
          {
            userId: user.id,
            documentType: "CHARTE_PEDAGOGIQUE",
            documentVersion: termsVersion,
            context: "REGISTRATION",
            ipAddress,
            userAgent,
            acceptedAt,
          },
          {
            userId: user.id,
            documentType: "NON_CIRCUMVENTION",
            documentVersion: termsVersion,
            context: "REGISTRATION",
            ipAddress,
            userAgent,
            acceptedAt,
          },
        ],
      });

      // Record audit logs
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "USER_REGISTERED",
          entityType: "User",
          entityId: user.id,
          ipAddress,
          detailsJson: JSON.stringify({ role, email }),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "TERMS_ACCEPTED",
          entityType: "User",
          entityId: user.id,
          ipAddress,
          detailsJson: JSON.stringify({
            version: termsVersion,
            documents: ["CGU", "CHARTE_PEDAGOGIQUE", "NON_CIRCUMVENTION"],
            clause: "Non-contournement de la plateforme",
            acceptedAt: acceptedAt.toISOString(),
          }),
        },
      });

      // P14: Send welcome notification & outbox email
      await NotificationService.publishNotificationEvent(
        {
          eventType: NotificationEventType.AUTH_WELCOME,
          recipientUserId: user.id,
          title: "Bienvenue sur Monsieur Fanyi !",
          message:
            role === "PARENT"
              ? "Votre compte parent est actif. Vous pouvez dès à présent créer votre première demande de cours."
              : "Votre compte enseignant est créé. Complétez votre profil pour commencer à postuler.",
          linkUrl: role === "PARENT" ? "/parent/dashboard" : "/teacher/dashboard",
          priority: NotificationPriority.NORMAL,
          emailPayload: {
            recipientName: user.fullName,
            role,
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${
              role === "PARENT" ? "/parent/dashboard" : "/teacher/dashboard"
            }`,
          },
        },
        tx
      );

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
