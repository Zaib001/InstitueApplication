import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  PrismaClient,
  UserRole,
  TeacherVerificationStatus,
  ClassroomStatus,
  SessionStatus,
  ReportStatus,
  PaymentProviderName,
  PaymentIntentStatus,
  ClassroomFundingStatus,
  SessionEarningsStatus,
  PayoutStatus,
  PricingOfferType,
  TutoringMode,
} from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import {
  CommissionPolicyService,
  DoubleEntryLedger,
  PaymentIntentService,
  EarningsEligibilityService,
  TeacherPayoutService,
  RefundService,
  STANDARD_ACCOUNTS,
  DuplicatePaymentError,
  FinancialError,
  IneligibleEarningsError,
} from "@/lib/finance";
import { POST as confirmPaymentRoute } from "@/app/api/finance/payment-intents/[reference]/confirm/route";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

describe("Phase 15: Enterprise Financial Architecture & Payment Foundation (M3.01)", () => {
  const ts = Date.now();
  const testPassword = "PasswordPhase15M301!";

  let adminUser: any;
  let parentUser: any;
  let parentProfile: any;
  let student: any;
  let teacherUser: any;
  let teacherProfile: any;
  let classroom: any;
  let tutoringPackage: any;
  let session1: any;
  let session2: any;
  let session3: any;
  let session4: any;

  beforeAll(async () => {
    const passwordHash = await hashPassword(testPassword);

    // 1. Admin
    adminUser = await prisma.user.create({
      data: {
        email: `admin.p15.${ts}@monsieurfanyi.gn`,
        passwordHash,
        fullName: "Administrateur M3.01",
        role: UserRole.ADMIN,
      },
    });

    // 2. Parent & Student
    parentUser = await prisma.user.create({
      data: {
        email: `parent.p15.${ts}@monsieurfanyi.gn`,
        passwordHash,
        fullName: "Aissatou Barry",
        role: UserRole.PARENT,
      },
    });

    parentProfile = await prisma.parentProfile.create({
      data: {
        userId: parentUser.id,
        address: "Kipé Centre, Conakry",
        city: "Conakry",
      },
    });

    student = await prisma.studentProfile.create({
      data: {
        parentId: parentProfile.id,
        fullName: "Ibrahima Barry",
        gradeLevel: "Terminale SM",
      },
    });

    // 3. Teacher
    teacherUser = await prisma.user.create({
      data: {
        email: `teacher.p15.${ts}@monsieurfanyi.gn`,
        passwordHash,
        fullName: "Professeur Thierno Diallo",
        role: UserRole.TEACHER,
      },
    });

    teacherProfile = await prisma.teacherProfile.create({
      data: {
        userId: teacherUser.id,
        bio: "Enseignant agrégé de Mathématiques",
        verificationStatus: TeacherVerificationStatus.APPROVED,
        hourlyRateGnf: 100000,
        monthlyPackageRateGnf: 800000,
      },
    });

    // 4. Classroom
    classroom = await prisma.classroom.create({
      data: {
        teacherProfileId: teacherProfile.id,
        studentId: student.id,
        subjectName: "Mathématiques Avancées",
        mode: TutoringMode.HOME,
        monthlyRateGnf: 800000,
        hourlyRateGnf: 100000,
        status: ClassroomStatus.PENDING_PAYMENT,
      },
    });

    // 5. Tutoring Package (8 sessions of 100,000 GNF = 800,000 GNF total)
    tutoringPackage = await prisma.tutoringPackage.create({
      data: {
        classroomId: classroom.id,
        pricingType: PricingOfferType.MONTHLY_PACKAGE,
        totalAmountGnf: 800000,
        sessionsCount: 8,
        minutesPerSession: 120,
        baseSessionRateGnf: 100000,
        remainderGnf: 0,
        commissionRatePercent: 15,
        totalPlatformCommissionGnf: 120000,
        totalTeacherShareGnf: 680000,
        status: "PENDING_PAYMENT",
      },
    });

    // 6. Sessions for the Classroom
    session1 = await prisma.lessonSession.create({
      data: {
        classroomId: classroom.id,
        packageId: tutoringPackage.id,
        sessionSequence: 1,
        title: "Fonctions Logarithmes & Dérivées",
        scheduledStart: new Date(Date.now() - 48 * 3600 * 1000),
        scheduledEnd: new Date(Date.now() - 46 * 3600 * 1000),
        durationMinutes: 120,
        status: SessionStatus.TEACHER_COMPLETED,
        allocatedAmountGnf: 100000,
        isFunded: false,
      },
    });

    session2 = await prisma.lessonSession.create({
      data: {
        classroomId: classroom.id,
        packageId: tutoringPackage.id,
        sessionSequence: 2,
        title: "Primitives et Intégrales",
        scheduledStart: new Date(Date.now() - 24 * 3600 * 1000),
        scheduledEnd: new Date(Date.now() - 22 * 3600 * 1000),
        durationMinutes: 120,
        status: SessionStatus.TEACHER_COMPLETED,
        allocatedAmountGnf: 100000,
        isFunded: false,
      },
    });

    session3 = await prisma.lessonSession.create({
      data: {
        classroomId: classroom.id,
        packageId: tutoringPackage.id,
        sessionSequence: 3,
        title: "Équations Différentielles",
        scheduledStart: new Date(Date.now() - 12 * 3600 * 1000),
        scheduledEnd: new Date(Date.now() - 10 * 3600 * 1000),
        durationMinutes: 120,
        status: SessionStatus.TEACHER_COMPLETED,
        allocatedAmountGnf: 100000,
        isFunded: false,
      },
    });

    session4 = await prisma.lessonSession.create({
      data: {
        classroomId: classroom.id,
        packageId: tutoringPackage.id,
        sessionSequence: 4,
        title: "Géométrie dans l'Espace",
        scheduledStart: new Date(Date.now() + 24 * 3600 * 1000),
        scheduledEnd: new Date(Date.now() + 26 * 3600 * 1000),
        durationMinutes: 120,
        status: SessionStatus.SCHEDULED,
        allocatedAmountGnf: 100000,
        isFunded: false,
      },
    });

    // Bootstrap general ledger standard accounts
    await DoubleEntryLedger.ensureStandardAccountsExist();
  });

  afterAll(async () => {
    try {
      await prisma.ledgerEntry.deleteMany({
        where: { journal: { postedBy: { in: [adminUser?.id, parentUser?.id, "TEST_SUITE"] } } },
      });
      await prisma.financialAuditEvent.deleteMany({
        where: { actorId: { in: [adminUser?.id, parentUser?.id, "TEST_SUITE"] } },
      });
      await prisma.teacherEarning.deleteMany({
        where: { teacherProfileId: teacherProfile?.id },
      });
      await prisma.payout.deleteMany({
        where: { teacherProfileId: teacherProfile?.id },
      });
      await prisma.paymentTransaction.deleteMany({
        where: { intent: { parentUserId: parentUser?.id } },
      });
      await prisma.paymentIntent.deleteMany({
        where: { parentUserId: parentUser?.id },
      });
      await prisma.classroomFunding.deleteMany({
        where: { classroomId: classroom?.id },
      });
      await prisma.lessonApproval.deleteMany({
        where: { session: { classroomId: classroom?.id } },
      });
      await prisma.lessonReport.deleteMany({
        where: { session: { classroomId: classroom?.id } },
      });
      await prisma.lessonSession.deleteMany({
        where: { classroomId: classroom?.id },
      });
      await prisma.tutoringPackage.deleteMany({
        where: { classroomId: classroom?.id },
      });
      await prisma.classroom.deleteMany({
        where: { id: classroom?.id },
      });
      await prisma.studentProfile.deleteMany({
        where: { id: student?.id },
      });
      await prisma.parentProfile.deleteMany({
        where: { id: parentProfile?.id },
      });
      await prisma.teacherProfile.deleteMany({
        where: { id: teacherProfile?.id },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [adminUser?.id, parentUser?.id, teacherUser?.id] } },
      });
      await prisma.$disconnect();
    } catch {
      // Ignore disconnect errors during teardown
    }
  });

  // ==========================================================================
  // SECTION 1: Commission Policy & Snapshot Versioning
  // ==========================================================================
  describe("1. Commission Policy & Snapshot Versioning", () => {
    it("initializes and retrieves default commission policy POL-2026-V1 (15% / 85%)", async () => {
      await prisma.commissionPolicy.updateMany({ data: { isActive: false } });
      await prisma.commissionPolicy.upsert({
        where: { version: CommissionPolicyService.DEFAULT_VERSION },
        update: { isActive: true },
        create: {
          version: CommissionPolicyService.DEFAULT_VERSION,
          platformPercent: 15,
          teacherPercent: 85,
          description: "Politique standard Monsieur Fanyi",
          effectiveFrom: new Date(),
          isActive: true,
          isLocked: true,
          createdByAdminId: adminUser.id,
        },
      });

      const activePolicy = await CommissionPolicyService.getActivePolicy();
      expect(activePolicy).toBeDefined();
      expect(activePolicy.platformPercent).toBe(15);
      expect(activePolicy.teacherPercent).toBe(85);
      expect(activePolicy.isActive).toBe(true);
    });

    it("allows admin to stage a new version (e.g. 20% platform / 80% teacher)", async () => {
      const newVersion = `POL-TEST-${ts}-V2`;
      const created = await CommissionPolicyService.createNewPolicyVersion({
        version: newVersion,
        platformPercent: 20,
        description: "Version 20% plateforme / 80% enseignant en cours d'évaluation client",
        adminId: adminUser.id,
      });

      expect(created.version).toBe(newVersion);
      expect(created.platformPercent).toBe(20);
      expect(created.teacherPercent).toBe(80);
      expect(created.isActive).toBe(true);

      const latestActive = await CommissionPolicyService.getActivePolicy();
      expect(latestActive.version).toBe(newVersion);

      // Align package snapshot to the newly staged 20% policy for subsequent payout tests
      await prisma.tutoringPackage.update({
        where: { id: tutoringPackage.id },
        data: { commissionRatePercent: 20 },
      });
    });
  });

  // ==========================================================================
  // SECTION 2: Prepayment Intent Lifecycle, Idempotency & Classroom Funding
  // ==========================================================================
  describe("2. Prepayment Intent Lifecycle, Idempotency & Classroom Funding", () => {
    const idempotencyKey = `idem_prepay_${ts}`;
    let createdIntent: any;

    it("creates a prepayment intent linked to the classroom and package", async () => {
      createdIntent = await PaymentIntentService.createPaymentIntent({
        parentUserId: parentUser.id,
        classroomId: classroom.id,
        packageId: tutoringPackage.id,
        amountGnf: 800000,
        provider: PaymentProviderName.CINETPAY,
        selectedMethod: "ORANGE_MONEY",
        idempotencyKey,
      });

      expect(createdIntent).toBeDefined();
      expect(createdIntent.intentReference).toMatch(/^pi_\d+_[a-f0-9]+/);
      expect(createdIntent.amountGnf).toBe(800000);
      expect(createdIntent.status).toBe(PaymentIntentStatus.CREATED);
    });

    it("enforces idempotency: repeated request with same key returns identical intent", async () => {
      const duplicate = await PaymentIntentService.createPaymentIntent({
        parentUserId: parentUser.id,
        classroomId: classroom.id,
        packageId: tutoringPackage.id,
        amountGnf: 800000,
        provider: PaymentProviderName.CINETPAY,
        selectedMethod: "ORANGE_MONEY",
        idempotencyKey,
      });

      expect(duplicate.id).toBe(createdIntent.id);
      expect(duplicate.intentReference).toBe(createdIntent.intentReference);
    });

    it("confirms payment receipt, funds classroom, marks sessions funded, and posts balanced journal", async () => {
      const confirmIdempotency = `confirm_tx_${ts}`;
      const result = await PaymentIntentService.confirmPaymentTransaction({
        intentReference: createdIntent.intentReference,
        providerTransactionId: `cinetpay_tx_${ts}`,
        settledAmountGnf: 800000,
        providerFeeGnf: 0,
        currency: "GNF",
        actorId: "GATEWAY_WEBHOOK",
        idempotencyKey: confirmIdempotency,
      });

      expect(result.intent.status).toBe(PaymentIntentStatus.SUCCEEDED);
      expect(result.transaction.settledAmountGnf).toBe(800000);

      // Verify ClassroomFunding state
      const funding = await prisma.classroomFunding.findUnique({
        where: { classroomId: classroom.id },
      });
      expect(funding).toBeDefined();
      expect(funding?.status).toBe(ClassroomFundingStatus.FUNDED);
      expect(funding?.totalFundedAmountGnf).toBe(800000);
      expect(funding?.availableBalanceGnf).toBe(800000);
      expect(funding?.allocatedAmountGnf).toBe(0);

      // Verify classroom sessions are marked as isFunded
      const updatedSession1 = await prisma.lessonSession.findUnique({
        where: { id: session1.id },
      });
      expect(updatedSession1?.isFunded).toBe(true);

      // Verify double-entry general ledger journal was created and balanced
      const journals = await prisma.ledgerJournal.findMany({
        where: { referenceId: result.transaction.id },
        include: { entries: { include: { account: true } } },
      });

      expect(journals.length).toBe(1);
      const journal = journals[0];
      expect(journal.isBalanced).toBe(true);
      expect(journal.totalDebit).toBe(800000);
      expect(journal.totalCredit).toBe(800000);

      // Debited 1010_PARENT_CLEARING, Credited 2020_CLASSROOM_FUNDS
      const debitEntry = journal.entries.find((e) => e.direction === "DEBIT");
      const creditEntry = journal.entries.find((e) => e.direction === "CREDIT");
      expect(debitEntry?.account.code).toBe(STANDARD_ACCOUNTS.PARENT_CLEARING);
      expect(creditEntry?.account.code).toBe(STANDARD_ACCOUNTS.CLASSROOM_FUNDS);
    });

    // SCENARIO 7: Duplicate payment webhook idempotency
    it("Scenario 7: Prevents duplicate payment settlement on already succeeded intent", async () => {
      await expect(
        PaymentIntentService.confirmPaymentTransaction({
          intentReference: createdIntent.intentReference,
          providerTransactionId: `duplicate_attempt_${ts}`,
          settledAmountGnf: 800000,
          currency: "GNF",
          actorId: "GATEWAY_WEBHOOK",
          idempotencyKey: `new_key_for_same_intent_${ts}`,
        })
      ).rejects.toThrow(DuplicatePaymentError);

      // Verify funding was NOT duplicated
      const funding = await prisma.classroomFunding.findUnique({
        where: { classroomId: classroom.id },
      });
      expect(funding?.totalFundedAmountGnf).toBe(800000);
    });
  });

  // ==========================================================================
  // SECTION 3: Payment Confirmation Security Hardening
  // ==========================================================================
  describe("3. Payment Confirmation Security Hardening (API & Service Guards)", () => {
    let securityIntent: any;

    beforeAll(async () => {
      securityIntent = await PaymentIntentService.createPaymentIntent({
        parentUserId: parentUser.id,
        classroomId: classroom.id,
        packageId: tutoringPackage.id,
        amountGnf: 500000,
        provider: PaymentProviderName.CINETPAY,
        selectedMethod: "ORANGE_MONEY",
        idempotencyKey: `sec_test_intent_${ts}`,
      });
    });

    // SCENARIO 5: Unauthorized user confirmation guard (returns 403)
    it("Scenario 5: Blocks unauthorized callers without signed webhook or admin credentials", async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/finance/payment-intents/${securityIntent.intentReference}/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            settledAmountGnf: 500000,
            currency: "GNF",
          }),
        }
      );

      const res = await confirmPaymentRoute(req, {
        params: Promise.resolve({ reference: securityIntent.intentReference }),
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.code).toBe("UNAUTHORIZED_PAYMENT_CONFIRMATION");
    });

    // SCENARIO 6: Forged confirmation with tampered amount (returns 422)
    it("Scenario 6: Rejects payment confirmation with tampered amount (amount mismatch)", async () => {
      // Test at API route level (with simulated signed header)
      const reqTampered = new NextRequest(
        `http://localhost:3000/api/finance/payment-intents/${securityIntent.intentReference}/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-cinetpay-signature": "simulated_test_sig",
          },
          body: JSON.stringify({
            settledAmountGnf: 50000, // Tampered: 50,000 instead of 500,000!
            currency: "GNF",
          }),
        }
      );

      const resTampered = await confirmPaymentRoute(reqTampered, {
        params: Promise.resolve({ reference: securityIntent.intentReference }),
      });

      expect(resTampered.status).toBe(422);
      const jsonTampered = await resTampered.json();
      expect(jsonTampered.code).toBe("AMOUNT_MISMATCH");

      // Test at core service level directly
      await expect(
        PaymentIntentService.confirmPaymentTransaction({
          intentReference: securityIntent.intentReference,
          providerTransactionId: `tamper_tx_${ts}`,
          settledAmountGnf: 100000, // Tampered!
          currency: "GNF",
          actorId: "SIMULATED_TEST",
          idempotencyKey: `tamper_key_${ts}`,
        })
      ).rejects.toThrow(FinancialError);
    });

    // SCENARIO 6b: Forged confirmation with tampered currency (returns 422)
    it("Scenario 6b: Rejects payment confirmation with unsupported currency", async () => {
      const reqCurrency = new NextRequest(
        `http://localhost:3000/api/finance/payment-intents/${securityIntent.intentReference}/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-cinetpay-signature": "simulated_test_sig",
          },
          body: JSON.stringify({
            settledAmountGnf: 500000,
            currency: "EUR", // Tampered: EUR instead of GNF!
          }),
        }
      );

      const resCurrency = await confirmPaymentRoute(reqCurrency, {
        params: Promise.resolve({ reference: securityIntent.intentReference }),
      });

      expect(resCurrency.status).toBe(422);
      const jsonCurrency = await resCurrency.json();
      expect(jsonCurrency.code).toBe("CURRENCY_MISMATCH");
    });
  });

  // ==========================================================================
  // SECTION 4: Lesson Earnings Eligibility & Atomic Crediting
  // ==========================================================================
  describe("4. Lesson Earnings Eligibility & Atomic Crediting", () => {
    it("blocks earnings release if lesson report has not been submitted", async () => {
      const evalResult = await EarningsEligibilityService.evaluateSessionEligibility(session1.id);
      expect(evalResult.isEligible).toBe(false);
      expect(evalResult.reasons).toContain(
        "Aucun compte-rendu de séance soumis par l'enseignant."
      );

      await expect(
        EarningsEligibilityService.releaseSessionEarnings(session1.id, adminUser.id)
      ).rejects.toThrow(IneligibleEarningsError);
    });

    it("blocks earnings release if report is submitted but not approved by parent", async () => {
      await prisma.lessonReport.create({
        data: {
          sessionId: session1.id,
          topicsCovered: "Étude des fonctions logarithmiques",
          status: ReportStatus.SUBMITTED,
        },
      });

      const evalResult = await EarningsEligibilityService.evaluateSessionEligibility(session1.id);
      expect(evalResult.isEligible).toBe(false);
      expect(evalResult.reasons).toContain(
        "Le compte-rendu n'a pas encore été validé par le parent d'élève."
      );
    });

    // SCENARIO 1: Lesson validation sets ELIGIBLE, NOT PAID
    it("Scenario 1: Releases earnings as ELIGIBLE (not PAID) once validated by parent, posting balanced 3-way journal", async () => {
      await prisma.lessonReport.update({
        where: { sessionId: session1.id },
        data: { status: ReportStatus.VALIDATED },
      });

      await prisma.lessonApproval.create({
        data: {
          sessionId: session1.id,
          approvedBy: parentUser.id,
          feedbackNote: "Excellente séance, élève très attentif.",
        },
      });

      const evalResult = await EarningsEligibilityService.evaluateSessionEligibility(session1.id);
      expect(evalResult.isEligible).toBe(true);
      expect(evalResult.grossAmountGnf).toBe(100000);

      // Release earnings
      const releaseResult = await EarningsEligibilityService.releaseSessionEarnings(
        session1.id,
        "TEST_SUITE"
      );

      // CRITICAL AUDIT CHECK: Status MUST be ELIGIBLE, NOT PAID!
      expect(releaseResult.session.earningsStatus).toBe(SessionEarningsStatus.ELIGIBLE);
      expect(releaseResult.earning.isPaidOut).toBe(false);

      // Verify ClassroomFunding balances updated
      const updatedFunding = await prisma.classroomFunding.findUnique({
        where: { classroomId: classroom.id },
      });
      // 800,000 - 100,000 = 700,000 available
      expect(updatedFunding?.availableBalanceGnf).toBe(700000);
      expect(updatedFunding?.allocatedAmountGnf).toBe(100000);

      // Verify 3-way balanced journal:
      // DEBIT 2020_CLASSROOM_FUNDS (100,000)
      // CREDIT 2030_TEACHER_PAYABLE (80,000)
      // CREDIT 4010_PLATFORM_COMMISSION (20,000)
      const journal = releaseResult.journal;
      expect(journal.isBalanced).toBe(true);
      expect(journal.totalDebit).toBe(100000);
      expect(journal.totalCredit).toBe(100000);
    });

    // SCENARIO 8: Concurrency & duplicate validation prevention
    it("Scenario 8: Rejects duplicate earnings release attempt (prevents duplicate crediting)", async () => {
      await expect(
        EarningsEligibilityService.releaseSessionEarnings(session1.id, "TEST_SUITE")
      ).rejects.toThrow(IneligibleEarningsError);
    });
  });

  // ==========================================================================
  // SECTION 5: Teacher Payout Lifecycle, Double-Reservation & Disbursement
  // ==========================================================================
  describe("5. Teacher Payout Request, Double-Reservation Prevention & Disbursement Confirmation", () => {
    let createdPayout: any;

    it("accurately calculates available unpaid balance for the teacher", async () => {
      const balanceInfo = await TeacherPayoutService.getTeacherAvailableBalance(
        teacherProfile.id
      );
      // Under POL-TEST-V2 (20% platform / 80% teacher): 80,000 GNF net earned
      expect(balanceInfo.availableBalanceGnf).toBe(80000);
      expect(balanceInfo.reservedBalanceGnf).toBe(0);
      expect(balanceInfo.paidOutBalanceGnf).toBe(0);
      expect(balanceInfo.unpaidEarningsCount).toBe(1);
    });

    it("rejects payout requests that exceed available earned balance", async () => {
      await expect(
        TeacherPayoutService.requestPayout({
          teacherProfileId: teacherProfile.id,
          amountGnf: 150000, // Exceeds 80,000 available!
          channel: "ORANGE_MONEY",
          beneficiaryName: "Thierno Diallo",
          beneficiaryPhone: "+224622000000",
          requestedByUserId: teacherUser.id,
          idempotencyKey: `payout_exceed_${ts}`,
        })
      ).rejects.toThrow(FinancialError);
    });

    // SCENARIO 2: Payout reservation transitions to RESERVED_FOR_PAYOUT
    it("Scenario 2: Requests payout, transitions session to RESERVED_FOR_PAYOUT, keeps isPaidOut false", async () => {
      createdPayout = await TeacherPayoutService.requestPayout({
        teacherProfileId: teacherProfile.id,
        amountGnf: 80000,
        channel: "ORANGE_MONEY",
        beneficiaryName: "Thierno Diallo",
        beneficiaryPhone: "+224622000000",
        requestedByUserId: teacherUser.id,
        idempotencyKey: `payout_valid_${ts}`,
      });

      expect(createdPayout.amountGnf).toBe(80000);
      expect(createdPayout.status).toBe(PayoutStatus.REQUESTED);

      // Verify TeacherEarning is linked to payout, but isPaidOut remains false
      const earning = await prisma.teacherEarning.findUnique({
        where: { sessionId: session1.id },
      });
      expect(earning?.isPaidOut).toBe(false);
      expect(earning?.payoutId).toBe(createdPayout.id);

      // Verify LessonSession is now RESERVED_FOR_PAYOUT
      const session = await prisma.lessonSession.findUnique({
        where: { id: session1.id },
      });
      expect(session?.earningsStatus).toBe(SessionEarningsStatus.RESERVED_FOR_PAYOUT);

      // Available balance is now 0, Reserved balance is 80,000
      const balanceAfter = await TeacherPayoutService.getTeacherAvailableBalance(
        teacherProfile.id
      );
      expect(balanceAfter.availableBalanceGnf).toBe(0);
      expect(balanceAfter.reservedBalanceGnf).toBe(80000);
    });

    // SCENARIO 2b: Double-reservation prevention
    it("Scenario 2b: Prevents double-reservation when earnings are already RESERVED_FOR_PAYOUT", async () => {
      await expect(
        TeacherPayoutService.requestPayout({
          teacherProfileId: teacherProfile.id,
          amountGnf: 80000, // Already reserved!
          channel: "ORANGE_MONEY",
          beneficiaryName: "Thierno Diallo",
          beneficiaryPhone: "+224622000000",
          requestedByUserId: teacherUser.id,
          idempotencyKey: `payout_double_reserve_${ts}`,
        })
      ).rejects.toThrow(FinancialError);
    });

    // SCENARIO 3: Provider confirms disbursement -> status becomes PAID
    it("Scenario 3: Confirms disbursement on provider confirmation: transitions to PAID and isPaidOut=true", async () => {
      const confirmedPayout = await TeacherPayoutService.confirmPayoutDisbursement({
        payoutId: createdPayout.id,
        providerDisbursementRef: `OM_CONFIRM_${ts}`,
        actorId: "TELECOM_PROVIDER",
      });

      expect(confirmedPayout.status).toBe(PayoutStatus.PAID);

      // Verify TeacherEarning is marked isPaidOut = true
      const earning = await prisma.teacherEarning.findUnique({
        where: { sessionId: session1.id },
      });
      expect(earning?.isPaidOut).toBe(true);

      // Verify LessonSession is marked PAID
      const session = await prisma.lessonSession.findUnique({
        where: { id: session1.id },
      });
      expect(session?.earningsStatus).toBe(SessionEarningsStatus.PAID);

      // Check teacher balances: available 0, reserved 0, paidOut 80,000
      const balanceAfter = await TeacherPayoutService.getTeacherAvailableBalance(
        teacherProfile.id
      );
      expect(balanceAfter.availableBalanceGnf).toBe(0);
      expect(balanceAfter.reservedBalanceGnf).toBe(0);
      expect(balanceAfter.paidOutBalanceGnf).toBe(80000);
    });
  });

  // ==========================================================================
  // SECTION 6: Payout Failure & Compensating Reversal Workflow
  // ==========================================================================
  describe("6. Provider Payout Failure & Compensating Reversal Workflow", () => {
    let failedPayout: any;

    beforeAll(async () => {
      // Setup session 2: validate report and release earnings
      await prisma.lessonReport.create({
        data: {
          sessionId: session2.id,
          topicsCovered: "Primitives et Intégrales définies",
          status: ReportStatus.VALIDATED,
        },
      });

      await prisma.lessonApproval.create({
        data: {
          sessionId: session2.id,
          approvedBy: parentUser.id,
          feedbackNote: "Très bon travail.",
        },
      });

      await EarningsEligibilityService.releaseSessionEarnings(session2.id, "TEST_SUITE");
    });

    // SCENARIO 4: Payout failure recovery & compensating reversal
    it("Scenario 4: Reverts earnings to ELIGIBLE and posts compensating reversal on provider disbursement failure", async () => {
      // 1. Available balance now has 80,000 GNF from session 2
      const balanceBefore = await TeacherPayoutService.getTeacherAvailableBalance(
        teacherProfile.id
      );
      expect(balanceBefore.availableBalanceGnf).toBe(80000);

      // 2. Request payout for session 2
      failedPayout = await TeacherPayoutService.requestPayout({
        teacherProfileId: teacherProfile.id,
        amountGnf: 80000,
        channel: "ORANGE_MONEY",
        beneficiaryName: "Thierno Diallo",
        beneficiaryPhone: "+224622000000",
        requestedByUserId: teacherUser.id,
        idempotencyKey: `payout_to_fail_${ts}`,
      });

      expect(failedPayout.status).toBe(PayoutStatus.REQUESTED);

      // Session 2 is reserved
      const sessionReserved = await prisma.lessonSession.findUnique({
        where: { id: session2.id },
      });
      expect(sessionReserved?.earningsStatus).toBe(SessionEarningsStatus.RESERVED_FOR_PAYOUT);

      // 3. Provider failure callback arrives (e.g. invalid phone number / telecom timeout)
      const failedResult = await TeacherPayoutService.failPayoutDisbursement({
        payoutId: failedPayout.id,
        failureReason: "Numéro Orange Money non enregistré auprès de l'opérateur.",
        actorId: "TELECOM_PROVIDER",
      });

      expect(failedResult.status).toBe(PayoutStatus.FAILED);

      // Earning is unlinked and remains unpaid
      const earning = await prisma.teacherEarning.findUnique({
        where: { sessionId: session2.id },
      });
      expect(earning?.isPaidOut).toBe(false);
      expect(earning?.payoutId).toBeNull();

      // Session 2 is restored to ELIGIBLE (ready for retry)
      const sessionRestored = await prisma.lessonSession.findUnique({
        where: { id: session2.id },
      });
      expect(sessionRestored?.earningsStatus).toBe(SessionEarningsStatus.ELIGIBLE);

      // Teacher available balance is safely restored to 80,000 GNF!
      const balanceRestored = await TeacherPayoutService.getTeacherAvailableBalance(
        teacherProfile.id
      );
      expect(balanceRestored.availableBalanceGnf).toBe(80000);
      expect(balanceRestored.reservedBalanceGnf).toBe(0);
    });
  });

  // ==========================================================================
  // SECTION 7: Classroom Refund & Reconciliation
  // ==========================================================================
  describe("7. Classroom Refund & Reconciliation", () => {
    // SCENARIO 9: Refund cannot exceed available classroom funds
    it("Scenario 9: Rejects refund exceeding available classroom funds", async () => {
      // 800,000 funded - 100,000 (s1) - 100,000 (s2) = 600,000 available
      await expect(
        RefundService.processClassroomRefund({
          classroomId: classroom.id,
          refundAmountGnf: 650000, // Exceeds 600,000 available!
          reason: "Demande supérieure au solde",
          adminId: adminUser.id,
        })
      ).rejects.toThrow(FinancialError);
    });

    it("processes legitimate partial refund and records balanced refund journal", async () => {
      const result = await RefundService.processClassroomRefund({
        classroomId: classroom.id,
        refundAmountGnf: 200000,
        reason: "Annulation de séances non tenues d'un commun accord",
        adminId: adminUser.id,
      });

      // 600,000 - 200,000 = 400,000 available
      expect(result.funding.availableBalanceGnf).toBe(400000);
      expect(result.funding.refundedAmountGnf).toBe(200000);

      // Verify refund journal
      expect(result.journal.isBalanced).toBe(true);
      expect(result.journal.totalDebit).toBe(200000);
      expect(result.journal.totalCredit).toBe(200000);
    });
  });

  // ==========================================================================
  // SECTION 8: General Ledger Equilibrium & Trial Balance Invariant
  // ==========================================================================
  describe("8. General Ledger Equilibrium & Trial Balance Invariant", () => {
    it("guarantees mathematical equilibrium across all ledger accounts (SUM(Debits) === SUM(Credits))", async () => {
      const balances = await DoubleEntryLedger.getAccountBalances();

      const totalDebits = balances.reduce((sum, a) => sum + a.totalDebitsGnf, 0);
      const totalCredits = balances.reduce((sum, a) => sum + a.totalCreditsGnf, 0);

      expect(totalDebits).toBeGreaterThan(0);
      expect(totalCredits).toBeGreaterThan(0);
      // Fundamental accounting theorem
      expect(totalDebits).toBe(totalCredits);
    });
  });

  // ==========================================================================
  // SECTION 9: State Persistence Across Simulated Application Restarts
  // ==========================================================================
  describe("9. State Persistence Across Simulated Application Restarts", () => {
    // SCENARIO 10: State persistence across fresh DB clients
    it("Scenario 10: Guarantees 100% financial state and ledger persistence across fresh database connections", async () => {
      const freshPrisma = new PrismaClient();

      try {
        // 1. Verify persisted classroom funding
        const persistedFunding = await freshPrisma.classroomFunding.findUnique({
          where: { classroomId: classroom.id },
        });
        expect(persistedFunding).toBeDefined();
        expect(persistedFunding?.totalFundedAmountGnf).toBe(800000);
        expect(persistedFunding?.availableBalanceGnf).toBe(400000);
        expect(persistedFunding?.allocatedAmountGnf).toBe(200000);
        expect(persistedFunding?.refundedAmountGnf).toBe(200000);

        // 2. Verify persisted lesson session statuses
        const persistedSession1 = await freshPrisma.lessonSession.findUnique({
          where: { id: session1.id },
        });
        expect(persistedSession1?.earningsStatus).toBe(SessionEarningsStatus.PAID);

        const persistedSession2 = await freshPrisma.lessonSession.findUnique({
          where: { id: session2.id },
        });
        expect(persistedSession2?.earningsStatus).toBe(SessionEarningsStatus.ELIGIBLE);

        // 3. Verify trial balance integrity across fresh connection
        const allEntries = await freshPrisma.ledgerEntry.findMany();
        let totalDebits = 0;
        let totalCredits = 0;
        for (const entry of allEntries) {
          if (entry.direction === "DEBIT") totalDebits += entry.amount;
          if (entry.direction === "CREDIT") totalCredits += entry.amount;
        }

        expect(totalDebits).toBeGreaterThan(0);
        expect(totalCredits).toBeGreaterThan(0);
        expect(totalDebits).toBe(totalCredits);
      } finally {
        await freshPrisma.$disconnect();
      }
    });
  });
});
