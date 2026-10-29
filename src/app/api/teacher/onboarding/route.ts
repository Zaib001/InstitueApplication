import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole, TeacherVerificationStatus } from "@prisma/client";
import { validateAvailabilitySlots } from "@/lib/validation/availability";

const TERMS_VERSION = "SRD-V2.0-2026-ENGAGEMENT";

const onboardingSchema = z.object({
  headline: z.string().max(120).optional().nullable(),
  bio: z.string().max(3000).optional().nullable(),
  yearsOfExperience: z.coerce.number().int().min(0).max(50).default(0),
  city: z.string().min(2).max(100).default("Conakry"),
  serviceArea: z.string().max(255).optional().nullable(),
  degrees: z.string().max(255).optional().nullable(),
  institution: z.string().max(255).optional().nullable(),
  isHomeAvailable: z.boolean().default(true),
  isOnlineAvailable: z.boolean().default(true),
  hourlyRateGnf: z.coerce.number().int().min(0).optional().nullable(),
  monthlyPackageRateGnf: z.coerce.number().int().min(0).optional().nullable(),
  monthlyPackageSessions: z.coerce.number().int().min(1).max(30).default(8),
  monthlyPackageHoursPerSession: z.coerce.number().int().min(1).max(6).default(2),
  subjectIds: z.array(z.string()).default([]),
  gradeLevelIds: z.array(z.string()).default([]),
  availabilities: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        startTime: z.string(),
        endTime: z.string(),
      })
    )
    .default([]),
  termsAccepted: z.boolean().default(false),
  action: z.enum(["save_draft", "submit"]).default("save_draft"),
});

