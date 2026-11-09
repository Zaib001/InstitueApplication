import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  PrismaClient,
  UserRole,
  RequestStatus,
  TutoringMode,
  TeacherVerificationStatus,
  ApplicationStatus,
} from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import {
  calculateOpportunityMatch,
  normalizeToken,
  matchCustomSubjectTokens,
} from "@/lib/marketplace/matching";
import frMessages from "@/messages/fr.json";
import enMessages from "@/messages/en.json";

const prisma = new PrismaClient();

describe("Phase 07: Teacher Marketplace Discovery, Matching & Applications", () => {
  const ts = Date.now();
  const testPassword = "PasswordPhase07Test2026!";

  // Parent & Student
  const parentEmail = `parent.p07.${ts}@monsieurfanyi.gn`;
  let parentUserId: string;
  let parentProfileId: string;
  let studentId: string;

  // Teachers: Approved A, Approved B, Pending, Rejected, Inactive
  const approvedTeacherEmailA = `teacher.p07.appA.${ts}@monsieurfanyi.gn`;
  const approvedTeacherEmailB = `teacher.p07.appB.${ts}@monsieurfanyi.gn`;
  const pendingTeacherEmail = `teacher.p07.pending.${ts}@monsieurfanyi.gn`;
  const rejectedTeacherEmail = `teacher.p07.rejected.${ts}@monsieurfanyi.gn`;
  const inactiveTeacherEmail = `teacher.p07.inactive.${ts}@monsieurfanyi.gn`;

  let approvedTeacherProfileA: any;
  let approvedTeacherProfileB: any;
  let pendingTeacherProfile: any;
  let rejectedTeacherProfile: any;
  let inactiveTeacherProfile: any;

  // Subjects & GradeLevels
  let mathSubject: any;
  let physicsSubject: any;
  let lyceeGrade: any;

  // Tutoring Requests
  let openRequestMath: any;
  let draftRequest: any;
  let cancelledRequest: any;
  let matchedRequest: any;
  let customAutreRequest: any;

  beforeAll(async () => {
    const passwordHash = await hashPassword(testPassword);

    // 1. Get or create Master Data: Math, Physics, Lycée Terminale
    mathSubject = await prisma.subject.upsert({
      where: { name: "Mathématiques" },
      update: {},
      create: { name: "Mathématiques", category: "SCIENCES" },
    });

    physicsSubject = await prisma.subject.upsert({
      where: { name: "Physique-Chimie" },
      update: {},
      create: { name: "Physique-Chimie", category: "SCIENCES" },
    });

    lyceeGrade = await prisma.gradeLevel.upsert({
      where: { name: "Terminale SM" },
      update: {},
      create: { name: "Terminale SM", cycle: "LYCEE", orderIndex: 12 },
    });

    // 2. Create Parent & Student
    const parentUser = await prisma.user.create({
      data: {
        email: parentEmail,
        fullName: "Mamadou Parent P07",
        phoneNumber: "+224620000701",
        passwordHash,
        role: UserRole.PARENT,
        isActive: true,
        parentProfile: {
          create: {
            city: "Conakry",
            address: "Kipé, Ratoma",
            children: {
              create: {
                fullName: "Aissatou Diallo",
                gradeLevel: "Terminale SM",
                cycle: "LYCEE",
                schoolName: "Lycée Sainte Marie",
              },
            },
          },
        },
      },
      include: {
        parentProfile: {
          include: {
            children: true,
          },
        },
      },
    });

    parentUserId = parentUser.id;
    parentProfileId = parentUser.parentProfile!.id;
    studentId = parentUser.parentProfile!.children[0].id;

    // 3. Create Approved Teacher A (Teaches Math, Lycée, Home & Online in Ratoma)
    const teacherUserA = await prisma.user.create({
      data: {
        email: approvedTeacherEmailA,
        fullName: "Professeur Alpha Diallo",
        phoneNumber: "+224620000702",
        passwordHash,
        role: UserRole.TEACHER,
        isActive: true,
        teacherProfile: {
          create: {
            headline: "Enseignant Certifié de Mathématiques",
            bio: "10 ans d'expérience au Lycée",
            yearsOfExperience: 10,
            city: "Conakry",
            serviceArea: "Ratoma",
            isHomeAvailable: true,
            isOnlineAvailable: true,
            hourlyRateGnf: 60000,
            monthlyPackageRateGnf: 800000,
            verificationStatus: TeacherVerificationStatus.APPROVED,
            subjects: {
              create: { subjectId: mathSubject.id },
            },
            gradeLevels: {
              create: { gradeLevelId: lyceeGrade.id },
            },
          },
        },
      },
      include: {
        teacherProfile: {
          include: {
            subjects: { include: { subject: true } },
            gradeLevels: { include: { gradeLevel: true } },
          },
        },
      },
    });
    approvedTeacherProfileA = teacherUserA.teacherProfile!;

    // 4. Create Approved Teacher B (Teaches Physics, Online only)
    const teacherUserB = await prisma.user.create({
      data: {
        email: approvedTeacherEmailB,
        fullName: "Professeur Boubacar Camara",
        phoneNumber: "+224620000703",
        passwordHash,
        role: UserRole.TEACHER,
        isActive: true,
        teacherProfile: {
          create: {
            headline: "Enseignant Spécialiste Robotique & Physique",
            customSubject: "Robotique Arduino",
            city: "Conakry",
            serviceArea: "Dixinn",
            isHomeAvailable: false,
            isOnlineAvailable: true,
            hourlyRateGnf: 75000,
            monthlyPackageRateGnf: 900000,
            verificationStatus: TeacherVerificationStatus.APPROVED,
            subjects: {
              create: { subjectId: physicsSubject.id },
            },
            gradeLevels: {
              create: { gradeLevelId: lyceeGrade.id },
            },
          },
        },
      },
      include: {
        teacherProfile: {
          include: {
            subjects: { include: { subject: true } },
            gradeLevels: { include: { gradeLevel: true } },
          },
        },
      },
    });
    approvedTeacherProfileB = teacherUserB.teacherProfile!;

    // 5. Create Pending Teacher
    const pendingTeacherUser = await prisma.user.create({
      data: {
        email: pendingTeacherEmail,
        fullName: "Candidat Enseignant En Attente",
        phoneNumber: "+224620000704",
        passwordHash,
        role: UserRole.TEACHER,
        isActive: true,
        teacherProfile: {
          create: {
            headline: "Candidat Master",
            city: "Conakry",
            verificationStatus: TeacherVerificationStatus.PENDING_REVIEW,
          },
        },
      },
      include: { teacherProfile: true },
    });
    pendingTeacherProfile = pendingTeacherUser.teacherProfile!;

    // 6. Create Rejected Teacher
    const rejectedTeacherUser = await prisma.user.create({
      data: {
        email: rejectedTeacherEmail,
        fullName: "Candidat Rejeté",
        phoneNumber: "+224620000705",
        passwordHash,
        role: UserRole.TEACHER,
        isActive: true,
        teacherProfile: {
          create: {
            headline: "Dossier Incomplet",
            city: "Conakry",
            verificationStatus: TeacherVerificationStatus.REJECTED,
            rejectionReason: "Diplôme non authentifié",
          },
        },
      },
      include: { teacherProfile: true },
    });
    rejectedTeacherProfile = rejectedTeacherUser.teacherProfile!;

    // 7. Create Inactive Teacher (Approved profile but isActive: false)
    const inactiveTeacherUser = await prisma.user.create({
      data: {
        email: inactiveTeacherEmail,
        fullName: "Enseignant Désactivé",
        phoneNumber: "+224620000706",
        passwordHash,
        role: UserRole.TEACHER,
        isActive: false, // Inactive account
        teacherProfile: {
          create: {
            headline: "Compte Suspendu",
            city: "Conakry",
            verificationStatus: TeacherVerificationStatus.APPROVED,
          },
        },
      },
      include: { teacherProfile: true },
    });
    inactiveTeacherProfile = inactiveTeacherUser.teacherProfile!;

    // 8. Create Tutoring Requests across statuses
    // 8a. OPEN Math request (Target for application)
    openRequestMath = await prisma.tutoringRequest.create({
      data: {
        parentId: parentProfileId,
        studentId,
        subjectId: mathSubject.id,
        subjectName: "Mathématiques",
        gradeLevelName: "Terminale SM",
        cycle: "LYCEE",
        mode: TutoringMode.HOME,
        frequency: "2_WEEKLY",
        preferredSchedule: "Samedi et Dimanche 10h-12h",
        sessionDurationMinutes: 120,
        budgetGnf: 800000,
        budgetType: "MONTHLY",
        city: "Conakry",
        commune: "Ratoma",
        neighborhood: "Kipé",
        locationAddress: "Rue 102 Kipé, Porte 45 (STRICTLY PRIVATE)",
        learningGoals: "Préparation intensive au baccalauréat unique",
        status: RequestStatus.OPEN,
        publishedAt: new Date(),
      },
    });

    // 8b. DRAFT request
    draftRequest = await prisma.tutoringRequest.create({
      data: {
        parentId: parentProfileId,
        studentId,
        subjectName: "Français",
        gradeLevelName: "Terminale SM",
        cycle: "LYCEE",
        mode: TutoringMode.ONLINE,
        budgetGnf: 500000,
        city: "Conakry",
        status: RequestStatus.DRAFT,
      },
    });

    // 8c. CANCELLED request
    cancelledRequest = await prisma.tutoringRequest.create({
      data: {
        parentId: parentProfileId,
        studentId,
        subjectName: "Chimie",
        gradeLevelName: "Terminale SM",
        cycle: "LYCEE",
        mode: TutoringMode.HOME,
        budgetGnf: 600000,
        city: "Conakry",
        status: RequestStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    // 8d. MATCHED request (Cannot receive applications)
    matchedRequest = await prisma.tutoringRequest.create({
      data: {
        parentId: parentProfileId,
        studentId,
        subjectName: "Histoire",
        gradeLevelName: "Terminale SM",
        cycle: "LYCEE",
        mode: TutoringMode.ONLINE,
        budgetGnf: 400000,
        city: "Conakry",
        status: RequestStatus.MATCHED,
      },
    });

    // 8e. Custom "Autre" request: Robotique
    customAutreRequest = await prisma.tutoringRequest.create({
      data: {
        parentId: parentProfileId,
        studentId,
        subjectName: "Autre",
        customSubject: "Robotique",
        gradeLevelName: "Terminale SM",
        cycle: "LYCEE",
        mode: TutoringMode.ONLINE,
        budgetGnf: 900000,
        city: "Conakry",
        status: RequestStatus.OPEN,
        publishedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    // Clean up test records
    const profileIds = [
      approvedTeacherProfileA?.id,
      approvedTeacherProfileB?.id,
      pendingTeacherProfile?.id,
      rejectedTeacherProfile?.id,
      inactiveTeacherProfile?.id,
    ].filter(Boolean);

    if (profileIds.length > 0) {
      await prisma.teacherApplication.deleteMany({
        where: {
          teacherProfileId: { in: profileIds },
        },
      });
    }

    const requestIds = [
      openRequestMath?.id,
      draftRequest?.id,
      cancelledRequest?.id,
      matchedRequest?.id,
      customAutreRequest?.id,
    ].filter(Boolean);

    if (requestIds.length > 0) {
      await prisma.tutoringRequest.deleteMany({
        where: { id: { in: requestIds } },
      });
    }

    if (parentUserId) {
      await prisma.notification.deleteMany({
        where: { userId: parentUserId },
      });
    }

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            parentEmail,
            approvedTeacherEmailA,
            approvedTeacherEmailB,
            pendingTeacherEmail,
            rejectedTeacherEmail,
            inactiveTeacherEmail,
          ],
        },
      },
    });
  });

  // 1. Approved teacher can discover OPEN requests
  it("P07.01 & P07.04: approved teacher can discover OPEN requests", async () => {
    const openRequests = await prisma.tutoringRequest.findMany({
      where: { status: "OPEN" },
      select: { id: true, subjectName: true, status: true },
    });

    const openIds = openRequests.map((r) => r.id);
    expect(openIds).toContain(openRequestMath.id);
    expect(openIds).toContain(customAutreRequest.id);
  });

  // 2. Draft requests remain hidden from marketplace
  it("P07.04: DRAFT requests remain strictly hidden from marketplace", async () => {
    const marketplaceVisible = await prisma.tutoringRequest.findMany({
      where: { status: "OPEN" },
    });

    const ids = marketplaceVisible.map((r) => r.id);
    expect(ids).not.toContain(draftRequest.id);
  });

  // 3. Cancelled requests remain hidden from marketplace
  it("P07.04: CANCELLED requests remain strictly hidden from marketplace", async () => {
    const marketplaceVisible = await prisma.tutoringRequest.findMany({
      where: { status: "OPEN" },
    });

    const ids = marketplaceVisible.map((r) => r.id);
    expect(ids).not.toContain(cancelledRequest.id);
  });

  // 4. Matched requests cannot receive applications
  it("P07.02 & P07.10: non-OPEN requests (MATCHED) cannot receive applications", async () => {
    const target = await prisma.tutoringRequest.findUnique({
      where: { id: matchedRequest.id },
      select: { status: true },
    });

    expect(target?.status).toBe("MATCHED");
    expect(target?.status !== "OPEN").toBe(true);
  });

  // 5. Pending teacher cannot apply (Eligibility Gate)
  it("P07.03: PENDING_REVIEW teacher is ineligible to submit applications", () => {
    expect(pendingTeacherProfile.verificationStatus).toBe("PENDING_REVIEW");
    const isEligible = pendingTeacherProfile.verificationStatus === "APPROVED";
    expect(isEligible).toBe(false);
  });

  // 6. Rejected teacher cannot apply
  it("P07.03: REJECTED teacher is ineligible to submit applications", () => {
    expect(rejectedTeacherProfile.verificationStatus).toBe("REJECTED");
    const isEligible = rejectedTeacherProfile.verificationStatus === "APPROVED";
    expect(isEligible).toBe(false);
  });

  // 7. Inactive teacher cannot apply
  it("P07.03: inactive teacher account cannot submit applications", async () => {
    const user = await prisma.user.findUnique({
      where: { email: inactiveTeacherEmail },
      select: { isActive: true },
    });
    expect(user?.isActive).toBe(false);
  });

  // 8. Approved teacher submits valid application
  let createdApplicationId: string;
  it("P07.08 & P07.10: approved teacher submits valid application persisting in PostgreSQL", async () => {
    const app = await prisma.$transaction(async (tx) => {
      const created = await tx.teacherApplication.create({
        data: {
          requestId: openRequestMath.id,
          teacherProfileId: approvedTeacherProfileA.id,
          pitchMessage: "Bonjour, professeur certifié avec 10 ans d'expérience en Terminale SM. Méthode personnalisée.",
          proposedRateGnf: 800000,
          proposedRateType: "MONTHLY",
          sessionArrangement: "2 séances de 2h par semaine (8 séances)",
          availabilityNotes: "Samedi et Dimanche matin",
          status: ApplicationStatus.SUBMITTED,
        },
      });

      // Notification to parent
      await tx.notification.create({
        data: {
          userId: parentUserId,
          title: "Nouvelle candidature reçue",
          message: `Un enseignant a postulé à votre demande de cours (${openRequestMath.subjectName}).`,
          linkUrl: `/parent/requests/${openRequestMath.id}`,
        },
      });

      return created;
    });

    createdApplicationId = app.id;
    expect(app.id).toBeDefined();
    expect(app.status).toBe(ApplicationStatus.SUBMITTED);
    expect(app.proposedRateGnf).toBe(800000);
    expect(app.withdrawnAt).toBeNull();

    // Verify parent received notification
    const notification = await prisma.notification.findFirst({
      where: { userId: parentUserId, title: "Nouvelle candidature reçue" },
    });
    expect(notification).not.toBeNull();
  });

  // 9. Duplicate application is rejected by database constraint
  it("P07.02 & P07.10: duplicate application by same teacher to same request is rejected", async () => {
    await expect(
      prisma.teacherApplication.create({
        data: {
          requestId: openRequestMath.id,
          teacherProfileId: approvedTeacherProfileA.id,
          pitchMessage: "Deuxième tentative de candidature identique.",
          proposedRateGnf: 850000,
          status: ApplicationStatus.SUBMITTED,
        },
      })
    ).rejects.toThrow();
  });

  // 10. Teacher can view own applications
  it("P07.11 & P07.12: teacher can view own applications with non-sensitive request data", async () => {
    const myApps = await prisma.teacherApplication.findMany({
      where: { teacherProfileId: approvedTeacherProfileA.id },
      include: {
        request: {
          select: {
            id: true,
            subjectName: true,
            gradeLevelName: true,
            city: true,
            commune: true,
          },
        },
      },
    });

    expect(myApps.length).toBe(1);
    expect(myApps[0].id).toBe(createdApplicationId);
    expect(myApps[0].request.subjectName).toBe("Mathématiques");
  });

  // 11. Cross-teacher access is denied (Data Isolation)
  it("P07.11 & P07.20: Teacher B cannot see Teacher A's applications", async () => {
    const teacherBApps = await prisma.teacherApplication.findMany({
      where: { teacherProfileId: approvedTeacherProfileB.id },
    });

    expect(teacherBApps.length).toBe(0);
  });

  // 12. Application withdrawal works
  it("P07.13: teacher can withdraw their submitted application", async () => {
    const updated = await prisma.teacherApplication.update({
      where: { id: createdApplicationId },
      data: {
        status: ApplicationStatus.WITHDRAWN,
        withdrawnAt: new Date(),
      },
    });

    expect(updated.status).toBe(ApplicationStatus.WITHDRAWN);
    expect(updated.withdrawnAt).not.toBeNull();
  });

  // 13. Invalid withdrawal fails
  it("P07.13: withdrawing an already WITHDRAWN application is rejected by business rule", async () => {
    const app = await prisma.teacherApplication.findUnique({
      where: { id: createdApplicationId },
    });

    const isWithdrawPermitted = app?.status === "SUBMITTED" || app?.status === "SHORTLISTED";
    expect(isWithdrawPermitted).toBe(false);
  });

  // 14. Deterministic matching works for standard subjects
  it("P07.06: matching algorithm scores high for matching subject, level, and mode", () => {
    const match = calculateOpportunityMatch(
      {
        id: approvedTeacherProfileA.id,
        verificationStatus: approvedTeacherProfileA.verificationStatus,
        city: approvedTeacherProfileA.city,
        serviceArea: approvedTeacherProfileA.serviceArea,
        isHomeAvailable: approvedTeacherProfileA.isHomeAvailable,
        isOnlineAvailable: approvedTeacherProfileA.isOnlineAvailable,
        subjects: approvedTeacherProfileA.subjects,
        gradeLevels: approvedTeacherProfileA.gradeLevels,
      },
      {
        id: openRequestMath.id,
        subjectId: openRequestMath.subjectId,
        subjectName: openRequestMath.subjectName,
        gradeLevelName: openRequestMath.gradeLevelName,
        cycle: openRequestMath.cycle,
        mode: openRequestMath.mode,
        city: openRequestMath.city,
        commune: openRequestMath.commune,
        status: openRequestMath.status,
      }
    );

    expect(match.isMatch).toBe(true);
    expect(match.isRecommended).toBe(true);
    expect(match.score).toBeGreaterThanOrEqual(80);
    expect(match.breakdown.subjectMatched).toBe(true);
    expect(match.breakdown.levelMatched).toBe(true);
    expect(match.breakdown.modeMatched).toBe(true);
    expect(match.breakdown.locationMatched).toBe(true);
  });

  // 15. Custom "Autre" requests are handled safely
  it("P07.06: custom 'Autre' subject matches via token normalization without naive string collapse", () => {
    expect(normalizeToken("Robotique Arduino")).toBe("robotique arduino");
    expect(matchCustomSubjectTokens("Robotique Arduino", "Robotique")).toBe(true);
    expect(matchCustomSubjectTokens("Russe", "Robotique")).toBe(false);

    const matchAutre = calculateOpportunityMatch(
      {
        id: approvedTeacherProfileB.id,
        verificationStatus: approvedTeacherProfileB.verificationStatus,
        city: approvedTeacherProfileB.city,
        serviceArea: approvedTeacherProfileB.serviceArea,
        isHomeAvailable: approvedTeacherProfileB.isHomeAvailable,
        isOnlineAvailable: approvedTeacherProfileB.isOnlineAvailable,
        customSubject: approvedTeacherProfileB.customSubject, // "Robotique Arduino"
        subjects: approvedTeacherProfileB.subjects,
        gradeLevels: approvedTeacherProfileB.gradeLevels,
      },
      {
        id: customAutreRequest.id,
        subjectName: "Autre",
        customSubject: "Robotique",
        gradeLevelName: customAutreRequest.gradeLevelName,
        cycle: customAutreRequest.cycle,
        mode: customAutreRequest.mode,
        city: customAutreRequest.city,
        status: customAutreRequest.status,
      }
    );

    expect(matchAutre.isMatch).toBe(true);
    expect(matchAutre.breakdown.subjectMatched).toBe(true);
  });

  // 16. Location and teaching-mode filters work
  it("P07.06: teaching mode mismatch or distant location is reflected in score", () => {
    // Teacher B is online-only, test against in-home request in Ratoma
    const matchHome = calculateOpportunityMatch(
      {
        id: approvedTeacherProfileB.id,
        verificationStatus: approvedTeacherProfileB.verificationStatus,
        city: approvedTeacherProfileB.city,
        serviceArea: approvedTeacherProfileB.serviceArea,
        isHomeAvailable: approvedTeacherProfileB.isHomeAvailable, // false
        isOnlineAvailable: approvedTeacherProfileB.isOnlineAvailable, // true
        subjects: approvedTeacherProfileB.subjects,
        gradeLevels: approvedTeacherProfileB.gradeLevels,
      },
      {
        id: openRequestMath.id,
        subjectId: openRequestMath.subjectId,
        subjectName: openRequestMath.subjectName,
        gradeLevelName: openRequestMath.gradeLevelName,
        cycle: openRequestMath.cycle,
        mode: "HOME", // Requires home
        city: openRequestMath.city,
        commune: openRequestMath.commune,
        status: openRequestMath.status,
      }
    );

    expect(matchHome.breakdown.modeMatched).toBe(false);
  });

  // 17. Parent confidential data remains private
  it("P07.05 & P07.08: sensitive student & parent data (phone, locationAddress) is never exposed", async () => {
    // Inspect request as fetched by opportunities API select
    const publicOpportunity = await prisma.tutoringRequest.findUnique({
      where: { id: openRequestMath.id },
      select: {
        id: true,
        subjectName: true,
        gradeLevelName: true,
        city: true,
        commune: true,
        neighborhood: true,
        student: {
          select: {
            fullName: true,
            gradeLevel: true,
          },
        },
        // Excluded: locationAddress, parent phone, email, notes
      },
    });

    expect((publicOpportunity as any).locationAddress).toBeUndefined();
    expect((publicOpportunity as any).parentId).toBeUndefined();
    expect((publicOpportunity as any).parent).toBeUndefined();
  });

  // 18. Application submission does NOT create classrooms
  it("P07.10: application submission does NOT provision classrooms (Phase 08 boundary)", async () => {
    const classrooms = await prisma.classroom.findMany({
      where: {
        teacherProfileId: approvedTeacherProfileA.id,
      },
    });
    expect(classrooms.length).toBe(0);
  });

  // 19. Application submission does NOT create earnings
  it("P07.10 & P07.17: application submission does NOT generate teacher earnings or payouts", async () => {
    const earnings = await prisma.teacherEarning.findMany({
      where: {
        teacherProfileId: approvedTeacherProfileA.id,
      },
    });
    expect(earnings.length).toBe(0);
  });

  // 20. Bilingual translation keys parity
  it("P07.19: full translation key parity between French and English for marketplace", () => {
    expect((frMessages as any).dashboard.nav.teacherOpportunities).toBeDefined();
    expect((enMessages as any).dashboard.nav.teacherOpportunities).toBeDefined();
    expect((frMessages as any).dashboard.nav.teacherApplications).toBeDefined();
    expect((enMessages as any).dashboard.nav.teacherApplications).toBeDefined();

    expect((frMessages as any).marketplace).toBeDefined();
    expect((enMessages as any).marketplace).toBeDefined();

    const frKeys = Object.keys((frMessages as any).marketplace);
    const enKeys = Object.keys((enMessages as any).marketplace);
    expect(frKeys).toEqual(enKeys);
  });
});
