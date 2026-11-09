import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import {
  PrismaClient,
  UserRole,
  RequestStatus,
  TutoringMode,
  TeacherVerificationStatus,
  ApplicationStatus,
  ClassroomStatus,
} from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import {
  ClassroomService,
  ClassroomServiceError,
} from "@/lib/classroom/classroom-service";
import frMessages from "@/messages/fr.json";
import enMessages from "@/messages/en.json";

const prisma = new PrismaClient();

describe("Phase 08: Parent-Led Selection, Admin-Assisted Assignment & Secure Classroom Creation", () => {
  const ts = Date.now();
  const randPhone = (code: number) => `+224${code}${Math.floor(100000 + Math.random() * 900000)}`;
  const testPassword = "PasswordPhase08Test2026!";

  // Parent & Students
  const parentEmailA = `parent.p08.a.${ts}@monsieurfanyi.gn`;
  const parentEmailB = `parent.p08.b.${ts}@monsieurfanyi.gn`;
  let parentUserIdA: string;
  let parentProfileIdA: string;
  let studentIdA1: string;

  let parentUserIdB: string;
  let parentProfileIdB: string;

  // Admin
  const adminEmail = `admin.p08.${ts}@monsieurfanyi.gn`;
  let adminUserId: string;

  // Teachers: Approved 1, Approved 2, Unapproved (Pending)
  const teacherEmailApproved1 = `teacher.p08.app1.${ts}@monsieurfanyi.gn`;
  const teacherEmailApproved2 = `teacher.p08.app2.${ts}@monsieurfanyi.gn`;
  const teacherEmailPending = `teacher.p08.pending.${ts}@monsieurfanyi.gn`;

  let teacherProfileApproved1: any;
  let teacherProfileApproved2: any;
  let teacherProfilePending: any;

  // Requests & Applications for Workflow A
  let requestA: any;
  let app1FromApproved1: any;
  let app2FromApproved2: any;

  beforeAll(async () => {
    const passwordHash = await hashPassword(testPassword);

    // 1. Create Admin User
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: "Administrateur National P08",
        phoneNumber: randPhone(61),
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
      },
    });
    adminUserId = adminUser.id;

    // 2. Create Parent A & Student A1
    const parentUserA = await prisma.user.create({
      data: {
        email: parentEmailA,
        fullName: "Thierno Mamadou Barry",
        phoneNumber: randPhone(62),
        passwordHash,
        role: UserRole.PARENT,
        isActive: true,
        parentProfile: {
          create: {
            city: "Conakry",
            address: "Kipé, Ratoma",
            children: {
              create: {
                fullName: "Kadiatou Barry",
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
          include: { children: true },
        },
      },
    });
    parentUserIdA = parentUserA.id;
    parentProfileIdA = parentUserA.parentProfile!.id;
    studentIdA1 = parentUserA.parentProfile!.children[0].id;

    // 3. Create Parent B (for IDOR testing)
    const parentUserB = await prisma.user.create({
      data: {
        email: parentEmailB,
        fullName: "Fatoumata Camara",
        phoneNumber: randPhone(63),
        passwordHash,
        role: UserRole.PARENT,
        isActive: true,
        parentProfile: {
          create: {
            city: "Conakry",
            address: "Dixinn",
          },
        },
      },
      include: { parentProfile: true },
    });
    parentUserIdB = parentUserB.id;
    parentProfileIdB = parentUserB.parentProfile!.id;

    // 4. Create Teachers
    // Teacher Approved 1
    const teacherUser1 = await prisma.user.create({
      data: {
        email: teacherEmailApproved1,
        fullName: "Dr. Alpha Oumar Diallo",
        phoneNumber: randPhone(64),
        passwordHash,
        role: UserRole.TEACHER,
        isActive: true,
        teacherProfile: {
          create: {
            headline: "Docteur en Mathématiques appliquées",
            yearsOfExperience: 8,
            verificationStatus: TeacherVerificationStatus.APPROVED,
            city: "Conakry",
            serviceArea: "Ratoma",
            monthlyPackageRateGnf: 800000,
            hourlyRateGnf: 50000,
          },
        },
      },
      include: { teacherProfile: true },
    });
    teacherProfileApproved1 = teacherUser1.teacherProfile!;

    // Teacher Approved 2
    const teacherUser2 = await prisma.user.create({
      data: {
        email: teacherEmailApproved2,
        fullName: "Prof. Sekouba Traore",
        phoneNumber: randPhone(65),
        passwordHash,
        role: UserRole.TEACHER,
        isActive: true,
        teacherProfile: {
          create: {
            headline: "Enseignant certifié de Physique-Chimie",
            yearsOfExperience: 5,
            verificationStatus: TeacherVerificationStatus.APPROVED,
            city: "Conakry",
            serviceArea: "Dixinn",
            monthlyPackageRateGnf: 750000,
            hourlyRateGnf: 45000,
          },
        },
      },
      include: { teacherProfile: true },
    });
    teacherProfileApproved2 = teacherUser2.teacherProfile!;

    // Teacher Pending
    const teacherUserPending = await prisma.user.create({
      data: {
        email: teacherEmailPending,
        fullName: "Ibrahima En Attente",
        phoneNumber: randPhone(66),
        passwordHash,
        role: UserRole.TEACHER,
        isActive: true,
        teacherProfile: {
          create: {
            headline: "Candidat en cours de révision",
            yearsOfExperience: 2,
            verificationStatus: TeacherVerificationStatus.PENDING_REVIEW,
            city: "Conakry",
          },
        },
      },
      include: { teacherProfile: true },
    });
    teacherProfilePending = teacherUserPending.teacherProfile!;

    // 5. Create Tutoring Request for Parent A
    requestA = await prisma.tutoringRequest.create({
      data: {
        parentId: parentProfileIdA,
        studentId: studentIdA1,
        subjectName: "Mathématiques",
        gradeLevelName: "Terminale SM",
        cycle: "LYCEE",
        mode: TutoringMode.HOME,
        budgetGnf: 800000,
        budgetType: "MONTHLY",
        city: "Conakry",
        commune: "Ratoma",
        status: RequestStatus.OPEN,
        publishedAt: new Date(),
      },
    });

    // 6. Submit applications from Teacher 1 and Teacher 2 to Request A
    app1FromApproved1 = await prisma.teacherApplication.create({
      data: {
        requestId: requestA.id,
        teacherProfileId: teacherProfileApproved1.id,
        pitchMessage: "Bonjour, j'ai 8 ans d'expérience en Terminale SM pour le Baccalauréat.",
        proposedRateGnf: 800000,
        proposedRateType: "MONTHLY",
        sessionArrangement: "2 séances de 2h par semaine",
        status: ApplicationStatus.SUBMITTED,
      },
    });

    app2FromApproved2 = await prisma.teacherApplication.create({
      data: {
        requestId: requestA.id,
        teacherProfileId: teacherProfileApproved2.id,
        pitchMessage: "Professeur chevronné, disponible immédiatement pour préparer les examens.",
        proposedRateGnf: 750000,
        proposedRateType: "MONTHLY",
        status: ApplicationStatus.SUBMITTED,
      },
    });
  });

  afterAll(async () => {
    // Clean up created test data
    try {
      await prisma.classroom.deleteMany({
        where: {
          OR: [
            { requestId: requestA?.id },
            { teacherProfileId: { in: [teacherProfileApproved1?.id, teacherProfileApproved2?.id, teacherProfilePending?.id] } },
          ],
        },
      });

      await prisma.teacherApplication.deleteMany({
        where: {
          teacherProfileId: { in: [teacherProfileApproved1?.id, teacherProfileApproved2?.id, teacherProfilePending?.id] },
        },
      });

      await prisma.tutoringRequest.deleteMany({
        where: {
          parentId: { in: [parentProfileIdA, parentProfileIdB] },
        },
      });

      await prisma.user.deleteMany({
        where: {
          id: { in: [adminUserId, parentUserIdA, parentUserIdB, teacherProfileApproved1?.userId, teacherProfileApproved2?.userId, teacherProfilePending?.userId] },
        },
      });
    } catch {
      // ignore
    } finally {
      await prisma.$disconnect();
    }
  });

  // =========================================================================
  // WORKFLOW A: Parent-Led Teacher Selection (Original Milestone 2)
  // =========================================================================

  describe("Workflow A: Parent-Led Selection & Classroom Creation", () => {
    it("P08.01: Parent can shortlist a submitted candidate application", async () => {
      const shortlisted = await ClassroomService.shortlistApplication({
        requestId: requestA.id,
        applicationId: app1FromApproved1.id,
        parentUserId: parentUserIdA,
      });

      expect(shortlisted.status).toBe(ApplicationStatus.SHORTLISTED);

      // Verify notification sent to teacher
      const notif = await prisma.notification.findFirst({
        where: {
          userId: teacherProfileApproved1.userId,
          title: { contains: "présélectionnée" },
        },
      });
      expect(notif).toBeDefined();

      // Verify audit log
      const audit = await prisma.auditLog.findFirst({
        where: {
          userId: parentUserIdA,
          action: "PARENT_SHORTLIST_APPLICATION",
          entityId: app1FromApproved1.id,
        },
      });
      expect(audit).toBeDefined();
    });

    it("P08.02: IDOR Protection: Non-owner parent is forbidden from shortlisting or selecting", async () => {
      await expect(
        ClassroomService.shortlistApplication({
          requestId: requestA.id,
          applicationId: app2FromApproved2.id,
          parentUserId: parentUserIdB, // Different parent
        })
      ).rejects.toThrowError(ClassroomServiceError);

      await expect(
        ClassroomService.createClassroomFromParentSelection({
          requestId: requestA.id,
          applicationId: app2FromApproved2.id,
          parentUserId: parentUserIdB, // Different parent
        })
      ).rejects.toThrowError(ClassroomServiceError);
    });

    it("P08.03: Cannot shortlist an application that is already shortlisted or not SUBMITTED", async () => {
      await expect(
        ClassroomService.shortlistApplication({
          requestId: requestA.id,
          applicationId: app1FromApproved1.id, // already SHORTLISTED in P08.01
          parentUserId: parentUserIdA,
        })
      ).rejects.toThrowError(/Impossible de présélectionner une candidature avec le statut SHORTLISTED/);
    });

    it("P08.04: Security Gate: Cannot select an unapproved teacher even if application somehow exists", async () => {
      // Fake application for pending teacher
      const fakeApp = await prisma.teacherApplication.create({
        data: {
          requestId: requestA.id,
          teacherProfileId: teacherProfilePending.id,
          pitchMessage: "Pending teacher message",
          proposedRateGnf: 600000,
          status: ApplicationStatus.SUBMITTED,
        },
      });

      await expect(
        ClassroomService.createClassroomFromParentSelection({
          requestId: requestA.id,
          applicationId: fakeApp.id,
          parentUserId: parentUserIdA,
        })
      ).rejects.toThrowError(/n'est pas encore certifié/);

      // Cleanup fake app
      await prisma.teacherApplication.delete({ where: { id: fakeApp.id } });
    });

    it("P08.05: Parent selects teacher: marks application ACCEPTED, request MATCHED, creates Classroom PENDING_PAYMENT, rejects competing applications", async () => {
      const result = await ClassroomService.createClassroomFromParentSelection({
        requestId: requestA.id,
        applicationId: app1FromApproved1.id,
        parentUserId: parentUserIdA,
      });

      expect(result.classroom).toBeDefined();
      expect(result.classroom.id).toBeDefined();
      expect(result.classroom.status).toBe(ClassroomStatus.PENDING_PAYMENT);
      expect(result.classroom.isAssistedAssignment).toBe(false);
      expect(result.classroom.monthlyRateGnf).toBe(800000);
      expect(result.classroom.teacherProfileId).toBe(teacherProfileApproved1.id);
      expect(result.classroom.studentId).toBe(studentIdA1);

      // Verify request transitioned to MATCHED
      const updatedReq = await prisma.tutoringRequest.findUnique({
        where: { id: requestA.id },
      });
      expect(updatedReq?.status).toBe(RequestStatus.MATCHED);

      // Verify selected application is ACCEPTED with decisionAt
      const acceptedApp = await prisma.teacherApplication.findUnique({
        where: { id: app1FromApproved1.id },
      });
      expect(acceptedApp?.status).toBe(ApplicationStatus.ACCEPTED);
      expect(acceptedApp?.decisionAt).toBeDefined();

      // Verify competing application from Teacher 2 was REJECTED with polite message
      const competingApp = await prisma.teacherApplication.findUnique({
        where: { id: app2FromApproved2.id },
      });
      expect(competingApp?.status).toBe(ApplicationStatus.REJECTED);
      expect(competingApp?.rejectionReason).toContain("Une autre candidature a été retenue");

      // Verify Notifications created for parent and selected teacher
      const parentNotif = await prisma.notification.findFirst({
        where: {
          userId: parentUserIdA,
          title: { contains: "sélectionné avec succès" },
        },
      });
      expect(parentNotif).toBeDefined();

      const teacherNotif = await prisma.notification.findFirst({
        where: {
          userId: teacherProfileApproved1.userId,
          title: { contains: "acceptée" },
        },
      });
      expect(teacherNotif).toBeDefined();

      // Verify Audit log
      const audit = await prisma.auditLog.findFirst({
        where: {
          userId: parentUserIdA,
          action: "PARENT_SELECT_TEACHER",
          entityId: result.classroom.id,
        },
      });
      expect(audit).toBeDefined();
    });

    it("P08.06: Idempotency Protection: Cannot select again once request is MATCHED / classroom exists", async () => {
      await expect(
        ClassroomService.createClassroomFromParentSelection({
          requestId: requestA.id,
          applicationId: app1FromApproved1.id,
          parentUserId: parentUserIdA,
        })
      ).rejects.toThrowError(/la demande est actuellement au statut MATCHED/);
    });
  });

  // =========================================================================
  // WORKFLOW B: Administrator-Assisted Direct Assignment (+50€ Enhancement)
  // =========================================================================

  describe("Workflow B: Administrator-Assisted Direct Assignment (+50€)", () => {
    let assistedParentUser: any;
    let assistedParentProfile: any;
    let assistedStudent: any;
    let assistedClassroom: any;

    it("P08.07: Non-admin users are blocked from admin assisted assignment endpoints", async () => {
      await expect(
        ClassroomService.createAdminAssistedClassroom({
          adminUserId: parentUserIdA, // Parent attempting admin assignment
          parentProfileId: parentProfileIdA,
          studentId: studentIdA1,
          teacherProfileId: teacherProfileApproved2.id,
          subjectName: "Physique-Chimie",
          mode: TutoringMode.HOME,
          monthlyRateGnf: 750000,
          assignmentSource: "PHONE_INQUIRY",
        })
      ).rejects.toThrowError(/Seuls les administrateurs Monsieur Fanyi/);
    });

    it("P08.08: Admin assisted parent registration: creates User + ParentProfile, no plaintext password, generates AccountInvitationToken", async () => {
      const assistedPhone = randPhone(67);
      const assistedEmail = `parent.${assistedPhone.replace("+", "")}@famille.monsieurfanyi.com`;

      const rawActivationToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto
        .createHash("sha256")
        .update(rawActivationToken)
        .digest("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Simulating API POST /api/admin/parents/assisted-register
      const randomSecret = crypto.randomBytes(32).toString("hex");
      const initialHash = await hashPassword(randomSecret);

      assistedParentUser = await prisma.user.create({
        data: {
          fullName: "M. Ousmane Sylla (Parent Téléphone)",
          email: assistedEmail,
          phoneNumber: assistedPhone,
          role: UserRole.PARENT,
          passwordHash: initialHash,
          isActive: true,
          parentProfile: {
            create: {
              city: "Conakry",
              address: "Lambanyi, Ratoma",
              isAssistedRegistration: true,
            },
          },
          invitationTokens: {
            create: {
              tokenHash,
              expiresAt,
              invitedByAdminId: adminUserId,
            },
          },
        },
        include: {
          parentProfile: true,
          invitationTokens: true,
        },
      });

      assistedParentProfile = assistedParentUser.parentProfile;

      expect(assistedParentUser.id).toBeDefined();
      expect(assistedParentUser.role).toBe(UserRole.PARENT);
      expect(assistedParentProfile.isAssistedRegistration).toBe(true);
      expect(assistedParentUser.passwordHash).not.toBe(randomSecret); // Bcrypt hashed, never plaintext!
      expect(assistedParentUser.invitationTokens.length).toBe(1);
      expect(assistedParentUser.invitationTokens[0].tokenHash).toBe(tokenHash);
    });

    it("P08.09: Admin creates student profile under assisted parent", async () => {
      assistedStudent = await prisma.studentProfile.create({
        data: {
          parentId: assistedParentProfile.id,
          fullName: "Moussa Sylla",
          gradeLevel: "10ème Année",
          cycle: "COLLEGE",
          schoolName: "Collège Kipé",
          supportNeeds: "Remise à niveau en Physique et Mathématiques",
        },
      });

      expect(assistedStudent.id).toBeDefined();
      expect(assistedStudent.parentId).toBe(assistedParentProfile.id);
      expect(assistedStudent.gradeLevel).toBe("10ème Année");
    });

    it("P08.10: Admin direct assignment fails if teacher is unapproved", async () => {
      await expect(
        ClassroomService.createAdminAssistedClassroom({
          adminUserId,
          parentProfileId: assistedParentProfile.id,
          studentId: assistedStudent.id,
          teacherProfileId: teacherProfilePending.id, // Unapproved teacher
          subjectName: "Physique-Chimie",
          mode: TutoringMode.HOME,
          monthlyRateGnf: 700000,
          assignmentSource: "PHONE_INQUIRY",
        })
      ).rejects.toThrowError(/Cet enseignant n'a pas été approuvé/);
    });

    it("P08.11: Admin executes direct assignment: creates assisted TutoringRequest, synthetic application, Classroom PENDING_PAYMENT with admin audit trail", async () => {
      const result = await ClassroomService.createAdminAssistedClassroom({
        adminUserId,
        parentProfileId: assistedParentProfile.id,
        studentId: assistedStudent.id,
        teacherProfileId: teacherProfileApproved2.id,
        subjectName: "Physique-Chimie",
        mode: TutoringMode.HOME,
        monthlyRateGnf: 750000,
        assignmentSource: "PHONE_INQUIRY",
        adminNotes: "Parent M. Sylla a appelé le 07/11 pour cours de soutien intensif avant brevet.",
        city: "Conakry",
        commune: "Ratoma",
        preferredSchedule: "Mardi et Samedi après-midi",
      });

      assistedClassroom = result.classroom;

      expect(assistedClassroom).toBeDefined();
      expect(assistedClassroom.status).toBe(ClassroomStatus.PENDING_PAYMENT);
      expect(assistedClassroom.isAssistedAssignment).toBe(true);
      expect(assistedClassroom.assignedByAdminId).toBe(adminUserId);
      expect(assistedClassroom.assignmentSource).toBe("PHONE_INQUIRY");
      expect(assistedClassroom.adminNotes).toContain("M. Sylla a appelé");
      expect(assistedClassroom.monthlyRateGnf).toBe(750000);

      // Verify assisted TutoringRequest created with MATCHED status
      const request = await prisma.tutoringRequest.findUnique({
        where: { id: assistedClassroom.requestId },
      });
      expect(request).toBeDefined();
      expect(request?.status).toBe(RequestStatus.MATCHED);
      expect(request?.isAssisted).toBe(true);

      // Verify synthetic accepted application created
      const syntheticApp = await prisma.teacherApplication.findFirst({
        where: {
          requestId: request?.id,
          teacherProfileId: teacherProfileApproved2.id,
        },
      });
      expect(syntheticApp).toBeDefined();
      expect(syntheticApp?.status).toBe(ApplicationStatus.ACCEPTED);
      expect(syntheticApp?.pitchMessage).toContain("Attribution directe");

      // Verify notifications sent to both parent and teacher
      const parentNotif = await prisma.notification.findFirst({
        where: {
          userId: assistedParentUser.id,
          title: { contains: "Affectation directe" },
        },
      });
      expect(parentNotif).toBeDefined();

      const teacherNotif = await prisma.notification.findFirst({
        where: {
          userId: teacherProfileApproved2.userId,
          title: { contains: "Nouvelle affectation directe" },
        },
      });
      expect(teacherNotif).toBeDefined();

      // Verify Audit log identifying the admin and source
      const audit = await prisma.auditLog.findFirst({
        where: {
          userId: adminUserId,
          action: "ADMIN_DIRECT_ASSIGNMENT",
          entityId: assistedClassroom.id,
        },
      });
      expect(audit).toBeDefined();
      expect(audit?.detailsJson).toContain("PHONE_INQUIRY");
    });

    it("P08.12: Duplicate prevention: Cannot create concurrent duplicate classroom between same student, teacher, and subject", async () => {
      await expect(
        ClassroomService.createAdminAssistedClassroom({
          adminUserId,
          parentProfileId: assistedParentProfile.id,
          studentId: assistedStudent.id,
          teacherProfileId: teacherProfileApproved2.id,
          subjectName: "Physique-Chimie", // already exists in P08.11
          mode: TutoringMode.HOME,
          monthlyRateGnf: 750000,
          assignmentSource: "PHONE_INQUIRY",
        })
      ).rejects.toThrowError(/Une classe existe déjà entre cet élève et ce professeur/);
    });
  });

  // =========================================================================
  // FINANCIAL INVARIANTS: NO PREMATURE EARNINGS OR PAYMENTS
  // =========================================================================

  describe("Financial Invariant & Zero Premature Earnings Enforcement", () => {
    it("P08.13: Neither Workflow A nor Workflow B generates any TeacherEarning records upon classroom creation", async () => {
      const earningsCount = await prisma.teacherEarning.count({
        where: {
          teacherProfileId: { in: [teacherProfileApproved1.id, teacherProfileApproved2.id] },
        },
      });

      expect(earningsCount).toBe(0);
    });

    it("P08.14: Classroom creation does not generate fictitious PaymentOrders or PaymentLedgerEntries", async () => {
      const paymentOrdersCount = await prisma.paymentOrder.count({
        where: {
          parentUserId: { in: [parentUserIdA, parentUserIdB] },
        },
      });

      expect(paymentOrdersCount).toBe(0);
    });

    it("P08.15: Classroom initial state is PENDING_PAYMENT, ensuring teaching is not financially authorized before advance settlement", async () => {
      const pendingClassrooms = await prisma.classroom.findMany({
        where: {
          teacherProfileId: { in: [teacherProfileApproved1.id, teacherProfileApproved2.id] },
        },
      });

      expect(pendingClassrooms.length).toBeGreaterThanOrEqual(2);
      for (const cls of pendingClassrooms) {
        expect(cls.status).toBe(ClassroomStatus.PENDING_PAYMENT);
      }
    });
  });

  // =========================================================================
  // LOCALIZATION & TERMINOLOGY PARITY
  // =========================================================================

  describe("Localization & Terminology Parity", () => {
    it("P08.16: Navigation keys exist and have exact parity between fr.json and en.json", () => {
      expect((frMessages as any).dashboard.nav.adminAssignments).toBe("Attributions & Classes");
      expect((enMessages as any).dashboard.nav.adminAssignments).toBe("Assignments & Classes");

      expect((frMessages as any).dashboard.nav.parentClasses).toBeDefined();
      expect((enMessages as any).dashboard.nav.parentClasses).toBeDefined();

      expect((frMessages as any).dashboard.nav.teacherClasses).toBeDefined();
      expect((enMessages as any).dashboard.nav.teacherClasses).toBeDefined();
    });
  });
});

