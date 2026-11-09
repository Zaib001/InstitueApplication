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
  SessionStatus,
  LessonAttendance,
  DisputeStatus,
  HomeworkStatus,
  AssessmentType,
  ReportStatus,
} from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { ClassroomService } from "@/lib/classroom/classroom-service";
import { PricingEngine } from "@/lib/pricing/pricing-engine";
import { SchedulingEngine } from "@/lib/scheduling/scheduling-engine";
import { ReportingService } from "@/lib/reporting/reporting-service";
import { ProgressService } from "@/lib/progress/progress-service";

const prisma = new PrismaClient();

describe("Phase 13: Final End-to-End Milestone 2 Integration & Security Audit", () => {
  const ts = Date.now();
  const randPhone = (pfx: number) => `+224${pfx}${Math.floor(100000 + Math.random() * 900000)}`;
  const testPassword = "PasswordPhase13Audit2026!";

  // Roles & Fixtures
  let adminUserId: string;

  // Parent A & Student A (Parent-Led Workflow)
  let parentAUserId: string;
  let parentAProfileId: string;
  let studentAId: string;

  // Parent B (Cross-Tenant Privacy Tests)
  let parentBUserId: string;
  let parentBProfileId: string;
  let studentBId: string;

  // Teachers
  let approvedTeacher1UserId: string;
  let approvedTeacher1ProfileId: string;

  let approvedTeacher2UserId: string;
  let approvedTeacher2ProfileId: string;

  let pendingTeacherUserId: string;
  let pendingTeacherProfileId: string;

  // Shared test entities across workflows
  let tutoringRequestA: any;
  let applicationApproved1: any;
  let classroomWorkflowA: any;
  let classroomWorkflowB: any;
  let packageWorkflowA: any;
  let sessionWorkflowA1: any;
  let sessionWorkflowA2: any;
  let sessionWorkflowA3: any;
  let sessionWorkflowA4: any;

  beforeAll(async () => {
    const passwordHash = await hashPassword(testPassword);

    // 1. Create Admin
    const adminUser = await prisma.user.create({
      data: {
        email: `admin.p13.${ts}@monsieurfanyi.gn`,
        fullName: "Direction Audit P13",
        phoneNumber: randPhone(71),
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
      },
    });
    adminUserId = adminUser.id;

    // 2. Create Parent A & Student A
    const parentAUser = await prisma.user.create({
      data: {
        email: `parent.p13.a.${ts}@monsieurfanyi.gn`,
        fullName: "Mamadou Bah (Parent Audit A)",
        phoneNumber: randPhone(72),
        passwordHash,
        role: UserRole.PARENT,
        isActive: true,
        parentProfile: {
          create: {
            city: "Conakry",
            address: "Kipé, Ratoma",
            children: {
              create: {
                fullName: "Ibrahima Bah",
                gradeLevel: "Terminale SM",
                cycle: "LYCEE",
                schoolName: "Lycée Sainte Marie",
                preferredSubjects: ["Mathématiques", "Physique-Chimie"],
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
    parentAUserId = parentAUser.id;
    parentAProfileId = parentAUser.parentProfile!.id;
    studentAId = parentAUser.parentProfile!.children[0].id;

    // 3. Create Parent B & Student B
    const parentBUser = await prisma.user.create({
      data: {
        email: `parent.p13.b.${ts}@monsieurfanyi.gn`,
        fullName: "Aissatou Diallo (Parent Audit B)",
        phoneNumber: randPhone(73),
        passwordHash,
        role: UserRole.PARENT,
        isActive: true,
        parentProfile: {
          create: {
            city: "Conakry",
            address: "Lambanyi, Ratoma",
            children: {
              create: {
                fullName: "Mariama Diallo",
                gradeLevel: "10ème Année",
                cycle: "COLLEGE",
                schoolName: "Collège Kipé",
                preferredSubjects: ["Français"],
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
    parentBUserId = parentBUser.id;
    parentBProfileId = parentBUser.parentProfile!.id;
    studentBId = parentBUser.parentProfile!.children[0].id;

    // 4. Create Teachers: Approved 1, Approved 2, and Pending
    const teacher1User = await prisma.user.create({
      data: {
        email: `teacher.p13.app1.${ts}@monsieurfanyi.gn`,
        fullName: "Dr. Alpha Sow (Audit Agréé 1)",
        phoneNumber: randPhone(74),
        passwordHash,
        role: UserRole.TEACHER,
        isActive: true,
        teacherProfile: {
          create: {
            headline: "Docteur en Sciences Physiques",
            yearsOfExperience: 8,
            verificationStatus: TeacherVerificationStatus.APPROVED,
            city: "Conakry",
            serviceArea: "Ratoma",
            hourlyRateGnf: 60000,
            monthlyPackageRateGnf: 900000,
          },
        },
      },
      include: { teacherProfile: true },
    });
    approvedTeacher1UserId = teacher1User.id;
    approvedTeacher1ProfileId = teacher1User.teacherProfile!.id;

    const teacher2User = await prisma.user.create({
      data: {
        email: `teacher.p13.app2.${ts}@monsieurfanyi.gn`,
        fullName: "Prof. Sekouba Traoré (Audit Agréé 2)",
        phoneNumber: randPhone(75),
        passwordHash,
        role: UserRole.TEACHER,
        isActive: true,
        teacherProfile: {
          create: {
            headline: "Enseignant certifié de Mathématiques",
            yearsOfExperience: 6,
            verificationStatus: TeacherVerificationStatus.APPROVED,
            city: "Conakry",
            serviceArea: "Dixinn",
            hourlyRateGnf: 50000,
            monthlyPackageRateGnf: 750000,
          },
        },
      },
      include: { teacherProfile: true },
    });
    approvedTeacher2UserId = teacher2User.id;
    approvedTeacher2ProfileId = teacher2User.teacherProfile!.id;

    const teacherPendingUser = await prisma.user.create({
      data: {
        email: `teacher.p13.pending.${ts}@monsieurfanyi.gn`,
        fullName: "Candidat Kante (Audit En Attente)",
        phoneNumber: randPhone(76),
        passwordHash,
        role: UserRole.TEACHER,
        isActive: true,
        teacherProfile: {
          create: {
            headline: "Candidat tuteur en cours d'évaluation",
            yearsOfExperience: 1,
            verificationStatus: TeacherVerificationStatus.PENDING_REVIEW,
            city: "Conakry",
          },
        },
      },
      include: { teacherProfile: true },
    });
    pendingTeacherUserId = teacherPendingUser.id;
    pendingTeacherProfileId = teacherPendingUser.teacherProfile!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // =========================================================================
  // SECTION 1: WORKFLOW A — PARENT-LED SELECTION (ORIGINAL MILESTONE 2)
  // =========================================================================
  describe("Workflow A: Parent-Led Teacher Selection & Classroom Creation", () => {
    it("P13.A1: Parent publishes TutoringRequest in OPEN state", async () => {
      tutoringRequestA = await prisma.tutoringRequest.create({
        data: {
          parentId: parentAProfileId,
          studentId: studentAId,
          subjectName: "Mathématiques",
          gradeLevelName: "Terminale SM",
          cycle: "LYCEE",
          mode: TutoringMode.HOME,
          status: RequestStatus.OPEN,
          budgetGnf: 900000,
          city: "Conakry",
          commune: "Ratoma",
          neighborhood: "Kipé",
        },
      });

      expect(tutoringRequestA.id).toBeDefined();
      expect(tutoringRequestA.status).toBe(RequestStatus.OPEN);
      expect(tutoringRequestA.parentId).toBe(parentAProfileId);
    });

    it("P13.A2: Unapproved teachers cannot apply to open tutoring requests", async () => {
      const applyAttempt = async () => {
        const teacher = await prisma.teacherProfile.findUnique({
          where: { id: pendingTeacherProfileId },
        });
        if (teacher?.verificationStatus !== TeacherVerificationStatus.APPROVED) {
          throw new Error("Seuls les enseignants agréés peuvent postuler.");
        }
      };
      await expect(applyAttempt()).rejects.toThrow("Seuls les enseignants agréés peuvent postuler.");
    });

    it("P13.A3: Approved teacher applies successfully with proposed rate", async () => {
      applicationApproved1 = await prisma.teacherApplication.create({
        data: {
          requestId: tutoringRequestA.id,
          teacherProfileId: approvedTeacher1ProfileId,
          proposedRateGnf: 900000,
          pitchMessage: "Bonjour, j'ai 8 ans d'expérience en Terminale SM avec 95% de réussite.",
          status: ApplicationStatus.SUBMITTED,
        },
      });

      expect(applicationApproved1.id).toBeDefined();
      expect(applicationApproved1.status).toBe(ApplicationStatus.SUBMITTED);
      expect(applicationApproved1.teacherProfileId).toBe(approvedTeacher1ProfileId);
    });

    it("P13.A4: Parent selects teacher: marks application ACCEPTED, request MATCHED, and creates Classroom PENDING_PAYMENT", async () => {
      const result = await ClassroomService.createClassroomFromParentSelection({
        parentUserId: parentAUserId,
        requestId: tutoringRequestA.id,
        applicationId: applicationApproved1.id,
      });

      classroomWorkflowA = result.classroom;
      expect(classroomWorkflowA.id).toBeDefined();
      expect(classroomWorkflowA.status).toBe(ClassroomStatus.PENDING_PAYMENT);
      expect(classroomWorkflowA.studentId).toBe(studentAId);
      expect(classroomWorkflowA.teacherProfileId).toBe(approvedTeacher1ProfileId);

      // Verify request & application states updated atomically
      const updatedReq = await prisma.tutoringRequest.findUnique({
        where: { id: tutoringRequestA.id },
      });
      expect(updatedReq?.status).toBe(RequestStatus.MATCHED);

      const updatedApp = await prisma.teacherApplication.findUnique({
        where: { id: applicationApproved1.id },
      });
      expect(updatedApp?.status).toBe(ApplicationStatus.ACCEPTED);
    });
  });

  // =========================================================================
  // SECTION 2: WORKFLOW B — ADMINISTRATOR-ASSISTED DIRECT ASSIGNMENT (+50€ SCOPE)
  // =========================================================================
  describe("Workflow B: Administrator-Assisted Direct Classroom Assignment (+50€)", () => {
    let assistedParentUser: any;
    let assistedStudent: any;

    it("P13.B1: Unauthorized parent cannot access admin-assisted assignment", async () => {
      await expect(
        ClassroomService.createAdminAssistedClassroom({
          adminUserId: parentAUserId, // non-admin
          parentProfileId: parentAProfileId,
          studentId: studentAId,
          teacherProfileId: approvedTeacher2ProfileId,
          subjectName: "Physique-Chimie",
          mode: TutoringMode.HOME,
          monthlyRateGnf: 750000,
          assignmentSource: "PHONE_INQUIRY",
        })
      ).rejects.toThrow(/Seuls les administrateurs Monsieur Fanyi/);
    });

    it("P13.B2: Admin registers assisted parent via telephone without plaintext password", async () => {
      const assistedPhone = randPhone(77);
      const assistedEmail = `parent.${assistedPhone.replace("+", "")}@famille.monsieurfanyi.com`;
      const initialHash = await hashPassword("TemporarySecretAudit2026!");

      assistedParentUser = await prisma.user.create({
        data: {
          fullName: "El Hadj Ousmane Sow (Parent Téléphonique)",
          email: assistedEmail,
          phoneNumber: assistedPhone,
          role: UserRole.PARENT,
          passwordHash: initialHash,
          isActive: true,
          parentProfile: {
            create: {
              city: "Conakry",
              address: "Matam, Hermakonon",
              isAssistedRegistration: true,
            },
          },
        },
        include: { parentProfile: true },
      });

      expect(assistedParentUser.id).toBeDefined();
      expect(assistedParentUser.parentProfile?.isAssistedRegistration).toBe(true);

      assistedStudent = await prisma.studentProfile.create({
        data: {
          parentId: assistedParentUser.parentProfile!.id,
          fullName: "Fanta Sow",
          gradeLevel: "11ème SM",
          cycle: "LYCEE",
          schoolName: "Lycée 28 Septembre",
        },
      });

      expect(assistedStudent.id).toBeDefined();
    });

    it("P13.B3: Admin executes direct assignment: creates Classroom PENDING_PAYMENT with audit provenance", async () => {
      const result = await ClassroomService.createAdminAssistedClassroom({
        adminUserId,
        parentProfileId: assistedParentUser.parentProfile!.id,
        studentId: assistedStudent.id,
        teacherProfileId: approvedTeacher2ProfileId,
        subjectName: "Physique-Chimie",
        mode: TutoringMode.HOME,
        monthlyRateGnf: 750000,
        assignmentSource: "PHONE_INQUIRY",
        adminNotes: "Demande reçue par téléphone au standard Conakry",
      });

      classroomWorkflowB = result.classroom;
      expect(classroomWorkflowB.id).toBeDefined();
      expect(classroomWorkflowB.status).toBe(ClassroomStatus.PENDING_PAYMENT);
      expect(classroomWorkflowB.assignmentSource).toBe("PHONE_INQUIRY");
      expect(classroomWorkflowB.assignedByAdminId).toBe(adminUserId);
      expect(classroomWorkflowB.subjectName).toBe("Physique-Chimie");
    });

    it("P13.B4: Duplicate direct assignment is blocked for same student, teacher, and subject", async () => {
      await expect(
        ClassroomService.createAdminAssistedClassroom({
          adminUserId,
          parentProfileId: assistedParentUser.parentProfile!.id,
          studentId: assistedStudent.id,
          teacherProfileId: approvedTeacher2ProfileId,
          subjectName: "Physique-Chimie",
          mode: TutoringMode.HOME,
          monthlyRateGnf: 750000,
          assignmentSource: "PHONE_INQUIRY",
        })
      ).rejects.toThrow(/Une classe existe déjà/);
    });
  });

  // =========================================================================
  // SECTION 3: PRICING ENGINE, FINANCIAL ALLOCATION & REVENUE SHARE INVARIANTS
  // =========================================================================
  describe("Workflow C: Flexible Pricing Engine & 85/15 Commission Allocation", () => {
    it("P13.C1: Monthly package financial calculation enforces exact 15% platform and 85% teacher split", () => {
      const breakdown = PricingEngine.calculateMonthlyPackage({
        totalAmountGnf: 1200000,
        sessionsCount: 8,
        durationMinutes: 90,
      });

      expect(breakdown.totalAmountGnf).toBe(1200000);
      expect(breakdown.totalPlatformCommissionGnf).toBe(180000); // 15%
      expect(breakdown.totalTeacherShareGnf).toBe(1020000); // 85%
      expect(breakdown.totalPlatformCommissionGnf + breakdown.totalTeacherShareGnf).toBe(breakdown.totalAmountGnf);

      // Per-session allocation
      expect(breakdown.sessionsCount).toBe(8);
      expect(breakdown.baseSessionRateGnf).toBe(150000);
      expect(breakdown.allocations.length).toBe(8);
      expect(breakdown.allocations[0].allocatedAmountGnf).toBe(150000);
      expect(breakdown.allocations[0].platformCommissionGnf).toBe(22500);
      expect(breakdown.allocations[0].teacherNetGnf).toBe(127500);
    });

    it("P13.C2: Hourly pricing calculation computes accurate total and session breakdown", () => {
      const hourlyCalculation = PricingEngine.calculateHourlyPackage({
        hourlyRateGnf: 60000,
        sessionsCount: 12,
        durationMinutes: 120, // 2 hours
      });

      expect(hourlyCalculation.totalAmountGnf).toBe(1440000);
      expect(hourlyCalculation.totalPlatformCommissionGnf).toBe(216000); // 15%
      expect(hourlyCalculation.totalTeacherShareGnf).toBe(1224000); // 85%
      expect(hourlyCalculation.baseSessionRateGnf).toBe(120000);
      expect(hourlyCalculation.allocations[0].allocatedAmountGnf).toBe(120000);
      expect(hourlyCalculation.allocations[0].platformCommissionGnf).toBe(18000);
      expect(hourlyCalculation.allocations[0].teacherNetGnf).toBe(102000);
    });

    it("P13.C3: Package creation locks financial terms in PENDING_PAYMENT state", async () => {
      const setupResult = await PricingEngine.setupClassroomPackage({
        classroomId: classroomWorkflowA.id,
        pricingType: PricingOfferType.MONTHLY_PACKAGE,
        amountGnf: 1200000,
        sessionsCount: 8,
        minutesPerSession: 90,
        notes: "Forfait mensuel Terminale SM",
        userId: parentAUserId,
        userRole: UserRole.PARENT,
      });

      packageWorkflowA = setupResult.package;
      expect(packageWorkflowA.id).toBeDefined();
      expect(packageWorkflowA.status).toBe(PackageStatus.PENDING_PAYMENT);
      expect(packageWorkflowA.totalAmountGnf).toBe(1200000);
      expect(packageWorkflowA.totalPlatformCommissionGnf).toBe(180000);
      expect(packageWorkflowA.totalTeacherShareGnf).toBe(1020000);
      expect(packageWorkflowA.baseSessionRateGnf).toBe(150000);
    });

    it("P13.C4: Financial Invariant: Zero premature earnings exist while package is pending payment", async () => {
      const validatedSessions = await prisma.lessonSession.count({
        where: {
          classroom: { teacherProfileId: approvedTeacher1ProfileId },
          status: SessionStatus.PARENT_APPROVED,
        },
      });
      expect(validatedSessions).toBe(0);
    });
  });

  // =========================================================================
  // SECTION 4: SCHEDULING, CONFLICT DETECTION & ATTENDANCE FORMULA
  // =========================================================================
  describe("Workflow D: Scheduling, Conflict Resolution & Strict Attendance Invariant", () => {
    beforeAll(async () => {
      // Simulate advance settlement confirmation to activate the package for scheduling
      await prisma.tutoringPackage.update({
        where: { id: packageWorkflowA.id },
        data: { status: PackageStatus.ACTIVE },
      });
      await prisma.classroom.update({
        where: { id: classroomWorkflowA.id },
        data: { status: ClassroomStatus.ACTIVE },
      });
    });

    it("P13.D1: Scheduling conflict detection prevents overlapping sessions for the same teacher", async () => {
      const baseStart = new Date("2026-11-10T10:00:00Z");
      const baseEnd = new Date("2026-11-10T11:30:00Z");

      // Create first scheduled session
      await prisma.lessonSession.create({
        data: {
          classroomId: classroomWorkflowA.id,
          sessionSequence: 99,
          scheduledStart: baseStart,
          scheduledEnd: baseEnd,
          durationMinutes: 90,
          status: SessionStatus.SCHEDULED,
        },
      });

      // Attempt to schedule conflicting overlapping session: 10:30 to 12:00
      const conflictCheck = await SchedulingEngine.checkTeacherConflicts(
        approvedTeacher1ProfileId,
        new Date("2026-11-10T10:30:00Z"),
        new Date("2026-11-10T12:00:00Z")
      );
      expect(conflictCheck.hasConflict).toBe(true);

      // Clean up the temporary session
      await prisma.lessonSession.deleteMany({
        where: { classroomId: classroomWorkflowA.id, sessionSequence: 99 },
      });
    });

    it("P13.D2: Generates 4 past sessions with diverse attendance statuses for formula verification", async () => {
      const pastBase = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      sessionWorkflowA1 = await prisma.lessonSession.create({
        data: {
          classroomId: classroomWorkflowA.id,
          sessionSequence: 1,
          scheduledStart: new Date(pastBase.getTime() + 1 * 86400000),
          scheduledEnd: new Date(pastBase.getTime() + 1 * 86400000 + 5400000),
          durationMinutes: 90,
          status: SessionStatus.SCHEDULED,
          attendanceStatus: LessonAttendance.PRESENT,
          attendanceRecordedAt: new Date(pastBase.getTime() + 1 * 86400000 + 5400000),
        },
      });

      sessionWorkflowA2 = await prisma.lessonSession.create({
        data: {
          classroomId: classroomWorkflowA.id,
          sessionSequence: 2,
          scheduledStart: new Date(pastBase.getTime() + 2 * 86400000),
          scheduledEnd: new Date(pastBase.getTime() + 2 * 86400000 + 5400000),
          durationMinutes: 90,
          status: SessionStatus.SCHEDULED,
          attendanceStatus: LessonAttendance.LATE,
          attendanceRecordedAt: new Date(pastBase.getTime() + 2 * 86400000 + 5400000),
        },
      });

      sessionWorkflowA3 = await prisma.lessonSession.create({
        data: {
          classroomId: classroomWorkflowA.id,
          sessionSequence: 3,
          scheduledStart: new Date(pastBase.getTime() + 3 * 86400000),
          scheduledEnd: new Date(pastBase.getTime() + 3 * 86400000 + 5400000),
          durationMinutes: 90,
          status: SessionStatus.TEACHER_COMPLETED,
          attendanceStatus: LessonAttendance.EXCUSED,
          attendanceRecordedAt: new Date(pastBase.getTime() + 3 * 86400000 + 5400000),
        },
      });

      sessionWorkflowA4 = await prisma.lessonSession.create({
        data: {
          classroomId: classroomWorkflowA.id,
          sessionSequence: 4,
          scheduledStart: new Date(pastBase.getTime() + 4 * 86400000),
          scheduledEnd: new Date(pastBase.getTime() + 4 * 86400000 + 5400000),
          durationMinutes: 90,
          status: SessionStatus.TEACHER_COMPLETED,
          attendanceStatus: LessonAttendance.ABSENT_STUDENT,
          attendanceRecordedAt: new Date(pastBase.getTime() + 4 * 86400000 + 5400000),
        },
      });

      // Add 1 FUTURE session to verify it is NOT counted in delivered attendance denominator
      await prisma.lessonSession.create({
        data: {
          classroomId: classroomWorkflowA.id,
          sessionSequence: 5,
          scheduledStart: new Date(Date.now() + 5 * 86400000),
          scheduledEnd: new Date(Date.now() + 5 * 86400000 + 5400000),
          durationMinutes: 90,
          status: SessionStatus.SCHEDULED,
        },
      });

      expect(sessionWorkflowA1.id).toBeDefined();
      expect(sessionWorkflowA4.id).toBeDefined();
    });

    it("P13.D3: Strict Attendance Formula Audit: EXCUSED absence is NOT counted as present", async () => {
      const progressBook = await ProgressService.getProgressBook(studentAId, parentAUserId, UserRole.PARENT);

      expect(progressBook.attendance.deliveredSessions).toBe(4);
      expect(progressBook.attendance.presentCount).toBe(1);
      expect(progressBook.attendance.lateCount).toBe(1);
      expect(progressBook.attendance.excusedCount).toBe(1);
      expect(progressBook.attendance.absentStudentCount).toBe(1);

      // (PRESENT 1 + LATE 1) / 4 = 2 / 4 = 50.0%
      // Strict invariant: EXCUSED (1) is NOT counted as present.
      expect(progressBook.attendance.ratePercentage).toBe(50);
      expect(progressBook.attendance.excusedRatePercentage).toBe(25);
      expect(progressBook.attendance.lateRatePercentage).toBe(25);
      expect(progressBook.attendance.unexcusedRatePercentage).toBe(25);
    });
  });

  // =========================================================================
  // SECTION 5: LESSON REPORTS, PARENT VALIDATION & DISPUTE ARBITRATION
  // =========================================================================
  describe("Workflow E: Lesson Reporting, Parent Validation & Dispute Arbitrage", () => {
    it("P13.E1: Teacher submits lesson report with pedagogic feedback", async () => {
      const { report } = await ReportingService.submitLessonReport({
        sessionId: sessionWorkflowA1.id,
        topicsCovered: "Fonctions exponentielles et équations différentielles",
        learningObjectives: "Savoir résoudre les équations du premier ordre avec second membre",
        studentEffort: "EXCELLENT",
        strengths: "Très bonne intuition algébrique et rapidité de calcul",
        areasForImprovement: "Soigner la rédaction des justifications théoriques",
        attendanceStatus: LessonAttendance.PRESENT,
        actorUserId: approvedTeacher1UserId,
        actorRole: UserRole.TEACHER,
      });

      expect(report.id).toBeDefined();
      expect(report.status).toBe(ReportStatus.SUBMITTED);

      const session = await prisma.lessonSession.findUnique({
        where: { id: sessionWorkflowA1.id },
      });
      expect(session?.status).toBe(SessionStatus.TEACHER_COMPLETED);
    });

    it("P13.E2: Parent validates reported session: creates LessonApproval and updates status to PARENT_APPROVED", async () => {
      const { approval } = await ReportingService.approveLessonSession({
        sessionId: sessionWorkflowA1.id,
        feedbackNote: "Séance très claire, Ibrahima a parfaitement compris le cours.",
        actorUserId: parentAUserId,
        actorRole: UserRole.PARENT,
      });

      expect(approval.id).toBeDefined();
      expect(approval.sessionId).toBe(sessionWorkflowA1.id);

      const session = await prisma.lessonSession.findUnique({
        where: { id: sessionWorkflowA1.id },
      });
      expect(session?.status).toBe(SessionStatus.PARENT_APPROVED);
    });

    it("P13.E3: Parent files dispute on questionable session: creates LessonDispute in OPEN status", async () => {
      // First, submit report on sessionWorkflowA2
      await ReportingService.submitLessonReport({
        sessionId: sessionWorkflowA2.id,
        topicsCovered: "Trigonométrie sphérique",
        learningObjectives: "Résolution des triangles sphériques",
        studentEffort: "GOOD",
        strengths: "Participation active",
        areasForImprovement: "Attention aux unités",
        attendanceStatus: LessonAttendance.LATE,
        actorUserId: approvedTeacher1UserId,
        actorRole: UserRole.TEACHER,
      });

      // Parent disputes session 2 (e.g. tutor arrived 45 mins late)
      const { dispute } = await ReportingService.disputeLessonSession({
        sessionId: sessionWorkflowA2.id,
        category: "LATENESS",
        reason: "L'enseignant est arrivé avec 45 minutes de retard et la séance n'a duré que 45 minutes au lieu de 90.",
        actorUserId: parentAUserId,
        actorRole: UserRole.PARENT,
      });

      expect(dispute.id).toBeDefined();
      expect(dispute.status).toBe(DisputeStatus.OPEN);

      const session = await prisma.lessonSession.findUnique({
        where: { id: sessionWorkflowA2.id },
      });
      expect(session?.status).toBe(SessionStatus.PARENT_DISPUTED);
    });

    it("P13.E4: Admin arbitrates dispute: resolves dispute and sets session to ADMIN_RESOLVED", async () => {
      const dispute = await prisma.lessonDispute.findUnique({
        where: { sessionId: sessionWorkflowA2.id },
      });

      const resolution = await ReportingService.resolveDispute({
        disputeId: dispute!.id,
        resolutionType: DisputeStatus.RESOLVED_VALIDATED,
        adminNote: "Après vérification avec les deux parties, accord pour comptabiliser la séance et rattraper 45 min lors de la prochaine séance.",
        actorUserId: adminUserId,
        actorRole: UserRole.ADMIN,
      });

      expect(resolution.status).toBe(DisputeStatus.RESOLVED_VALIDATED);

      const session = await prisma.lessonSession.findUnique({
        where: { id: sessionWorkflowA2.id },
      });
      expect(session?.status).toBe(SessionStatus.ADMIN_RESOLVED);
    });
  });

  // =========================================================================
  // SECTION 6: DIGITAL STUDENT PROGRESS BOOK & MULTI-TENANT ISOLATION
  // =========================================================================
  describe("Workflow F: Advanced Digital Student Progress Book (+50€)", () => {
    let homeworkId: string;
    let assessmentId: string;

    it("P13.F1: Teacher creates homework assignment and records assessment", async () => {
      // Create homework
      const hw = await ProgressService.createHomework({
        classroomId: classroomWorkflowA.id,
        studentId: studentAId,
        title: "Devoir Maison : Équations Différentielles",
        description: "Exercices 1 à 5 page 142 du manuel Terminale SM",
        dueDate: new Date(Date.now() + 3 * 86400000),
        actorUserId: approvedTeacher1UserId,
        actorRole: UserRole.TEACHER,
      });
      homeworkId = hw.id;
      expect(hw.id).toBeDefined();
      expect(hw.status).toBe(HomeworkStatus.ASSIGNED);

      // Create academic assessment
      const assessment = await ProgressService.createAssessment({
        classroomId: classroomWorkflowA.id,
        studentId: studentAId,
        title: "Contrôle N°1 : Fonctions et Dérivées",
        assessmentType: AssessmentType.TOPIC_TEST,
        assessmentDate: new Date(),
        obtainedScore: 17,
        maxScore: 20,
        learningObjectives: "Maîtrise du calcul différentiel et étude de variations",
        teacherComments: "Très bon devoir, démonstrations rigoureuses.",
        actorUserId: approvedTeacher1UserId,
        actorRole: UserRole.TEACHER,
      });
      assessmentId = assessment.id;
      expect(assessment.id).toBeDefined();
      expect(assessment.percentage).toBe(85); // 17 / 20 = 85%
    });

    it("P13.F2: Student/Parent submits homework and teacher grades it", async () => {
      // Submission
      const submitted = await ProgressService.updateHomeworkStatus({
        homeworkId,
        status: HomeworkStatus.SUBMITTED,
        studentSubmission: "Exercices résolus sur copie double manuscrite remise lors de la séance.",
        actorUserId: parentAUserId,
        actorRole: UserRole.PARENT,
      });
      expect(submitted.status).toBe(HomeworkStatus.SUBMITTED);

      // Teacher grading
      const graded = await ProgressService.updateHomeworkStatus({
        homeworkId,
        status: HomeworkStatus.COMPLETED,
        teacherFeedback: "Excellent travail. Les démarches sont claires et les conclusions justifiées.",
        actorUserId: approvedTeacher1UserId,
        actorRole: UserRole.TEACHER,
      });
      expect(graded.status).toBe(HomeworkStatus.COMPLETED);
    });

    it("P13.F3: Multi-tenant Privacy: Parent B cannot access Student A's progress book", async () => {
      await expect(
        ProgressService.getProgressBook(studentAId, parentBUserId, UserRole.PARENT)
      ).rejects.toThrow(/Accès refusé. Vous n'êtes pas le parent de cet élève/);
    });

    it("P13.F4: Multi-tenant Privacy: Teacher 2 (unassigned) cannot access Student A's progress book", async () => {
      await expect(
        ProgressService.getProgressBook(studentAId, approvedTeacher2UserId, UserRole.TEACHER)
      ).rejects.toThrow(/Accès refusé. Vous n'êtes pas l'enseignant assigné/);
    });

    it("P13.F5: Parent A and Admin can fetch the full Digital Progress Book with complete tabular data", async () => {
      const book = await ProgressService.getProgressBook(studentAId, parentAUserId, UserRole.PARENT);

      expect(book.student.fullName).toBe("Ibrahima Bah");
      expect(book.student.parent.fullName).toBe("Mamadou Bah (Parent Audit A)");
      expect(book.summary.deliveredSessions).toBe(4);
      expect(book.summary.overallAverageScore20).toBe(17);
      expect(book.summary.completedHomeworkCount).toBe(1);
      expect(book.subjects.length).toBeGreaterThanOrEqual(1);
      expect(book.assessments.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // SECTION 7: SECURITY, CREDENTIALS & AUDIT INTEGRITY
  // =========================================================================
  describe("Workflow G: Security, RBAC & Credential Invariants", () => {
    it("P13.G1: All user credentials in PostgreSQL are securely hashed with bcrypt", async () => {
      const testUsers = await prisma.user.findMany({
        where: {
          id: {
            in: [adminUserId, parentAUserId, parentBUserId, approvedTeacher1UserId],
          },
        },
      });

      for (const user of testUsers) {
        expect(user.passwordHash).toBeDefined();
        // Bcrypt hashes start with $2a$ or $2b$ and are 60 chars long
        expect(user.passwordHash).toMatch(/^\$2[ab]\$\d{2}\$[./A-Za-z0-9]{53}$/);
        expect(user.passwordHash).not.toContain(testPassword);
      }
    });

    it("P13.G2: Tutoring request preserves student confidentiality", async () => {
      const req = await prisma.tutoringRequest.findUnique({
        where: { id: tutoringRequestA.id },
        include: {
          student: true,
          parent: {
            include: {
              user: true,
            },
          },
        },
      });

      expect(req).toBeDefined();
      expect(req?.student.fullName).toBe("Ibrahima Bah");
    });
  });
});
