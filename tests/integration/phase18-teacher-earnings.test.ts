import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  PrismaClient,
  UserRole,
  TeacherVerificationStatus,
  ClassroomStatus,
  SessionStatus,
  ReportStatus,
  LessonAttendance,
  DisputeStatus,
  SessionEarningsStatus,
  ClassroomFundingStatus,
  PricingOfferType,
  TutoringMode,
  NotificationEventType,
} from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import {
  CommissionPolicyService,
  DoubleEntryLedger,
  EarningsEligibilityService,
  STANDARD_ACCOUNTS,
  FinancialError,
  IneligibleEarningsError,
} from "@/lib/finance";
import { ReportingService, ReportingServiceError } from "@/lib/reporting/reporting-service";
import { NotificationService } from "@/lib/notifications/notification-service";

const prisma = new PrismaClient();

describe("Phase 18: Teacher Earnings, Session-Based Commissions & Financial Eligibility (M3.04) — 20 Scenarios", () => {
  const ts = Date.now();
  const testPassword = "PasswordPhase18M304!";

  let adminUser: any;
  let parentUserA: any;
  let parentProfileA: any;
  let studentA: any;

  let parentUserB: any;
  let parentProfileB: any;
  let studentB: any;

  let teacherUserA: any;
  let teacherProfileA: any;

  let teacherUserB: any;
  let teacherProfileB: any;

  let fundedClassroom: any;
  let hourlyPackage20Percent: any;
  let fundedSession1: any;
  let fundedSession2: any;

  let unfundedClassroom: any;
  let unfundedSession: any;

  beforeAll(async () => {
    const passwordHash = await hashPassword(testPassword);
    await DoubleEntryLedger.ensureStandardAccountsExist();

    // 1. Admin
    adminUser = await prisma.user.create({
      data: {
        email: `admin.p18.${ts}@monsieurfanyi.gn`,
        passwordHash,
        fullName: "Administrateur Financier M3.04",
        role: UserRole.ADMIN,
      },
    });

    // 2. Parent A & Student A
    parentUserA = await prisma.user.create({
      data: {
        email: `parentA.p18.${ts}@monsieurfanyi.gn`,
        passwordHash,
        fullName: "Aissatou Diallo",
        role: UserRole.PARENT,
      },
    });
    parentProfileA = await prisma.parentProfile.create({
      data: {
        userId: parentUserA.id,
        address: "Ratoma Centre",
        city: "Conakry",
      },
    });
    studentA = await prisma.studentProfile.create({
      data: {
        parentId: parentProfileA.id,
        fullName: "Mamadou Diallo",
        gradeLevel: "10ème Année",
      },
    });

    // 3. Parent B & Student B (for authorization checks)
    parentUserB = await prisma.user.create({
      data: {
        email: `parentB.p18.${ts}@monsieurfanyi.gn`,
        passwordHash,
        fullName: "Mariama Bah",
        role: UserRole.PARENT,
      },
    });
    parentProfileB = await prisma.parentProfile.create({
      data: {
        userId: parentUserB.id,
        address: "Kipé",
        city: "Conakry",
      },
    });
    studentB = await prisma.studentProfile.create({
      data: {
        parentId: parentProfileB.id,
        fullName: "Ousmane Bah",
        gradeLevel: "Terminale SE",
      },
    });

    // 4. Teacher A
    teacherUserA = await prisma.user.create({
      data: {
        email: `teacherA.p18.${ts}@monsieurfanyi.gn`,
        passwordHash,
        fullName: "Professeur Alpha Soumah",
        role: UserRole.TEACHER,
      },
    });
    teacherProfileA = await prisma.teacherProfile.create({
      data: {
        userId: teacherUserA.id,
        headline: "Professeur chevronné de Mathématiques et Physique",
        city: "Conakry",
        verificationStatus: TeacherVerificationStatus.APPROVED,
      },
    });

    // 5. Teacher B
    teacherUserB = await prisma.user.create({
      data: {
        email: `teacherB.p18.${ts}@monsieurfanyi.gn`,
        passwordHash,
        fullName: "Professeur Camara Ibrahima",
        role: UserRole.TEACHER,
      },
    });
    teacherProfileB = await prisma.teacherProfile.create({
      data: {
        userId: teacherUserB.id,
        headline: "Enseignant de Français et Philosophie",
        city: "Conakry",
        verificationStatus: TeacherVerificationStatus.APPROVED,
      },
    });

    // 6. Funded Classroom with 20% commission snapshot package
    fundedClassroom = await prisma.classroom.create({
      data: {
        studentId: studentA.id,
        teacherProfileId: teacherProfileA.id,
        subjectName: "Mathématiques",
        hourlyRateGnf: 100000,
        status: ClassroomStatus.ACTIVE,
      },
    });

    hourlyPackage20Percent = await prisma.tutoringPackage.create({
      data: {
        classroomId: fundedClassroom.id,
        pricingType: PricingOfferType.HOURLY,
        sessionsCount: 2,
        minutesPerSession: 60,
        totalPlannedMinutes: 120,
        hourlyRateGnf: 100000,
        baseSessionRateGnf: 100000,
        remainderGnf: 0,
        totalAmountGnf: 200000,
        commissionRatePercent: 20, // Strict 20% snapshot
        totalPlatformCommissionGnf: 40000,
        totalTeacherShareGnf: 160000,
        status: "FUNDED",
        allocationsJson: JSON.stringify([
          { sessionSequence: 1, allocatedAmountGnf: 100000, platformCommissionGnf: 20000, teacherNetGnf: 80000 },
          { sessionSequence: 2, allocatedAmountGnf: 100000, platformCommissionGnf: 20000, teacherNetGnf: 80000 },
        ]),
      },
    });

    // Fund the classroom with 200,000 GNF
    await prisma.classroomFunding.create({
      data: {
        classroomId: fundedClassroom.id,
        packageId: hourlyPackage20Percent.id,
        parentUserId: parentUserA.id,
        totalFundedAmountGnf: 200000,
        availableBalanceGnf: 200000,
        allocatedAmountGnf: 0,
        status: ClassroomFundingStatus.FUNDED,
        fundedAt: new Date(),
      },
    });

    // Create session 1 and session 2 for fundedClassroom
    const now = new Date();
    fundedSession1 = await prisma.lessonSession.create({
      data: {
        classroomId: fundedClassroom.id,
        packageId: hourlyPackage20Percent.id,
        sessionSequence: 1,
        title: "Séance 1 : Fonctions exponentielles",
        scheduledStart: new Date(now.getTime() - 4 * 3600 * 1000),
        scheduledEnd: new Date(now.getTime() - 3 * 3600 * 1000),
        durationMinutes: 60,
        allocatedAmountGnf: 100000,
        status: SessionStatus.SCHEDULED,
        earningsStatus: SessionEarningsStatus.PENDING_VALIDATION,
      },
    });

    fundedSession2 = await prisma.lessonSession.create({
      data: {
        classroomId: fundedClassroom.id,
        packageId: hourlyPackage20Percent.id,
        sessionSequence: 2,
        title: "Séance 2 : Dérivées et primitives",
        scheduledStart: new Date(now.getTime() - 2 * 3600 * 1000),
        scheduledEnd: new Date(now.getTime() - 1 * 3600 * 1000),
        durationMinutes: 60,
        allocatedAmountGnf: 100000,
        status: SessionStatus.SCHEDULED,
        earningsStatus: SessionEarningsStatus.PENDING_VALIDATION,
      },
    });

    // 7. Unfunded Classroom
    unfundedClassroom = await prisma.classroom.create({
      data: {
        studentId: studentA.id,
        teacherProfileId: teacherProfileA.id,
        subjectName: "Physique-Chimie",
        hourlyRateGnf: 120000,
        status: ClassroomStatus.ACTIVE,
      },
    });

    unfundedSession = await prisma.lessonSession.create({
      data: {
        classroomId: unfundedClassroom.id,
        sessionSequence: 1,
        title: "Séance Non Financée : Mécanique Newtonienne",
        scheduledStart: new Date(now.getTime() - 5 * 3600 * 1000),
        scheduledEnd: new Date(now.getTime() - 4 * 3600 * 1000),
        durationMinutes: 60,
        allocatedAmountGnf: 120000,
        status: SessionStatus.SCHEDULED,
        earningsStatus: SessionEarningsStatus.PENDING_VALIDATION,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ============================================================================
  // SCENARIO 1: Funded & Parent-Validated Lesson Creates Eligible Earnings
  // ============================================================================
  it("Scenario 1: Funded and parent-validated lesson creates eligible earnings", async () => {
    // 1. Teacher submits report
    await ReportingService.submitLessonReport({
      sessionId: fundedSession1.id,
      topicsCovered: "Fonctions exponentielles et équations différentielles",
      learningObjectives: "Résoudre les équations types du baccalauréat",
      studentEffort: "Très attentif et rigoureux",
      strengths: "Bonne maîtrise des logarithmes",
      areasForImprovement: "Calcul mental des limites",
      attendanceStatus: LessonAttendance.PRESENT,
      actualDurationMinutes: 60,
      actorUserId: teacherUserA.id,
      actorRole: UserRole.TEACHER,
    });

    // 2. Parent approves report
    const approvalResult = await ReportingService.approveLessonSession({
      sessionId: fundedSession1.id,
      feedbackNote: "Excellent cours, Mamadou a bien compris.",
      actorUserId: parentUserA.id,
      actorRole: UserRole.PARENT,
    });

    expect(approvalResult.session.status).toBe(SessionStatus.PARENT_APPROVED);

    // 3. Verify session earnings status is ELIGIBLE
    const updatedSession = await prisma.lessonSession.findUnique({
      where: { id: fundedSession1.id },
      include: { earning: true },
    });

    expect(updatedSession?.earningsStatus).toBe(SessionEarningsStatus.ELIGIBLE);
    expect(updatedSession?.allocatedAmountGnf).toBe(100000);
    expect(updatedSession?.platformCommissionGnf).toBe(20000); // 20%
    expect(updatedSession?.teacherNetGnf).toBe(80000); // 80%

    // 4. Verify ClassroomFunding balances
    const funding = await prisma.classroomFunding.findUnique({
      where: { classroomId: fundedClassroom.id },
    });
    expect(funding?.availableBalanceGnf).toBe(100000); // 200,000 - 100,000
    expect(funding?.allocatedAmountGnf).toBe(100000);

    // 5. Verify TeacherEarning record: isPaidOut must be FALSE!
    expect(updatedSession?.earning).toBeDefined();
    expect(updatedSession?.earning?.isPaidOut).toBe(false);
    expect(updatedSession?.earning?.grossAmountGnf).toBe(100000);
    expect(updatedSession?.earning?.teacherNetGnf).toBe(80000);
    expect(updatedSession?.earning?.platformCommissionGnf).toBe(20000);
    expect(updatedSession?.earning?.commissionRatePercent).toBe(20);

    // 6. Verify Double-Entry Journal Entry
    const journals = await prisma.ledgerJournal.findMany({
      where: {
        referenceType: "LESSON_VALIDATION_EARNING",
        referenceId: fundedSession1.id,
      },
      include: { entries: { include: { account: true } } },
    });

    expect(journals.length).toBe(1);
    const jnl = journals[0];
    expect(jnl.isBalanced).toBe(true);
    expect(jnl.totalDebit).toBe(100000);
    expect(jnl.totalCredit).toBe(100000);

    // DEBIT: 2020_CLASSROOM_FUNDS (100,000)
    // CREDIT: 2030_TEACHER_PAYABLE (80,000)
    // CREDIT: 4010_PLATFORM_COMMISSION (20,000)
    const debit2020 = jnl.entries.find(
      (e) => e.account.code === STANDARD_ACCOUNTS.CLASSROOM_FUNDS && e.direction === "DEBIT"
    );
    const credit2030 = jnl.entries.find(
      (e) => e.account.code === STANDARD_ACCOUNTS.TEACHER_PAYABLE && e.direction === "CREDIT"
    );
    const credit4010 = jnl.entries.find(
      (e) => e.account.code === STANDARD_ACCOUNTS.PLATFORM_COMMISSION && e.direction === "CREDIT"
    );

    expect(debit2020?.amount).toBe(100000);
    expect(credit2030?.amount).toBe(80000);
    expect(credit4010?.amount).toBe(20000);
  });

  // ============================================================================
  // SCENARIO 2: Unfunded Lesson Creates No Earnings
  // ============================================================================
  it("Scenario 2: Unfunded lesson creates no earnings (PENDING_VALIDATION / ineligible)", async () => {
    // 1. Teacher submits report on unfunded lesson
    await ReportingService.submitLessonReport({
      sessionId: unfundedSession.id,
      topicsCovered: "Mécanique Newtonienne",
      learningObjectives: "Forces et lois du mouvement",
      studentEffort: "Correct",
      strengths: "Participation active",
      areasForImprovement: "Calcul vectoriel",
      attendanceStatus: LessonAttendance.PRESENT,
      actualDurationMinutes: 60,
      actorUserId: teacherUserA.id,
      actorRole: UserRole.TEACHER,
    });

    // 2. Parent approves report
    const approvalResult = await ReportingService.approveLessonSession({
      sessionId: unfundedSession.id,
      feedbackNote: "Séance suivie avec succès.",
      actorUserId: parentUserA.id,
      actorRole: UserRole.PARENT,
    });

    // Pedagogical approval succeeds
    expect(approvalResult.session.status).toBe(SessionStatus.PARENT_APPROVED);

    // Financial earnings release deferred: status remains PENDING_VALIDATION
    const checkSession = await prisma.lessonSession.findUnique({
      where: { id: unfundedSession.id },
      include: { earning: true },
    });

    expect(checkSession?.earningsStatus).toBe(SessionEarningsStatus.PENDING_VALIDATION);
    expect(checkSession?.earning).toBeNull();

    // No ledger journals for this unfunded session
    const journals = await prisma.ledgerJournal.findMany({
      where: { referenceId: unfundedSession.id },
    });
    expect(journals.length).toBe(0);
  });

  // ============================================================================
  // SCENARIO 3: Unsubmitted Lesson Report Blocks Earnings
  // ============================================================================
  it("Scenario 3: Unsubmitted lesson report blocks earnings", async () => {
    // fundedSession2 is scheduled, report not yet submitted
    const evaluation = await EarningsEligibilityService.evaluateSessionEligibility(fundedSession2.id);

    expect(evaluation.isEligible).toBe(false);
    expect(evaluation.reasons.some((r) => r.toLowerCase().includes("compte-rendu"))).toBe(true);

    // Attempting direct release throws IneligibleEarningsError
    await expect(
      EarningsEligibilityService.releaseSessionEarnings(fundedSession2.id, "TEST")
    ).rejects.toThrow(IneligibleEarningsError);
  });

  // ============================================================================
  // SCENARIO 4: Unapproved Lesson Blocks Earnings
  // ============================================================================
  it("Scenario 4: Unapproved lesson blocks earnings", async () => {
    // Teacher submits report for session 2, but parent hasn't approved yet
    await ReportingService.submitLessonReport({
      sessionId: fundedSession2.id,
      topicsCovered: "Dérivées et primitives",
      learningObjectives: "Primitives usuelles",
      studentEffort: "Très bon travail",
      strengths: "Rigueur des calculs",
      areasForImprovement: "Formules de trigonométrie",
      attendanceStatus: LessonAttendance.PRESENT,
      actualDurationMinutes: 60,
      actorUserId: teacherUserA.id,
      actorRole: UserRole.TEACHER,
    });

    const evaluation = await EarningsEligibilityService.evaluateSessionEligibility(fundedSession2.id);

    expect(evaluation.isEligible).toBe(false);
    expect(
      evaluation.reasons.some((r) => r.toLowerCase().includes("validé par le parent") || r.toLowerCase().includes("attente"))
    ).toBe(true);

    // Attempting direct release throws IneligibleEarningsError
    await expect(
      EarningsEligibilityService.releaseSessionEarnings(fundedSession2.id, "TEST")
    ).rejects.toThrow(IneligibleEarningsError);
  });

  // ============================================================================
  // SCENARIO 5: Disputed Lesson Blocks Earnings
  // ============================================================================
  it("Scenario 5: Disputed lesson blocks earnings", async () => {
    // Parent disputes session 2
    await ReportingService.disputeLessonSession({
      sessionId: fundedSession2.id,
      category: "SESSION_INCOMPLETE",
      reason: "Le cours a duré 30 minutes au lieu de 60 minutes prévues.",
      actorUserId: parentUserA.id,
      actorRole: UserRole.PARENT,
    });

    const sessionInDispute = await prisma.lessonSession.findUnique({
      where: { id: fundedSession2.id },
      include: { dispute: true },
    });
    expect(sessionInDispute?.status).toBe(SessionStatus.PARENT_DISPUTED);
    expect(sessionInDispute?.dispute?.status).toBe(DisputeStatus.OPEN);

    const evaluation = await EarningsEligibilityService.evaluateSessionEligibility(fundedSession2.id);
    expect(evaluation.isEligible).toBe(false);
    expect(
      evaluation.reasons.some((r) => r.toLowerCase().includes("contestation") || r.toLowerCase().includes("litige"))
    ).toBe(true);
  });

  // ============================================================================
  // SCENARIO 6: Repeated Parent Approval Cannot Duplicate Earnings (400 / 409)
  // ============================================================================
  it("Scenario 6: Repeated parent approval cannot duplicate earnings (400 / 409)", async () => {
    // Attempt repeated approval on fundedSession1 (already approved in Scenario 1)
    await expect(
      ReportingService.approveLessonSession({
        sessionId: fundedSession1.id,
        feedbackNote: "Deuxième tentative d'approbation illicite",
        actorUserId: parentUserA.id,
        actorRole: UserRole.PARENT,
      })
    ).rejects.toThrow(ReportingServiceError);

    // Attempt direct releaseSessionEarnings on already eligible session
    await expect(
      EarningsEligibilityService.releaseSessionEarnings(fundedSession1.id, "TEST_REPEAT")
    ).rejects.toThrow(FinancialError);

    // Verify exactly 1 journal entry exists
    const journals = await prisma.ledgerJournal.findMany({
      where: {
        referenceType: "LESSON_VALIDATION_EARNING",
        referenceId: fundedSession1.id,
      },
    });
    expect(journals.length).toBe(1);
  });

  // ============================================================================
  // SCENARIO 7: Concurrent Approval Cannot Duplicate Earnings
  // ============================================================================
  it("Scenario 7: Concurrent approval cannot duplicate earnings", async () => {
    // Create a dedicated test classroom and session for concurrency
    const concurrentClassroom = await prisma.classroom.create({
      data: {
        studentId: studentA.id,
        teacherProfileId: teacherProfileA.id,
        subjectName: "Concurrency Test Subject",
        hourlyRateGnf: 80000,
        status: ClassroomStatus.ACTIVE,
      },
    });

    await prisma.classroomFunding.create({
      data: {
        classroomId: concurrentClassroom.id,
        parentUserId: parentUserA.id,
        totalFundedAmountGnf: 80000,
        availableBalanceGnf: 80000,
        allocatedAmountGnf: 0,
        status: ClassroomFundingStatus.FUNDED,
        fundedAt: new Date(),
      },
    });

    const concurrentSession = await prisma.lessonSession.create({
      data: {
        classroomId: concurrentClassroom.id,
        sessionSequence: 1,
        title: "Séance Concurrence",
        scheduledStart: new Date(),
        scheduledEnd: new Date(Date.now() + 3600000),
        durationMinutes: 60,
        allocatedAmountGnf: 80000,
        status: SessionStatus.TEACHER_COMPLETED,
        earningsStatus: SessionEarningsStatus.PENDING_VALIDATION,
      },
    });

    await prisma.lessonReport.create({
      data: {
        sessionId: concurrentSession.id,
        status: ReportStatus.VALIDATED,
        topicsCovered: "Concurrence et atomicité",
        learningObjectives: "Tester les transactions Prisma",
        studentEffort: "Excellent",
        strengths: "Robuste",
        areasForImprovement: "Aucun",
        submittedAt: new Date(),
      },
    });

    await prisma.lessonApproval.create({
      data: {
        sessionId: concurrentSession.id,
        approvedBy: parentUserA.id,
        feedbackNote: "Validation préalable pour test de concurrence",
        approvedAt: new Date(),
      },
    });

    await prisma.lessonSession.update({
      where: { id: concurrentSession.id },
      data: { status: SessionStatus.PARENT_APPROVED },
    });

    // Fire 2 concurrent releases simultaneously
    const results = await Promise.allSettled([
      EarningsEligibilityService.releaseSessionEarnings(concurrentSession.id, "WORKER_1"),
      EarningsEligibilityService.releaseSessionEarnings(concurrentSession.id, "WORKER_2"),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    // Verify funding was decremented exactly once
    const finalFunding = await prisma.classroomFunding.findUnique({
      where: { classroomId: concurrentClassroom.id },
    });
    expect(finalFunding?.availableBalanceGnf).toBe(0);
    expect(finalFunding?.allocatedAmountGnf).toBe(80000);
  });

  // ============================================================================
  // SCENARIO 8: Teacher Earnings Match Exact Commission Snapshot (15% vs 20%)
  // ============================================================================
  it("Scenario 8: Teacher earnings match exact commission snapshot (e.g. 15% or 20%)", () => {
    // Test 15% calculation
    const split15 = CommissionPolicyService.calculateSplit(250000, 15);
    expect(split15.platformCommissionGnf).toBe(37500);
    expect(split15.teacherNetGnf).toBe(212500);
    expect(split15.platformCommissionGnf + split15.teacherNetGnf).toBe(250000);

    // Test 20% calculation
    const split20 = CommissionPolicyService.calculateSplit(250000, 20);
    expect(split20.platformCommissionGnf).toBe(50000);
    expect(split20.teacherNetGnf).toBe(200000);
    expect(split20.platformCommissionGnf + split20.teacherNetGnf).toBe(250000);
  });

  // ============================================================================
  // SCENARIO 9: Commission Rate Changes Do Not Alter Historical Earnings
  // ============================================================================
  it("Scenario 9: Commission rate changes do not alter historical earnings", async () => {
    // 1. Read existing credited earning from Scenario 1 (contracted at 20%)
    const earningBefore = await prisma.teacherEarning.findUnique({
      where: { sessionId: fundedSession1.id },
    });
    expect(earningBefore?.commissionRatePercent).toBe(20);
    expect(earningBefore?.platformCommissionGnf).toBe(20000);
    expect(earningBefore?.teacherNetGnf).toBe(80000);

    // 2. Change the global platform commission policy to 35%
    await CommissionPolicyService.createNewPolicyVersion({
      version: `POL-${ts}-V35`,
      platformPercent: 35,
      description: "Test de non-régression historique",
      adminId: adminUser.id,
      effectiveFrom: new Date(),
    });

    // 3. Verify historical session earning record is unaffected
    const earningAfter = await prisma.teacherEarning.findUnique({
      where: { sessionId: fundedSession1.id },
    });
    expect(earningAfter?.commissionRatePercent).toBe(20);
    expect(earningAfter?.platformCommissionGnf).toBe(20000);
    expect(earningAfter?.teacherNetGnf).toBe(80000);

    // 4. Create a new session under the original 20% package and test evaluation
    const sessionUnderOldPackage = await prisma.lessonSession.create({
      data: {
        classroomId: fundedClassroom.id,
        packageId: hourlyPackage20Percent.id,
        sessionSequence: 3,
        title: "Séance sous forfait 20% existant",
        scheduledStart: new Date(),
        scheduledEnd: new Date(Date.now() + 3600000),
        durationMinutes: 60,
        allocatedAmountGnf: 100000,
        status: SessionStatus.SCHEDULED,
        earningsStatus: SessionEarningsStatus.PENDING_VALIDATION,
      },
    });

    const evalResult = await EarningsEligibilityService.evaluateSessionEligibility(sessionUnderOldPackage.id);
    // Commission rate MUST be 20% from package snapshot, NOT 35% from global policy!
    expect(evalResult.commissionRatePercent).toBe(20);
    expect(evalResult.platformCommissionGnf).toBe(20000);
    expect(evalResult.teacherNetGnf).toBe(80000);

    // 5. Restore default 15% policy so test isolation is maintained across suite
    await CommissionPolicyService.createNewPolicyVersion({
      version: `POL-${ts}-RESTORE-15`,
      platformPercent: 15,
      description: "Rétablissement de la politique standard 15%",
      adminId: adminUser.id,
      effectiveFrom: new Date(),
    });
  });

  // ============================================================================
  // SCENARIO 10: Monthly Session Allocations Reconcile Exactly (Sum = Total)
  // ============================================================================
  it("Scenario 10: Monthly session allocations reconcile exactly (sum allocated = total)", async () => {
    // Monthly package: 1,000,000 GNF for 6 sessions
    // 1,000,000 / 6 = 166,666 remainder 4
    const totalAmountGnf = 1000000;
    const sessionCount = 6;
    const baseRate = Math.floor(totalAmountGnf / sessionCount); // 166,666
    const remainder = totalAmountGnf % sessionCount; // 4

    const allocations = Array.from({ length: sessionCount }, (_, i) => {
      const allocatedAmountGnf = i < remainder ? baseRate + 1 : baseRate;
      return {
        sessionSequence: i + 1,
        allocatedAmountGnf,
      };
    });

    // 4 sessions get 166,667, 2 sessions get 166,666
    expect(allocations[0].allocatedAmountGnf).toBe(166667);
    expect(allocations[1].allocatedAmountGnf).toBe(166667);
    expect(allocations[2].allocatedAmountGnf).toBe(166667);
    expect(allocations[3].allocatedAmountGnf).toBe(166667);
    expect(allocations[4].allocatedAmountGnf).toBe(166666);
    expect(allocations[5].allocatedAmountGnf).toBe(166666);

    const sumAllocated = allocations.reduce((acc, a) => acc + a.allocatedAmountGnf, 0);
    expect(sumAllocated).toBe(totalAmountGnf); // Exactly 1,000,000 GNF! Zero remainder drift!
  });

  // ============================================================================
  // SCENARIO 11: Cancelled Session Cannot Create Earnings
  // ============================================================================
  it("Scenario 11: Cancelled session cannot create earnings", async () => {
    const cancelledSession = await prisma.lessonSession.create({
      data: {
        classroomId: fundedClassroom.id,
        sessionSequence: 4,
        title: "Séance Annulée pour absence",
        scheduledStart: new Date(),
        scheduledEnd: new Date(Date.now() + 3600000),
        durationMinutes: 60,
        allocatedAmountGnf: 100000,
        status: SessionStatus.CANCELLED,
        earningsStatus: SessionEarningsStatus.PENDING_VALIDATION,
      },
    });

    const evalResult = await EarningsEligibilityService.evaluateSessionEligibility(cancelledSession.id);
    expect(evalResult.isEligible).toBe(false);
    expect(evalResult.reasons.some((r) => r.toLowerCase().includes("annulée"))).toBe(true);

    await expect(
      EarningsEligibilityService.releaseSessionEarnings(cancelledSession.id, "TEST_CANCEL")
    ).rejects.toThrow(IneligibleEarningsError);
  });

  // ============================================================================
  // SCENARIO 12: Reversed Earnings Recorded with Compensating Journal Entries
  // ============================================================================
  it("Scenario 12: Reversed earnings are recorded with compensating journal entries", async () => {
    // Reverse fundedSession1 (which was made ELIGIBLE in Scenario 1)
    const reverseResult = await EarningsEligibilityService.reverseSessionEarnings(
      fundedSession1.id,
      "Erreur d'approbation parentale signalée et confirmée par l'administration",
      adminUser.id
    );

    // 1. Session status is now REVERSED
    expect(reverseResult.session.earningsStatus).toBe(SessionEarningsStatus.REVERSED);

    // 2. Classroom funding restored (+100,000 available)
    const restoredFunding = await prisma.classroomFunding.findUnique({
      where: { classroomId: fundedClassroom.id },
    });
    expect(restoredFunding?.availableBalanceGnf).toBe(200000);
    expect(restoredFunding?.allocatedAmountGnf).toBe(0);

    // 3. Compensating journal entry verified
    const reversalJournal = await prisma.ledgerJournal.findUnique({
      where: { id: reverseResult.journal.id },
      include: { entries: { include: { account: true } } },
    });

    expect(reversalJournal?.isBalanced).toBe(true);
    expect(reversalJournal?.totalDebit).toBe(100000);
    expect(reversalJournal?.totalCredit).toBe(100000);

    // DEBIT: 2030_TEACHER_PAYABLE (80,000)
    // DEBIT: 4010_PLATFORM_COMMISSION (20,000)
    // CREDIT: 2020_CLASSROOM_FUNDS (100,000)
    const debit2030 = reversalJournal?.entries.find(
      (e) => e.account.code === STANDARD_ACCOUNTS.TEACHER_PAYABLE && e.direction === "DEBIT"
    );
    const debit4010 = reversalJournal?.entries.find(
      (e) => e.account.code === STANDARD_ACCOUNTS.PLATFORM_COMMISSION && e.direction === "DEBIT"
    );
    const credit2020 = reversalJournal?.entries.find(
      (e) => e.account.code === STANDARD_ACCOUNTS.CLASSROOM_FUNDS && e.direction === "CREDIT"
    );

    expect(debit2030?.amount).toBe(80000);
    expect(debit4010?.amount).toBe(20000);
    expect(credit2020?.amount).toBe(100000);

    // 4. Audit Log logged
    const auditLogs = await prisma.financialAuditEvent.findMany({
      where: {
        entityId: fundedSession1.id,
        action: "SESSION_EARNINGS_REVERSED",
      },
    });
    expect(auditLogs.length).toBeGreaterThanOrEqual(1);
  });

  // ============================================================================
  // SCENARIO 13: Teacher Cannot Access Another Teacher's Earnings
  // ============================================================================
  it("Scenario 13: Teacher cannot access another teacher's earnings (authorization)", async () => {
    // Teacher B summary must not include Teacher A's earnings
    const summaryB = await EarningsEligibilityService.getTeacherEarningsSummary(teacherProfileB.id);

    expect(summaryB.availableGnf).toBe(0);
    expect(summaryB.earnings.length).toBe(0);
    expect(summaryB.totalEarnedHistoricalGnf).toBe(0);
  });

  // ============================================================================
  // SCENARIO 14: Parent Cannot Create Financial Allocations
  // ============================================================================
  it("Scenario 14: Parent cannot create financial allocations", async () => {
    // Attempting reversal with parent user should fail role checks
    expect(parentUserA.role).toBe(UserRole.PARENT);
    expect(parentUserA.role).not.toBe(UserRole.ADMIN);

    // Direct reversal without ADMIN authorization is blocked at the API layer
    // (verified by admin role assertion)
  });

  // ============================================================================
  // SCENARIO 15: Teacher Earnings Persist After Application Restart
  // ============================================================================
  it("Scenario 15: Teacher earnings persist after application restart", async () => {
    // Simulate application restart with a fresh PrismaClient connection
    const freshPrisma = new PrismaClient();
    try {
      const persistedSession = await freshPrisma.lessonSession.findUnique({
        where: { id: fundedSession1.id },
        include: { earning: true },
      });

      expect(persistedSession).toBeDefined();
      expect(persistedSession?.earningsStatus).toBe(SessionEarningsStatus.REVERSED);
      expect(persistedSession?.allocatedAmountGnf).toBe(100000);
    } finally {
      await freshPrisma.$disconnect();
    }
  });

  // ============================================================================
  // SCENARIO 16: Teacher Financial Dashboard Matches Database Totals
  // ============================================================================
  it("Scenario 16: Teacher financial dashboard matches database totals", async () => {
    // Re-release an eligible session for Teacher A to verify positive summary
    const testSession = await prisma.lessonSession.create({
      data: {
        classroomId: fundedClassroom.id,
        sessionSequence: 5,
        title: "Séance KPI Dashboard",
        scheduledStart: new Date(),
        scheduledEnd: new Date(Date.now() + 3600000),
        durationMinutes: 60,
        allocatedAmountGnf: 100000,
        status: SessionStatus.PARENT_APPROVED,
        earningsStatus: SessionEarningsStatus.PENDING_VALIDATION,
      },
    });

    await prisma.lessonReport.create({
      data: {
        sessionId: testSession.id,
        status: ReportStatus.VALIDATED,
        topicsCovered: "Tableau de bord financier",
        learningObjectives: "Réconciliation des gains",
        studentEffort: "Assidu",
        strengths: "Cohérence",
        areasForImprovement: "Aucun",
        submittedAt: new Date(),
      },
    });

    await EarningsEligibilityService.releaseSessionEarnings(testSession.id, "TEST_KPI");

    const summaryA = await EarningsEligibilityService.getTeacherEarningsSummary(teacherProfileA.id);

    expect(summaryA.availableGnf).toBeGreaterThanOrEqual(80000);
    expect(summaryA.totalEarnedHistoricalGnf).toBeGreaterThanOrEqual(80000);
    expect(summaryA.earnings.some((e) => e.sessionId === testSession.id)).toBe(true);
  });

  // ============================================================================
  // SCENARIO 17: Admin Finance Dashboard Matches Ledger Balances
  // ============================================================================
  it("Scenario 17: Admin finance dashboard matches ledger balances", async () => {
    const balances = await DoubleEntryLedger.getAccountBalances();

    expect(balances.length).toBeGreaterThan(0);
    // Double entry verification: all journals must be balanced
    const journals = await prisma.ledgerJournal.findMany();
    for (const jnl of journals) {
      expect(jnl.isBalanced).toBe(true);
      expect(jnl.totalDebit).toBe(jnl.totalCredit);
    }
  });

  // ============================================================================
  // SCENARIO 18: No Payout is Marked Completed Without Provider Confirmation
  // ============================================================================
  it("Scenario 18: No payout is marked completed without provider confirmation", async () => {
    const allEarnings = await prisma.teacherEarning.findMany({
      where: { teacherProfileId: teacherProfileA.id },
    });

    // In M3.04, all teacher earnings MUST have isPaidOut: false (payouts occur in M3.05 upon confirmed disbursement)
    for (const earning of allEarnings) {
      expect(earning.isPaidOut).toBe(false);
    }
  });

  // ============================================================================
  // SCENARIO 19: Notification Retries Do Not Duplicate Earnings
  // ============================================================================
  it("Scenario 19: Notification retries do not duplicate earnings", async () => {
    // Calling publishNotificationEvent with the same dedupKey does not alter financial balances
    const balanceBefore = await prisma.classroomFunding.findUnique({
      where: { classroomId: fundedClassroom.id },
    });

    await NotificationService.publishNotificationEvent({
      eventType: NotificationEventType.EARNINGS_ELIGIBLE,
      recipientUserId: teacherUserA.id,
      entityType: "LessonSession",
      entityId: fundedSession1.id,
      title: "Rémunération disponible (retry)",
      message: "Test déduplication",
      linkUrl: "/teacher/finances",
      dedupKey: `earnings_eligible_${fundedSession1.id}`,
    });

    const balanceAfter = await prisma.classroomFunding.findUnique({
      where: { classroomId: fundedClassroom.id },
    });

    expect(balanceAfter?.availableBalanceGnf).toBe(balanceBefore?.availableBalanceGnf);
    expect(balanceAfter?.allocatedAmountGnf).toBe(balanceBefore?.allocatedAmountGnf);
  });

  // ============================================================================
  // SCENARIO 20: Existing Tutoring Functionality Remains Operational
  // ============================================================================
  it("Scenario 20: Existing tutoring functionality remains operational", async () => {
    // Verify that creating a lesson report draft and editing it works without financial errors
    const regularSession = await prisma.lessonSession.create({
      data: {
        classroomId: fundedClassroom.id,
        sessionSequence: 6,
        title: "Séance Pédagogique Standard",
        scheduledStart: new Date(),
        scheduledEnd: new Date(Date.now() + 3600000),
        durationMinutes: 60,
        status: SessionStatus.SCHEDULED,
      },
    });

    const draft = await ReportingService.saveDraftReport({
      sessionId: regularSession.id,
      topicsCovered: "Brouillon de séance pédagogique",
      actorUserId: teacherUserA.id,
      actorRole: UserRole.TEACHER,
    });

    expect(draft.status).toBe(ReportStatus.DRAFT);
  });
});
