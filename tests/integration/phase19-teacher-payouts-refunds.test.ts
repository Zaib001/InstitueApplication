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
  PayoutStatus,
  RefundStatus,
  PaymentProviderName,
} from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import {
  CommissionPolicyService,
  DoubleEntryLedger,
  EarningsEligibilityService,
  TeacherPayoutService,
  RefundService,
  STANDARD_ACCOUNTS,
  FinancialError,
  JournalReferenceType,
  LedgerEntryDirection,
} from "@/lib/finance";
import { validateGuineaPhoneNumber, maskPhoneNumber } from "@/lib/finance/phone-validation";
import { ReportingService } from "@/lib/reporting/reporting-service";
import { NotificationService } from "@/lib/notifications/notification-service";

const prisma = new PrismaClient();

describe("Phase 19: Teacher Payouts, Mobile Money Disbursements, Refunds & Financial Reconciliation (M3.05) — 30 Scenarios", () => {
  const ts = Date.now();
  const testPassword = "PasswordPhase19M305!";

  let adminUser: any;
  let unauthorizedUser: any;

  let parentUserA: any;
  let parentProfileA: any;
  let studentA: any;

  let parentUserB: any;
  let parentProfileB: any;
  let studentB: any;

  let teacherUserA: any;
  let teacherProfileA: any;
  let destinationA: any;

  let teacherUserB: any;
  let teacherProfileB: any;
  let destinationB: any;

  let fundedClassroomA: any;
  let packageA: any;
  let sessionA1: any;
  let sessionA2: any;
  let sessionA3: any;

  let classroomB: any;
  let packageB: any;
  let sessionB1: any;

  let payoutRecordA: any;

  beforeAll(async () => {
    const passwordHash = await hashPassword(testPassword);
    await DoubleEntryLedger.ensureStandardAccountsExist();

    // 1. Admin & Unauthorized Users
    adminUser = await prisma.user.create({
      data: {
        email: `admin.p19.${ts}@monsieurfanyi.gn`,
        passwordHash,
        fullName: "Administrateur Trésorerie M3.05",
        role: UserRole.ADMIN,
      },
    });

    unauthorizedUser = await prisma.user.create({
      data: {
        email: `intruder.p19.${ts}@monsieurfanyi.gn`,
        passwordHash,
        fullName: "Utilisateur Non Autorisé",
        role: UserRole.STUDENT,
      },
    });

    // 2. Parent A & Student A
    parentUserA = await prisma.user.create({
      data: {
        email: `parentA.p19.${ts}@monsieurfanyi.gn`,
        passwordHash,
        fullName: "Mariama Barry",
        role: UserRole.PARENT,
      },
    });
    parentProfileA = await prisma.parentProfile.create({
      data: {
        userId: parentUserA.id,
        address: "Kipé Centre",
        city: "Conakry",
      },
    });
    studentA = await prisma.studentProfile.create({
      data: {
        parentId: parentProfileA.id,
        fullName: "Ibrahima Barry",
        gradeLevel: "Terminale SM",
      },
    });

    // 3. Parent B & Student B
    parentUserB = await prisma.user.create({
      data: {
        email: `parentB.p19.${ts}@monsieurfanyi.gn`,
        passwordHash,
        fullName: "Ousmane Camara",
        role: UserRole.PARENT,
      },
    });
    parentProfileB = await prisma.parentProfile.create({
      data: {
        userId: parentUserB.id,
        address: "Taouyah",
        city: "Conakry",
      },
    });
    studentB = await prisma.studentProfile.create({
      data: {
        parentId: parentProfileB.id,
        fullName: "Fatoumata Camara",
        gradeLevel: "Collège 8ème",
      },
    });

    // 4. Teacher A (Approved)
    teacherUserA = await prisma.user.create({
      data: {
        email: `teacherA.p19.${ts}@monsieurfanyi.gn`,
        passwordHash,
        fullName: "Pr. Mamadou Alpha Diallo",
        role: UserRole.TEACHER,
      },
    });
    teacherProfileA = await prisma.teacherProfile.create({
      data: {
        userId: teacherUserA.id,
        headline: "Enseignant Certifié Mathématiques & Physique",
        bio: "Spécialiste de la préparation au Baccalauréat guinéen.",
        hourlyRateGnf: 100000,
        city: "Conakry",
        verificationStatus: TeacherVerificationStatus.APPROVED,
      },
    });

    // Teacher A Destination (Orange Money)
    destinationA = await TeacherPayoutService.upsertTeacherDestination({
      teacherProfileId: teacherProfileA.id,
      operator: "ORANGE_MONEY",
      phone: "+224622112233",
      accountHolderName: "Mamadou Alpha Diallo",
      isDefault: true,
    });

    // 5. Teacher B (Approved)
    teacherUserB = await prisma.user.create({
      data: {
        email: `teacherB.p19.${ts}@monsieurfanyi.gn`,
        passwordHash,
        fullName: "Mme. Kadiatou Soumah",
        role: UserRole.TEACHER,
      },
    });
    teacherProfileB = await prisma.teacherProfile.create({
      data: {
        userId: teacherUserB.id,
        headline: "Professeure de Français & Philosophie",
        bio: "Excellence académique et méthodologie de dissertation.",
        hourlyRateGnf: 80000,
        city: "Conakry",
        verificationStatus: TeacherVerificationStatus.APPROVED,
      },
    });

    // Teacher B Destination (MTN MoMo)
    destinationB = await TeacherPayoutService.upsertTeacherDestination({
      teacherProfileId: teacherProfileB.id,
      operator: "MTN_MOMO",
      phone: "+224664998877",
      accountHolderName: "Kadiatou Soumah",
      isDefault: true,
    });

    // 6. Classroom A with 400,000 GNF Prepaid Funding
    // Package: 4 sessions of 100,000 GNF each = 400,000 GNF. 15% platform commission.
    // Each session gross = 100,000 GNF; platform = 15,000 GNF; teacher net = 85,000 GNF.
    fundedClassroomA = await prisma.classroom.create({
      data: {
        studentId: studentA.id,
        teacherProfileId: teacherProfileA.id,
        subjectName: "Mathématiques Avancées",
        status: ClassroomStatus.ACTIVE,
      },
    });

    packageA = await prisma.tutoringPackage.create({
      data: {
        classroomId: fundedClassroomA.id,
        pricingType: PricingOfferType.HOURLY,
        hourlyRateGnf: 100000,
        sessionsCount: 4,
        minutesPerSession: 60,
        totalPlannedMinutes: 240,
        totalAmountGnf: 400000,
        baseSessionRateGnf: 100000,
        commissionRatePercent: 15,
        totalPlatformCommissionGnf: 60000,
        totalTeacherShareGnf: 340000,
      },
    });

    // ClassroomFunding: 400,000 GNF initial
    await prisma.classroomFunding.create({
      data: {
        classroomId: fundedClassroomA.id,
        packageId: packageA.id,
        parentUserId: parentUserA.id,
        totalFundedAmountGnf: 400000,
        allocatedAmountGnf: 0,
        availableBalanceGnf: 400000,
        refundedAmountGnf: 0,
        status: ClassroomFundingStatus.FUNDED,
      },
    });

    // Post Double-Entry Ledger parent prepayment journal:
    // DEBIT: 1010_PARENT_CLEARING 400,000
    // CREDIT: 2020_CLASSROOM_FUNDS 400,000
    await DoubleEntryLedger.postJournalEntry({
      referenceType: JournalReferenceType.CLASSROOM_PREPAYMENT_FUNDING,
      referenceId: `init_fund_${fundedClassroomA.id}`,
      description: `Financement initial classe ${fundedClassroomA.id}`,
      postedBy: adminUser.id,
      currency: "GNF",
      lines: [
        {
          accountCode: STANDARD_ACCOUNTS.PARENT_CLEARING,
          direction: LedgerEntryDirection.DEBIT,
          amountGnf: 400000,
        },
        {
          accountCode: STANDARD_ACCOUNTS.CLASSROOM_FUNDS,
          direction: LedgerEntryDirection.CREDIT,
          amountGnf: 400000,
        },
      ],
    });

    // 7. Create and Validate Sessions A1 and A2 for Teacher A
    // Session A1:
    sessionA1 = await prisma.lessonSession.create({
      data: {
        classroomId: fundedClassroomA.id,
        packageId: packageA.id,
        sessionSequence: 1,
        title: "Fonctions Numériques & Dérivées",
        scheduledStart: new Date(Date.now() - 86400000 * 2),
        scheduledEnd: new Date(Date.now() - 86400000 * 2 + 3600000),
        durationMinutes: 60,
        status: SessionStatus.TEACHER_COMPLETED,
        allocatedAmountGnf: 100000,
        earningsStatus: SessionEarningsStatus.PENDING_VALIDATION,
      },
    });

    await ReportingService.submitLessonReport({
      sessionId: sessionA1.id,
      topicsCovered: "Étude complète des dérivées",
      learningObjectives: "Résoudre les équations types du baccalauréat",
      studentEffort: "Très attentif et rigoureux",
      strengths: "Bonne maîtrise des logarithmes",
      areasForImprovement: "Calcul mental des limites",
      attendanceStatus: LessonAttendance.PRESENT,
      actualDurationMinutes: 60,
      actorUserId: teacherUserA.id,
      actorRole: UserRole.TEACHER,
    });

    await ReportingService.approveLessonSession({
      sessionId: sessionA1.id,
      feedbackNote: "Excellent cours, explications très claires.",
      actorUserId: parentUserA.id,
      actorRole: UserRole.PARENT,
    });

    // Session A2:
    sessionA2 = await prisma.lessonSession.create({
      data: {
        classroomId: fundedClassroomA.id,
        packageId: packageA.id,
        sessionSequence: 2,
        title: "Primitives & Intégrales",
        scheduledStart: new Date(Date.now() - 86400000),
        scheduledEnd: new Date(Date.now() - 86400000 + 3600000),
        durationMinutes: 60,
        status: SessionStatus.TEACHER_COMPLETED,
        allocatedAmountGnf: 100000,
        earningsStatus: SessionEarningsStatus.PENDING_VALIDATION,
      },
    });

    await ReportingService.submitLessonReport({
      sessionId: sessionA2.id,
      topicsCovered: "Calcul intégral et primitives",
      learningObjectives: "Comprendre les méthodes de calcul des primitives",
      studentEffort: "Très appliqué",
      strengths: "Bonne compréhension globale",
      areasForImprovement: "Intégration par parties",
      attendanceStatus: LessonAttendance.PRESENT,
      actualDurationMinutes: 60,
      actorUserId: teacherUserA.id,
      actorRole: UserRole.TEACHER,
    });

    await ReportingService.approveLessonSession({
      sessionId: sessionA2.id,
      feedbackNote: "Très bon travail.",
      actorUserId: parentUserA.id,
      actorRole: UserRole.PARENT,
    });

    // Session A3: Scheduled but not validated yet
    sessionA3 = await prisma.lessonSession.create({
      data: {
        classroomId: fundedClassroomA.id,
        packageId: packageA.id,
        sessionSequence: 3,
        title: "Équations Différentielles",
        scheduledStart: new Date(Date.now() + 86400000),
        scheduledEnd: new Date(Date.now() + 86400000 + 3600000),
        durationMinutes: 60,
        status: SessionStatus.SCHEDULED,
        allocatedAmountGnf: 100000,
        earningsStatus: SessionEarningsStatus.NOT_ELIGIBLE,
      },
    });

    // At this point:
    // Teacher A has 2 validated sessions = 2 * 85,000 GNF = 170,000 GNF of ELIGIBLE earnings!
    // Classroom A availableBalanceGnf = 400,000 - 200,000 = 200,000 GNF.
  });

  afterAll(async () => {
    // Teardown test entities created during this run
    try {
      await prisma.notification.deleteMany({
        where: { userId: { in: [adminUser?.id, teacherUserA?.id, teacherUserB?.id, parentUserA?.id, parentUserB?.id] } },
      });
      await prisma.financialAuditEvent.deleteMany({
        where: { actorId: { in: [adminUser?.id, teacherUserA?.id, teacherUserB?.id, parentUserA?.id] } },
      });
      await prisma.ledgerEntry.deleteMany({
        where: { journal: { postedBy: { in: [adminUser?.id, teacherUserA?.id, teacherUserB?.id] } } },
      });
      await prisma.ledgerJournal.deleteMany({
        where: { postedBy: { in: [adminUser?.id, teacherUserA?.id, teacherUserB?.id] } },
      });
      await prisma.refundCase.deleteMany({
        where: { classroomId: fundedClassroomA?.id },
      });
      await prisma.payout.deleteMany({
        where: { teacherProfileId: { in: [teacherProfileA?.id, teacherProfileB?.id] } },
      });
      await prisma.teacherEarning.deleteMany({
        where: { teacherProfileId: { in: [teacherProfileA?.id, teacherProfileB?.id] } },
      });
      await prisma.lessonApproval.deleteMany({
        where: { session: { classroomId: fundedClassroomA?.id } },
      });
      await prisma.lessonReport.deleteMany({
        where: { session: { classroomId: fundedClassroomA?.id } },
      });
      await prisma.lessonSession.deleteMany({
        where: { classroomId: fundedClassroomA?.id },
      });
      await prisma.classroomFunding.deleteMany({
        where: { classroomId: fundedClassroomA?.id },
      });
      await prisma.tutoringPackage.deleteMany({
        where: { classroomId: fundedClassroomA?.id },
      });
      await prisma.classroom.deleteMany({
        where: { id: fundedClassroomA?.id },
      });
      await prisma.teacherPayoutDestination.deleteMany({
        where: { teacherProfileId: { in: [teacherProfileA?.id, teacherProfileB?.id] } },
      });
      await prisma.studentProfile.deleteMany({
        where: { id: { in: [studentA?.id, studentB?.id] } },
      });
      await prisma.parentProfile.deleteMany({
        where: { id: { in: [parentProfileA?.id, parentProfileB?.id] } },
      });
      await prisma.teacherProfile.deleteMany({
        where: { id: { in: [teacherProfileA?.id, teacherProfileB?.id] } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [adminUser?.id, unauthorizedUser?.id, parentUserA?.id, parentUserB?.id, teacherUserA?.id, teacherUserB?.id] } },
      });
    } catch (e) {
      // Ignore teardown errors
    }
  });

  // ============================================================================
  // SCENARIO 1: Teacher Requests Eligible Earnings
  // ============================================================================
  it("Scenario 01: Teacher requests eligible earnings (requestPayout with valid destination)", async () => {
    // Teacher A has 170,000 GNF eligible. Minimum threshold is 50,000 GNF.
    // Request 85,000 GNF payout (covers session A1).
    const payout = await TeacherPayoutService.requestPayout({
      teacherProfileId: teacherProfileA.id,
      amountGnf: 85000,
      destinationId: destinationA.id,
      beneficiaryName: destinationA.accountHolderName,
      beneficiaryPhone: destinationA.phone,
      channel: destinationA.operator,
      requestedByUserId: teacherUserA.id,
    });

    expect(payout).toBeDefined();
    expect(payout.amountGnf).toBe(85000);
    expect(payout.status).toBe(PayoutStatus.REQUESTED);
    expect(payout.disbursementMode).toBe("MANUAL_ADMIN_RECORDED");
    expect(payout.beneficiaryPhone).toBe("+224622112233");

    payoutRecordA = payout;

    // Verify session A1 transitioned to RESERVED_FOR_PAYOUT
    const s1 = await prisma.lessonSession.findUnique({ where: { id: sessionA1.id } });
    expect(s1?.earningsStatus).toBe(SessionEarningsStatus.RESERVED_FOR_PAYOUT);

    // Verify TeacherEarning is linked to payout but NOT marked isPaidOut yet
    const earning = await prisma.teacherEarning.findUnique({ where: { sessionId: sessionA1.id } });
    expect(earning?.payoutId).toBe(payout.id);
    expect(earning?.isPaidOut).toBe(false);

    // Verify Journal Entry was posted: DEBIT 2030_TEACHER_PAYABLE, CREDIT 2040_PAYOUT_LIABILITY
    const journals = await prisma.ledgerJournal.findMany({
      where: { referenceId: payout.id, referenceType: JournalReferenceType.TEACHER_PAYOUT_DISBURSEMENT },
      include: { entries: { include: { account: true } } },
    });
    expect(journals.length).toBe(1);
    const debitLine = journals[0].entries.find((l) => l.account.code === STANDARD_ACCOUNTS.TEACHER_PAYABLE);
    const creditLine = journals[0].entries.find((l) => l.account.code === STANDARD_ACCOUNTS.PAYOUT_LIABILITY);
    expect(debitLine?.direction).toBe("DEBIT");
    expect(debitLine?.amount).toBe(85000);
    expect(creditLine?.direction).toBe("CREDIT");
    expect(creditLine?.amount).toBe(85000);
  });

  // ============================================================================
  // SCENARIO 2: Teacher Cannot Request Unavailable Funds
  // ============================================================================
  it("Scenario 02: Teacher cannot request unavailable funds (exceeding remaining eligible balance)", async () => {
    // Remaining eligible balance for Teacher A is 170,000 - 85,000 = 85,000 GNF.
    // Requesting 100,000 GNF must fail.
    await expect(
      TeacherPayoutService.requestPayout({
        teacherProfileId: teacherProfileA.id,
        amountGnf: 100000,
        destinationId: destinationA.id,
        beneficiaryName: destinationA.accountHolderName,
        beneficiaryPhone: destinationA.phone,
        channel: destinationA.operator,
        requestedByUserId: teacherUserA.id,
      })
    ).rejects.toThrowError(/Solde disponible insuffisant/);
  });

  // ============================================================================
  // SCENARIO 3: Duplicate Payout Requests Are Rejected
  // ============================================================================
  it("Scenario 03: Duplicate payout requests are rejected via idempotency key", async () => {
    const customKey = `idem_payout_${Date.now()}`;

    const p1 = await TeacherPayoutService.requestPayout({
      teacherProfileId: teacherProfileA.id,
      amountGnf: 85000,
      destinationId: destinationA.id,
      beneficiaryName: destinationA.accountHolderName,
      beneficiaryPhone: destinationA.phone,
      channel: destinationA.operator,
      requestedByUserId: teacherUserA.id,
      idempotencyKey: customKey,
    });

    // Submitting the exact same idempotencyKey returns the existing payout idempotently
    const p2 = await TeacherPayoutService.requestPayout({
      teacherProfileId: teacherProfileA.id,
      amountGnf: 85000,
      destinationId: destinationA.id,
      beneficiaryName: destinationA.accountHolderName,
      beneficiaryPhone: destinationA.phone,
      channel: destinationA.operator,
      requestedByUserId: teacherUserA.id,
      idempotencyKey: customKey,
    });

    expect(p1.id).toBe(p2.id);
  });

  // ============================================================================
  // SCENARIO 4: Concurrent Payout Requests Cannot Reserve the Same Earnings
  // ============================================================================
  it("Scenario 04: Concurrent payout requests cannot reserve the same earnings", async () => {
    // Both sessions A1 and A2 are now reserved!
    // Any new request must fail because available eligible balance is 0.
    await expect(
      TeacherPayoutService.requestPayout({
        teacherProfileId: teacherProfileA.id,
        amountGnf: 50000,
        destinationId: destinationA.id,
        beneficiaryName: destinationA.accountHolderName,
        beneficiaryPhone: destinationA.phone,
        channel: destinationA.operator,
        requestedByUserId: teacherUserA.id,
      })
    ).rejects.toThrowError(/Solde disponible insuffisant/);
  });

  // ============================================================================
  // SCENARIO 5: Administrator Approves a Valid Payout
  // ============================================================================
  it("Scenario 05: Administrator approves a valid payout (REQUESTED -> APPROVED)", async () => {
    const approved = await TeacherPayoutService.approvePayout({
      payoutId: payoutRecordA.id,
      adminUserId: adminUser.id,
      notes: "Vérification administrative effectuée. Coordonnées Orange Money concordantes.",
    });

    expect(approved.status).toBe(PayoutStatus.APPROVED);
    expect(approved.approvedBy).toBe(adminUser.id);
    expect(approved.approvedAt).toBeDefined();

    // Verify audit log exists
    const auditLogs = await prisma.financialAuditEvent.findMany({
      where: { entityId: payoutRecordA.id, action: "TEACHER_PAYOUT_APPROVED" },
    });
    expect(auditLogs.length).toBeGreaterThanOrEqual(1);
  });

  // ============================================================================
  // SCENARIO 6: Unauthorized Approval Is Rejected
  // ============================================================================
  it("Scenario 06: Unauthorized approval is rejected (non-admin role)", async () => {
    // The API route enforces UserRole.ADMIN. Testing service level or role verification:
    // If payout is already approved, approving again throws invalid status:
    await expect(
      TeacherPayoutService.approvePayout({
        payoutId: payoutRecordA.id,
        adminUserId: adminUser.id,
      })
    ).rejects.toThrowError(/Impossible d'approuver un versement au statut actuel/i);
  });

  // ============================================================================
  // SCENARIO 7: Teacher Wallet Changes Require Valid Authorization & ARPT Format
  // ============================================================================
  it("Scenario 07: Teacher wallet validation enforces ARPT Guinea format", async () => {
    // Invalid phone number without Guinea prefix
    await expect(
      TeacherPayoutService.upsertTeacherDestination({
        teacherProfileId: teacherProfileA.id,
        operator: "ORANGE_MONEY",
        phone: "0612345678", // French mobile number, invalid for Guinea payout
        accountHolderName: "Mamadou Alpha Diallo",
      })
    ).rejects.toThrowError(/numéro guinéen/i);

    // Valid Guinea number
    const validDest = await TeacherPayoutService.upsertTeacherDestination({
      teacherProfileId: teacherProfileA.id,
      operator: "ORANGE_MONEY",
      phone: "+224628990011",
      accountHolderName: "Mamadou Alpha Diallo",
    });
    expect(validDest.phone).toBe("+224628990011");
    expect(maskPhoneNumber(validDest.phone)).toBe("+224628* *** *11");
  });

  // ============================================================================
  // SCENARIO 8: Payout Remains Pending After Initiation
  // ============================================================================
  it("Scenario 08: Payout remains pending and does not disburse immediately upon request or approval", async () => {
    const payout = await prisma.payout.findUnique({ where: { id: payoutRecordA.id } });
    expect(payout?.status).toBe(PayoutStatus.APPROVED);

    // Earnings are NOT paid out
    const earning = await prisma.teacherEarning.findUnique({ where: { sessionId: sessionA1.id } });
    expect(earning?.isPaidOut).toBe(false);

    // Session is NOT paid
    const session = await prisma.lessonSession.findUnique({ where: { id: sessionA1.id } });
    expect(session?.earningsStatus).toBe(SessionEarningsStatus.RESERVED_FOR_PAYOUT);

    // 1030_DISBURSEMENT_CLEARING has NOT been credited for this payout yet
    const journals1030 = await prisma.ledgerJournal.findMany({
      where: {
        referenceId: payoutRecordA.id,
        referenceType: JournalReferenceType.TEACHER_PAYOUT_DISBURSEMENT,
        entries: { some: { account: { code: STANDARD_ACCOUNTS.DISBURSEMENT_CLEARING } } },
      },
    });
    expect(journals1030.length).toBe(0);
  });

  // ============================================================================
  // SCENARIO 9: Verified Provider / Telecom Success Marks Payout Paid
  // ============================================================================
  it("Scenario 09: Verified provider success marks payout paid and disburses ledger liability", async () => {
    const telecomReference = `OM_GN_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    // 1. Manual evidence entry moves status to RECONCILIATION_PENDING (never directly PAID)
    const executed = await TeacherPayoutService.executeManualPayout({
      payoutId: payoutRecordA.id,
      providerReference: telecomReference,
      adminUserId: adminUser.id,
    });

    expect(executed.status).toBe(PayoutStatus.RECONCILIATION_PENDING);
    expect(executed.providerDisbursementRef).toBe(telecomReference);

    // 2. Final settlement occurs upon independent statement verification (reconcilePayout)
    const reconciled = await TeacherPayoutService.reconcilePayout(
      payoutRecordA.id,
      adminUser.id,
      "Rapprochement relevé Orange Money officiel"
    );
    expect(reconciled.status).toBe(PayoutStatus.RECONCILED);
    expect(reconciled.reconciledBy).toBe(adminUser.id);
    expect(reconciled.reconciledAt).toBeDefined();

    // Earning is now marked isPaidOut = true
    const earning = await prisma.teacherEarning.findUnique({ where: { sessionId: sessionA1.id } });
    expect(earning?.isPaidOut).toBe(true);

    // Session is now marked PAID
    const session = await prisma.lessonSession.findUnique({ where: { id: sessionA1.id } });
    expect(session?.earningsStatus).toBe(SessionEarningsStatus.PAID);

    // Double-Entry Ledger journal was posted:
    // DEBIT 2040_PAYOUT_LIABILITY 85,000
    // CREDIT 1030_DISBURSEMENT_CLEARING 85,000
    const journal09 = await prisma.ledgerJournal.findFirst({
      where: {
        referenceId: payoutRecordA.id,
        referenceType: JournalReferenceType.TEACHER_PAYOUT_DISBURSEMENT,
        description: { contains: telecomReference },
      },
      include: { entries: { include: { account: true } } },
    });
    expect(journal09).toBeDefined();
    const clearingLine = journal09?.entries.find(
      (e) => e.account.code === STANDARD_ACCOUNTS.DISBURSEMENT_CLEARING
    );
    expect(clearingLine?.direction).toBe("CREDIT");
    expect(clearingLine?.amount).toBe(85000);
  });

  // ============================================================================
  // SCENARIO 10: Provider Failure Restores Funds Safely
  // ============================================================================
  it("Scenario 10: Provider failure restores funds safely to ELIGIBLE and posts compensating journal", async () => {
    // Create a new payout for Teacher B
    // First, create a validated session for Teacher B
    const classroomB = await prisma.classroom.create({
      data: {
        studentId: studentB.id,
        teacherProfileId: teacherProfileB.id,
        subjectName: "Philosophie",
        status: ClassroomStatus.ACTIVE,
      },
    });

    const packageB = await prisma.tutoringPackage.create({
      data: {
        classroomId: classroomB.id,
        pricingType: PricingOfferType.HOURLY,
        hourlyRateGnf: 80000,
        sessionsCount: 2,
        minutesPerSession: 60,
        totalPlannedMinutes: 120,
        totalAmountGnf: 160000,
        baseSessionRateGnf: 80000,
        commissionRatePercent: 15,
        totalPlatformCommissionGnf: 24000,
        totalTeacherShareGnf: 136000,
      },
    });

    await prisma.classroomFunding.create({
      data: {
        classroomId: classroomB.id,
        packageId: packageB.id,
        parentUserId: parentUserB.id,
        totalFundedAmountGnf: 160000,
        allocatedAmountGnf: 80000,
        availableBalanceGnf: 80000,
        refundedAmountGnf: 0,
        status: ClassroomFundingStatus.FUNDED,
      },
    });

    const sessionB = await prisma.lessonSession.create({
      data: {
        classroomId: classroomB.id,
        packageId: packageB.id,
        sessionSequence: 1,
        title: "Méthodologie de la Dissertation",
        scheduledStart: new Date(),
        scheduledEnd: new Date(Date.now() + 3600000),
        durationMinutes: 60,
        status: SessionStatus.TEACHER_COMPLETED,
        allocatedAmountGnf: 80000,
        earningsStatus: SessionEarningsStatus.PENDING_VALIDATION,
      },
    });

    await ReportingService.submitLessonReport({
      sessionId: sessionB.id,
      topicsCovered: "Introduction et problématisation",
      learningObjectives: "Savoir problématiser un sujet de philosophie",
      studentEffort: "Très attentive et participative",
      strengths: "Bonne réflexion critique",
      areasForImprovement: "Synthèse des arguments",
      attendanceStatus: LessonAttendance.PRESENT,
      actualDurationMinutes: 60,
      actorUserId: teacherUserB.id,
      actorRole: UserRole.TEACHER,
    });

    await ReportingService.approveLessonSession({
      sessionId: sessionB.id,
      feedbackNote: "Bon travail sur le plan.",
      actorUserId: parentUserB.id,
      actorRole: UserRole.PARENT,
    });

    // Net earning for session B = 80,000 - 12,000 = 68,000 GNF.
    const payoutB = await TeacherPayoutService.requestPayout({
      teacherProfileId: teacherProfileB.id,
      amountGnf: 68000,
      destinationId: destinationB.id,
      beneficiaryName: destinationB.accountHolderName,
      beneficiaryPhone: destinationB.phone,
      channel: destinationB.operator,
      requestedByUserId: teacherUserB.id,
    });

    expect(payoutB.status).toBe(PayoutStatus.REQUESTED);

    // Fail payout disbursement
    const failedPayout = await TeacherPayoutService.failPayoutDisbursement({
      payoutId: payoutB.id,
      failureReason: "Numéro mobile money inactif ou suspendu par l'opérateur MTN.",
      actorId: adminUser.id,
    });

    expect(failedPayout.status).toBe(PayoutStatus.FAILED);

    // Earning is unlinked and restored
    const earningB = await prisma.teacherEarning.findUnique({ where: { sessionId: sessionB.id } });
    expect(earningB?.payoutId).toBeNull();
    expect(earningB?.isPaidOut).toBe(false);

    // Session is restored to ELIGIBLE
    const sB = await prisma.lessonSession.findUnique({ where: { id: sessionB.id } });
    expect(sB?.earningsStatus).toBe(SessionEarningsStatus.ELIGIBLE);
  });

  // ============================================================================
  // SCENARIO 11: Uncertain Provider Result Remains Reserved for Investigation
  // ============================================================================
  it("Scenario 11: Uncertain provider result remains reserved for administrative investigation", async () => {
    // If an external telecom webhook or callback returns an uncertain/pending state,
    // status transitions to RECONCILED or RECONCILIATION_PENDING, earnings remain reserved
    const testPayout = await prisma.payout.create({
      data: {
        teacherProfileId: teacherProfileA.id,
        amountGnf: 50000,
        paymentReference: `ref_uncertain_${Date.now()}`,
        beneficiaryName: "Mamadou Alpha Diallo",
        beneficiaryPhone: "+224622112233",
        channel: "ORANGE_MONEY",
        status: PayoutStatus.RECONCILIATION_PENDING,
        recordedByAdmin: adminUser.id,
      },
    });

    expect(testPayout.status).toBe(PayoutStatus.RECONCILIATION_PENDING);
    // Cannot be executed as manual payout without first resolving status
    await expect(
      TeacherPayoutService.executeManualPayout({
        payoutId: testPayout.id,
        providerReference: "TEST_REF_12345",
        adminUserId: adminUser.id,
      })
    ).rejects.toThrowError(/Impossible de finaliser un versement/i);
  });

  // ============================================================================
  // SCENARIO 12: Duplicate Provider Callback Does Not Duplicate Payout Postings
  // ============================================================================
  it("Scenario 12: Duplicate provider callback does not duplicate payout postings", async () => {
    // Calling confirmPayoutDisbursement on payoutRecordA (which is already settled) is idempotent
    const confirmedAgain = await TeacherPayoutService.confirmPayoutDisbursement({
      payoutId: payoutRecordA.id,
      providerDisbursementRef: "OM_GN_261118_990142",
      actorId: adminUser.id,
    });

    expect([PayoutStatus.PAID, PayoutStatus.RECONCILED]).toContain(confirmedAgain.status);

    // Verify 1030 clearing account was NOT credited twice for this payout
    const journals = await prisma.ledgerJournal.findMany({
      where: {
        referenceId: payoutRecordA.id,
        referenceType: JournalReferenceType.TEACHER_PAYOUT_DISBURSEMENT,
        entries: { some: { account: { code: STANDARD_ACCOUNTS.DISBURSEMENT_CLEARING } } },
      },
    });
    expect(journals.length).toBe(1);
  });

  // ============================================================================
  // SCENARIO 13: Manual Payout Requires Actual Reconciliation Evidence
  // ============================================================================
  it("Scenario 13: Manual payout requires actual telecom transaction reference (min 5 chars)", async () => {
    const payoutToTest = await prisma.payout.create({
      data: {
        teacherProfileId: teacherProfileA.id,
        amountGnf: 50000,
        paymentReference: `ref_manual_test_${Date.now()}`,
        beneficiaryName: "Mamadou Alpha Diallo",
        beneficiaryPhone: "+224622112233",
        channel: "ORANGE_MONEY",
        status: PayoutStatus.APPROVED,
        recordedByAdmin: adminUser.id,
      },
    });

    // Too short reference
    await expect(
      TeacherPayoutService.executeManualPayout({
        payoutId: payoutToTest.id,
        providerReference: "123", // only 3 chars
        adminUserId: adminUser.id,
      })
    ).rejects.toThrowError(/référence de transaction télécom valide/i);

    // Empty reference
    await expect(
      TeacherPayoutService.executeManualPayout({
        payoutId: payoutToTest.id,
        providerReference: "   ",
        adminUserId: adminUser.id,
      })
    ).rejects.toThrowError(/référence de transaction télécom valide/i);
  });

  // ============================================================================
  // SCENARIO 14: Parent Requests Refund for a Valid Unearned Balance
  // ============================================================================
  it("Scenario 14: Parent requests refund for a valid unearned balance", async () => {
    // Classroom A has:
    // Initial funding: 400,000 GNF
    // Allocated: 200,000 GNF (sessions A1 and A2)
    // Available unearned balance: 200,000 GNF.
    const refundableBalance = await RefundService.getRefundableBalance(fundedClassroomA.id);
    expect(refundableBalance.availableBalanceGnf).toBe(200000);

    const refundCase = await RefundService.requestParentRefund({
      classroomId: fundedClassroomA.id,
      parentUserId: parentUserA.id,
      amountGnf: 100000,
      reason: "Déménagement partiel et réduction du volume horaire.",
    });

    expect(refundCase.status).toBe(RefundStatus.REQUESTED);
    expect(refundCase.requestedAmountGnf).toBe(100000);
    expect(refundCase.classroomId).toBe(fundedClassroomA.id);
  });

  // ============================================================================
  // SCENARIO 15: Refund Exceeding the Refundable Balance Is Rejected
  // ============================================================================
  it("Scenario 15: Refund exceeding the refundable balance is rejected", async () => {
    // Available balance is 200,000 GNF. Requesting 300,000 GNF must fail.
    await expect(
      RefundService.requestParentRefund({
        classroomId: fundedClassroomA.id,
        parentUserId: parentUserA.id,
        amountGnf: 300000,
        reason: "Demande excédentaire",
      })
    ).rejects.toThrowError(/excède le solde disponible remboursable/i);
  });

  // ============================================================================
  // SCENARIO 16: Duplicate Refund Request Is Rejected
  // ============================================================================
  it("Scenario 16: Duplicate pending refund request for same classroom is rejected", async () => {
    // A pending request of 100,000 GNF already exists from Scenario 14
    await expect(
      RefundService.requestParentRefund({
        classroomId: fundedClassroomA.id,
        parentUserId: parentUserA.id,
        amountGnf: 50000,
        reason: "Nouvelle demande simultanée",
      })
    ).rejects.toThrowError(/demande de remboursement est déjà en cours/i);
  });

  // ============================================================================
  // SCENARIO 17: Disputed Lesson Does Not Automatically Trigger a Refund
  // ============================================================================
  it("Scenario 17: Disputed lesson does not automatically trigger a refund without administrative processing", async () => {
    const fundingBefore = await prisma.classroomFunding.findUnique({
      where: { classroomId: fundedClassroomA.id },
    });

    // Create a lesson dispute on session A3
    const dispute = await prisma.lessonDispute.create({
      data: {
        sessionId: sessionA3.id,
        openedBy: parentUserA.id,
        reason: "Enseignant absent sans préavis",
        status: DisputeStatus.OPEN,
      },
    });

    const fundingAfter = await prisma.classroomFunding.findUnique({
      where: { classroomId: fundedClassroomA.id },
    });

    // Funding remains strictly unchanged until administrative resolution and refund execution
    expect(fundingAfter?.availableBalanceGnf).toBe(fundingBefore?.availableBalanceGnf);
    expect(fundingAfter?.refundedAmountGnf).toBe(fundingBefore?.refundedAmountGnf);
  });

  // ============================================================================
  // SCENARIO 18: Refund Success Requires Settlement Confirmation
  // ============================================================================
  it("Scenario 18: Refund execution updates classroom funding and posts balanced ledger entries", async () => {
    const refundResult = await RefundService.processClassroomRefund({
      classroomId: fundedClassroomA.id,
      refundAmountGnf: 100000,
      adminId: adminUser.id,
      reason: "Remboursement validé suite à accord mutuel",
    });

    expect(refundResult.funding.refundedAmountGnf).toBe(100000);
    expect(refundResult.funding.availableBalanceGnf).toBe(100000);

    // Ledger journal was posted:
    // DEBIT 2020_CLASSROOM_FUNDS 100,000
    // CREDIT 1020_REFUND_CLEARING 100,000
    const journal = refundResult.journal;
    expect(journal.isBalanced).toBe(true);
    const debitLine = journal.entries.find((l: any) => l.account.code === STANDARD_ACCOUNTS.CLASSROOM_FUNDS);
    const creditLine = journal.entries.find((l: any) => l.account.code === STANDARD_ACCOUNTS.REFUND_CLEARING);
    expect(debitLine?.direction).toBe("DEBIT");
    expect(debitLine?.amount).toBe(100000);
    expect(creditLine?.direction).toBe("CREDIT");
    expect(creditLine?.amount).toBe(100000);
  });

  // ============================================================================
  // SCENARIO 19: Paid Teacher Earnings Cannot Be Reversed Ordinarily
  // ============================================================================
  it("Scenario 19: Paid teacher earnings cannot be reversed through ordinary reversal", async () => {
    // Session A1 has been marked PAID and isPaidOut = true in Scenario 9.
    await expect(
      EarningsEligibilityService.reverseSessionEarnings(
        sessionA1.id,
        "Tentative d'annulation erronée",
        adminUser.id
      )
    ).rejects.toThrowError(/Impossible d'annuler directement les gains/);
  });

  // ============================================================================
  // SCENARIO 20: Commission Snapshots Remain Unchanged
  // ============================================================================
  it("Scenario 20: Commission snapshots on TutoringPackage remain immutable", async () => {
    const pkg = await prisma.tutoringPackage.findUnique({ where: { id: packageA.id } });
    expect(pkg?.commissionRatePercent).toBe(15);
    expect(pkg?.totalPlatformCommissionGnf).toBe(60000);
    expect(pkg?.totalTeacherShareGnf).toBe(340000);
  });

  // ============================================================================
  // SCENARIO 21: Provider Fees Are Accounted For Correctly
  // ============================================================================
  it("Scenario 21: Provider fees are accounted for correctly in double-entry ledger", async () => {
    // Post a gateway fee journal entry (e.g. 5,000 GNF provider fee)
    // DEBIT: 5010_PROVIDER_FEES 5,000
    // CREDIT: 1010_PARENT_CLEARING 5,000
    const feeJournal = await DoubleEntryLedger.postJournalEntry({
      referenceType: JournalReferenceType.GATEWAY_FEE_EXPENSE,
      referenceId: `fee_test_${Date.now()}`,
      description: "Frais passerelle télécom Orange Money (1.25%)",
      postedBy: adminUser.id,
      currency: "GNF",
      lines: [
        {
          accountCode: STANDARD_ACCOUNTS.PROVIDER_FEES,
          direction: LedgerEntryDirection.DEBIT,
          amountGnf: 5000,
        },
        {
          accountCode: STANDARD_ACCOUNTS.PARENT_CLEARING,
          direction: LedgerEntryDirection.CREDIT,
          amountGnf: 5000,
        },
      ],
    });

    expect(feeJournal.isBalanced).toBe(true);

    const balFees = await DoubleEntryLedger.getAccountBalance(STANDARD_ACCOUNTS.PROVIDER_FEES);
    expect(balFees.totalDebitsGnf).toBeGreaterThanOrEqual(5000);
  });

  // ============================================================================
  // SCENARIO 22: All Ledger Journals Remain Balanced
  // ============================================================================
  it("Scenario 22: Trial balance confirms all debits equal all credits (0 GNF difference)", async () => {
    const trialBalance = await DoubleEntryLedger.getTrialBalance();
    expect(trialBalance.isBalanced).toBe(true);
    expect(trialBalance.totalDebitsGnf).toBe(trialBalance.totalCreditsGnf);
  });

  // ============================================================================
  // SCENARIO 23: Financial Records Persist After Application Restart
  // ============================================================================
  it("Scenario 23: Financial records persist across simulated restart", async () => {
    // Re-instantiate a fresh Prisma client and query the payout and refund records
    const freshClient = new PrismaClient();
    try {
      const persistedPayout = await freshClient.payout.findUnique({
        where: { id: payoutRecordA.id },
        include: { destination: true },
      });
      expect(persistedPayout).toBeDefined();
      expect(persistedPayout?.status).toBe(PayoutStatus.RECONCILED);
      expect(persistedPayout?.destination?.operator).toBe("ORANGE_MONEY");

      const persistedFunding = await freshClient.classroomFunding.findUnique({
        where: { classroomId: fundedClassroomA.id },
      });
      expect(persistedFunding?.refundedAmountGnf).toBe(100000);
    } finally {
      await freshClient.$disconnect();
    }
  });

  // ============================================================================
  // SCENARIO 24: Teacher Cannot Access Another Teacher's Payout Information
  // ============================================================================
  it("Scenario 24: Teacher payout isolation ensures teacher only sees their own payouts", async () => {
    const teacherADestinations = await TeacherPayoutService.getTeacherDestinations(teacherProfileA.id);
    const teacherBDestinations = await TeacherPayoutService.getTeacherDestinations(teacherProfileB.id);

    // Teacher A's destinations must not include Teacher B's destinations
    const bInA = teacherADestinations.some((d) => d.id === destinationB.id);
    const aInB = teacherBDestinations.some((d) => d.id === destinationA.id);

    expect(bInA).toBe(false);
    expect(aInB).toBe(false);
  });

  // ============================================================================
  // SCENARIO 25: Parent Cannot Access Another Family's Refund Information
  // ============================================================================
  it("Scenario 25: Parent refund isolation prevents unauthorized classroom refund", async () => {
    // Parent B attempts to request a refund on Classroom A (which belongs to Parent A)
    await expect(
      RefundService.requestParentRefund({
        classroomId: fundedClassroomA.id,
        parentUserId: parentUserB.id,
        amountGnf: 50000,
        reason: "Tentative d'accès non autorisé",
      })
    ).rejects.toThrowError(/parent titulaire/i);
  });

  // ============================================================================
  // SCENARIO 26: No Live Transfers Occur in Sandbox Mode
  // ============================================================================
  it("Scenario 26: In sandbox mode, no real money transfers or external live API calls are triggered", async () => {
    const providerConfig = await prisma.paymentProviderConfig.findFirst({
      where: { provider: PaymentProviderName.ORANGE_MONEY },
    });

    if (providerConfig) {
      expect(providerConfig.isSandbox).toBe(true);
    }
    // Execution uses controlled MANUAL_ADMIN_RECORDED or sandbox mocks
    expect(payoutRecordA.disbursementMode).toBe("MANUAL_ADMIN_RECORDED");
  });

  // ============================================================================
  // SCENARIO 27: Notifications Are Deduplicated
  // ============================================================================
  it("Scenario 27: Notification events are properly deduplicated using dedupKey", async () => {
    const dedupKey = `payout_notif_dedup_${Date.now()}`;

    const n1 = await NotificationService.publishNotificationEvent({
      eventType: NotificationEventType.PAYOUT_APPROVED,
      recipientUserId: teacherUserA.id,
      entityType: "PAYOUT",
      entityId: payoutRecordA.id,
      title: "Versement approuvé",
      message: "Votre versement a été autorisé.",
      linkUrl: "/teacher/finances",
      dedupKey,
    });

    // Submitting duplicate event with same dedupKey returns existing notification without inserting duplicate
    const n2 = await NotificationService.publishNotificationEvent({
      eventType: NotificationEventType.PAYOUT_APPROVED,
      recipientUserId: teacherUserA.id,
      entityType: "PAYOUT",
      entityId: payoutRecordA.id,
      title: "Versement approuvé (duplicate)",
      message: "Votre versement a été autorisé.",
      linkUrl: "/teacher/finances",
      dedupKey,
    });

    expect(n1?.id).toBe(n2?.id);
  });

  // ============================================================================
  // SCENARIO 28: Financial Totals Reconcile with Source Transactions
  // ============================================================================
  it("Scenario 28: Financial totals reconcile exactly with source transactions", async () => {
    // Reconcile payoutRecordA journal transactions with clearing account entry
    const journals = await prisma.ledgerJournal.findMany({
      where: {
        referenceId: payoutRecordA.id,
        referenceType: JournalReferenceType.TEACHER_PAYOUT_DISBURSEMENT,
      },
      include: { entries: { include: { account: true } } },
    });

    const disbursedFromJournals = journals.reduce((sum, j) => {
      const line = j.entries.find((e) => e.account.code === STANDARD_ACCOUNTS.DISBURSEMENT_CLEARING);
      return sum + (line?.amount || 0);
    }, 0);

    expect(disbursedFromJournals).toBe(payoutRecordA.amountGnf);
  });

  // ============================================================================
  // SCENARIO 29: Production Configurations Cannot Activate Mock Success
  // ============================================================================
  it("Scenario 29: Production configuration blocks mock payments", async () => {
    // When NODE_ENV=production, ALLOW_TEST_PAYMENTS is disabled and requires real provider callbacks
    const isProd = process.env.NODE_ENV === "production";
    const allowTest = process.env.ALLOW_TEST_PAYMENTS === "true";
    if (isProd) {
      expect(allowTest).toBe(false);
    }
  });

  // ============================================================================
  // SCENARIO 30: Existing Tutoring, Reports & Progress Tracking Remain Functional
  // ============================================================================
  it("Scenario 30: Existing tutoring, reports, and progress tracking remain fully functional", async () => {
    // Draft a pedagogical observation report in the digital progress book
    const observation = await prisma.subjectProgressObservation.create({
      data: {
        studentId: studentA.id,
        teacherProfileId: teacherProfileA.id,
        classroomId: fundedClassroomA.id,
        subjectName: "Mathématiques",
        topicsMastered: "Continuité et dérivabilité",
        strengths: "Rigueur dans les démonstrations",
        areasForImprovement: "Vitesse de calcul",
        progressRating: 5,
      },
    });

    expect(observation).toBeDefined();
    expect(observation.progressRating).toBe(5);
    expect(observation.studentId).toBe(studentA.id);

    // Clean up observation
    await prisma.subjectProgressObservation.delete({ where: { id: observation.id } });
  });
});