export async function GET() {
  const user = await getCurrentUser();

  if (!user || user.role !== UserRole.TEACHER) {
    return NextResponse.json(
      { error: "Accès refusé. Réservé aux enseignants authentifiés." },
      { status: 403 }
    );
  }

  // Retrieve or create teacherProfile
  let profile = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
    include: {
      subjects: { select: { subjectId: true } },
      gradeLevels: { select: { gradeLevelId: true } },
      availabilities: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!profile) {
    profile = await prisma.teacherProfile.create({
      data: {
        userId: user.id,
        verificationStatus: TeacherVerificationStatus.DRAFT,
      },
      include: {
        subjects: { select: { subjectId: true } },
        gradeLevels: { select: { gradeLevelId: true } },
        availabilities: true,
        documents: true,
      },
    });
  }

  // Master data
  const [allSubjects, allGradeLevels] = await Promise.all([
    prisma.subject.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.gradeLevel.findMany({ orderBy: { orderIndex: "asc" } }),
  ]);

  return NextResponse.json({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
    },
    profile: {
      ...profile,
      subjectIds: profile.subjects.map((s) => s.subjectId),
      gradeLevelIds: profile.gradeLevels.map((g) => g.gradeLevelId),
    },
    masterData: {
      subjects: allSubjects,
      gradeLevels: allGradeLevels,
    },
    termsVersion: TERMS_VERSION,
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.role !== UserRole.TEACHER) {
    return NextResponse.json(
      { error: "Accès refusé. Réservé aux enseignants authentifiés." },
      { status: 403 }
    );
  }

  try {
    const rawData = await request.json();
    const parsed = onboardingSchema.parse(rawData);

    // Validate availabilities for overlapping intervals
    if (parsed.availabilities.length > 0) {
      const availCheck = validateAvailabilitySlots(parsed.availabilities);
      if (!availCheck.valid) {
        return NextResponse.json({ error: availCheck.error }, { status: 400 });
      }
    }

    // Retrieve or initialize teacher profile
    let profile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      include: { documents: true },
    });

    if (!profile) {
      profile = await prisma.teacherProfile.create({
        data: {
          userId: user.id,
          verificationStatus: TeacherVerificationStatus.DRAFT,
        },
        include: { documents: true },
      });
    }

    // Check if submitting application
    if (parsed.action === "submit") {
      // 1. Bio completeness check
      if (!parsed.bio || parsed.bio.trim().length < 30) {
        return NextResponse.json(
          { error: "La biographie pédagogique doit comporter au moins 30 caractères décrivant votre méthodologie." },
          { status: 400 }
        );
      }

      // 2. Subjects check
      if (!parsed.subjectIds || parsed.subjectIds.length === 0) {
        return NextResponse.json(
          { error: "Veuillez sélectionner au moins une matière d'enseignement." },
          { status: 400 }
        );
      }

      // 3. Grade levels check
      if (!parsed.gradeLevelIds || parsed.gradeLevelIds.length === 0) {
        return NextResponse.json(
          { error: "Veuillez sélectionner au moins un niveau d'enseignement (Primaire, Collège, Lycée)." },
          { status: 400 }
        );
      }

      // 4. Availability check
      if (!parsed.availabilities || parsed.availabilities.length === 0) {
        return NextResponse.json(
          { error: "Veuillez renseigner au moins un créneau horaire de disponibilité hebdomadaire." },
          { status: 400 }
        );
      }

      // 5. Document checks (Identity document + Diploma required)
      const hasIdentityDoc = profile.documents.some(
        (doc) => doc.type === "NATIONAL_ID" || doc.type === "PASSPORT"
      );
      if (!hasIdentityDoc) {
        return NextResponse.json(
          { error: "Une pièce d'identité valide (CNI ou Passeport Guinéen) est obligatoire." },
          { status: 400 }
        );
      }

      const hasDiplomaDoc = profile.documents.some((doc) => doc.type === "DIPLOMA");
      if (!hasDiplomaDoc) {
        return NextResponse.json(
          { error: "Le téléversement d'au moins un diplôme ou attestation universitaire est obligatoire." },
          { status: 400 }
        );
      }

      // 6. Terms check
      if (!parsed.termsAccepted) {
        return NextResponse.json(
          { error: "Vous devez accepter la Charte Déontologique et les conditions d'engagement Monsieur Fanyi." },
          { status: 400 }
        );
      }
    }

    const isSubmitting = parsed.action === "submit";
    const previousStatus = profile.verificationStatus;
    const isResubmission = previousStatus === TeacherVerificationStatus.REJECTED;

    // Transaction to update profile, subjects, gradeLevels, and availabilities
    const updatedProfile = await prisma.$transaction(async (tx) => {
      // 1. Update Profile Fields
      const updated = await tx.teacherProfile.update({
        where: { id: profile.id },
        data: {
          headline: parsed.headline || null,
          bio: parsed.bio || null,
          yearsOfExperience: parsed.yearsOfExperience,
          city: parsed.city,
          serviceArea: parsed.serviceArea || null,
          degrees: parsed.degrees || null,
          institution: parsed.institution || null,
          isHomeAvailable: parsed.isHomeAvailable,
          isOnlineAvailable: parsed.isOnlineAvailable,
          hourlyRateGnf: parsed.hourlyRateGnf || null,
          monthlyPackageRateGnf: parsed.monthlyPackageRateGnf || null,
          monthlyPackageSessions: parsed.monthlyPackageSessions,
          monthlyPackageHoursPerSession: parsed.monthlyPackageHoursPerSession,
          termsAccepted: parsed.termsAccepted,
          termsAcceptedAt: parsed.termsAccepted ? new Date() : profile.termsAcceptedAt,
          termsVersion: parsed.termsAccepted ? TERMS_VERSION : profile.termsVersion,
          ...(isSubmitting
            ? {
                verificationStatus: TeacherVerificationStatus.PENDING_REVIEW,
                submittedAt: new Date(),
                rejectionReason: null,
              }
            : {}),
        },
      });

      // 2. Synchronize Subjects
      await tx.teacherSubject.deleteMany({ where: { teacherProfileId: profile.id } });
      if (parsed.subjectIds.length > 0) {
        await tx.teacherSubject.createMany({
          data: parsed.subjectIds.map((subjectId) => ({
            teacherProfileId: profile.id,
            subjectId,
          })),
        });
      }

      // 3. Synchronize Grade Levels
      await tx.teacherGradeLevel.deleteMany({ where: { teacherProfileId: profile.id } });
      if (parsed.gradeLevelIds.length > 0) {
        await tx.teacherGradeLevel.createMany({
          data: parsed.gradeLevelIds.map((gradeLevelId) => ({
            teacherProfileId: profile.id,
            gradeLevelId,
          })),
        });
      }

      // 4. Synchronize Availabilities
      await tx.availability.deleteMany({ where: { teacherProfileId: profile.id } });
      if (parsed.availabilities.length > 0) {
        await tx.availability.createMany({
          data: parsed.availabilities.map((slot) => ({
            teacherProfileId: profile.id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isRecurring: true,
          })),
        });
      }

      // 5. If submitting, write AuditLog & in-app Notification
      if (isSubmitting) {
        const auditAction = isResubmission
          ? "TEACHER_APPLICATION_RESUBMITTED"
          : "TEACHER_APPLICATION_SUBMITTED";

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: auditAction,
            entityType: "TeacherProfile",
            entityId: profile.id,
            detailsJson: JSON.stringify({
              fullName: user.fullName,
              city: parsed.city,
              subjectsCount: parsed.subjectIds.length,
              documentsCount: profile.documents.length,
              termsVersion: TERMS_VERSION,
            }),
          },
        });

        await tx.notification.create({
          data: {
            userId: user.id,
            title: isResubmission
              ? "Candidature renvoyée pour examen"
              : "Dossier d'enseignant soumis avec succès",
            message:
              "Votre candidature a été transmise à l'administration de Monsieur Fanyi. Examen sous 24h ouvrées.",
            linkUrl: "/teacher/dashboard",
          },
        });
      }

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: isSubmitting
        ? "Votre dossier a été soumis avec succès et est en cours d'examen."
        : "Brouillon sauvegardé avec succès.",
      profile: updatedProfile,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données de formulaire invalides.", details: error.format() },
        { status: 400 }
      );
    }
    console.error("Erreur lors de la mise à jour de l'onboarding enseignant:", error);
    return NextResponse.json(
      { error: "Une erreur serveur est survenue lors de l'enregistrement." },
      { status: 500 }
    );
  }
}
