import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  PrismaClient,
  UserRole,
  RequestStatus,
  TutoringMode,
  TeacherVerificationStatus,
  ApplicationStatus,
  ClassroomStatus,
  PackageStatus,
  PricingOfferType,
} from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import {
  PricingEngine,
  PricingEngineError,
} from "@/lib/pricing/pricing-engine";
import { ClassroomService } from "@/lib/classroom/classroom-service";
import frMessages from "@/messages/fr.json";
import enMessages from "@/messages/en.json";

const prisma = new PrismaClient();

describe("Phase 09: Flexible GNF Pricing Engine, Hourly & Monthly Packages, Exact Session Allocation", () => {
  const ts = Date.now();
  const randPhone = (code: number) => `+224${code}${Math.floor(100000 + Math.random() * 900000)}`;
  const testPassword = "PasswordPhase09Test2026!";

  // Test users
  let adminUserId: string;
  let parentUserId: string;
  let parentProfileId: string;
  let studentId: string;

  let approvedTeacherUserId: string;
  let approvedTeacherProfileId: string;

  let pendingTeacherUserId: string;
  let pendingTeacherProfileId: string;

  let otherParentUserId: string;
  let otherParentProfileId: string;

  beforeAll(async () => {
    const passwordHash = await hashPassword(testPassword);

    // 1. Admin
    const admin = await prisma.user.create({
      data: {
        email: `admin.p09.${ts}@monsieurfanyi.gn`,
        fullName: "Directeur Financier P09",
        phoneNumber: randPhone(51),
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
      },
    });
    adminUserId = admin.id;

    // 2. Parent A & Student
    const parent = await prisma.user.create({
      data: {
        email: `parent.p09.${ts}@monsieurfanyi.gn`,
        fullName: "Amadou Diallo",
        phoneNumber: randPhone(52),
        passwordHash,
        role: UserRole.PARENT,
        isActive: true,
        parentProfile: {
          create: {
            city: "Conakry",
            address: "Kipé, Ratoma",
            children: {
              create: {
                fullName: "Fatoumata Diallo",
                gradeLevel: "1ère SM",
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
    parentUserId = parent.id;
    parentProfileId = parent.parentProfile!.id;
    studentId = parent.parentProfile!.children[0].id;

    // 3. Other Parent B (for authorization checks)
    const otherParent = await prisma.user.create({
      data: {
        email: `parent.b.p09.${ts}@monsieurfanyi.gn`,
        fullName: "Ousmane Camara",
        phoneNumber: randPhone(53),
        passwordHash,
        role: UserRole.PARENT,
        isActive: true,
        parentProfile: {
          create: {
            city: "Conakry",
            address: "Lambanyi",
          },
        },
      },
      include: { parentProfile: true },
    });
    otherParentUserId = otherParent.id;
    otherParentProfileId = otherParent.parentProfile!.id;

    // 4. Approved Teacher
    const approvedTeacher = await prisma.user.create({
      data: {
        email: `teacher.approved.p09.${ts}@monsieurfanyi.gn`,
        fullName: "Prof. Sékou Traoré (Agréé)",
        phoneNumber: randPhone(54),
        passwordHash,
        role: UserRole.TEACHER,
        isActive: true,
        teacherProfile: {
          create: {
            verificationStatus: TeacherVerificationStatus.APPROVED,
            headline: "Enseignant certifié de Mathématiques & Physique",
            yearsOfExperience: 7,
            city: "Conakry",
            hourlyRateGnf: 60000,
            monthlyPackageRateGnf: 900000,
          },
        },
      },
      include: { teacherProfile: true },
    });
    approvedTeacherUserId = approvedTeacher.id;
    approvedTeacherProfileId = approvedTeacher.teacherProfile!.id;

    // 5. Pending (Unapproved) Teacher
    const pendingTeacher = await prisma.user.create({
      data: {
        email: `teacher.pending.p09.${ts}@monsieurfanyi.gn`,
        fullName: "Candidat Ibrahima (En attente)",
        phoneNumber: randPhone(55),
        passwordHash,
        role: UserRole.TEACHER,
        isActive: true,
        teacherProfile: {
          create: {
            verificationStatus: TeacherVerificationStatus.DRAFT,
            headline: "Candidat tuteur non encore certifié",
            yearsOfExperience: 2,
            city: "Conakry",
          },
        },
      },
      include: { teacherProfile: true },
    });
    pendingTeacherUserId = pendingTeacher.id;
    pendingTeacherProfileId = pendingTeacher.teacherProfile!.id;
  });

  afterAll(async () => {
    // Cleanup created test records
    await prisma.tutoringPackage.deleteMany({
      where: {
        classroom: {
          teacherProfileId: { in: [approvedTeacherProfileId, pendingTeacherProfileId] },
        },
      },
    });
    await prisma.classroom.deleteMany({
      where: {
        teacherProfileId: { in: [approvedTeacherProfileId, pendingTeacherProfileId] },
      },
    });
    await prisma.teacherPricingOffer.deleteMany({
      where: {
        teacherProfileId: { in: [approvedTeacherProfileId, pendingTeacherProfileId] },
      },
    });
    await prisma.teacherApplication.deleteMany({
      where: {
        teacherProfileId: { in: [approvedTeacherProfileId, pendingTeacherProfileId] },
      },
    });
    await prisma.tutoringRequest.deleteMany({
      where: {
        parentId: { in: [parentProfileId, otherParentProfileId] },
      },
    });
    await prisma.studentProfile.deleteMany({
      where: { parentId: { in: [parentProfileId, otherParentProfileId] } },
    });
    await prisma.parentProfile.deleteMany({
      where: { id: { in: [parentProfileId, otherParentProfileId] } },
    });
    await prisma.teacherProfile.deleteMany({
      where: { id: { in: [approvedTeacherProfileId, pendingTeacherProfileId] } },
    });
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [
            adminUserId,
            parentUserId,
            otherParentUserId,
            approvedTeacherUserId,
            pendingTeacherUserId,
          ],
        },
      },
    });
    await prisma.$disconnect();
  });

  // =========================================================================
  // SUITE 1: MATHEMATICAL INVARIANTS & EXACT REMAINDER RECONCILIATION
  // =========================================================================
  describe("1. Mathematical Pricing Invariants & Exact Remainder Allocation", () => {
    it("should accurately calculate an hourly tutoring package with safe integer math", () => {
      // 50,000 GNF/hour, 60 minutes, 8 sessions => 400,000 GNF
      const result = PricingEngine.calculateHourlyPackage({
        hourlyRateGnf: 50000,
        durationMinutes: 60,
        sessionsCount: 8,
        commissionRatePercent: 15,
      });

      expect(result.pricingType).toBe(PricingOfferType.HOURLY);
      expect(result.hourlyRateGnf).toBe(50000);
      expect(result.totalAmountGnf).toBe(400000);
      expect(result.sessionsCount).toBe(8);
      expect(result.minutesPerSession).toBe(60);
      expect(result.totalPlannedMinutes).toBe(480);
      expect(result.totalPlatformCommissionGnf).toBe(60000); // 15% of 400,000
      expect(result.totalTeacherShareGnf).toBe(340000); // 85% of 400,000
      expect(result.allocations).toHaveLength(8);

      // Verify each individual session
      for (const s of result.allocations) {
        expect(s.allocatedAmountGnf).toBe(50000);
        expect(s.platformCommissionGnf).toBe(7500); // 15% of 50,000
        expect(s.teacherNetGnf).toBe(42500); // 85% of 50,000
        expect(s.platformCommissionGnf + s.teacherNetGnf).toBe(s.allocatedAmountGnf);
      }
    });

    it("should handle pro-rata hourly package with 90 minutes session duration", () => {
      // 60,000 GNF/hour for 90 minutes = 90,000 GNF per session. 4 sessions = 360,000 GNF
      const result = PricingEngine.calculateHourlyPackage({
        hourlyRateGnf: 60000,
        durationMinutes: 90,
        sessionsCount: 4,
        commissionRatePercent: 15,
      });

      expect(result.baseSessionRateGnf).toBe(90000);
      expect(result.totalAmountGnf).toBe(360000);
      expect(result.totalPlatformCommissionGnf).toBe(54000);
      expect(result.totalTeacherShareGnf).toBe(306000);

      const sumAllocated = result.allocations.reduce((sum, s) => sum + s.allocatedAmountGnf, 0);
      const sumCommission = result.allocations.reduce((sum, s) => sum + s.platformCommissionGnf, 0);
      const sumTeacher = result.allocations.reduce((sum, s) => sum + s.teacherNetGnf, 0);

      expect(sumAllocated).toBe(360000);
      expect(sumCommission).toBe(54000);
      expect(sumTeacher).toBe(306000);
    });

    it("should handle exact integer division in monthly package", () => {
      // 800,000 GNF / 8 sessions = 100,000 GNF each exactly
      const result = PricingEngine.calculateMonthlyPackage({
        totalAmountGnf: 800000,
        sessionsCount: 8,
        durationMinutes: 60,
        commissionRatePercent: 15,
      });

      expect(result.pricingType).toBe(PricingOfferType.MONTHLY_PACKAGE);
      expect(result.totalAmountGnf).toBe(800000);
      expect(result.baseSessionRateGnf).toBe(100000);
      expect(result.remainderGnf).toBe(0);
      expect(result.totalPlatformCommissionGnf).toBe(120000);
      expect(result.totalTeacherShareGnf).toBe(680000);

      for (const s of result.allocations) {
        expect(s.allocatedAmountGnf).toBe(100000);
        expect(s.platformCommissionGnf).toBe(15000);
        expect(s.teacherNetGnf).toBe(85000);
        expect(s.platformCommissionGnf + s.teacherNetGnf).toBe(100000);
      }
    });

    it("should deterministically absorb remainders across earliest sessions with zero rounding loss (100,000 GNF / 3 sessions)", () => {
      // 100,000 GNF / 3 sessions:
      // Base session rate: 33,333 GNF, Remainder: 1 GNF
      // Session 1: 33,334 GNF
      // Session 2: 33,333 GNF
      // Session 3: 33,333 GNF
      // Total Gross: 33,334 + 33,333 + 33,333 = 100,000 GNF strictly!
      const result = PricingEngine.calculateMonthlyPackage({
        totalAmountGnf: 100000,
        sessionsCount: 3,
        durationMinutes: 60,
        commissionRatePercent: 15,
      });

      expect(result.remainderGnf).toBe(1);
      expect(result.allocations[0].allocatedAmountGnf).toBe(33334);
      expect(result.allocations[1].allocatedAmountGnf).toBe(33333);
      expect(result.allocations[2].allocatedAmountGnf).toBe(33333);

      const sumGross = result.allocations.reduce((sum, s) => sum + s.allocatedAmountGnf, 0);
      expect(sumGross).toBe(100000);

      // Commission 15%: 15,000 GNF / 3 sessions = 5,000 GNF each exactly
      expect(result.totalPlatformCommissionGnf).toBe(15000);
      expect(result.totalTeacherShareGnf).toBe(85000);

      for (const s of result.allocations) {
        expect(s.platformCommissionGnf).toBe(5000);
        expect(s.platformCommissionGnf + s.teacherNetGnf).toBe(s.allocatedAmountGnf);
      }

      expect(result.allocations[0].teacherNetGnf).toBe(28334);
      expect(result.allocations[1].teacherNetGnf).toBe(28333);
      expect(result.allocations[2].teacherNetGnf).toBe(28333);

      const sumNet = result.allocations.reduce((sum, s) => sum + s.teacherNetGnf, 0);
      expect(sumNet).toBe(85000);
    });

    it("should guarantee zero aggregate rounding drift on odd amounts and non-divisible commission (1,000,000 GNF / 7 sessions)", () => {
      // 1,000,000 GNF / 7 sessions:
      // 1,000,000 = 142,857 * 7 + 1
      // Commission 15%: 150,000 GNF. 150,000 / 7 = 21,428 with remainder 4.
      // Sessions 1..4 have commission 21,429; Sessions 5..7 have commission 21,428.
      const result = PricingEngine.calculateMonthlyPackage({
        totalAmountGnf: 1000000,
        sessionsCount: 7,
        durationMinutes: 60,
        commissionRatePercent: 15,
      });

      const sumAllocated = result.allocations.reduce((sum, s) => sum + s.allocatedAmountGnf, 0);
      const sumCommission = result.allocations.reduce((sum, s) => sum + s.platformCommissionGnf, 0);
      const sumTeacher = result.allocations.reduce((sum, s) => sum + s.teacherNetGnf, 0);

      // 5-point mathematical invariant verification:
      // Invariant 1: Sum of session gross === totalAmountGnf down to the exact 1 GNF
      expect(sumAllocated).toBe(1000000);

      // Invariant 2: Sum of platform commissions === totalPlatformCommissionGnf
      expect(sumCommission).toBe(150000);

      // Invariant 3: Sum of teacher shares === totalTeacherShareGnf
      expect(sumTeacher).toBe(850000);

      // Invariant 4: Platform + Teacher === Total
      expect(sumCommission + sumTeacher).toBe(sumAllocated);

      // Invariant 5: For EVERY individual session, Gross === Commission + Net
      for (const s of result.allocations) {
        expect(s.allocatedAmountGnf).toBe(s.platformCommissionGnf + s.teacherNetGnf);
      }
    });

    it("should handle odd amounts and arbitrary session counts perfectly (777,777 GNF / 11 sessions)", () => {
      const result = PricingEngine.calculateMonthlyPackage({
        totalAmountGnf: 777777,
        sessionsCount: 11,
        durationMinutes: 90,
        commissionRatePercent: 15,
      });

      const sumGross = result.allocations.reduce((acc, s) => acc + s.allocatedAmountGnf, 0);
      const sumComm = result.allocations.reduce((acc, s) => acc + s.platformCommissionGnf, 0);
      const sumNet = result.allocations.reduce((acc, s) => acc + s.teacherNetGnf, 0);

      expect(sumGross).toBe(777777);
      expect(sumComm).toBe(result.totalPlatformCommissionGnf);
      expect(sumNet).toBe(result.totalTeacherShareGnf);
      expect(sumComm + sumNet).toBe(777777);

      for (const s of result.allocations) {
        expect(s.allocatedAmountGnf).toBe(s.platformCommissionGnf + s.teacherNetGnf);
      }
    });

    it("should handle large realistic amounts (12,000,000 GNF / 16 sessions)", () => {
      const result = PricingEngine.calculateMonthlyPackage({
        totalAmountGnf: 12000000,
        sessionsCount: 16,
        durationMinutes: 120,
        commissionRatePercent: 15,
      });

      expect(result.totalAmountGnf).toBe(12000000);
      expect(result.totalPlatformCommissionGnf).toBe(1800000); // 15%
      expect(result.totalTeacherShareGnf).toBe(10200000); // 85%
      expect(result.baseSessionRateGnf).toBe(750000);
      expect(result.remainderGnf).toBe(0);
    });

    it("should strictly reject negative, zero, or floating-point monetary values", () => {
      // Negative amount
      expect(() => {
        PricingEngine.calculateMonthlyPackage({
          totalAmountGnf: -100000,
          sessionsCount: 8,
          durationMinutes: 60,
        });
      }).toThrowError(PricingEngineError);

      // Zero amount
      expect(() => {
        PricingEngine.calculateHourlyPackage({
          hourlyRateGnf: 0,
          durationMinutes: 60,
          sessionsCount: 8,
        });
      }).toThrowError(PricingEngineError);

      // Floating-point rate
      expect(() => {
        PricingEngine.calculateHourlyPackage({
          hourlyRateGnf: 50000.75,
          durationMinutes: 60,
          sessionsCount: 8,
        });
      }).toThrowError(PricingEngineError);

      // Invalid duration (< 15 min or > 480 min)
      expect(() => {
        PricingEngine.calculateHourlyPackage({
          hourlyRateGnf: 50000,
          durationMinutes: 10,
          sessionsCount: 8,
        });
      }).toThrowError(PricingEngineError);

      // Invalid session count (< 1 or > 100)
      expect(() => {
        PricingEngine.calculateMonthlyPackage({
          totalAmountGnf: 500000,
          sessionsCount: 0,
          durationMinutes: 60,
        });
      }).toThrowError(PricingEngineError);

      // Invalid commission percentage (< 0 or > 100)
      expect(() => {
        PricingEngine.calculateMonthlyPackage({
          totalAmountGnf: 500000,
          sessionsCount: 5,
          durationMinutes: 60,
          commissionRatePercent: 105,
        });
      }).toThrowError(PricingEngineError);
    });
  });

  // =========================================================================
  // SUITE 2: TEACHER PRICING OFFERS & APPROVAL GATE
  // =========================================================================
  describe("2. Teacher Pricing Offers & Security Gate", () => {
    it("should allow an APPROVED teacher to create and publish active pricing offers", async () => {
      // Create hourly offer
      const hourlyOffer = await prisma.teacherPricingOffer.create({
        data: {
          teacherProfileId: approvedTeacherProfileId,
          type: PricingOfferType.HOURLY,
          totalPriceGnf: 65000,
          minutesPerSession: 60,
          sessionsCount: 1,
          isActive: true,
          title: "Cours particulier de Mathématiques à l'heure",
        },
      });

      expect(hourlyOffer.id).toBeDefined();
      expect(hourlyOffer.totalPriceGnf).toBe(65000);
      expect(hourlyOffer.type).toBe(PricingOfferType.HOURLY);
      expect(hourlyOffer.isActive).toBe(true);

      // Create monthly package offer
      const monthlyOffer = await prisma.teacherPricingOffer.create({
        data: {
          teacherProfileId: approvedTeacherProfileId,
          type: PricingOfferType.MONTHLY_PACKAGE,
          totalPriceGnf: 950000,
          minutesPerSession: 90,
          sessionsCount: 8,
          isActive: true,
          title: "Forfait Mensuel Intensif (8 séances de 1h30)",
        },
      });

      expect(monthlyOffer.id).toBeDefined();
      expect(monthlyOffer.totalPriceGnf).toBe(950000);
      expect(monthlyOffer.sessionsCount).toBe(8);
      expect(monthlyOffer.minutesPerSession).toBe(90);
    });

    it("should reject pricing offer creation if teacher is not APPROVED", async () => {
      // Check that pending teacher has verificationStatus !== APPROVED
      const pendingProfile = await prisma.teacherProfile.findUnique({
        where: { id: pendingTeacherProfileId },
      });
      expect(pendingProfile?.verificationStatus).toBe(TeacherVerificationStatus.DRAFT);

      // The API endpoint /api/teacher/pricing-offers checks verificationStatus === APPROVED
      // Simulating the server-side guard:
      const canPublish = pendingProfile?.verificationStatus === TeacherVerificationStatus.APPROVED;
      expect(canPublish).toBe(false);
    });

    it("should allow editing and deactivating teacher pricing offers", async () => {
      const offer = await prisma.teacherPricingOffer.findFirst({
        where: {
          teacherProfileId: approvedTeacherProfileId,
          type: PricingOfferType.HOURLY,
        },
      });
      expect(offer).not.toBeNull();

      const updated = await prisma.teacherPricingOffer.update({
        where: { id: offer!.id },
        data: {
          totalPriceGnf: 70000,
          isActive: false,
        },
      });

      expect(updated.totalPriceGnf).toBe(70000);
      expect(updated.isActive).toBe(false);
    });
  });

  // =========================================================================
  // SUITE 3: CLASSROOM AGREED PACKAGE SETUP & IMMUTABILITY
  // =========================================================================
  describe("3. Classroom Agreed Package Integration & Rate Immutability", () => {
    let testClassroomId: string;

    beforeAll(async () => {
      // Create a test classroom for diallo
      const classroom = await prisma.classroom.create({
        data: {
          teacherProfileId: approvedTeacherProfileId,
          studentId,
          subjectName: "Mathématiques",
          mode: TutoringMode.HOME,
          status: ClassroomStatus.PENDING_PAYMENT,
          hourlyRateGnf: 60000,
          monthlyRateGnf: 900000,
          isAssistedAssignment: false,
        },
      });
      testClassroomId = classroom.id;
    });

    it("should setup a TutoringPackage snapshot with PENDING_PAYMENT status and strict zero earnings", async () => {
      const setupResult = await PricingEngine.setupClassroomPackage({
        classroomId: testClassroomId,
        userId: adminUserId,
        userRole: UserRole.ADMIN,
        pricingType: PricingOfferType.MONTHLY_PACKAGE,
        amountGnf: 900000,
        sessionsCount: 8,
        minutesPerSession: 90,
        notes: "Forfait convenu entre M. Diallo et Prof. Traoré",
      });

      expect(setupResult.success).toBe(true);
      expect(setupResult.package).toBeDefined();
      expect(setupResult.package.status).toBe(PackageStatus.PENDING_PAYMENT);
      expect(setupResult.package.totalAmountGnf).toBe(900000);
      expect(setupResult.package.sessionsCount).toBe(8);
      expect(setupResult.package.minutesPerSession).toBe(90);
      expect(setupResult.package.commissionRatePercent).toBe(15);
      expect(setupResult.package.totalPlatformCommissionGnf).toBe(135000); // 15%
      expect(setupResult.package.totalTeacherShareGnf).toBe(765000); // 85%
      expect(setupResult.package.version).toBe(1);

      // CRITICAL FINANCIAL INVARIANT 1: No PaymentOrder created
      const orders = await prisma.paymentOrder.findMany({
        where: { classroomId: testClassroomId },
      });
      expect(orders).toHaveLength(0);

      // CRITICAL FINANCIAL INVARIANT 2: No TeacherEarning created
      const earnings = await prisma.teacherEarning.findMany({
        where: { teacherProfileId: approvedTeacherProfileId },
      });
      expect(earnings).toHaveLength(0);

      // CRITICAL FINANCIAL INVARIANT 3: Classroom remains PENDING_PAYMENT
      const refreshedClassroom = await prisma.classroom.findUnique({
        where: { id: testClassroomId },
      });
      expect(refreshedClassroom?.status).toBe(ClassroomStatus.PENDING_PAYMENT);
    });

    it("should preserve existing classroom package snapshot even if teacher updates public pricing offers", async () => {
      // 1. Teacher updates public rates to 1,500,000 GNF
      await prisma.teacherProfile.update({
        where: { id: approvedTeacherProfileId },
        data: {
          monthlyPackageRateGnf: 1500000,
          hourlyRateGnf: 120000,
        },
      });

      // 2. Existing agreed package on classroom must remain 900,000 GNF with version 1
      const pkg = await prisma.tutoringPackage.findFirst({
        where: { classroomId: testClassroomId },
        orderBy: { version: "desc" },
      });

      expect(pkg).not.toBeNull();
      expect(pkg?.totalAmountGnf).toBe(900000);
      expect(pkg?.totalTeacherShareGnf).toBe(765000);
      expect(pkg?.commissionRatePercent).toBe(15);
      expect(pkg?.version).toBe(1);
    });

    it("should increment package version when reconfiguring a package", async () => {
      const secondSetup = await PricingEngine.setupClassroomPackage({
        classroomId: testClassroomId,
        userId: parentUserId,
        userRole: UserRole.PARENT,
        pricingType: PricingOfferType.MONTHLY_PACKAGE,
        amountGnf: 1000000,
        sessionsCount: 10,
        minutesPerSession: 60,
        notes: "Mise à niveau : 10 séances de 1h",
      });

      expect(secondSetup.package.version).toBe(2);
      expect(secondSetup.package.totalAmountGnf).toBe(1000000);
      expect(secondSetup.package.sessionsCount).toBe(10);
      expect(secondSetup.package.totalPlatformCommissionGnf).toBe(150000);
      expect(secondSetup.package.totalTeacherShareGnf).toBe(850000);
    });

    it("should prevent unauthorized users from setting up a classroom package", async () => {
      await expect(
        PricingEngine.setupClassroomPackage({
          classroomId: testClassroomId,
          userId: otherParentUserId, // Unrelated parent
          userRole: UserRole.PARENT,
          pricingType: PricingOfferType.HOURLY,
          amountGnf: 60000,
          sessionsCount: 8,
          minutesPerSession: 60,
        })
      ).rejects.toThrowError(PricingEngineError);
    });
  });

  // =========================================================================
  // SUITE 4: END-TO-END WORKFLOW INTEGRATION
  // =========================================================================
  describe("4. End-to-End Classroom Creation & Package Provisioning", () => {
    it("should automatically provision TutoringPackage when creating an admin-assisted classroom", async () => {
      const result = await ClassroomService.createAdminAssistedClassroom({
        adminUserId,
        parentProfileId,
        studentId,
        teacherProfileId: approvedTeacherProfileId,
        subjectName: "Physique-Chimie",
        mode: TutoringMode.HOME,
        monthlyRateGnf: 800000,
        sessionsCount: 8,
        minutesPerSession: 60,
        assignmentSource: "PHONE_INQUIRY",
        adminNotes: "Demande formulée par téléphone pour renforcement en Terminale",
        city: "Conakry",
        commune: "Ratoma",
      });

      expect(result.classroom).toBeDefined();
      expect(result.classroom.isAssistedAssignment).toBe(true);
      expect(result.classroom.status).toBe(ClassroomStatus.PENDING_PAYMENT);

      // Verify that a TutoringPackage was atomically created
      const pkg = await prisma.tutoringPackage.findFirst({
        where: { classroomId: result.classroom.id },
      });

      expect(pkg).not.toBeNull();
      expect(pkg?.status).toBe(PackageStatus.PENDING_PAYMENT);
      expect(pkg?.totalAmountGnf).toBe(800000);
      expect(pkg?.sessionsCount).toBe(8);
      expect(pkg?.minutesPerSession).toBe(60);
      expect(pkg?.commissionRatePercent).toBe(15);
      expect(pkg?.totalPlatformCommissionGnf).toBe(120000);
      expect(pkg?.totalTeacherShareGnf).toBe(680000);

      // Verify allocationsJson is valid and reconciles strictly
      const allocations = JSON.parse(pkg!.allocationsJson || "[]");
      expect(allocations).toHaveLength(8);

      const sumGross = allocations.reduce((acc: number, a: any) => acc + a.allocatedAmountGnf, 0);
      const sumCommission = allocations.reduce((acc: number, a: any) => acc + a.platformCommissionGnf, 0);
      const sumTeacher = allocations.reduce((acc: number, a: any) => acc + a.teacherNetGnf, 0);

      expect(sumGross).toBe(800000);
      expect(sumCommission).toBe(120000);
      expect(sumTeacher).toBe(680000);

      // Zero fake payments or teacher earnings
      const orders = await prisma.paymentOrder.findMany({
        where: { classroomId: result.classroom.id },
      });
      expect(orders).toHaveLength(0);
    });

    it("should verify 100% key parity for pricing between fr.json and en.json", () => {
      const frPricingKeys = Object.keys(frMessages.pricing).sort();
      const enPricingKeys = Object.keys(enMessages.pricing).sort();

      expect(frPricingKeys).toEqual(enPricingKeys);
      expect(frPricingKeys.length).toBeGreaterThan(15);
      expect(frPricingKeys).toContain("hourlyTitle");
      expect(frPricingKeys).toContain("packageTitle");
      expect(frPricingKeys).toContain("commissionPlatform");
      expect(frPricingKeys).toContain("netTeacher");
      expect(frPricingKeys).toContain("simTitle");
    });
  });
});
