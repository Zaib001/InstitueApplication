import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole, NotificationEventType, NotificationPriority } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { NotificationService } from "@/lib/notifications/notification-service";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();
    const { fullName, phoneNumber, email, address, city = "Conakry" } = body;

    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      return NextResponse.json(
        { error: "Le nom complet du parent est obligatoire (au moins 2 caractères)" },
        { status: 400 }
      );
    }

    if (!phoneNumber || typeof phoneNumber !== "string") {
      return NextResponse.json(
        { error: "Le numéro de téléphone du parent est obligatoire" },
        { status: 400 }
      );
    }

    // Clean phone number
    const cleanPhone = phoneNumber.replace(/[\s\-\.]/g, "");
    if (cleanPhone.length < 8) {
      return NextResponse.json(
        { error: "Format de numéro de téléphone invalide" },
        { status: 400 }
      );
    }

    // Determine or generate unique email
    let parentEmail = email ? email.trim().toLowerCase() : null;
    if (!parentEmail) {
      // Institutional placeholder for phone-only registered parents
      parentEmail = `parent.${cleanPhone.replace("+", "")}@famille.monsieurfanyi.com`;
    }

    // Check unique email and phone
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: parentEmail },
          { phoneNumber: cleanPhone },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "Un utilisateur existe déjà avec cette adresse email ou ce numéro de téléphone",
        },
        { status: 409 }
      );
    }

    // Generate secure random activation token (never a plaintext password!)
    const rawActivationToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawActivationToken)
      .digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Generate high-entropy unguessable initial hash
    const initialRandomSecret = crypto.randomBytes(32).toString("hex");
    const passwordHash = await bcrypt.hash(initialRandomSecret, 12);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create parent User
      const newUser = await tx.user.create({
        data: {
          fullName: fullName.trim(),
          email: parentEmail,
          phoneNumber: cleanPhone,
          role: UserRole.PARENT,
          passwordHash,
          isActive: true,
        },
      });

      // 2. Create ParentProfile
      const parentProfile = await tx.parentProfile.create({
        data: {
          userId: newUser.id,
          city: city || "Conakry",
          address: address?.trim() || null,
          isAssistedRegistration: true,
        },
      });

      // 3. Create AccountInvitationToken
      await tx.accountInvitationToken.create({
        data: {
          userId: newUser.id,
          tokenHash,
          expiresAt,
          invitedByAdminId: user.id,
        },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "ADMIN_ASSISTED_PARENT_REGISTER",
          entityType: "User",
          entityId: newUser.id,
          detailsJson: JSON.stringify({
            parentProfileId: parentProfile.id,
            email: parentEmail,
            phoneNumber: cleanPhone,
            isAssistedRegistration: true,
          }),
        },
      });

      // 5. P14: Send account activation notification & outbox email
      await NotificationService.publishNotificationEvent(
        {
          eventType: NotificationEventType.AUTH_ACTIVATION,
          recipientUserId: newUser.id,
          actorUserId: user.id,
          title: "Activation de votre compte Monsieur Fanyi",
          message:
            "Un conseiller pédagogique a initialisé votre espace parent. Activez votre compte pour suivre vos cours.",
          linkUrl: `/reset-password?token=${rawActivationToken}`,
          priority: NotificationPriority.HIGH,
          emailPayload: {
            activationUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${rawActivationToken}`,
            adminName: user.fullName,
          },
        },
        tx
      );

      return {
        user: newUser,
        parentProfile,
      };
    });

    // Activation link for parent
    const activationUrl = `/reset-password?token=${rawActivationToken}`;

    return NextResponse.json({
      success: true,
      parent: {
        userId: result.user.id,
        parentProfileId: result.parentProfile.id,
        fullName: result.user.fullName,
        email: result.user.email,
        phoneNumber: result.user.phoneNumber,
        city: result.parentProfile.city,
        address: result.parentProfile.address,
        isAssistedRegistration: true,
      },
      activationToken: rawActivationToken,
      activationUrl,
    });
  } catch (error) {
    console.error("Error creating assisted parent account:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création assistée du compte parent" },
      { status: 500 }
    );
  }
}

