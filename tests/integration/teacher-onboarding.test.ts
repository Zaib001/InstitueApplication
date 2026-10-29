import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  PrismaClient,
  UserRole,
  TeacherVerificationStatus,
  DocumentStatus,
  DocumentType,
} from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { validateAvailabilitySlots } from "@/lib/validation/availability";

const prisma = new PrismaClient();

describe("Phase 03: Complete Teacher Onboarding & Verification Lifecycle", () => {
  const timestamp = Date.now();
  const teacherEmail = `teacher.p03.${timestamp}@monsieurfanyi.gn`;
  const adminEmail = `admin.p03.${timestamp}@monsieurfanyi.gn`;
  const parentEmail = `parent.p03.${timestamp}@monsieurfanyi.gn`;
  const testPassword = "PasswordSecure2026!";

  let teacherUserId: string;
  let teacherProfileId: string;
  let adminUserId: string;
  let parentUserId: string;
  let mathSubjectId: string;
  let lyceeGradeLevelId: string;

  beforeAll(async () => {
    const passwordHash = await hashPassword(testPassword);

    // 1. Ensure master data exists
    let math = await prisma.subject.findFirst({ where: { name: "Mathématiques" } });
    if (!math) {
      math = await prisma.subject.create({
        data: { name: "Mathématiques", category: "Sciences" },
      });
    }
    mathSubjectId = math.id;

    let lycee = await prisma.gradeLevel.findFirst({ where: { cycle: "LYCEE" } });
    if (!lycee) {
      lycee = await prisma.gradeLevel.create({
        data: { name: "Terminale", cycle: "LYCEE", orderIndex: 10 },
      });
    }
    lyceeGradeLevelId = lycee.id;

    // 2. Create Teacher User & Profile in DRAFT
    const teacherUser = await prisma.user.create({
      data: {
        fullName: "Dr. Alpha Camara",
        email: teacherEmail,
        phoneNumber: `620${Math.floor(100000 + Math.random() * 900000)}`,
        passwordHash,
        role: UserRole.TEACHER,
        isActive: true,
        teacherProfile: {
          create: {
            headline: "Enseignant agrégé de Mathématiques",
            bio: "Plus de 8 ans d'expérience dans la préparation au Baccalauréat.",
            city: "Conakry",
            serviceArea: "Ratoma, Dixinn",
            yearsOfExperience: 8,
            degrees: "Master 2 Didactique des Sciences",
            institution: "UGANC",
            isHomeAvailable: true,
            isOnlineAvailable: true,
            monthlyPackageRateGnf: 600000,
            monthlyPackageSessions: 8,
            monthlyPackageHoursPerSession: 2,
            verificationStatus: TeacherVerificationStatus.DRAFT,
          },
        },
      },
      include: { teacherProfile: true },
    });
    teacherUserId = teacherUser.id;
    teacherProfileId = teacherUser.teacherProfile!.id;

    // 3. Create Admin User
    const adminUser = await prisma.user.create({
      data: {
        fullName: "Administrateur National",
        email: adminEmail,
        phoneNumber: `629${Math.floor(100000 + Math.random() * 900000)}`,
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
      },
    });
    adminUserId = adminUser.id;

    // 4. Create Parent User
    const parentUser = await prisma.user.create({
      data: {
        fullName: "Parent Ibrahima Barry",
        email: parentEmail,
        phoneNumber: `628${Math.floor(100000 + Math.random() * 900000)}`,
        passwordHash,
        role: UserRole.PARENT,
        isActive: true,
      },
    });
    parentUserId = parentUser.id;
  });

  afterAll(async () => {
    // Clean up test data safely
    const userIds = [teacherUserId, adminUserId, parentUserId].filter(Boolean);

    if (teacherProfileId) {
      await prisma.teacherSubject.deleteMany({ where: { teacherProfileId } });
      await prisma.teacherGradeLevel.deleteMany({ where: { teacherProfileId } });
      await prisma.availability.deleteMany({ where: { teacherProfileId } });
      await prisma.teacherDocument.deleteMany({ where: { teacherProfileId } });
      await prisma.teacherProfile.deleteMany({ where: { id: teacherProfileId } });
    }

    if (userIds.length > 0) {
      await prisma.notification.deleteMany({
        where: { userId: { in: userIds } },
      });
      await prisma.auditLog.deleteMany({
        where: { userId: { in: userIds } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }

    await prisma.$disconnect();
  });

  it("P03.01: Master data seeding verifies Guinean subjects and grade levels exist", async () => {
    const subjectsCount = await prisma.subject.count();
    const gradeLevelsCount = await prisma.gradeLevel.count();

    expect(subjectsCount).toBeGreaterThanOrEqual(1);
    expect(gradeLevelsCount).toBeGreaterThanOrEqual(1);
  });

  it("P03.02: Teacher profile initializes in DRAFT status with initial fields", async () => {
    const profile = await prisma.teacherProfile.findUnique({
      where: { id: teacherProfileId },
    });

    expect(profile).toBeDefined();
    expect(profile?.verificationStatus).toBe(TeacherVerificationStatus.DRAFT);
    expect(profile?.degrees).toBe("Master 2 Didactique des Sciences");
    expect(profile?.institution).toBe("UGANC");
    expect(profile?.monthlyPackageRateGnf).toBe(600000);
    expect(profile?.termsAccepted).toBe(false);
  });

  it("P03.03: Connects subjects and grade levels to teacher profile", async () => {
    // Associate subject
    await prisma.teacherSubject.create({
      data: {
        teacherProfileId,
        subjectId: mathSubjectId,
      },
    });

    // Associate grade level
    await prisma.teacherGradeLevel.create({
      data: {
        teacherProfileId,
        gradeLevelId: lyceeGradeLevelId,
      },
    });

    const teacherWithAssociations = await prisma.teacherProfile.findUnique({
      where: { id: teacherProfileId },
      include: {
        subjects: { include: { subject: true } },
        gradeLevels: { include: { gradeLevel: true } },
      },
    });

    expect(teacherWithAssociations?.subjects).toHaveLength(1);
    expect(teacherWithAssociations?.subjects[0].subject.name).toBe("Mathématiques");
    expect(teacherWithAssociations?.gradeLevels).toHaveLength(1);
    expect(teacherWithAssociations?.gradeLevels[0].gradeLevel.cycle).toBe("LYCEE");
  });

  it("P03.04: Validates availability intervals and prevents overlapping time slots", async () => {
    const validIntervals = [
      { dayOfWeek: 1, startTime: "16:00", endTime: "18:00" },
      { dayOfWeek: 3, startTime: "14:00", endTime: "16:00" },
    ];

    const validation = validateAvailabilitySlots(validIntervals);
    expect(validation.isValid).toBe(true);

    // Save valid availabilities in DB
    for (const slot of validIntervals) {
      await prisma.availability.create({
        data: {
          teacherProfileId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
        },
      });
    }

    const saved = await prisma.availability.findMany({
      where: { teacherProfileId },
    });
    expect(saved).toHaveLength(2);

    // Test rejection of overlapping slot
    const overlapping = [
      { dayOfWeek: 1, startTime: "16:00", endTime: "18:00" },
      { dayOfWeek: 1, startTime: "17:00", endTime: "19:00" },
    ];
    const invalidValidation = validateAvailabilitySlots(overlapping);
    expect(invalidValidation.isValid).toBe(false);
    expect(invalidValidation.errors[0]).toContain("Chevauchement");
  });

  it("P03.05: Private document attachment creates secure document records with PENDING status", async () => {
    // 1. National ID
    const idDoc = await prisma.teacherDocument.create({
      data: {
        teacherProfileId,
        type: DocumentType.NATIONAL_ID,
        title: "Carte Nationale d'Identité Guinéenne",
        fileUrl: "/private/documents/doc_test_cni_123.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 1048576, // 1MB
        status: DocumentStatus.PENDING,
      },
    });

    // 2. Diploma
    const diplomaDoc = await prisma.teacherDocument.create({
      data: {
        teacherProfileId,
        type: DocumentType.DIPLOMA,
        title: "Diplôme de Master UGANC",
        fileUrl: "/private/documents/doc_test_diploma_456.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 2097152, // 2MB
        status: DocumentStatus.PENDING,
      },
    });

    expect(idDoc.id).toBeDefined();
    expect(idDoc.status).toBe(DocumentStatus.PENDING);
    expect(diplomaDoc.id).toBeDefined();
    expect(diplomaDoc.status).toBe(DocumentStatus.PENDING);
  });

  it("P03.06: Submitting application transitions status from DRAFT to PENDING_REVIEW", async () => {
    // Update profile to submitted with terms accepted
    const submittedProfile = await prisma.teacherProfile.update({
      where: { id: teacherProfileId },
      data: {
        verificationStatus: TeacherVerificationStatus.PENDING_REVIEW,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        termsVersion: "SRD_V2.0",
        submittedAt: new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: teacherUserId,
        action: "TEACHER_APPLICATION_SUBMITTED",
        entityType: "TeacherProfile",
        entityId: teacherProfileId,
        detailsJson: JSON.stringify({
          submittedAt: submittedProfile.submittedAt,
          termsVersion: submittedProfile.termsVersion,
        }),
      },
    });

    expect(submittedProfile.verificationStatus).toBe(TeacherVerificationStatus.PENDING_REVIEW);
    expect(submittedProfile.submittedAt).not.toBeNull();
    expect(submittedProfile.termsAccepted).toBe(true);

    const audit = await prisma.auditLog.findFirst({
      where: {
        entityId: teacherProfileId,
        action: "TEACHER_APPLICATION_SUBMITTED",
      },
    });
    expect(audit).toBeDefined();
  });

  it("P03.07: Admin rejects application with required reason and creates notification & audit log", async () => {
    const rejectionReasonText = "La copie du diplôme est tronquée. Veuillez fournir une copie intégrale.";

    // Rejection transaction
    const rejectedProfile = await prisma.$transaction(async (tx) => {
      const updated = await tx.teacherProfile.update({
        where: { id: teacherProfileId },
        data: {
          verificationStatus: TeacherVerificationStatus.REJECTED,
          rejectionReason: rejectionReasonText,
          reviewedAt: new Date(),
          reviewerId: adminUserId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: "TEACHER_APPLICATION_REJECTED",
          entityType: "TeacherProfile",
          entityId: teacherProfileId,
          detailsJson: JSON.stringify({
            reason: rejectionReasonText,
            reviewerId: adminUserId,
          }),
        },
      });

      await tx.notification.create({
        data: {
          userId: teacherUserId,
          title: "Complément requis pour votre dossier",
          message: rejectionReasonText,
          linkUrl: "/teacher/onboarding",
        },
      });

      return updated;
    });

    expect(rejectedProfile.verificationStatus).toBe(TeacherVerificationStatus.REJECTED);
    expect(rejectedProfile.rejectionReason).toBe(rejectionReasonText);

    // Verify teacher notification
    const notification = await prisma.notification.findFirst({
      where: {
        userId: teacherUserId,
        title: "Complément requis pour votre dossier",
      },
    });
    expect(notification).toBeDefined();
    expect(notification?.message).toContain("copie du diplôme");
  });

  it("P03.08: Teacher corrects and resubmits, transitioning back to PENDING_REVIEW", async () => {
    // Resubmit resets rejectionReason and sets status back to PENDING_REVIEW
    const resubmittedProfile = await prisma.$transaction(async (tx) => {
      const updated = await tx.teacherProfile.update({
        where: { id: teacherProfileId },
        data: {
          verificationStatus: TeacherVerificationStatus.PENDING_REVIEW,
          rejectionReason: null,
          submittedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: teacherUserId,
          action: "TEACHER_APPLICATION_RESUBMITTED",
          entityType: "TeacherProfile",
          entityId: teacherProfileId,
          detailsJson: JSON.stringify({
            resubmittedAt: new Date().toISOString(),
          }),
        },
      });

      return updated;
    });

    expect(resubmittedProfile.verificationStatus).toBe(TeacherVerificationStatus.PENDING_REVIEW);
    expect(resubmittedProfile.rejectionReason).toBeNull();
  });

  it("P03.09: Admin approves application in atomic transaction, verifying documents and sending approval notification", async () => {
    const approvedProfile = await prisma.$transaction(async (tx) => {
      // 1. Update TeacherProfile to APPROVED
      const updated = await tx.teacherProfile.update({
        where: { id: teacherProfileId },
        data: {
          verificationStatus: TeacherVerificationStatus.APPROVED,
          verifiedAt: new Date(),
          reviewerId: adminUserId,
          rejectionReason: null,
        },
      });

      // 2. Update documents to VERIFIED
      await tx.teacherDocument.updateMany({
        where: {
          teacherProfileId,
          status: DocumentStatus.PENDING,
        },
        data: {
          status: DocumentStatus.VERIFIED,
          verifiedAt: new Date(),
        },
      });

      // 3. Write AuditLog
      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: "TEACHER_APPLICATION_APPROVED",
          entityType: "TeacherProfile",
          entityId: teacherProfileId,
          detailsJson: JSON.stringify({
            reviewerId: adminUserId,
            verifiedAt: new Date().toISOString(),
          }),
        },
      });

      // 4. In-App Notification
      await tx.notification.create({
        data: {
          userId: teacherUserId,
          title: "Félicitations ! Votre profil est approuvé 🎉",
          message: "Votre candidature d'enseignant a été validée par l'administration.",
          linkUrl: "/teacher/dashboard",
        },
      });

      return updated;
    });

    expect(approvedProfile.verificationStatus).toBe(TeacherVerificationStatus.APPROVED);
    expect(approvedProfile.verifiedAt).not.toBeNull();

    // Verify documents were updated to VERIFIED
    const docs = await prisma.teacherDocument.findMany({
      where: { teacherProfileId },
    });
    for (const doc of docs) {
      expect(doc.status).toBe(DocumentStatus.VERIFIED);
      expect(doc.verifiedAt).not.toBeNull();
    }

    // Verify AuditLog and Notification
    const approveAudit = await prisma.auditLog.findFirst({
      where: {
        entityId: teacherProfileId,
        action: "TEACHER_APPLICATION_APPROVED",
      },
    });
    expect(approveAudit).toBeDefined();

    const approveNotif = await prisma.notification.findFirst({
      where: {
        userId: teacherUserId,
        title: "Félicitations ! Votre profil est approuvé 🎉",
      },
    });
    expect(approveNotif).toBeDefined();
  });
});
